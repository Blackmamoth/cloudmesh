"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Box, Link2, Plus } from "lucide-react";
import OverviewTable from "@/components/overview-table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Account, AccountResponse, AccountsByProvider } from "@/lib/types/account";
import { env } from "@/lib/env";
import { authClient } from "@/lib/auth-client";
import { getJwtToken } from "@/lib/token";

const DashboardPage = () => {
  const { data: session } = authClient.useSession();
  useEffect(() => {
    fetchAccounts();
  }, []);

  const getOAuthState = async () => {
    try {
      const response = await fetch("/api/get-oauth-state");
      const body = await response.json();
      return body?.state;
    } catch (error) {
      return "";
    }
  };

  const fetchAccounts = async () => {
    try {
      // Get the access token from getSession
      const accessToken = await getJwtToken();
      if(accessToken) {
        const response = await fetch(`/api/accounts`, {
          headers: {
            "access_token": accessToken.token
          }
        });
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return error;
    }
  };

  const { data: response, isLoading, error } = useQuery<AccountResponse>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  if (isLoading) return <div>Loading...</div>;

  // Extract accounts by provider - note the extra .data level
  const googleAccount = response?.data?.data?.accounts?.google?.[0];
  const dropboxAccount = response?.data?.data?.accounts?.dropbox?.[0];
  const onedriveAccount = response?.data?.data?.accounts?.onedrive?.[0];

  // Convert bytes to GB with 2 decimal places
  const bytesToGB = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return Math.round(gb * 100) / 100; // Round to 2 decimal places
  };

  return (
    <div className="flex flex-col gap-4 flex-1 col-span-3 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 py-4 lg:py-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Hi, {session?.user?.name?.split(' ')[0] || 'User'}!</h1>
            <p className="text-sm text-muted-foreground">
              Here&rsquo;s an overview of your files and linked accounts.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          <ProviderCard
            name="Google Drive"
            providerId="google"
            logo="/google-drive-logo.webp"
            usedStorage={googleAccount ? bytesToGB(googleAccount.used_storage) : 0}
            totalStorage={googleAccount ? bytesToGB(googleAccount.total_storage) : 0}
            color="#10b981"
            isConnected={!!googleAccount}
            getOAuthState={getOAuthState}
          />
          <ProviderCard
            name="Dropbox"
            providerId="dropbox"
            logo="/dropbox-logo.png"
            usedStorage={dropboxAccount ? bytesToGB(dropboxAccount.used_storage) : 0}
            totalStorage={dropboxAccount ? bytesToGB(dropboxAccount.total_storage) : 0}
            color="#0061ff"
            isConnected={!!dropboxAccount}
            getOAuthState={getOAuthState}
          />
          <ProviderCard
            name="OneDrive"
            providerId="onedrive"
            logo="/onedrive-logo.png"
            usedStorage={onedriveAccount ? bytesToGB(onedriveAccount.used_storage) : 0}
            totalStorage={onedriveAccount ? bytesToGB(onedriveAccount.total_storage) : 0}
            color="#0078d4"
            isConnected={!!onedriveAccount}
            getOAuthState={getOAuthState}
          />
          <OverallStorageCard 
            accounts={response?.data?.data?.accounts}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 border border-border rounded-xl bg-gradient-to-br from-sidebar/60 to-sidebar p-4">
        <OverviewTable />
      </div>
    </div>
  );
};

export default DashboardPage;

interface ProviderCardProps {
  name: string;
  providerId: string;
  logo: string;
  usedStorage?: number;
  totalStorage?: number;
  color?: string;
  isConnected: boolean;
  getOAuthState: () => Promise<string>;
}

function ProviderCard({
  name,
  providerId,
  logo,
  usedStorage = 0,
  totalStorage = 0,
  color = "#10b981",
  isConnected,
  getOAuthState,
}: ProviderCardProps) {
 
  const percentage = isConnected ? (usedStorage / totalStorage) * 100 : 0;
  const formatStorage = (bytes: number) => {
    return `${bytes}GB`;
  };

  const handleConnect = async () => {
    const state = await getOAuthState();
    window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/v1/link/${providerId}?state=${encodeURIComponent(state)}`;
  };

  return (
    <div className="rounded-lg border p-6 bg-gradient-to-br from-sidebar/60 to-sidebar border-border transition-all hover:shadow-lg flex flex-col h-full">
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <Image
            src={logo}
            alt={`${name} logo`}
            width={40}
            height={40}
            className={`rounded-sm ${
              !isConnected ? "opacity-50 grayscale" : ""
            }`}
          />
        </div>
        <h3 className="text-xl font-medium text-foreground tracking-tight">
          {name}
        </h3>
      </div>

      <div className="mt-4">
        {isConnected ? (
          <div className="space-y-2">
            <Progress
              value={percentage}
              fillColor={color}
              className="h-2 dark:bg-neutral-800 bg-neutral-300"
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                {formatStorage(usedStorage)}
              </span>
              <span className="text-muted-foreground">
                {formatStorage(totalStorage)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="w-4 h-4" />
              <span>Not connected</span>
            </div>
            <Button
              onClick={handleConnect}
              className="w-full group transition-all h-9 text-sm"
              variant="outline"
              size="sm"
            >
              <Plus className="w-3 h-3" />
              Connect
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface OverallStorageCardProps {
  accounts?: AccountsByProvider;
}

function OverallStorageCard({ accounts }: OverallStorageCardProps) {
  // Calculate total storage from all connected accounts
  const calculateTotalStorage = () => {
    if (!accounts) return { used: 0, total: 0 };
    
    let totalUsed = 0;
    let totalStorage = 0;
    
    // Iterate through all provider accounts
    Object.values(accounts).forEach((providerAccounts) => {
      if (providerAccounts && Array.isArray(providerAccounts)) {
        providerAccounts.forEach((account) => {
          totalUsed += account.used_storage;
          totalStorage += account.total_storage;
        });
      }
    });
    
    // Convert bytes to GB with 2 decimal places
    const usedGB = totalUsed / (1024 * 1024 * 1024);
    const totalGB = totalStorage / (1024 * 1024 * 1024);
    return {
      used: Math.round(usedGB * 100) / 100,  // Round to 2 decimal places
      total: Math.round(totalGB * 100) / 100  // Round to 2 decimal places
    };
  };
  
  const storage = calculateTotalStorage();
  
  return (
    <Card className="flex flex-col border-border shadow-none] bg-gradient-to-br from-sidebar/60 to-sidebar pr-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h1 className="text-muted-foreground font-light text-sm">
          Overall Storage
        </h1>
      </CardHeader>
      <CardContent className="flex justify-between">
        <div>
          <span className="text-5xl text-muted-foreground">{storage.used}</span>
          <span className="text-muted-foreground font-light text-sm">GB</span>
          <div className="pt-2 font-light text-sm"> used of {storage.total}GB</div>
        </div>
        <div className="flex gap-2">
          <Image src="/storage.png" alt="storage" width={100} height={100} />
        </div>
      </CardContent>
    </Card>
  );
}
