/** @format */

// Event data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import {
  EventRow,
  EventInsert,
  EventUpdate,
  EventWithRegistration,
  EventFilters,
  CreateEventData,
  UpdateEventData,
  EventCategory,
} from "@/types/event";
import { handleError, DatabaseError, AuthenticationError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";
import { createSubforum } from "@/lib/forum/subforums";
import { createChannel } from "@/lib/channel/channels";

const supabase = createClient();

/**
 * Helper function to check if a user can see a private event
 * Returns true if:
 * - The event is public (not private)
 * - The user is the event creator
 * - The user is friends with the event creator
 */
async function getEventVisibility(
  event: { is_private: boolean; creator_id: string },
  userId: string | undefined
): Promise<boolean> {
  // Public events are visible to everyone
  if (!event.is_private) {
    return true;
  }

  // If no user is logged in, private events are not visible
  if (!userId) {
    return false;
  }

  // Creator can always see their own private events
  if (event.creator_id === userId) {
    return true;
  }

  // Check if user is friends with the creator
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(`and(user_id.eq.${userId},friend_id.eq.${event.creator_id}),and(user_id.eq.${event.creator_id},friend_id.eq.${userId})`)
    .single();

  return !!friendship;
}

/**
 * Helper function to create a forum for a public event
 * Automatically creates a subforum and links it to the event
 */
async function createEventForum(
  eventId: string,
  eventTitle: string,
  creatorId: string
): Promise<{ forumId: string | null; error: Error | null }> {
  try {
    // Create the forum
    const forumData = {
      name: `${eventTitle} - Discussion`,
      description: `Forum for discussing ${eventTitle}`,
    };

    const { data: forum, error: forumError } = await createSubforum(forumData, creatorId);

    if (forumError || !forum) {
      throw forumError || new Error("Failed to create forum");
    }

    // Link forum to event
    const { error: updateError } = await supabase
      .from("events")
      .update({ forum_id: forum.id })
      .eq("id", eventId);

    if (updateError) {
      // If linking fails, try to clean up the forum
      await supabase.from("subforums").delete().eq("id", forum.id);
      throw new DatabaseError(updateError.message, { operation: 'linkForumToEvent' });
    }

    logger.info('Forum created for event', {
      operation: 'createEventForum',
      userId: creatorId,
      metadata: { eventId, forumId: forum.id },
    });

    return { forumId: forum.id, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'createEventForum',
      userId: creatorId,
      metadata: { eventId, eventTitle },
    });
    return { forumId: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Helper function to create a cluster for a private event
 * Automatically creates a pin-protected cluster and links it to the event
 */
async function createEventCluster(
  eventId: string,
  eventTitle: string,
  creatorId: string
): Promise<{ clusterId: string | null; pin: string | null; error: Error | null }> {
  try {
    // Generate 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    // Create the cluster
    const clusterData = {
      name: `${eventTitle} - Chat`,
      description: `Private chat for ${eventTitle}`,
      access_type: 'pin' as const,
      pin_code: pin,
    };

    const { data: cluster, error: clusterError } = await createChannel(clusterData, creatorId);

    if (clusterError || !cluster) {
      throw clusterError || new Error("Failed to create cluster");
    }

    // Link cluster to event and store PIN
    const { error: updateError } = await supabase
      .from("events")
      .update({ 
        cluster_id: cluster.id,
        cluster_pin: pin 
      })
      .eq("id", eventId);

    if (updateError) {
      // If linking fails, try to clean up the cluster
      await supabase.from("channels").delete().eq("id", cluster.id);
      throw new DatabaseError(updateError.message, { operation: 'linkClusterToEvent' });
    }

    logger.info('Cluster created for event', {
      operation: 'createEventCluster',
      userId: creatorId,
      metadata: { eventId, clusterId: cluster.id },
    });

    return { clusterId: cluster.id, pin, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'createEventCluster',
      userId: creatorId,
      metadata: { eventId, eventTitle },
    });
    return { clusterId: null, pin: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Create a new event (requires event creation permission for public events, any user for private events)
 */
export async function createEvent(
  data: CreateEventData,
  userId: string
): Promise<{ data: EventRow | null; error: Error | null }> {
  try {
    // Validate start_time and end_time
    if (!data.start_time) {
      throw new ValidationError("Start time is required", { field: 'start_time' });
    }

    // Validate end_time is after start_time if provided
    if (data.end_time && data.end_time <= data.start_time) {
      throw new ValidationError(
        "End time must be after start time",
        { start_time: data.start_time, end_time: data.end_time }
      );
    }

    // Validate category
    const validCategories: EventCategory[] = ['social', 'academic', 'sports', 'cultural', 'other'];
    if (!data.category || !validCategories.includes(data.category)) {
      throw new ValidationError(
        "Invalid category. Must be one of: social, academic, sports, cultural, other",
        { category: data.category }
      );
    }

    // Check permissions based on event type (public vs private)
    const isPrivate = data.is_private ?? false;
    
    if (!isPrivate) {
      // Public events require admin or event creation permission
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("can_create_events, is_admin")
        .eq("id", userId)
        .single();

      if (!userProfile?.can_create_events && !userProfile?.is_admin) {
        throw new AuthenticationError(
          "You do not have permission to create public events. Please contact an administrator.",
          "Unauthorized: Event creation permission required"
        );
      }
    }
    // Private events can be created by any authenticated user (no additional check needed)

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        ...data,
        is_private: isPrivate,
        creator_id: userId,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, { operation: 'createEvent' });

    // Create communication channel based on event type
    if (event) {
      if (!isPrivate) {
        // Create forum for public events
        const { forumId, error: forumError } = await createEventForum(
          event.id,
          event.title,
          userId
        );

        if (forumError) {
          // Log the error but don't fail the event creation
          logger.logError(handleError(forumError), {
            operation: 'createEvent',
            userId,
            metadata: { eventId: event.id, message: 'Forum creation failed but event was created' },
          });
        }
      } else {
        // Create cluster for private events
        const { clusterId, pin, error: clusterError } = await createEventCluster(
          event.id,
          event.title,
          userId
        );

        if (clusterError) {
          // Log the error but don't fail the event creation
          logger.logError(handleError(clusterError), {
            operation: 'createEvent',
            userId,
            metadata: { eventId: event.id, message: 'Cluster creation failed but event was created' },
          });
        }
      }
    }

    logger.info('Event created successfully', {
      operation: 'createEvent',
      userId,
      metadata: { eventId: event?.id, title: data.title, isPrivate },
    });

    return { data: event, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'createEvent',
      userId,
      metadata: { title: data.title },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Get an event by ID with registration info
 */
export async function getEvent(
  id: string,
  userId?: string
): Promise<{ data: EventWithRegistration | null; error: Error | null }> {
  try {
    const { data: event, error } = await supabase
      .from("events")
      .select(
        `
        *,
        user_profiles!events_creator_id_fkey(display_name)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Check if user can see this event based on visibility rules
    const canSee = await getEventVisibility(event, userId);
    if (!canSee) {
      throw new AuthenticationError(
        "This event is only visible to the creator's friends",
        "Unauthorized: Private event access denied"
      );
    }

    let is_registered = false;
    let user_registration = null;
    let registration_count = 0;

    if (event) {
      // Get registration count
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", id);

      registration_count = count || 0;

      // Check if user is registered
      if (userId) {
        const { data: registration } = await supabase
          .from("event_registrations")
          .select("*")
          .eq("event_id", id)
          .eq("user_id", userId)
          .single();

        is_registered = !!registration;
        user_registration = registration;
      }
    }

    // Extract creator name from nested user_profiles
    const creator_name = (event as any).user_profiles?.display_name || null;

    // Fetch channel information
    let forum_name = null;
    let cluster_name = null;
    let cluster_pin_display = null;

    if (event.forum_id) {
      // Fetch forum details for public events
      const { data: forum } = await supabase
        .from("subforums")
        .select("name")
        .eq("id", event.forum_id)
        .single();
      
      forum_name = forum?.name || null;
    }

    if (event.cluster_id) {
      // Fetch cluster details for private events
      const { data: cluster } = await supabase
        .from("channels")
        .select("name")
        .eq("id", event.cluster_id)
        .single();
      
      cluster_name = cluster?.name || null;

      // Only show cluster PIN if user is registered
      if (is_registered && event.cluster_pin) {
        cluster_pin_display = event.cluster_pin;
      }
    }

    const result: EventWithRegistration = {
      ...event,
      is_registered,
      registration_count,
      user_registration,
      creator_name,
      forum_name,
      cluster_name,
      cluster_pin_display,
    };

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all events with optional filtering
 */
export async function getEvents(
  filters?: EventFilters,
  userId?: string
): Promise<{ data: EventWithRegistration[] | null; error: Error | null }> {
  try {
    let query = supabase.from("events").select(`
        *,
        user_profiles!events_creator_id_fkey(display_name)
      `);

    // Show published events OR events created by the user (so they can see their drafts)
    if (userId) {
      query = query.or(`is_published.eq.true,creator_id.eq.${userId}`);
    } else {
      query = query.eq("is_published", true);
    }

    // Apply date range filter
    if (filters?.dateRange) {
      query = query
        .gte("date", filters.dateRange.start)
        .lte("date", filters.dateRange.end);
    }

    // Apply event type filter
    if (filters?.eventType) {
      query = query.eq("event_type", filters.eventType);
    }

    // Apply category filter
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    // Apply search filter
    if (filters?.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      query = query.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }

    // Default sort by date, ascending (soonest first)
    query = query.order("date", { ascending: true });

    const { data: events, error } = await query;

    if (error) throw error;

    let result: EventWithRegistration[] = [];

    if (events) {
      // Filter events based on visibility rules
      const visibleEvents = [];
      for (const event of events) {
        const canSee = await getEventVisibility(event, userId);
        if (canSee) {
          visibleEvents.push(event);
        }
      }

      // Get registration info for each visible event
      const eventIds = visibleEvents.map((e) => e.id);

      // Get registration counts
      const { data: registrationCounts } = await supabase
        .from("event_registrations")
        .select("event_id")
        .in("event_id", eventIds);

      const countMap = new Map<string, number>();
      registrationCounts?.forEach((reg) => {
        countMap.set(reg.event_id, (countMap.get(reg.event_id) || 0) + 1);
      });

      // Get user registrations if userId provided
      let userRegistrations: Map<string, any> = new Map();
      if (userId) {
        const { data: userRegs } = await supabase
          .from("event_registrations")
          .select("*")
          .eq("user_id", userId)
          .in("event_id", eventIds);

        userRegs?.forEach((reg) => {
          userRegistrations.set(reg.event_id, reg);
        });
      }

      // Fetch channel information for all visible events
      const forumIds = visibleEvents.filter(e => e.forum_id).map(e => e.forum_id!);
      const clusterIds = visibleEvents.filter(e => e.cluster_id).map(e => e.cluster_id!);

      let forumMap = new Map<string, string>();
      let clusterMap = new Map<string, string>();

      if (forumIds.length > 0) {
        const { data: forums } = await supabase
          .from("subforums")
          .select("id, name")
          .in("id", forumIds);
        
        forums?.forEach(forum => {
          forumMap.set(forum.id, forum.name);
        });
      }

      if (clusterIds.length > 0) {
        const { data: clusters } = await supabase
          .from("channels")
          .select("id, name")
          .in("id", clusterIds);
        
        clusters?.forEach(cluster => {
          clusterMap.set(cluster.id, cluster.name);
        });
      }

      result = visibleEvents.map((event) => {
        // Extract creator name from nested user_profiles
        const creator_name = (event as any).user_profiles?.display_name || null;
        const is_registered = userId ? userRegistrations.has(event.id) : false;
        
        return {
          ...event,
          is_registered,
          registration_count: countMap.get(event.id) || 0,
          user_registration: userId ? userRegistrations.get(event.id) : null,
          creator_name,
          forum_name: event.forum_id ? forumMap.get(event.forum_id) || null : null,
          cluster_name: event.cluster_id ? clusterMap.get(event.cluster_id) || null : null,
          cluster_pin_display: is_registered && event.cluster_pin ? event.cluster_pin : null,
        };
      });
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update an event (creator or admin only)
 */
export async function updateEvent(
  id: string,
  updates: UpdateEventData,
  userId: string
): Promise<{ data: EventRow | null; error: Error | null }> {
  try {
    // Get the event to check creator
    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is creator or admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (event.creator_id !== userId && !userProfile?.is_admin) {
      throw new Error("Only the event creator or an administrator can update this event");
    }

    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedEvent, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete an event (creator or admin only)
 */
export async function deleteEvent(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Get the event to check creator
    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is creator or admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (event.creator_id !== userId && !userProfile?.is_admin) {
      throw new Error("Only the event creator or an administrator can delete this event");
    }

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Register for an event
 */
export async function registerForEvent(
  eventId: string,
  userId: string
): Promise<{ data: any | null; error: Error | null }> {
  try {
    // Check if event exists and is published
    const { data: event } = await supabase
      .from("events")
      .select("id, is_published, max_attendees, is_private, event_type")
      .eq("id", eventId)
      .single();

    if (!event) {
      throw new ValidationError("Event not found", { eventId });
    }

    if (!event.is_published) {
      throw new ValidationError("This event is not yet published", { eventId });
    }

    // Check if already registered
    const { data: existingRegistration } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (existingRegistration) {
      throw new ValidationError("You are already registered for this event", { eventId });
    }

    // Check if event is full
    if (event.max_attendees) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (count && count >= event.max_attendees) {
        throw new ValidationError("This event is full", { eventId, maxAttendees: event.max_attendees });
      }
    }

    // Create registration
    // Note: QR codes are NOT generated for private events (Requirement 5.6)
    // QR codes are only generated for public TUM native events
    const { data: registration, error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, { operation: 'registerForEvent' });

    logger.info('User registered for event', {
      operation: 'registerForEvent',
      userId,
      metadata: { 
        eventId, 
        registrationId: registration?.id,
        isPrivate: event.is_private,
        eventType: event.event_type
      },
    });

    return { data: registration, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: 'registerForEvent',
      userId,
      metadata: { eventId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Unregister from an event
 */
export async function unregisterFromEvent(
  eventId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get event registrations (for event creator or admin)
 */
export async function getEventRegistrations(
  eventId: string,
  userId: string
): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    // Check if user is event creator or admin
    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      throw new Error("Event not found");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (event.creator_id !== userId && !userProfile?.is_admin) {
      throw new Error("Only the event creator or an administrator can view registrations");
    }

    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        `
        *,
        user_profiles!event_registrations_user_id_fkey(
          id,
          display_name,
          email
        )
      `
      )
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get user's registered events
 */
export async function getUserRegisteredEvents(
  userId: string
): Promise<{ data: EventWithRegistration[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        `
        *,
        events!event_registrations_event_id_fkey(*)
      `
      )
      .eq("user_id", userId)
      .order("registered_at", { ascending: false });

    if (error) throw error;

    const events: EventWithRegistration[] =
      data?.map((registration: any) => ({
        ...registration.events,
        is_registered: true,
        user_registration: {
          id: registration.id,
          event_id: registration.event_id,
          user_id: registration.user_id,
          qr_code: registration.qr_code,
          registered_at: registration.registered_at,
        },
      })) || [];

    return { data: events, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get user's created events
 */
export async function getUserCreatedEvents(
  userId: string
): Promise<{ data: EventRow[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Publish an event (creator or admin only)
 */
export async function publishEvent(
  id: string,
  userId: string
): Promise<{ data: EventRow | null; error: Error | null }> {
  try {
    // Get the event to check creator
    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is creator or admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (event.creator_id !== userId && !userProfile?.is_admin) {
      throw new Error("Only the event creator or an administrator can publish this event");
    }

    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update({ is_published: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedEvent, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Unpublish an event (creator or admin only)
 */
export async function unpublishEvent(
  id: string,
  userId: string
): Promise<{ data: EventRow | null; error: Error | null }> {
  try {
    // Get the event to check creator
    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is creator or admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (event.creator_id !== userId && !userProfile?.is_admin) {
      throw new Error("Only the event creator or an administrator can unpublish this event");
    }

    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update({ is_published: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data: updatedEvent, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
