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
    <Card className='bg-gray-800 border-gray-700'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <QrCode className='h-5 w-5 text-violet-400' />
          Your Event Ticket
        </CardTitle>
        <CardDescription>
          Show this QR code at the event entrance
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {qrCode && (
          <>
            <div className='flex justify-center bg-white p-4 rounded-lg'>
              <div className='relative w-64 h-64'>
                <Image
                  src={qrCode}
                  alt='Event QR Code'
                  fill
                  sizes="256px"
                  className='object-contain'
                />
              </div>
            </div>
            <Button
              onClick={handleDownload}
              className='w-full bg-violet-600 hover:bg-violet-700'>
              <Download className='h-4 w-4 mr-2' />
              Download Ticket
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
