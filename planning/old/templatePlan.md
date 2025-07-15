# Template Application Implementation Plan

## 1. Overview

This document outlines the plan for creating a reusable template application. The goal is to provide a starter project with a pre-configured authentication flow using Auth0, a Convex backend setup, and a basic UI structure. This template will allow for rapid development of new applications by handling common setup tasks.

The template will feature:
- Auth0 integration for authentication (supporting email/password and social logins like Google).
- Convex backend for data storage and server-side logic.
- A simple login page.
- An empty, authenticated application shell where new features can be built.
- Instructions for using the existing Auth0 development application for the template and switching to a new Auth0 application for production deployments.
- Clear steps for creating and linking a new Convex database for each project spawned from this template.

## 2. Technology Stack

-   **Frontend:** React, TypeScript
-   **Backend:** Convex (TypeScript)
-   **Authentication:** Auth0 (using `@auth0/auth0-react`)
-   **Styling:** (To be decided, recommend Tailwind CSS for utility-first approach, consistent with mobile-first)
-   **Routing:** React Router DOM
-   **State Management:** React Context API (for simple global state like auth status), or a lightweight library if needed later.
-   **Linting/Formatting:** ESLint, Prettier

## 3. Project Structure

A suggested project structure:

```
/
├── convex/
│   ├── schema.ts         # Minimal schema for users
│   ├── auth.ts           # Basic auth functions (e.g., getUser)
│   └── http.ts           # If Auth0 webhooks are needed later
├── public/
│   └── # Static assets
├── src/
│   ├── assets/             # Images, icons, etc.
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginButton.tsx
│   │   │   ├── LogoutButton.tsx
│   │   │   └── AuthProviderWithHistory.tsx # Wrapper for Auth0Provider
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/               # Reusable UI elements (buttons, inputs, etc.)
│   ├── config/
│   │   └── auth0.ts          # Auth0 configuration
│   ├── hooks/                # Custom React hooks
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx      # Empty authenticated landing page
│   │   └── NotFoundPage.tsx
│   ├── providers/
│   │   └── AppProviders.tsx  # To wrap context providers (Auth, Theme, etc.)
│   ├── services/             # API calls (Convex queries/mutations)
│   ├── styles/               # Global styles, theme
│   ├── utils/                # Utility functions
│   ├── App.tsx               # Main application component with routing
│   ├── main.tsx              # Entry point
│   └── vite-env.d.ts       # Vite environment variables
├── tests/                  # Unit and integration tests
│   └── # Mirrored structure from src/
├── .env.local              # Local environment variables (ignored by git)
├── .env.example            # Example environment variables
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js       # If using Tailwind
├── README.md
├── tailwind.config.js      # If using Tailwind
└── tsconfig.json
```

## 4. Auth0 Setup

### 4.1 Using the Existing Development Application
-   The template will be configured to use your current Auth0 development application.
-   Required environment variables:
    -   `VITE_PUBLIC_AUTH0_DOMAIN`: Your Auth0 application domain.
    -   `VITE_PUBLIC_AUTH0_CLIENT_ID`: Your Auth0 application client ID.
-   **Callback URL in Auth0 Dashboard**: Ensure `http://localhost:PORT` (e.g., `http://localhost:5173` for Vite default) is added to "Allowed Callback URLs", "Allowed Logout URLs", and "Allowed Web Origins" in your Auth0 app settings.

