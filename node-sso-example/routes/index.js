import express from 'express'
import session from 'express-session'
import { WorkOS } from '@workos-inc/node'

const app = express()
const router = express.Router()

app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
    })
)

const workos = new WorkOS(process.env.WORKOS_API_KEY)
const clientID = process.env.WORKOS_CLIENT_ID
const organizationID = process.env.WORKOS_ORGANIZATION_ID
const redirectURI = process.env.WORKOS_REDIRECT_URI
const state = ''

// Landing page
router.get('/', function (req, res) {
    if (session.isloggedin) {
        res.render('login_successful.ejs', {
            profile: session.profile,
            firstName: session.first_name,
            lastName: session.last_name,
        })
    } else {
        res.render('index.ejs', { title: 'Home' })
    }
})

// User clicks login
router.post('/login', (req, res) => {
    const login_type = req.body.login_method

    const params = {
        clientID: clientID,
        redirectURI: redirectURI,
        state: state,
    }

    if (login_type === 'saml') {
        params.organization = organizationID
    } else {
        params.provider = login_type
    }

    try {
        // call to generate WORKOS authURL
        const url = workos.sso.getAuthorizationURL(params)
        console.log('Generated authorization URL:', url);
        res.redirect(url)
    } catch (error) {
        // if error, show error.ejs
        res.render('error.ejs', { error: error })
    }
})

// Callback endpoint
router.get('/callback', async (req, res) => {
    let errorMessage
    try {
        const { code, error } = req.query

        if (error) {
            errorMessage = `Redirect callback error: ${error}`
        } else {
            // If no error, store user in session
            const profile = await workos.sso.getProfileAndToken({
                code,
                clientID,
            })
            session.first_name = profile.profile.first_name
            session.last_name = profile.profile.last_name
            session.profile = profile
            session.isloggedin = true
        }
    } catch (error) {
        errorMessage = `Error exchanging code for profile: ${error}`
    }
    if (errorMessage) {
        res.render('error.ejs', { error: errorMessage })
    } else {
        res.redirect('/')
    }
})

router.get('/logout', async (req, res) => {
    try {
        session.first_name = null
        session.profile = null
        session.isloggedin = null

        res.redirect('/')
    } catch (error) {
        res.render('error.ejs', { error: error })
    }
})

// Get directory information for the logged in user
router.get('/directory-info', async (req, res) => {
    try {
        if (!session.isloggedin) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        // Get directories, one user can have many directories
        const directories = await workos.directorySync.listDirectories({
            limit: 10,
        });

        // Get groups from all directories, one directory can have many groups
        let allGroups = [];
        for (const directory of directories.data) {
            try {
                const groups = await workos.directorySync.listGroups({
                    directory: directory.id,
                    limit: 100,
                });
                allGroups = allGroups.concat(groups.data || []);
            } catch (error) {
                console.error(`Error fetching groups for directory ${directory.id}:`, error);
            }
        }

        res.json({
            success: true,
            directories: directories.data || [],
            groups: allGroups
        });
    } catch (error) {
        console.error('Error fetching directory info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch directory information'
        });
    }
})

// View directory details
router.get('/directory/:id', async (req, res) => {
    try {
        if (!session.isloggedin) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const directoryId = req.params.id;
        // Get the specific directory
        const directories = await workos.directorySync.listDirectories();
        const directory = directories.data.find((dir) => dir.id === directoryId);
        
        if (!directory) {
            return res.status(404).json({ success: false, error: 'Directory not found' });
        }

        res.render('directory_details.ejs', {
            directory: directory,
            title: 'Directory Details',
            firstName: session.first_name,
            lastName: session.last_name
        });

    } catch (error) {
        console.error('Error fetching directory details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch directory details'
        });
    }
})

// List users for a specific directory
router.get('/users', async (req, res) => {
    try {
        // Check if user is logged in
        if (!session.isloggedin) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const directoryId = req.query.id;
        
        if (!directoryId) {
            return res.status(400).json({ success: false, error: 'Directory ID is required' });
        }

        const users = await workos.directorySync.listUsers({
            directory: directoryId,
            limit: 100,
        });

        res.render('users.ejs', { 
            users: users.data, 
            directoryId: directoryId,
            firstName: session.first_name,
            lastName: session.last_name
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
})

// List groups for a specific directory
router.get('/groups', async (req, res) => {
    try {
        if (!session.isloggedin) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const directoryId = req.query.id;
        
        if (!directoryId) {
            return res.status(400).json({ success: false, error: 'Directory ID is required' });
        }

        const groups = await workos.directorySync.listGroups({
            directory: directoryId,
            limit: 100,
        });

        res.render('groups.ejs', { 
            groups: groups.data, 
            directoryId: directoryId,
            firstName: session.first_name,
            lastName: session.last_name
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch groups'
        });
    }
})

export default router
