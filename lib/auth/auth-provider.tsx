/** @format */

"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
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

// Custom debounce hook with 300ms delay
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  // Request deduplication: track in-flight requests
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  // Initialization guard: ensure single authentication check on mount
  const initializationRef = useRef<boolean>(false);
  // Track if we're currently initializing to avoid unnecessary checks
  const isInitializingRef = useRef<boolean>(false);

  const refreshUser = useCallback(async () => {
    // Request deduplication: if a refresh is already in progress, return that promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Create new refresh promise
    refreshPromiseRef.current = (async () => {
      try {
        const supabase = createClient();
        
        // First, try to get the current user
        let {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        console.log(
          "AuthProvider - Auth user:",
          authUser ? "authenticated" : "null"
        );

        // If no user found, attempt silent refresh before giving up
        if (!authUser) {
          console.log("AuthProvider - Attempting silent refresh");
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && refreshData.session) {
              authUser = refreshData.session.user;
              console.log("AuthProvider - Silent refresh successful");
            } else {
              console.log("AuthProvider - Silent refresh failed:", refreshError?.message);
            }
          } catch (refreshError) {
            console.log("AuthProvider - Silent refresh error:", refreshError);
          }
        }

        // If still no user after refresh attempt, clear state
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

        // Attempt to get full profile
        const profile = await getCurrentUser();
        console.log("AuthProvider - Profile:", profile ? "found" : "null");
        
        if (profile) {
          setUser(profile);
        } else {
          // Fallback to basic profile when profile fetch fails
          // This ensures authentication persists even if profile is incomplete
          console.log("AuthProvider - Using basic profile fallback");
          const basicProfile: UserProfile = {
            id: authUser.id,
            email: authUser.email!,
            display_name: authUser.user_metadata?.display_name || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            activity_status: 'active',
            bio: null,
            interests: null,
            profile_visibility: 'public',
            is_admin: false,
            can_create_events: false,
            projects: null,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          };
          setUser(basicProfile);
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
        // Maintain current state on transient errors (don't clear user)
        // This prevents automatic logout on network issues or temporary failures
        // Only clear if we don't have a user yet (initial load failure)
        if (!user) {
          setUser(null);
          setIsEmailVerified(false);
        }
      } finally {
        // Clear the in-flight promise
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [user]);

  // Debounced state update handler
  const debouncedRefreshUser = useDebouncedCallback(refreshUser, 300);

  useEffect(() => {
    // Prevent multiple concurrent initialization calls
    // This ensures single authentication check on mount
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;
    isInitializingRef.current = true;

    // Initial user load - single authentication check on mount
    // Loading state management: set loading to false after initial check completes
    refreshUser().finally(() => {
      setLoading(false);
      isInitializingRef.current = false;
    });

    // Set up auth state listener with debounced updates
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Avoid unnecessary checks during initialization
      if (isInitializingRef.current) {
        return;
      }

      if (event === "SIGNED_IN") {
        // For SIGNED_IN, refresh immediately without debounce for faster UI update
        await refreshUser();
      } else if (event === "TOKEN_REFRESHED") {
        // Use debounced refresh for token refreshes to prevent rapid state updates
        await debouncedRefreshUser();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsEmailVerified(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, debouncedRefreshUser]);

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
