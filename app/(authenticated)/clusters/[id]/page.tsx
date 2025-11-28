/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { ChannelView } from "@/components/channel";
import { ChannelWithMembership } from "@/types/channel";
import { getChannel } from "@/lib/channel";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ChannelPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<ChannelWithMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChannel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await getChannel(channelId, user?.id);
      if (error) throw error;
      if (!data) throw new Error("Cluster not found");

      setChannel(data);
    } catch (err) {
      console.error("Failed to load channel:", err);
      setError(err instanceof Error ? err.message : "Failed to load channel");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && channelId) {
      loadChannel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, channelId]);

  const handleBack = () => {
    router.push("/clusters");
  };

  const handleChannelUpdate = (updatedChannel: ChannelWithMembership) => {
    setChannel(updatedChannel);
  };

  // ---------- RENDER STATES ----------

  if (!user?.id) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <main className='min-h-screen bg-background/80 flex items-center justify-center px-4'>
          <Card className='max-w-md w-full border-border/60 bg-card/90'>
            <CardContent className='p-8 text-center space-y-3'>
              <CardTitle className='text-lg'>Sign in required</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Please log in to view clusters and participate in discussions.
              </p>
              <Button className='mt-2' onClick={() => router.push("/")}>
                Go to home
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <main className='min-h-screen bg-background/80 flex items-center justify-center px-4'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <Loader2 className='h-7 w-7 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Loading cluster…</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !channel) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <main className='min-h-screen bg-background/80 flex items-center justify-center px-4'>
          <Card className='max-w-xl w-full border-border/60 bg-card/90'>
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl font-semibold text-foreground'>
                Channel not found
              </CardTitle>
            </CardHeader>
            <CardContent className='pb-8 pt-0 text-center space-y-4'>
              <p className='text-sm text-muted-foreground'>
                {error ||
                  "The cluster you're looking for doesn't exist or is no longer available."}
              </p>
              <Button className='gap-2' onClick={handleBack}>
                Back to Clusters
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      {/* subtle neon background like dashboard/forums */}
      <main className='flex h-[calc(100vh-4rem)] max-h-[760px] w-full max-w-[1100px] flex-col  bg-card shadow-xl overflow-hidden'>
        <ChannelView
          channel={channel}
          currentUserId={user.id}
          onBack={handleBack}
          onChannelUpdate={handleChannelUpdate}
        />
      </main>
    </>
  );
}

export default function ChannelPage() {
  return (
    <ProtectedRoute requireVerified={false}>
      <ChannelPageContent />
    </ProtectedRoute>
  );
}
