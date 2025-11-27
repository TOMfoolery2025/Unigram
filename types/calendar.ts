/** @format */

import { EventType } from "./event";
import { EventRegistrationRow } from "./event";

// Calendar-specific event type
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  time: string;
  location: string;
  event_type: EventType;
  external_link?: string | null;
  creator_name: string;
  is_registered: boolean;
  user_registration?: EventRegistrationRow | null;
  created_at: string;
}

// Calendar filter options
export interface CalendarFilters {
  showOnlyRegistered: boolean;
}

// Calendar view types
export type CalendarView = "month" | "week" | "day";

// Calendar event for react-big-calendar
export interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEvent;
}

// ICS export options
export interface ICSExportOptions {
  filename: string;
  includeOnlyRegistered: boolean;
}