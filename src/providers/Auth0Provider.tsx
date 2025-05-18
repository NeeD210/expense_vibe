import { Auth0Provider } from '@auth0/auth0-react';
import { ReactNode } from 'react';

interface Auth0ProviderWithConfigProps {
  children: ReactNode;
}

export function Auth0ProviderWithConfig({ children }: Auth0ProviderWithConfigProps) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ''}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ''}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
        prompt: 'login',
        connection: 'google-oauth2' // Default to Google OAuth
      }}
    >
      {children}
    </Auth0Provider>
  );
} 