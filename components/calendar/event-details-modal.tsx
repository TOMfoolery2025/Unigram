/** @format */

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarEvent } from "@/types/calendar";
import { EventRegistrationIndicator } from "./event-registration-indicator";
import { registerForEvent, unregisterFromEvent } from "@/lib/event";
import { useAuth } from "@/lib/auth";
import { Calendar, Clock, MapPin, User, ExternalLink, QrCode } from "lucide-react";
import { format } from "date-fns";

interface EventDetailsModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationChange: () => void;
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onRegistrationChange,
}: EventDetailsModalProps) {
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegistrationToggle = async () => {
    if (!user) return;

    setIsRegistering(true);
    try {
      if (event.is_registered) {
        const { error } = await unregisterFromEvent(event.id, user.id);
        if (error) throw error;
      } else {
        const { error } = await registerForEvent(event.id, user.id);
        if (error) throw error;
      }
      
      onRegistrationChange();
      onClose();
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const eventDate = new Date(`${event.date}T${event.time}`);
  const formattedDate = format(eventDate, "EEEE, MMMM d, yyyy");
  const formattedTime = format(eventDate, "h:mm a");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{event.title}</DialogTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={event.event_type === "tum_native" ? "default" : "secondary"}>
                  {event.event_type === "tum_native" ? "TUM Native" : "External"}
                </Badge>
                <EventRegistrationIndicator
                  isRegistered={event.is_registered}
                  showLabel
                  size="sm"
                />
              </div>
            </div>
          </div>
          <DialogDescription className="text-left">
            {event.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Details */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formattedTime}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Created by {event.creator_name}</span>
            </div>
          </div>

          {/* External Link */}
          {event.external_link && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">External Registration:</span>
              </div>
              <a
                href={event.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:text-violet-700 text-sm underline mt-1 block"
              >
                {event.external_link}
              </a>
            </div>
          )}

          {/* QR Code Info */}
          {event.event_type === "tum_native" && event.is_registered && event.user_registration?.qr_code && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <QrCode className="h-4 w-4" />
                <span className="font-medium">QR Code Available</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Your QR code ticket is ready for this TUM native event.
              </p>
            </div>
          )}

          {/* Registration Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {event.event_type === "external" && event.external_link ? (
              <Button asChild className="flex-1">
                <a
                  href={event.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Register Externally
                </a>
              </Button>
            ) : (
              <Button
                onClick={handleRegistrationToggle}
                disabled={isRegistering}
                variant={event.is_registered ? "outline" : "default"}
                className="flex-1"
              >
                {isRegistering ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    {event.is_registered ? "Unregistering..." : "Registering..."}
                  </div>
                ) : (
                  event.is_registered ? "Unregister" : "Register"
                )}
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}