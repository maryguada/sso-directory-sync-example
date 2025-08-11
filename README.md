**Node example application using [WorkOS Node.js SDK](https://github.com/workos/workos-node)**

**Features**
- Single Sign-On (SSO) - Authenticate users via their organization's identity provider (IdP)
- Directory Sync - Sync user and group data from identity providers

**Prerequisites**
- Node.js 10+
- npm or yarn
- Sign up for a WorkOS account and obtain API key, Client ID, Orangization ID. 
- In the WorkOS dashboard navigate to Developer > Redirects > Redirect URI > add your callback endpoint, this should be the same as WORKOS_REDIRECT_URI in your .env

**Documentation**
- [WorkOS SSO Documentation](https://workos.com/docs/sso)
- [Okta SAML Integration Guide](https://workos.com/docs/integrations/okta-saml)
- [WorkOS DirectorySync Documentation](https://workos.com/docs/directory-sync)
- [Okta SCIM Integration Guide](https://workos.com/docs/integrations/okta-scim)

**Installation**
1) git clone the repository https://github.com/maryguada/sso-directory-sync-example.git
2) cd into node-sso-example
3) npm install
4) set up environment variables as shown here: 

```env
WORKOS_API_KEY=sk_test_abc123
WORKOS_CLIENT_ID=client_abc123
WORKOS_ORGANIZATION_ID=org_abc123
WORKOS_REDIRECT_URI=http://localhost:8000/callback
```

5) Read and follow this set up guide [WorkOS SSO Documentation](https://workos.com/docs/sso)
