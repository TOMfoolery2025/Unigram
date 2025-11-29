/** @format */

"use client";

import { Suspense } from "react";
import { CreateEventForm } from "@/app/(authenticated)/events/create/create-event-form";
import { Loader2 } from "lucide-react";

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    }>
      <CreateEventForm />
    </Suspense>
  );
}
