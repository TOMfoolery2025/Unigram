/** @format */

// QR code generation functions for TUM native events

import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * Generate a unique QR code for a user's event registration
 * Only for TUM native events
 */
export async function generateEventQRCode(
  eventId: string,
  userId: string
): Promise<{ data: string | null; error: Error | null }> {
  try {
    // Check if event is TUM native
    const { data: event } = await supabase
      .from("events")
      .select("event_type")
      .eq("id", eventId)
      .single();

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.event_type !== "tum_native") {
      throw new Error("QR codes are only generated for TUM native events");
    }

    // Check if user is registered
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (!registration) {
      throw new Error("User is not registered for this event");
    }

    // Generate unique QR code data
    const qrData = JSON.stringify({
      eventId,
      userId,
      registrationId: registration.id,
      timestamp: Date.now(),
    });

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    // Update registration with QR code
    const { error: updateError } = await supabase
      .from("event_registrations")
      .update({ qr_code: qrCodeDataURL })
      .eq("id", registration.id);

    if (updateError) throw updateError;

    return { data: qrCodeDataURL, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get QR code for a user's event registration
 */
export async function getEventQRCode(
  eventId: string,
  userId: string
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("qr_code")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (!registration) {
      throw new Error("Registration not found");
    }

    // If QR code doesn't exist, generate it
    if (!registration.qr_code) {
      return await generateEventQRCode(eventId, userId);
    }

    return { data: registration.qr_code, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Invalidate QR code when user unregisters from event
 * This is handled automatically by the unregisterFromEvent function
 * which deletes the registration record
 */
export async function invalidateEventQRCode(
  eventId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Simply remove the QR code from the registration
    const { error } = await supabase
      .from("event_registrations")
      .update({ qr_code: null })
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Verify a QR code is valid for an event
 */
export async function verifyEventQRCode(
  qrData: string
): Promise<{ data: { valid: boolean; eventId?: string; userId?: string }; error: Error | null }> {
  try {
    // Parse QR code data
    const parsed = JSON.parse(qrData);
    const { eventId, userId, registrationId } = parsed;

    if (!eventId || !userId || !registrationId) {
      return { data: { valid: false }, error: null };
    }

    // Check if registration still exists
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id, qr_code")
      .eq("id", registrationId)
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (!registration || !registration.qr_code) {
      return { data: { valid: false }, error: null };
    }

    return { data: { valid: true, eventId, userId }, error: null };
  } catch (error) {
    return { data: { valid: false }, error: error as Error };
  }
}