### 4.2 Switching to a New Auth0 Application for Deployment/New Projects
1.  **Create a new Auth0 Application:**
    -   Go to the [Auth0 Dashboard](https://auth0.com/).
    -   Create a new application of type "Single Page Application (SPA)".
    -   Note the **Domain** and **Client ID**.
2.  **Configure Allowed URLs:**
    -   **Allowed Callback URLs:** `YOUR_DEPLOYMENT_URL`, `http://localhost:PORT` (for continued local dev on the new project)
    -   **Allowed Logout URLs:** `YOUR_DEPLOYMENT_URL`, `http://localhost:PORT`
    -   **Allowed Web Origins:** `YOUR_DEPLOYMENT_URL`, `http://localhost:PORT`
3.  **Update Environment Variables:**
    -   In the new project derived from the template, update `.env.local` (and deployment environment variables) with the new Auth0 Domain and Client ID.
    -   `VITE_PUBLIC_AUTH0_DOMAIN=NEW_AUTH0_DOMAIN`
    -   `VITE_PUBLIC_AUTH0_CLIENT_ID=NEW_AUTH0_CLIENT_ID`
4.  **Enable Connections:**
    -   Ensure desired connections (e.g., Email/Password, Google) are enabled for the new Auth0 application.
    -   Refer to `docs/auth0.md` from the original project for detailed steps on enabling Email OTP and other social connections if needed.

## 5. Convex Setup

### 5.1 Creating a New Convex Project
Each time the template is used for a new application, a new Convex project/database should be created:
1.  Install Convex CLI: `npm install -g convex`
2.  Navigate to the project root directory.
3.  Initialize a new Convex project: `convex init`
    -   This will create a new project, link it to your Convex account, and generate a `.env.local` file with `VITE_PUBLIC_CONVEX_URL`.
    -   It will also create a `convex/` directory if it doesn't exist (though our template will have one).
4.  Push the initial schema: `convex deploy` (after defining the schema below).

### 5.2 Minimal `convex/schema.ts`
The template will start with a minimal schema, primarily for storing user information linked to Auth0.

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    auth0Id: v.string(), // Unique identifier from Auth0 (usually 'sub')
    emailVerified: v.optional(v.boolean()),
    picture: v.optional(v.string()),
    // Add any other essential user fields needed across apps
  }).index("by_auth0Id", ["auth0Id"]),
});
```

### 5.3 Basic `convex/auth.ts`
A simple function to get or create a user based on Auth0 identity.

```typescript
// convex/auth.ts
import { query, mutation } from "./_generated/server";
import { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import { v } from "convex/values";

// Helper to get Auth0 user info
async function getAuth0User(ctx: GenericQueryCtx<any> | GenericMutationCtx<any>) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return {
    auth0Id: identity.subject, // 'sub' field from Auth0 token
    email: identity.email!,
    name: identity.name,
    picture: identity.pictureUrl,
    emailVerified: identity.emailVerified,
  };
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const auth0User = await getAuth0User(ctx);
    if (!auth0User) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth0Id", (q) => q.eq("auth0Id", auth0User.auth0Id))
      .unique();
    return user;
  },
});

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const auth0User = await getAuth0User(ctx);
    if (!auth0User) {
      throw new Error("User not authenticated via Auth0");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_auth0Id", (q) => q.eq("auth0Id", auth0User.auth0Id))
      .unique();

    if (existingUser) {
      // Optionally update user details if they've changed in Auth0
      if (existingUser.name !== auth0User.name || existingUser.picture !== auth0User.picture || existingUser.email !== auth0User.email) {
        await ctx.db.patch(existingUser._id, {
          name: auth0User.name,
          picture: auth0User.picture,
          email: auth0User.email, // Ensure email is kept up-to-date
          emailVerified: auth0User.emailVerified,
        });
      }
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      auth0Id: auth0User.auth0Id,
      email: auth0User.email!,
      name: auth0User.name,
      picture: auth0User.picture,
      emailVerified: auth0User.emailVerified,
    });
    return userId;
  },
});
```

## 6. Core Components & UI

### 6.1 `AuthProviderWithHistory.tsx` (`src/components/auth/`)
This component will wrap the Auth0Provider and handle navigation after login/logout.

```tsx
// src/components/auth/AuthProviderWithHistory.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

interface AuthProviderWithHistoryProps {
  children: React.ReactNode;
}

const AuthProviderWithHistory: React.FC<AuthProviderWithHistoryProps> = ({ children }) => {
  const navigate = useNavigate();
  const domain = import.meta.env.VITE_PUBLIC_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_PUBLIC_AUTH0_CLIENT_ID;
  const redirectUri = window.location.origin;

  if (!domain || !clientId) {
    // Consider rendering an error message or a fallback UI
    return (
      <div>
        Auth0 configuration is missing. Please check your environment variables.
      </div>
    );
  }

  const onRedirectCallback = (appState?: any) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        // audience: `https://${domain}/api/v2/`, // Uncomment if calling Auth0 Management API
        // scope: "openid profile email read:current_user update:current_user_metadata", // Add scopes as needed
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProviderWithHistory;
```

### 6.2 `LoginButton.tsx` and `LogoutButton.tsx`
Standard Auth0 login/logout buttons. (Refer to `docs/auth0.md` or `planning/authPlan.md` from original project for implementation).

### 6.3 `AppProviders.tsx` (`src/providers/`)
```tsx
// src/providers/AppProviders.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthProviderWithHistory from '../components/auth/AuthProviderWithHistory';
import { ConvexProvider, ConvexReactClient } from "convex/react";

interface AppProvidersProps {
  children: React.ReactNode;
}

const convex = new ConvexReactClient(import.meta.env.VITE_PUBLIC_CONVEX_URL as string);

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <React.StrictMode>
      <Router>
        <AuthProviderWithHistory>
          <ConvexProvider client={convex}>
            {children}
          </ConvexProvider>
        </AuthProviderWithHistory>
      </Router>
    </React.StrictMode>
  );
};

