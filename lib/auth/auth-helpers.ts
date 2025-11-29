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
      display_name: null,
      avatar_url: null,
      bio: null,
      interests: null,
      profile_visibility: 'public',
      is_admin: false,
      can_create_events: false,
      projects: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
          display_name: null,
          avatar_url: null,
          bio: null,
          interests: null,
          profile_visibility: 'public',
          is_admin: false,
          can_create_events: false,
          projects: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { user: newProfile, error: null };
      }

      const newProfile: UserProfile = {
        id: createdProfile.id,
        email: createdProfile.email,
        display_name: createdProfile.display_name,
        avatar_url: createdProfile.avatar_url,
        bio: createdProfile.bio || null,
        interests: createdProfile.interests || null,
        profile_visibility: createdProfile.profile_visibility || 'public',
        is_admin: createdProfile.is_admin,
        can_create_events: createdProfile.can_create_events,
        projects: createdProfile.projects || null,
        created_at: createdProfile.created_at,
        updated_at: createdProfile.updated_at,
      };
      return { user: newProfile, error: null };
    }

    const profile: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      bio: profileData.bio || null,
      interests: profileData.interests || null,
      profile_visibility: profileData.profile_visibility || 'public',
      is_admin: profileData.is_admin,
      can_create_events: profileData.can_create_events,
      projects: profileData.projects || null,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
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
        // Fallback to basic profile when profile fetch/creation fails
        // This ensures authentication persists even if profile is incomplete
        const basicProfile: UserProfile = {
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.display_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          interests: null,
          profile_visibility: 'public',
          is_admin: false,
          can_create_events: false,
          projects: null,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        };
        return basicProfile;
      }

      return {
        id: createdProfile.id,
        email: createdProfile.email,
        display_name: createdProfile.display_name,
        avatar_url: createdProfile.avatar_url,
        bio: createdProfile.bio || null,
        interests: createdProfile.interests || null,
        profile_visibility: createdProfile.profile_visibility || 'public',
        is_admin: createdProfile.is_admin,
        can_create_events: createdProfile.can_create_events,
        projects: createdProfile.projects || null,
        created_at: createdProfile.created_at,
        updated_at: createdProfile.updated_at,
      };
    }

    return {
      id: profileData.id,
      email: profileData.email,
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      bio: profileData.bio || null,
      interests: profileData.interests || null,
      profile_visibility: profileData.profile_visibility || 'public',
      is_admin: profileData.is_admin,
      can_create_events: profileData.can_create_events,
      projects: profileData.projects || null,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    // On unexpected errors, try to get basic auth user info
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Return basic profile from auth user to maintain authentication
        const basicProfile: UserProfile = {
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.display_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          interests: null,
          profile_visibility: 'public',
          is_admin: false,
          can_create_events: false,
          projects: null,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        };
        return basicProfile;
      }
    } catch {
      // If even basic auth check fails, return null
    }
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
