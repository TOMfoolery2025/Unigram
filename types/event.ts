/** @format */

import { Database } from "./database.types";

// Event types from database
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type EventRegistrationRow =
  Database["public"]["Tables"]["event_registrations"]["Row"];
export type EventRegistrationInsert =
  Database["public"]["Tables"]["event_registrations"]["Insert"];
export type EventRegistrationUpdate =
  Database["public"]["Tables"]["event_registrations"]["Update"];

// Event type enum
export type EventType = "tum_native" | "external";

// Event category enum
export type EventCategory = "social" | "academic" | "sports" | "cultural" | "other";

// Extended event with registration info
export interface EventWithRegistration extends EventRow {
  is_registered?: boolean;
  registration_count?: number;
  user_registration?: EventRegistrationRow | null;
  creator_name?: string | null;
  // Channel information
  forum_name?: string | null;
  cluster_name?: string | null;
  cluster_pin_display?: string | null; // Only shown if user is registered
}

// Event filter options
export interface EventFilters {
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  eventType?: EventType;
  category?: EventCategory;
  searchQuery?: string;
}

// Event creation data
export interface CreateEventData {
  title: string;
  description: string;
  event_type: EventType;
  date: string; // ISO date string
  start_time: string;
  end_time?: string | null;
  location: string;
  external_link?: string | null;
  max_attendees?: number | null;
  is_published?: boolean;
  is_private?: boolean;
  category: EventCategory;
}

// Event update data
export interface UpdateEventData {
  title?: string;
  description?: string;
  event_type?: EventType;
  date?: string;
  start_time?: string;
  end_time?: string | null;
  location?: string;
  external_link?: string | null;
  max_attendees?: number | null;
  is_published?: boolean;
  is_private?: boolean;
  category?: EventCategory;
  forum_id?: string | null;
  cluster_id?: string | null;
  cluster_pin?: string | null;
}
