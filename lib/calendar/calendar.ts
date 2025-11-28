/** @format */

// Calendar data layer functions for TUM Community Platform

import { createClient } from "@/lib/supabase/client";
import { EventWithRegistration } from "@/types/event";
import { CalendarEvent, CalendarFilters } from "@/types/calendar";

const supabase = createClient();

/**
 * Fetch all published events for calendar display
 * Requirements: 12.1
 */
export async function getAllCalendarEvents(
  userId?: string
): Promise<{ data: CalendarEvent[] | null; error: Error | null }> {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        *,
        user_profiles!events_creator_id_fkey(display_name)
      `)
      .eq("is_published", true)
      .order("date", { ascending: true });

    if (error) throw error;

    let result: CalendarEvent[] = [];

    if (events) {
      // Get user registrations if userId provided
      let userRegistrations: Map<string, any> = new Map();
      if (userId) {
        const eventIds = events.map((e) => e.id);
        const { data: userRegs } = await supabase
          .from("event_registrations")
          .select("*")
          .eq("user_id", userId)
          .in("event_id", eventIds);

        userRegs?.forEach((reg) => {
          userRegistrations.set(reg.event_id, reg);
        });
      }

      // Transform events to calendar format
      result = events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        event_type: event.event_type,
        external_link: event.external_link,
        creator_id: event.creator_id,
        creator_name: event.user_profiles?.display_name || "Unknown",
        is_registered: userId ? userRegistrations.has(event.id) : false,
        user_registration: userId ? userRegistrations.get(event.id) : null,
        created_at: event.created_at,
      }));
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch only registered events for filtered calendar view
 * Requirements: 12.2
 */
export async function getRegisteredCalendarEvents(
  userId: string
): Promise<{ data: CalendarEvent[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(`
        *,
        events!event_registrations_event_id_fkey(
          *,
          user_profiles!events_creator_id_fkey(display_name)
        )
      `)
      .eq("user_id", userId)
      .order("registered_at", { ascending: false });

    if (error) throw error;

    const events: CalendarEvent[] =
      data?.map((registration: any) => ({
        id: registration.events.id,
        title: registration.events.title,
        description: registration.events.description,
        date: registration.events.date,
        time: registration.events.time,
        location: registration.events.location,
        event_type: registration.events.event_type,
        external_link: registration.events.external_link,
        creator_id: registration.events.creator_id,
        creator_name: registration.events.user_profiles?.display_name || "Unknown",
        is_registered: true,
        user_registration: {
          id: registration.id,
          event_id: registration.event_id,
          user_id: registration.user_id,
          qr_code: registration.qr_code,
          registered_at: registration.registered_at,
        },
        created_at: registration.events.created_at,
      })) || [];

    return { data: events, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get calendar events with filtering by registration status
 * Requirements: 12.3
 */
export async function getFilteredCalendarEvents(
  userId: string,
  filters: CalendarFilters
): Promise<{ data: CalendarEvent[] | null; error: Error | null }> {
  try {
    if (filters.showOnlyRegistered) {
      return await getRegisteredCalendarEvents(userId);
    } else {
      return await getAllCalendarEvents(userId);
    }
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get calendar events for a specific date range
 */
export async function getCalendarEventsByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
  showOnlyRegistered: boolean = false
): Promise<{ data: CalendarEvent[] | null; error: Error | null }> {
  try {
    let query;
    
    if (showOnlyRegistered) {
      query = supabase
        .from("event_registrations")
        .select(`
          *,
          events!event_registrations_event_id_fkey(
            *,
            user_profiles!events_creator_id_fkey(display_name)
          )
        `)
        .eq("user_id", userId)
        .gte("events.date", startDate)
        .lte("events.date", endDate);
    } else {
      query = supabase
        .from("events")
        .select(`
          *,
          user_profiles!events_creator_id_fkey(display_name)
        `)
        .eq("is_published", true)
        .gte("date", startDate)
        .lte("date", endDate);
    }

    const { data, error } = await query.order("date", { ascending: true });

    if (error) throw error;

    let result: CalendarEvent[] = [];

    if (data) {
      if (showOnlyRegistered) {
        // Transform registered events
        result = data.map((registration: any) => ({
          id: registration.events.id,
          title: registration.events.title,
          description: registration.events.description,
          date: registration.events.date,
          time: registration.events.time,
          location: registration.events.location,
          event_type: registration.events.event_type,
          external_link: registration.events.external_link,
          creator_id: registration.events.creator_id,
          creator_name: registration.events.user_profiles?.display_name || "Unknown",
          is_registered: true,
          user_registration: {
            id: registration.id,
            event_id: registration.event_id,
            user_id: registration.user_id,
            qr_code: registration.qr_code,
            registered_at: registration.registered_at,
          },
          created_at: registration.events.created_at,
        }));
      } else {
        // Get user registrations for all events
        let userRegistrations: Map<string, any> = new Map();
        if (userId) {
          const eventIds = data.map((e: any) => e.id);
          const { data: userRegs } = await supabase
            .from("event_registrations")
            .select("*")
            .eq("user_id", userId)
            .in("event_id", eventIds);

          userRegs?.forEach((reg) => {
            userRegistrations.set(reg.event_id, reg);
          });
        }

        // Transform all events
        result = data.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          event_type: event.event_type,
          external_link: event.external_link,
          creator_id: event.creator_id,
          creator_name: event.user_profiles?.display_name || "Unknown",
          is_registered: userId ? userRegistrations.has(event.id) : false,
          user_registration: userId ? userRegistrations.get(event.id) : null,
          created_at: event.created_at,
        }));
      }
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}