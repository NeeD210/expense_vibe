import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const { logout } = useAuth0();
  
  return (
    <Button
      variant="ghost"
      className="flex items-center gap-2"
      onClick={() => logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      })}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
} 