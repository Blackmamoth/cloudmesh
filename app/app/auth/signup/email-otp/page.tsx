"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function EmailOTP() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [isResendDisabled, setIsResendDisabled] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email submission logic here
    setStep("otp");
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement OTP verification logic here
  };

  const handleResendOTP = async () => {
    setIsResendDisabled(true);
    // TODO: Implement resend OTP logic here
    
    // Enable resend button after 30 seconds
    setTimeout(() => {
      setIsResendDisabled(false);
    }, 30000);
  };

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
                Enter verification code
              </h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                We sent a code to {email}
              </p>
              
              <form onSubmit={handleOTPSubmit} className="mt-8 space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <InputOTP maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <Button type="submit" className="w-full">
                  Verify Code
                </Button>
                
                <div className="flex items-center justify-between">
                  <Link
                    href="/auth/signup"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Change email
                  </Link>
                  <button
                    onClick={handleResendOTP}
                    disabled={isResendDisabled}
                    className="text-sm text-primary hover:text-primary/90 disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </form>
        </div>
      </div>
    </div>
  );
}
