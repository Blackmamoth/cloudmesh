import Image from "next/image";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Box } from "lucide-react";
import OverviewTable from "@/components/overview-table";
import { Progress } from "@/components/ui/progress";

const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-4 flex-1 col-span-3 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 py-4 lg:py-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Hi, Larry!</h1>
            <p className="text-sm text-muted-foreground">
              Here&rsquo;s an overview of your files and linked accounts.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProviderCard
            name="Google Drive"
            logo="/google-drive-logo.webp"
            usedStorage={100}
            totalStorage={1000}
            color="#10b981"
          />
          <ProviderCard
            name="Dropbox"
            logo="/dropbox-logo.png"
            usedStorage={250}
            totalStorage={500}
            color="#0061ff"
          />
          <ProviderCard
            name="OneDrive"
            logo="/onedrive-logo.png"
            usedStorage={75}
            totalStorage={200}
            color="#0078d4"
          />
          <OverallStorageCard />
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
  logo: string;
  usedStorage: number;
  totalStorage: number;
  color?: string;
}

function ProviderCard({
  name,
  logo,
  usedStorage,
  totalStorage,
  color = "#10b981",
}: ProviderCardProps) {
  const percentage = (usedStorage / totalStorage) * 100;
  const formatStorage = (bytes: number) => {
    return `${bytes}GB`;
  };

  return (
    <div className="rounded-lg border p-6 space-y-4 bg-gradient-to-br from-sidebar/60 to-sidebar border-border">
      <div className="flex flex-col gap-3">
        <Image
          src={logo}
          alt={`${name} logo`}
          width={40}
          height={40}
          className="rounded-sm"
        />
        <h3 className="text-xl font-medium text-foreground tracking-tight">
          {name}
        </h3>
      </div>

      <div className="space-y-2">
        <Progress value={percentage} fillColor={color} className="h-2 dark:bg-neutral-800 bg-neutral-300" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-medium">
            {formatStorage(usedStorage)}
          </span>
          <span className="text-muted-foreground">
            {formatStorage(totalStorage)}
          </span>
        </div>
      </div>
    </div>
  );
}

function OverallStorageCard() {
  return (
    <Card className="flex flex-col border-border shadow-none] bg-gradient-to-br from-sidebar/60 to-sidebar pr-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h1 className="text-muted-foreground font-light text-sm">
          Overall Storage
        </h1>
      </CardHeader>
      <CardContent className="flex justify-between">
        <div>
          <span className="text-5xl text-muted-foreground">100</span>
          <span className="text-muted-foreground font-light text-sm">GB</span>
          <div className="pt-2 font-light text-sm"> used of 1000GB</div>
        </div>
        <div className="flex gap-2">
          <Image src='/storage.png' alt="storage" width={100} height={100} />
        </div>
      </CardContent>
    </Card>
  );
}
