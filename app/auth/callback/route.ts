/** @format */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // If session was created successfully, ensure user profile exists
    if (data.user && !error) {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      // If profile doesn't exist, create it
      if (profileError || !profile) {
        await supabase.from("user_profiles").insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: data.user.user_metadata?.display_name || null,
          is_admin: false,
          can_create_events: false,
        });
      }
    }
  }

  // Redirect to dashboard after verification
  return NextResponse.redirect(`${origin}/dashboard`);
}
