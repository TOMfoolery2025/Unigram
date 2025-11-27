/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signIn(data.email, data.password);

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full items-center justify-center">
      <CardHeader>
        {/* <div className="mb-4 text-center"> */}
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Sign in to your TUM Community Platform account
        </CardDescription>
        {/* </div> */}
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className='space-y-4'>
          {error && (
            <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='your.name@tum.de'
              {...register("email")}
              disabled={loading}
            />
            {errors.email && (
              <p className='text-sm text-destructive'>{errors.email.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              {...register("password")}
              disabled={loading}
            />
            {errors.password && (
              <p className='text-sm text-destructive'>
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className='flex flex-col space-y-4'>
          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className='text-sm text-muted-foreground text-center'>
            Don&apos;t have an account?{" "}
            <a
              href='/register'
              className='text-primary hover:underline font-medium'>
              Register
            </a>
          </p>
        </CardFooter>
      </form>
    </  div>
  );
}
