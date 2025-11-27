/** @format */

import { createClient } from "@/lib/supabase/client";
import type { AuthResponse, UserProfile } from "@/types";

/**
 * Sign up a new user with email and password
 * Sends verification email through Supabase
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { user: null, error };
    }

    if (!data.user) {
      return { user: null, error: new Error("Failed to create user") };
    }

    // Create user profile
    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email!,
      display_name: undefined,
      avatar_url: undefined,
      is_admin: false,
      can_create_events: false,
      created_at: new Date().toISOString(),
    };

    return { user: profile, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err : new Error("Unknown error occurred"),
    };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    if (!data.user) {
      return { user: null, error: new Error("Failed to sign in") };
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profileData) {
      // If profile doesn't exist, create it
      const newProfileData = {
        id: data.user.id,
        email: data.user.email!,
        display_name: data.user.user_metadata?.display_name || null,
        is_admin: false,
        can_create_events: false,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert(newProfileData)
        .select()
        .single();

      if (createError) {
        console.error("Failed to create user profile:", createError);
        // Return a basic profile even if creation fails
        const newProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email!,
          display_name: undefined,
          avatar_url: undefined,
          is_admin: false,
          can_create_events: false,
          created_at: new Date().toISOString(),
        };
        return { user: newProfile, error: null };
      }

      const newProfile: UserProfile = {
        id: createdProfile.id,
        email: createdProfile.email,
        display_name: createdProfile.display_name,
        avatar_url: createdProfile.avatar_url,
        is_admin: createdProfile.is_admin,
        can_create_events: createdProfile.can_create_events,
        created_at: createdProfile.created_at,
      };
      return { user: newProfile, error: null };
    }

    const profile: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      is_admin: profileData.is_admin,
      can_create_events: profileData.can_create_events,
      created_at: profileData.created_at,
    };

    return { user: profile, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err : new Error("Unknown error occurred"),
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Unknown error occurred"),
    };
  }
}

/**
 * Get the current user session
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      // If profile doesn't exist, create it
      const newProfileData = {
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || null,
        is_admin: false,
        can_create_events: false,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert(newProfileData)
        .select()
        .single();

      if (createError) {
        console.error("Failed to create user profile:", createError);
        return null;
      }

      return {
        id: createdProfile.id,
        email: createdProfile.email,
        display_name: createdProfile.display_name,
        avatar_url: createdProfile.avatar_url,
        is_admin: createdProfile.is_admin,
        can_create_events: createdProfile.can_create_events,
        created_at: createdProfile.created_at,
      };
    }

    return {
      id: profileData.id,
      email: profileData.email,
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      is_admin: profileData.is_admin,
      can_create_events: profileData.can_create_events,
      created_at: profileData.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Check if the current user's email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.email_confirmed_at != null;
  } catch {
    return false;
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Unknown error occurred"),
    };
  }
}
