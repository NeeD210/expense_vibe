# Auth0 Authentication with Email OTP in React

## Overview
Auth0 is a popular authentication-as-a-service platform that supports a wide range of authentication methods, including email OTP (one-time password) for passwordless login and email verification. This guide covers how to integrate Auth0 into a React app and enable email OTP verification for new users.

---

## 1. Setting Up Auth0

1. **Create an Auth0 Account:**
   - Go to [Auth0 Dashboard](https://auth0.com/) and sign up or log in.
2. **Create an Application:**
   - Application Type: Single Page Application (SPA)
   - Note your **Domain** and **Client ID** from the application settings.
3. **Configure Allowed URLs:**
   - **Allowed Callback URLs:** e.g., `http://localhost:3000`
   - **Allowed Logout URLs:** e.g., `http://localhost:3000`
   - **Allowed Web Origins:** e.g., `http://localhost:3000`

---

## 2. Installing the Auth0 React SDK

```bash
npm install @auth0/auth0-react
```

---

## 3. Integrating Auth0 in Your React App

Wrap your app with the `Auth0Provider`:

```jsx
import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain="YOUR_DOMAIN"
  clientId="YOUR_CLIENT_ID"
  authorizationParams={{ redirect_uri: window.location.origin }}
>
  <App />
</Auth0Provider>
```

---

## 4. Enabling Email OTP (Passwordless) Authentication

1. **Enable Passwordless Email Connection:**
   - In the Auth0 Dashboard, go to **Authentication > Database > Email**.
   - Enable **OTP** as the verification method.
   - Set **Allow Signups with Email** to **Required**.
   - Enable **Verify Email on Signup**.
2. **Customize Email Templates:**
   - Go to **Branding > Email Templates**.
   - Edit the verification email to use a code (OTP) instead of a link if desired.

---

## 5. Using Auth0 in React Components

**Login Button:**
```jsx
import { useAuth0 } from '@auth0/auth0-react';

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();
  return <button onClick={() => loginWithRedirect()}>Log In</button>;
};
```

**Logout Button:**
```jsx
const LogoutButton = () => {
  const { logout } = useAuth0();
  return <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Log Out</button>;
};
```

**User Profile:**
```jsx
const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return <div>Loading ...</div>;
  return isAuthenticated && (
    <div>
      <img src={user.picture} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
```

---

## 6. Best Practices & Notes
- Always check `user.email_verified` before granting full access.
- Use Auth0 Actions (instead of Rules) for custom flows (e.g., post-login checks).
- Rate-limit OTP requests to prevent abuse.
- For advanced flows, see [Auth0 Actions Gallery](https://github.com/auth0/actions-gallery).

---

## 7. References
- [Auth0 React Quickstart](https://auth0.com/docs/quickstart/spa/react/01-login)
- [Auth0 Passwordless Docs](https://auth0.com/docs/authenticate/passwordless/)
- [Auth0 Community: Email OTP](https://community.auth0.com/t/verify-email-with-code/115201) 