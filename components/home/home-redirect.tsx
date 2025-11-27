/** @format */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function HomeRedirect() {
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("HomeRedirect - Auth state:", {
      user: !!user,
      loading,
      isEmailVerified,
    });

    // Wait for auth to finish loading
    if (loading) {
      console.log("HomeRedirect - Still loading, waiting...");
      return;
    }

    // If user is authenticated and email is verified, redirect to dashboard
    if (user && isEmailVerified) {
      console.log("HomeRedirect - Redirecting authenticated user to dashboard");
      router.push("/dashboard");
    } else if (user && !isEmailVerified) {
      console.log("HomeRedirect - User authenticated but email not verified");
    } else {
      console.log(
        "HomeRedirect - User not authenticated, staying on home page"
      );
    }
  }, [user, loading, isEmailVerified, router]);

  // Don't render anything, this is just for redirection
  return null;
}
