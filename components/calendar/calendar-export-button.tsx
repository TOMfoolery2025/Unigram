/** @format */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { exportEventsToICS, downloadICSFile, generateDefaultFilename } from "@/lib/calendar";
import { Download, Calendar } from "lucide-react";

interface CalendarExportButtonProps {
  userId: string;
  showOnlyRegistered: boolean;
}

export function CalendarExportButton({
  userId,
  showOnlyRegistered,
}: CalendarExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExport = async (includeOnlyRegistered: boolean) => {
    setIsExporting(true);
    
    try {
      const filename = generateDefaultFilename(includeOnlyRegistered);
      const { data: icsContent, error } = await exportEventsToICS(userId, {
        filename,
        includeOnlyRegistered,
      });

      if (error) throw error;
      if (!icsContent) throw new Error("No content to export");

      downloadICSFile(icsContent, filename);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Export Calendar
          </DialogTitle>
          <DialogDescription>
            Export events to an .ics file that you can import into your calendar app.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <Button
              onClick={() => handleExport(false)}
              disabled={isExporting}
              className="justify-start bg-red-500 hover:bg-red-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Events
              <span className="ml-auto text-xs text-red-100">
                All published events
              </span>
            </Button>
            
            <Button
              onClick={() => handleExport(true)}
              disabled={isExporting}
              variant="outline"
              className="justify-start border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export My Registered Events
              <span className="ml-auto text-xs text-muted-foreground">
                Only events you&apos;ve registered for
              </span>
            </Button>
          </div>
          
          {isExporting && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              <span className="ml-2 text-sm text-muted-foreground">
                Generating calendar file...
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}