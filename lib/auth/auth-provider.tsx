/** @format */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import { getCurrentUser } from "./auth-helpers";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isEmailVerified: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const refreshUser = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      console.log(
        "AuthProvider - Auth user:",
        authUser ? "authenticated" : "null"
      );

      if (!authUser) {
        setUser(null);
        setIsEmailVerified(false);
        return;
      }

      setIsEmailVerified(authUser.email_confirmed_at != null);
      console.log(
        "AuthProvider - Email verified:",
        authUser.email_confirmed_at != null
      );

      const profile = await getCurrentUser();
      console.log("AuthProvider - Profile:", profile ? "found" : "null");
      setUser(profile);
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setIsEmailVerified(false);
    }
  };

  useEffect(() => {
    // Initial user load
    refreshUser().finally(() => setLoading(false));

    // Set up auth state listener
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await refreshUser();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsEmailVerified(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isEmailVerified,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