export default AppProviders;
```

### 6.4 `App.tsx` (`src/`)
Main application component with routing logic.
It will use `useAuth0` to check authentication status and `useMutation` from Convex to call `storeUser`.

```tsx
// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
// import Navbar from './components/layout/Navbar'; // Optional

function App() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const storeUserMutation = useMutation(api.auth.storeUser);

  useEffect(() => {
    if (isAuthenticated && user) {
      storeUserMutation().catch(console.error);
    }
  }, [isAuthenticated, user, storeUserMutation]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading spinner component
  }

  return (
    <>
      {/* <Navbar /> */} {/* Optional: Add a navbar if desired for the template */}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />}
        />
        {/* Add other routes for the template shell if needed */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </>
  );
}

export default App;
```

### 6.5 `LoginPage.tsx` (`src/pages/`)
A simple page with a login button.
```tsx
// src/pages/LoginPage.tsx
import React from 'react';
import LoginButton from '../components/auth/LoginButton'; // Assuming LoginButton is created

const LoginPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>Welcome! Please Log In</h1>
      <LoginButton />
      {/* Optionally, add GoogleLoginButton or other social logins here */}
    </div>
  );
};

export default LoginPage;
```

### 6.6 `HomePage.tsx` (`src/pages/`)
The "empty" authenticated app shell.
```tsx
// src/pages/HomePage.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LogoutButton from '../components/auth/LogoutButton'; // Assuming LogoutButton is created
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';


const HomePage: React.FC = () => {
  const { user } = useAuth0();
  const currentUser = useQuery(api.auth.getCurrentUser); // Example: Fetch user from Convex

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to Your New App, {user?.name || 'User'}!</h1>
      <p>This is your authenticated application shell.</p>
      <p>You can start building your features here.</p>
      {currentUser && (
        <div>
          <p>Email from Convex: {currentUser.email}</p>
          <p>User ID from Convex: {currentUser._id}</p>
        </div>
      )}
      <LogoutButton />
    </div>
  );
};

export default HomePage;
```

### 6.7 `main.tsx` (`src/`)
```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppProviders from './providers/AppProviders';
// import './index.css'; // Your global stylesheet

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
```

## 7. UI/UX Considerations (Mobile-First)

-   The template should be styled with a mobile-first approach.
-   Use responsive design techniques.
-   If using a CSS framework like Tailwind CSS, leverage its responsive utilities.
-   The login page should be simple and clear.
-   The authenticated shell should provide a clean slate, possibly with a placeholder for a navigation bar or main content area.

## 8. Setup and Usage Instructions for Template Users

A `README.md` in the template's root will guide users:

1.  **Clone the Repository:**
    `git clone <template-repo-url> my-new-app`
    `cd my-new-app`
2.  **Install Dependencies:**
    `npm install`
3.  **Auth0 Setup:**
    -   Follow instructions in Section 4.2 to create and configure a new Auth0 application.
    -   Create a `.env.local` file by copying `.env.example`.
    -   Populate `VITE_PUBLIC_AUTH0_DOMAIN` and `VITE_PUBLIC_AUTH0_CLIENT_ID` in `.env.local`.
4.  **Convex Setup:**
    -   Run `convex init` to set up a new Convex backend. This will update/create `.env.local` with `VITE_PUBLIC_CONVEX_URL`.
    -   Deploy the schema and functions: `convex deploy`.
5.  **Run the Application:**
    `npm run dev`
6.  **Start Building:**
    -   Modify `convex/schema.ts` to define your application's data model.
    -   Add new Convex functions in `convex/`.
    -   Create new React components and pages in `src/`.

## 9. Environment Variables (`.env.example`)

```
# Auth0 Configuration
VITE_PUBLIC_AUTH0_DOMAIN=your-auth0-domain
VITE_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id

# Convex Configuration (this will be generated by `convex init`)
VITE_PUBLIC_CONVEX_URL=your-convex-url
```

## 10. Next Steps / Future Enhancements for Template
-   Add basic UI library (e.g., Shadcn UI with Tailwind CSS).
-   Implement a basic Navbar and Footer component.
-   Add example unit tests.
-   Include more detailed documentation on extending the template.
-   Create a script to automate parts of the new project setup.

This plan provides a comprehensive starting point for building the template application.
Adjustments can be made as development progresses. 