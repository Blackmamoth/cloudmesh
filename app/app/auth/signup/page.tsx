"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { JSX, SVGProps, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const GitHubIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
  </svg>
);

const GoogleIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

const schema = z.object({
  name: z.string().trim().min(2, "Name should consist of at least 2 characters"),
  email: z.email({ message: "Please provide a valid email address" }),
  password: z.string().trim().min(8, { message: "Password should be of minimum 8 characters" }).max(16, { message: "Password should be of maximum 16 characters" })
})

type SignUpSchema = z.infer<typeof schema>

export default function SignUp() {

  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const onSocialLogin = async (provider: "google" | "github") => {
    await authClient.signIn.social({ provider, callbackURL: "/dashboard" }, {
      onRequest: () => setLoading(true),
      onSuccess: () => setLoading(false),
      onError: (ctx) => {
        setLoading(false)
        toast.error(ctx.error.message)
      }
    })
  }

  const { register, handleSubmit, formState: { errors, isValid } } = useForm({ resolver: zodResolver(schema) })

  const handleEmailSignUp = async ({ name, email, password }: SignUpSchema) => {
    if (!isValid) {
      return
    }
    await authClient.signUp.email({
      name,
      email,
      password,
    }, {
      onRequest: () => setLoading(true),
      onSuccess: () => {
        setLoading(false)
        router.push("/dashboard")
      },
      onError: (ctx) => {
        setLoading(false)
        toast.error(ctx.error.message)
      }
    })
  }


  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex items-center space-x-1.5">
            <Image
              src="/cloudmesh-logo.svg"
              alt="Cloudmesh"
              width={40}
              height={40}
              className="h-10 w-10 text-foreground dark:text-foreground"
            />
            <p className="font-medium text-lg text-foreground dark:text-foreground">
              Cloudmesh
            </p>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground dark:text-foreground">
            Create your account
          </h3>
          <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
            >
              Sign in
            </Link>
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center space-y-2 sm:space-x-4 sm:space-y-0">
            <Button
              disabled={loading}
              variant="outline"
              className="w-full sm:w-auto sm:flex-1 items-center justify-center space-x-2 py-2"
              onClick={() => onSocialLogin("github")}
            >
              <GitHubIcon className="size-5" aria-hidden={true} />
              <span className="text-sm font-medium">Continue with GitHub</span>
            </Button>
            <Button
              disabled={loading}
              variant="outline"
              className="mt-2 w-full sm:w-auto sm:flex-1 items-center justify-center space-x-2 py-2 sm:mt-0"
              onClick={() => onSocialLogin("google")}
            >
              <GoogleIcon className="size-4" aria-hidden={true} />
              <span className="text-sm font-medium">Continue with Google</span>
            </Button>
          </div>
          <div className="py-7">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(handleEmailSignUp)}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="mt-2"
                  {...register("name")}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="johndoe@mail.com"
                  className="mt-2"
                  {...register("email")}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  className="mt-2"
                  {...register("password")}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              <Button disabled={loading} type="submit" className="w-full mt-2">
                Verify Email
              </Button>
            </div>
          </form>
          <p className="pt-3 text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
