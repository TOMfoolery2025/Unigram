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
} from "@/types/event";

const supabase = createClient();

/**
 * Create a new event (requires event creation permission)
 */
export async function createEvent(
  data: CreateEventData,
  userId: string
): Promise<{ data: EventRow | null; error: Error | null }> {
  try {
    // Check if user has permission to create events
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("can_create_events, is_admin")
      .eq("id", userId)
      .single();

    if (!userProfile?.can_create_events && !userProfile?.is_admin) {
      throw new Error(
        "You do not have permission to create events. Please contact an administrator."
      );
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        ...data,
        creator_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: event, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
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

    const result: EventWithRegistration = {
      ...event,
      is_registered,
      registration_count,
      user_registration,
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
      // Get registration info for each event
      const eventIds = events.map((e) => e.id);

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

      result = events.map((event) => ({
        ...event,
        is_registered: userId ? userRegistrations.has(event.id) : false,
        registration_count: countMap.get(event.id) || 0,
        user_registration: userId ? userRegistrations.get(event.id) : null,
      }));
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
      .select("id, is_published, max_attendees")
      .eq("id", eventId)
      .single();

    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.is_published) {
      throw new Error("This event is not yet published");
    }

    // Check if already registered
    const { data: existingRegistration } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (existingRegistration) {
      throw new Error("You are already registered for this event");
    }

    // Check if event is full
    if (event.max_attendees) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (count && count >= event.max_attendees) {
        throw new Error("This event is full");
      }
    }

    // Create registration (QR code will be added separately for TUM native events)
    const { data: registration, error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: registration, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
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
