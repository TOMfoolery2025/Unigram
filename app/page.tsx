/** @format */

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HomeRedirect } from "@/components/home/home-redirect";
import { AuthDebug } from "@/components/debug/auth-debug";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <HomeRedirect />

      <main className='flex min-h-screen flex-col items-center justify-center p-6 md:p-24'>
        <div className='card-hover-glow z-10 max-w-xl w-full rounded-2xl border bg-background/80 px-8 py-10 shadow-lg'>
          {/* LOGO + TITLE */}
          <div className='flex flex-col items-center mb-8'>
            <div className='h-12 w-12 rounded-xl shadow-lg overflow-hidden mb-3'>
              <Image
                src='/Vector.png'
                alt='Unigram Logo'
                width={48}
                height={48}
                className='h-full w-full object-cover'
              />
            </div>

            <h1 className='text-3xl md:text-4xl font-bold text-center text-primary'>
              Unigram
            </h1>

            <p className='mt-2 text-center text-muted-foreground'>
              A modern community platform currently built for TUM Students
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className='flex flex-wrap gap-4 justify-center'>
            <Link href='/login'>
              <Button>Sign In</Button>
            </Link>

            <Link href='/register'>
              <Button variant='outline'>Register</Button>
            </Link>

            <Link href='/wiki'>
              <Button variant='secondary'>Open Wiki</Button>
            </Link>

            <Link href='/dashboard'>
              <Button variant='outline'>Dashboard</Button>
            </Link>
          </div>
        </div>
      </main>

      <AuthDebug />
    </>
  );
}
