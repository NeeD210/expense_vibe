"use client";
import { useAuth0 } from "@auth0/auth0-react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { logout } = useAuth0();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded-lg transition-colors bg-blue-500 text-white"
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
    >
      Sign out
    </button>
  );
}
