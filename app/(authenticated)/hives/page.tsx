/** @format */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";

import {
  getSubforums,
  joinSubforum,
  leaveSubforum,
  createSubforum,
} from "@/lib/forum";
import { SubforumWithMembership } from "@/types/forum";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import {
  Calendar,
  ChevronDown,
  Filter,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type SortOption = "date-desc" | "date-asc" | "members-desc" | "members-asc";
type FilterOption = "all" | "joined" | "not-joined";

function ForumsContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [subforums, setSubforums] = useState<SubforumWithMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  // create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // ----- LOAD -----
  const loadSubforums = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await getSubforums(undefined, user.id);
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

  const handleJoinSubforum = async (subforumId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await joinSubforum(subforumId, user.id);
      if (error) {
        console.error("Failed to join subforum:", error);
        return;
      }
      await loadSubforums();
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
      await loadSubforums();
    } catch (error) {
      console.error("Failed to leave subforum:", error);
    }
  };

  const handleViewSubforum = (subforumId: string) => {
    router.push(`/hives/${subforumId}`);
  };

  const handleCreateSubforum = async () => {
    if (!user?.id) return;
    if (!newName.trim()) return;

    try {
      setIsCreating(true);
      const { error } = await createSubforum(
        {
          name: newName.trim(),
          description: newDescription.trim(),
        },
        user.id
      );
      if (error) {
        console.error("Failed to create subforum:", error);
        return;
      }

      setNewName("");
      setNewDescription("");
      setShowCreateForm(false);
      await loadSubforums();
    } catch (error) {
      console.error("Failed to create subforum:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // ----- FILTER + SORT -----
  const filtered = useMemo(() => {
    let list = [...subforums];

    if (filterBy === "joined") list = list.filter((s) => s.is_member);
    if (filterBy === "not-joined") list = list.filter((s) => !s.is_member);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "date-desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "members-asc":
          return (a.member_count || 0) - (b.member_count || 0);
        case "members-desc":
          return (b.member_count || 0) - (a.member_count || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [subforums, search, sortBy, filterBy]);

  const sortLabel =
    sortBy === "date-desc"
      ? "Newest"
      : sortBy === "date-asc"
      ? "Oldest"
      : sortBy === "members-desc"
      ? "Most members"
      : "Fewest members";

  const filterLabel =
    filterBy === "joined"
      ? "Joined only"
      : filterBy === "not-joined"
      ? "Not joined"
      : "All hives";

  // ----- UI -----
  return (
    <>
      {/* neon bg like dashboard */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' />

      <main className='min-h-screen bg-background/80 px-4 py-10 md:px-6'>
        <div className='max-w-6xl mx-auto space-y-8'>
          {/* HEADER */}
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-3xl md:text-4xl font-bold text-primary'>
                Hives
              </h1>
              <p className='mt-1 text-sm md:text-base text-muted-foreground max-w-xl'>
                Join discussions on topics that interest you. Subscribed hives
                show up in your dashboard and activity feed.
              </p>
            </div>
            <Button
              className='gap-2 '
              onClick={() => setShowCreateForm((v) => !v)}>
              <Plus className='h-4 w-4' />
              {showCreateForm ? "Close" : "Create Hive"}
            </Button>
          </div>

          {/* CREATE FORM (inline glass card) */}
          {showCreateForm && (
            <Card className='card-hover-glow border-border/60 bg-card/90'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg'>Create a new hive</CardTitle>
                <CardDescription className='text-sm'>
                  Give your hive a clear, searchable name and short description
                  so other students can find it easily.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-muted-foreground'>
                    Name
                  </label>
                  <Input
                    placeholder='e.g. “CNS Study Group”'
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className='bg-background/60 border-border/60'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-muted-foreground'>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder='What is this hive about?'
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className='w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
                  />
                </div>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewName("");
                      setNewDescription("");
                    }}>
                    Cancel
                  </Button>
                  <Button
                    size='sm'
                    onClick={handleCreateSubforum}
                    disabled={isCreating || !newName.trim()}
                    className='shadow-[0_0_24px_rgba(139,92,246,0.6)]'>
                    {isCreating ? "Creating…" : "Create"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEARCH + FILTERS */}
          <Card className='card-hover-glow border-border/60 bg-card/90'>
            <CardContent className='flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between'>
              <div className='relative w-full md:max-w-xl'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search hives...'
                  className='pl-9 bg-background/60 border-border/60'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className='flex flex-wrap items-center gap-2 justify-end'>
                {/* sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-2 border-border/60'>
                      <Filter className='h-4 w-4' />
                      {sortLabel}
                      <ChevronDown className='h-3 w-3' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-44'>
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                      Newest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                      Oldest first
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("members-desc")}>
                      Most members
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("members-asc")}>
                      Fewest members
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-2 border-border/60'>
                      {filterLabel}
                      <ChevronDown className='h-3 w-3' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-44'>
                    <DropdownMenuLabel>Filter</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterBy("all")}>
                      All hives
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("joined")}>
                      Joined only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("not-joined")}>
                      Not joined
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* COUNT + REFRESH */}
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span>
              {filtered.length} hive{filtered.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={loadSubforums}
              className='text-[11px] uppercase tracking-wide text-primary hover:text-primary/80'>
              Refresh
            </button>
          </div>

          {/* LIST */}
          {isLoading ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {[0, 1, 2].map((i) => (
                <Card
                  key={i}
                  className='border-border/60 bg-card/70 h-32 animate-pulse'>
                  <CardContent />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className='card-hover-glow border-border/60 bg-card/90'>
              <CardContent className='py-10 text-center space-y-2'>
                <p className='text-sm font-medium'>
                  No hives match your filters.
                </p>
                <p className='text-xs text-muted-foreground'>
                  Try clearing the search or filters, or create a new hive for
                  your topic.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-5 md:grid-cols-2'>
              {filtered.map((sf) => {
                const createdLabel = formatDistanceToNow(
                  new Date(sf.created_at),
                  { addSuffix: true }
                );

                return (
                  <Card
                    key={sf.id}
                    className='card-hover-glow border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 cursor-pointer transition-transform hover:-translate-y-0.5'
                    onClick={() => handleViewSubforum(sf.id)}>
                    <CardHeader className='flex flex-row items-start justify-between gap-3 pb-3'>
                      <div>
                        <CardTitle className='text-lg font-semibold text-primary'>
                          {sf.name}
                        </CardTitle>
                        {sf.description && (
                          <CardDescription className='mt-1 text-xs'>
                            {sf.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        {sf.is_member && (
                          <Badge
                            variant='outline'
                            className='text-[10px] border-emerald-500/60 text-emerald-300'>
                            Joined
                          </Badge>
                        )}
                        <Button
                          size='sm'
                          variant={sf.is_member ? "outline" : "default"}
                          className={
                            sf.is_member
                              ? "border-border/70"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            sf.is_member
                              ? handleLeaveSubforum(sf.id)
                              : handleJoinSubforum(sf.id);
                          }}>
                          {sf.is_member ? "Leave" : "Join"}
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className='pt-0 text-xs text-muted-foreground'>
                      <div className='flex flex-wrap items-center gap-4'>
                        <div className='flex items-center gap-1'>
                          <Users className='h-3.5 w-3.5' />
                          <span>
                            {sf.member_count} member
                            {sf.member_count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3.5 w-3.5' />
                          <span>Created {createdLabel}</span>
                        </div>
                        {sf.creator_name && <span>by {sf.creator_name}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ForumsPage() {
  return (
    <ProtectedRoute requireVerified={false}>
      <ForumsContent />
    </ProtectedRoute>
  );
}
