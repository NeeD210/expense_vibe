"use client";
import { useAuth0 } from "@auth0/auth0-react";
import { useState, Dispatch, SetStateAction, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { FcGoogle } from "react-icons/fc";

interface SignInFormProps {
  setCurrentPage: Dispatch<SetStateAction<"home" | "analysis" | "config" | "add" | "income" | "manage">>;
}

export function SignInForm({ setCurrentPage }: SignInFormProps) {
  const { loginWithRedirect, loginWithPopup, isAuthenticated, user, isLoading } = useAuth0();
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [userCreationAttempted, setUserCreationAttempted] = useState(false);
  
  const createUser = useMutation(api.auth.createUser);

  useEffect(() => {
    const createUserIfNeeded = async () => {
      console.log("Auth state check:", { isLoading, isAuthenticated, email: user?.email, sub: user?.sub, userCreationAttempted });

      if (isLoading) {
        console.log("Auth0 is loading, waiting...");
        return;
      }

      if (isAuthenticated && user?.email && user?.sub && !userCreationAttempted) {
        setUserCreationAttempted(true);
        try {
          console.log("Attempting to create user:", { email: user.email, auth0Id: user.sub });
          await createUser({
            email: user.email,
            auth0Id: user.sub
          });
          console.log("User creation/check successful for:", user.email);
        } catch (error: any) {
          console.error("Error during createUser mutation:", error);
        }
      } else if (userCreationAttempted) {
        console.log("User creation already attempted for this session/login.");
      } else {
        console.log("Skipping user creation: conditions not met (or Auth0 finished loading without user).");
      }
    };

    createUserIfNeeded();
  }, [isLoading, isAuthenticated, user?.email, user?.sub, createUser, userCreationAttempted]);

  const handlePasswordAuth = async () => {
    setSubmitting(true);
    try {
      await loginWithPopup({
        authorizationParams: {
          connection: "Username-Password-Authentication"
        }
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Failed to authenticate. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setSubmitting(true);
      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2"
        }
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Failed to sign in with Google",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Button
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={handleGoogleAuth}
        disabled={submitting}
      >
        <FcGoogle className="h-5 w-5" />
        Sign in with Google
      </Button>

      <Button 
        onClick={handlePasswordAuth}
        disabled={submitting}
        className="w-full"
      >
        Sign in with Email
      </Button>
    </div>
  );
}
