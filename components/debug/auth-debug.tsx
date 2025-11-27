/** @format */

"use client";

import { useAuth } from "@/lib/auth";

export function AuthDebug() {
  const { user, loading, isEmailVerified } = useAuth();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 bg-gray-900 border border-gray-700 p-4 rounded-lg text-xs text-white max-w-sm'>
      <h3 className='font-bold mb-2'>Auth Debug</h3>
      <div className='space-y-1'>
        <div>Loading: {loading ? "true" : "false"}</div>
        <div>User: {user ? "authenticated" : "null"}</div>
        <div>Email Verified: {isEmailVerified ? "true" : "false"}</div>
        {user && (
          <div className='mt-2 text-xs'>
            <div>ID: {user.id}</div>
            <div>Email: {user.email}</div>
            <div>Admin: {user.is_admin ? "true" : "false"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
