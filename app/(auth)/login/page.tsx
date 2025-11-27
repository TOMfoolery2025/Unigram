/** @format */

import { LoginForm } from "@/components/auth";
import { GuestAccessButton } from "@/components/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageCarousel } from "./ImageCarousel";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className='flex min-h-screen bg-background'>
      {/* Left side - Hero Image/Content */}
      <div className='hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden'>
        {/* Background Images Carousel */}
        <div className='absolute inset-0'>
          <ImageCarousel />
        </div>

        <div className='relative z-10 max-w-md space-y-6 animate-fade-in p-12'>
          <h1 className='text-5xl font-bold text-foreground leading-tight'>
            Connect with your campus community
          </h1>
          <p className='text-lg text-muted-foreground'>
            Join TUM Heilbronn students to share knowledge, collaborate, and
            stay connected.
          </p>
          <div className='flex gap-2'>
            <div className='h-1 w-12 bg-primary rounded-full'></div>
            <div className='h-1 w-8 bg-primary/50 rounded-full'></div>
            <div className='h-1 w-8 bg-primary/30 rounded-full'></div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className='flex-1 flex items-center justify-center p-4 lg:p-8'>
        <Card className='w-full max-w-lg border-border/50 animate-fade-in-up transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20'>
          <CardHeader className='space-y-1 text-center pt-8 pb-4'>
            <div className='flex justify-center mb-4'>
              <div className='h-10 w-10 rounded-xl shadow-lg overflow-hidden relative'>
                <Image
                  src='/Vector.png'
                  alt='Logo'
                  fill
                  className='object-cover'
                />
              </div>
            </div>
            <CardTitle className='text-3xl font-bold animate-fade-in tracking-widest text-primary'>
              Unigram
            </CardTitle>
            <CardDescription className='text-base animate-fade-in animation-delay-100'>
              Welcome Back to Unigram
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4 px-8 pb-8'>
            <div className='flex justify-center items-center mb-4 animate-fade-in animation-delay-200'>
              <LoginForm />
            </div>

            <div className='relative py-4 animate-fade-in animation-delay-300'>
              <div className='absolute inset-0 flex items-center'>
                <Separator />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-card px-3 text-muted-foreground'>
                  Or continue with
                </span>
              </div>
            </div>

            <div className='animate-fade-in animation-delay-400'>
              <GuestAccessButton />
            </div>

            <p className='text-xs text-center text-muted-foreground pt-2 animate-fade-in animation-delay-500'>
              Guest access is limited to the Wiki section only
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
