import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RiSettingsLine, RiTeamLine, RiLogoutBoxLine, RiRefreshLine, RiContrast2Line } from "@remixicon/react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

const accountSchema = z.object({
  name: z.string().trim().min(2, { message: "Name should consist of at least 2 characters" }).optional(),
  email: z.email({ message: "Please provide a valid email" }).optional(),
  currentPassword: z.string().trim().optional(),
  newPassword: z.string().trim().min(8, { message: "New password should consist of at least 8 characters" }).max(16, { message: "New password should consist of at most 16 characters" }).optional()
})

type AccountSchema = z.infer<typeof accountSchema>

export default function UserDropdown() {
  const { setTheme } = useTheme();

  const { data, isPending } = authClient.useSession()

  const signOut = () => authClient.signOut()

  const { register, handleSubmit, formState: { errors, isValid }, setValue } = useForm({
    resolver: zodResolver(accountSchema), defaultValues: {
      name: data?.user?.name || "",
      email: data?.user?.email || "",
    }
  })


  const handleAccountEdit = async ({ name, email, currentPassword, newPassword }: AccountSchema) => {
    if (!isValid) return;

    if (name && name !== data?.user?.name) {
      await authClient.updateUser({
        name
      }, {
        onError: (ctx) => {
          console.error(ctx.error.message)
        }
      })
    }

    if (email && email !== data?.user?.email) {
      await authClient.changeEmail({
        newEmail: email
      }, {
        onError: (ctx) => {
          console.error(ctx.error.message)
        }
      })
    }

    if (currentPassword && newPassword) {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      }, {
        onError: (ctx) => {
          console.error(ctx.error.message)
        }
      })
    }
  }

  useEffect(() => {

    if (!isPending && data?.user?.id) {
      setValue("name", data?.user?.name)
      setValue("email", data?.user?.email)
    }

  }, [isPending])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar className="size-8">
            <AvatarImage
              src={data?.user?.image || ""}
              width={32}
              height={32}
              alt="Profile image"
            />
            <AvatarFallback>{data?.user?.name?.split(" ")?.map(n => n[0])}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64" align="end">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {data?.user?.name}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {data?.user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <RiContrast2Line size={16} className="opacity-60" aria-hidden="true" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>

              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center gap-2 w-full">
                  <RiSettingsLine
                    size={16}
                    className="opacity-60"
                    aria-hidden="true"
                  />
                  <span>Account settings</span>
                </div>
              </DialogTrigger>
              <DialogContent className="min-w-xl">
                <DialogHeader>
                  <DialogTitle>Edit Account</DialogTitle>
                  <DialogDescription>
                    Edit your account information.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="account">
                  <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="oauth_tokens">OAuth Tokens</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account">
                    <div className="flex flex-col gap-2 mt-4">
                      <Label>Full Name</Label>
                      <Input type="text" placeholder="Full Name" {...register("name")} />
                      <Label>Email</Label>
                      <Input type="email" placeholder="Email" {...register("email")} />
                    </div>
                  </TabsContent>
                  <TabsContent value="security">
                    <div className="flex flex-col gap-2 mt-4">
                      <Label>Current Password</Label>
                      <Input type="password" placeholder="Current Password" {...register("currentPassword")} />
                      <Label>New Password</Label>
                      <Input type="password" placeholder="Password" {...register("newPassword")} />
                    </div>
                  </TabsContent>
                  <TabsContent value="oauth_tokens">
                    <div className="flex flex-col gap-2 mt-4">
                      <Card>
                        <CardContent>
                          <CloudProviders />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSubmit(handleAccountEdit)} >Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RiTeamLine size={16} className="opacity-60" aria-hidden="true" />
            <span>Affiliate area</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <RiLogoutBoxLine
            size={16}
            className="opacity-60"
            aria-hidden="true"
          />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const CloudProviders = () => {

  const providers = [
    {
      name: "Google Drive",
      image: "/google-drive-logo.webp",
      status: "Active",
      expiresIn: "Expires in 3 days",
    },
    {
      name: "Dropbox",
      image: "/dropbox-logo.png",
      status: "Active",
      expiresIn: "Expires in 3 days",
    },
    {
      name: "OneDrive",
      image: "/onedrive-logo.webp",
      status: "Inactive",
      expiresIn: "Expired",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {providers.map((provider, index) => (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md overflow-hidden">
              <Image src={provider.image} alt={provider.name} width={32} height={32} />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium flex items-center gap-2">{provider.name}
                <Badge className={cn("mt-1", provider.status === "Active" ? "bg-green-700 text-white" : "bg-red-700 text-white")} >{provider.status}</Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                {provider.expiresIn}
              </p>
            </div>
          </div>
          <div>
            <Button variant="outline" size="sm">
              <RiRefreshLine size={16} /> Refresh Token
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
