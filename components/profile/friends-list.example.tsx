/** @format */

/**
 * Example usage of the FriendsList component
 * 
 * This file demonstrates how to use the FriendsList component
 * in a profile page or dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FriendsList } from "./friends-list";
import { getUserFriends } from "@/lib/profile/friendships";
import { FriendWithProfile } from "@/types/friendship";

export function FriendsListExample({ userId }: { userId: string }) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFriends() {
      setIsLoading(true);
      const { data, error } = await getUserFriends(userId);
      
      if (data) {
        setFriends(data);
      } else if (error) {
        console.error("Failed to load friends:", error);
      }
      
      setIsLoading(false);
    }

    loadFriends();
  }, [userId]);

  const handleFriendClick = (friendId: string) => {
    router.push(`/profile/${friendId}`);
  };

  return (
    <FriendsList
      friends={friends}
      isLoading={isLoading}
      onFriendClick={handleFriendClick}
    />
  );
}

/**
 * Usage in a page component:
 * 
 * import { FriendsListExample } from "@/components/profile/friends-list.example";
 * 
 * export default function MyProfilePage() {
 *   const { user } = useAuth();
 *   
 *   return (
 *     <div className="container mx-auto p-6">
 *       <FriendsListExample userId={user.id} />
 *     </div>
 *   );
 * }
 */
