/** @format */

"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEventQRCode } from "@/lib/event/qr-codes";
import Image from "next/image";

interface QRCodeDisplayProps {
  eventId: string;
  userId: string;
  eventTitle: string;
}

export function QRCodeDisplay({
  eventId,
  userId,
  eventTitle,
}: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQRCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, userId]);

  const loadQRCode = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: qrError } = await getEventQRCode(eventId, userId);

    if (qrError) {
      setError(qrError.message);
    } else {
      setQrCode(data);
    }

    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `${eventTitle.replace(/\s+/g, "-")}-ticket.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card className='bg-gray-800 border-gray-700'>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-violet-400' />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='bg-gray-800 border-gray-700'>
        <CardContent className='py-6'>
          <p className='text-red-400 text-center'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border-violet-700/50'>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <QrCode className='h-5 w-5 text-violet-400' />
          Your Event Ticket
        </CardTitle>
        <CardDescription className='text-gray-300'>
          Show this QR code at the event entrance for check-in
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {qrCode && (
          <>
            <div className='flex justify-center bg-white p-4 sm:p-6 rounded-xl shadow-lg'>
              <div className='relative w-48 h-48 sm:w-56 sm:h-56 max-w-full'>
                <Image
                  src={qrCode}
                  alt='Event QR Code'
                  fill
                  sizes="(max-width: 640px) 192px, 224px"
                  className='object-contain max-w-full'
                  priority
                />
              </div>
            </div>
            <div className='bg-gray-800/50 rounded-lg p-3 border border-gray-700'>
              <p className='text-xs text-gray-400 text-center'>
                Save this ticket to your device for easy access at the event
              </p>
            </div>
            <Button
              onClick={handleDownload}
              className='w-full bg-violet-600 hover:bg-violet-700 font-medium'>
              <Download className='h-4 w-4 mr-2' />
              Download Ticket
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
