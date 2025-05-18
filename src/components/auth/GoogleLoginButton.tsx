import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

export function GoogleLoginButton() {
  const { loginWithRedirect } = useAuth0();
  
  return (
    <Button
      variant="outline"
      className="w-full flex items-center gap-2"
      onClick={() => loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2'
        }
      })}
    >
      <FcGoogle className="h-5 w-5" />
      Sign in with Google
    </Button>
  );
} 