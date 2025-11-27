/** @format */

"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { MainNav } from "@/components/navigation/main-nav";
import { SubforumList } from "@/components/forum";
import {
  getSubforums,
  createSubforum,
  joinSubforum,
  leaveSubforum,
} from "@/lib/forum";
import { SubforumWithMembership } from "@/types/forum";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function ForumsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [subforums, setSubforums] = useState<SubforumWithMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubforums = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getSubforums(undefined, user?.id);
      if (error) {
        console.error("Failed to load subforums:", error);
        return;
      }
      setSubforums(data || []);
    } catch (error) {
      console.error("Failed to load subforums:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubforums();
  }, [user?.id]);

  const handleCreateSubforum = async (data: {
    name: string;
    description: string;
  }) => {
    if (!user?.id) return;

    try {
      const { error } = await createSubforum(data, user.id);
      if (error) {
        console.error("Failed to create subforum:", error);
        return;
      }

      await loadSubforums(); // Refresh the list
    } catch (error) {
      console.error("Failed to create subforum:", error);
    }
  };

  const handleJoinSubforum = async (subforumId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await joinSubforum(subforumId, user.id);
      if (error) {
        console.error("Failed to join subforum:", error);
        return;
      }

      await loadSubforums(); // Refresh the list
    } catch (error) {
      console.error("Failed to join subforum:", error);
    }
  };

  const handleLeaveSubforum = async (subforumId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await leaveSubforum(subforumId, user.id);
      if (error) {
        console.error("Failed to leave subforum:", error);
        return;
      }

      await loadSubforums(); // Refresh the list
    } catch (error) {
      console.error("Failed to leave subforum:", error);
    }
  };

  const handleViewSubforum = (subforumId: string) => {
    router.push(`/forums/${subforumId}`);
  };

  return (
    <>
      <MainNav />
      <main className='min-h-screen p-8 bg-background'>
        <div className='max-w-6xl mx-auto'>
          <SubforumList
            subforums={subforums}
            isLoading={isLoading}
            onJoinSubforum={handleJoinSubforum}
            onLeaveSubforum={handleLeaveSubforum}
            onViewSubforum={handleViewSubforum}
            onCreateSubforum={handleCreateSubforum}
            onRefresh={loadSubforums}
            showCreateButton={true}
          />
        </div>
      </main>
    </>
  );
}

export default function ForumsPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <ForumsContent />
    </ProtectedRoute>
  );
}
