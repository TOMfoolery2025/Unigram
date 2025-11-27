/** @format */

// ICS export functionality for TUM Community Platform

import { createEvents, EventAttributes } from "ics";
import { CalendarEvent, ICSExportOptions } from "@/types/calendar";
import { getAllCalendarEvents, getRegisteredCalendarEvents } from "./calendar";

/**
 * Convert CalendarEvent to ICS EventAttributes format
 */
function convertToICSEvent(event: CalendarEvent): EventAttributes {
  // Parse date and time
  const eventDate = new Date(`${event.date}T${event.time}`);
  
  // Create date array for ICS format [year, month, day, hour, minute]
  const start: [number, number, number, number, number] = [
    eventDate.getFullYear(),
    eventDate.getMonth() + 1, // ICS months are 1-based
    eventDate.getDate(),
    eventDate.getHours(),
    eventDate.getMinutes(),
  ];

  // Assume 1 hour duration if not specified
  const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);
  const end: [number, number, number, number, number] = [
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    endDate.getDate(),
    endDate.getHours(),
    endDate.getMinutes(),
  ];

  return {
    uid: `${event.id}@tum-community-platform.com`,
    title: event.title,
    description: event.description,
    location: event.location,
    start,
    end,
    url: event.external_link || undefined,
    organizer: {
      name: event.creator_name,
    },
    categories: [event.event_type === "tum_native" ? "TUM Native" : "External"],
    status: "CONFIRMED",
  };
}

/**
 * Generate ICS file content from events array
 * Requirements: 12.6
 */
export function generateICSContent(events: CalendarEvent[]): Promise<{ value: string | undefined; error: Error | null }> {
  return new Promise((resolve) => {
    try {
      const icsEvents = events.map(convertToICSEvent);
      
      createEvents(icsEvents, (error, value) => {
        if (error) {
          resolve({ value: undefined, error: error as Error });
        } else {
          resolve({ value, error: null });
        }
      });
    } catch (error) {
      resolve({ value: undefined, error: error as Error });
    }
  });
}

/**
 * Export all published events to ICS format
 * Requirements: 12.7
 */
export async function exportAllEventsToICS(
  userId?: string,
  filename: string = "tum-community-events.ics"
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data: events, error: fetchError } = await getAllCalendarEvents(userId);
    
    if (fetchError) throw fetchError;
    if (!events || events.length === 0) {
      throw new Error("No events found to export");
    }

    const { value: icsContent, error: icsError } = await generateICSContent(events);
    
    if (icsError) throw icsError;
    if (!icsContent) throw new Error("Failed to generate ICS content");

    return { data: icsContent, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Export only registered events to ICS format
 * Requirements: 12.8
 */
export async function exportRegisteredEventsToICS(
  userId: string,
  filename: string = "my-registered-events.ics"
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data: events, error: fetchError } = await getRegisteredCalendarEvents(userId);
    
    if (fetchError) throw fetchError;
    if (!events || events.length === 0) {
      throw new Error("No registered events found to export");
    }

    const { value: icsContent, error: icsError } = await generateICSContent(events);
    
    if (icsError) throw icsError;
    if (!icsContent) throw new Error("Failed to generate ICS content");

    return { data: icsContent, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Export events based on options
 */
export async function exportEventsToICS(
  userId: string,
  options: ICSExportOptions
): Promise<{ data: string | null; error: Error | null }> {
  if (options.includeOnlyRegistered) {
    return await exportRegisteredEventsToICS(userId, options.filename);
  } else {
    return await exportAllEventsToICS(userId, options.filename);
  }
}

/**
 * Create downloadable blob from ICS content
 */
export function createICSBlob(icsContent: string): Blob {
  return new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
}

/**
 * Trigger download of ICS file in browser
 */
export function downloadICSFile(icsContent: string, filename: string): void {
  const blob = createICSBlob(icsContent);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Format date for ICS filename
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

/**
 * Generate default filename with current date
 */
export function generateDefaultFilename(includeOnlyRegistered: boolean): string {
  const dateStr = formatDateForFilename();
  const prefix = includeOnlyRegistered ? "my-registered-events" : "tum-community-events";
  return `${prefix}-${dateStr}.ics`;
}