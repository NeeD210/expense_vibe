"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, Dispatch, SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface SignInFormProps {
  setCurrentPage: Dispatch<SetStateAction<"home" | "analysis" | "config" | "add" | "income" | "manage">>;
}

export function SignInForm({ setCurrentPage }: SignInFormProps) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const createUser = useMutation(api.auth.createUser);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          try {
            await signIn("password", formData);
            if (flow === "signUp") {
              const email = formData.get("email") as string;
              await createUser({ email });
            }
            // Explicitly set the current page to home after successful authentication
            setCurrentPage('home');
          } catch (_error) {
            const toastTitle =
              flow === "signIn"
                ? "Could not sign in, did you mean to sign up?"
                : "Could not sign up, did you mean to sign in?";
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: toastTitle,
            });
            setSubmitting(false);
          }
        }}
      >
        <Input
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <Button 
          type="submit" 
          disabled={submitting}
          className="w-full"
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </Button>
        </div>
      </form>
    </div>
  );
}
