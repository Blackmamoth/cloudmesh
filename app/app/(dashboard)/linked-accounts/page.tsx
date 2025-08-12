'use client'
import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RiMoreLine, RiErrorWarningLine, RiCheckboxCircleLine, RiLoader4Line, RiLinkUnlink, RiPauseLargeLine, RiKey2Line, RiArrowGoBackLine } from '@remixicon/react'
import dropboxlogo from "@/public/dropbox-logo.png"
import googledrivelogo from "@/public/google-drive-logo.webp"
import onedrivelogo from "@/public/onedrive-logo.webp"
import { env } from '@/lib/env'
import { useQuery } from '@tanstack/react-query'
import { AccountResponse, AccountsByProvider } from '@/lib/types/account'
import { getJwtToken } from '@/lib/token'

type AccountStatus = 'healthy' | 'error' | 'syncing'

interface AccountUI {
  id: string
  name: string
  email: string
  avatar: string
  status: AccountStatus
  storage: {
    used: number
    total: number
    unit: 'GB' | 'MB'
  }
  lastSynced: string
  errorMessage?: string
}

interface ProviderUI {
  name: string
  logo: any
  accounts: AccountUI[]
}

// helper: bytes to GB (2 decimals)
const bytesToGB = (bytes: number) => {
  const gb = bytes / (1024 * 1024 * 1024)
  return Math.round(gb * 100) / 100
}

const PROVIDER_META: Record<string, { label: string; logo: any }> = {
  google: { label: 'Google Drive', logo: googledrivelogo },
  dropbox: { label: 'Dropbox', logo: dropboxlogo },
  onedrive: { label: 'OneDrive', logo: onedrivelogo },
}

// Provider options for the dialog
const availableProviders = [
  {
    id: 'google',
    name: 'Google Drive',
    logo: googledrivelogo,
    description: 'Connect your Google Drive account',
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    logo: dropboxlogo,
    description: 'Connect your Dropbox account',
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'microsoft',
    name: 'OneDrive',
    logo: onedrivelogo,
    description: 'Connect your Microsoft OneDrive account',
    color: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800'
  },
  {
    id: 'box',
    name: 'Box',
    logo: null, // We'll use a text-based placeholder
    description: 'Connect your Box account',
    color: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
  }
]

function AddAccountDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const getOAuthState = async () => {
    try {
      const response = await fetch("/api/get-oauth-state")
      const body = await response.json()
      return body?.state
    } catch (error) {
      return ""
    }
  }

  const handleProviderSelect = async (providerId: string) => {
    const state = await getOAuthState()
    document.location.href = `${env.NEXT_PUBLIC_API_URL}/api/v1/link/${providerId}?state=${encodeURIComponent(state)}`
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">
            Link a Cloud Storage Account
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Select a cloud storage provider to connect. You'll be redirected to sign in and authorize CloudMesh.
          </DialogDescription>
        </DialogHeader>

        {/* Provider Grid */}
        <div className="grid grid-cols-2 gap-4 my-6">
          {availableProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider.id)}
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md hover:scale-[1.02] ${provider.color} hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                {provider.logo ? (
                  <Image
                    src={provider.logo}
                    alt={`${provider.name} logo`}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">box</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {provider.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0 mt-0.5">
            <div className="w-full h-full rounded-full bg-muted-foreground/20"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            CloudMesh never stores your files. We only access your files when you use the app.
          </p>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const getStatusColor = (status: AccountStatus) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'syncing':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusIcon = (status: AccountStatus) => {
  switch (status) {
    case 'healthy':
      return <RiCheckboxCircleLine className="w-4 h-4 text-green-600" />
    case 'error':
      return <RiErrorWarningLine className="w-4 h-4 text-red-600" />
    case 'syncing':
      return <RiLoader4Line className="w-4 h-4 text-blue-600 animate-spin" />
    default:
      return null
  }
}

const formatStorage = (value: number, unit: 'GB' | 'MB') => {
  if (unit === 'MB' && value >= 1024) {
    return `${(value / 1024).toFixed(1)} GB`
  }
  return `${value} ${unit}`
}

const getStoragePercentage = (used: number, total: number, unit: 'GB' | 'MB') => {
  if (unit === 'MB') {
    // Convert MB to GB for percentage calculation if total is in GB
    const usedInGB = used / 1024
    return (usedInGB / total) * 100
  }
  return (used / total) * 100
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#ef4444' // red
  if (percentage >= 70) return '#f59e0b' // orange
  return '#10b981' // green
}

function AccountCard({ account }: { account: AccountUI }) {
  const percentage = getStoragePercentage(account.storage.used, account.storage.total, account.storage.unit)

  return (
    <div className="rounded-lg border p-4 space-y-4 bg-gradient-to-br from-sidebar/40 to-sidebar/60 border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={account.avatar}
            alt={account.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-medium text-foreground">{account.name}</h3>
            <p className="text-sm text-muted-foreground">{account.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {getStatusIcon(account.status)}
            <span className={`text-sm font-medium capitalize ${getStatusColor(account.status)}`}>
              {account.status}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RiMoreLine className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <RiArrowGoBackLine className="w-4 h-4" />
                  Force sync
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RiKey2Line className="w-4 h-4" />
                  Re-authenticate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RiPauseLargeLine className="w-4 h-4" />
                  Disable sync
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <RiLinkUnlink className="w-4 h-4" />
                  Unlink account
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Storage Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Storage</span>
          <span className="text-sm text-muted-foreground">
            {formatStorage(account.storage.used, account.storage.unit)} of {formatStorage(account.storage.total, account.storage.unit)} used
          </span>
        </div>
        <Progress
          value={percentage}
          fillColor={getProgressColor(percentage)}
          className="h-2 dark:bg-neutral-800 bg-neutral-300"
        />
      </div>

      {/* Last Synced */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>Last synced:</span>
        <span className={account.status === 'syncing' ? 'text-blue-600 font-medium' : ''}>
          {account.lastSynced}
        </span>
      </div>

      {/* Error Message */}
      {account.errorMessage && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          <RiErrorWarningLine className="h-4 w-4" />
          <span>{account.errorMessage}</span>
        </div>
      )}
    </div>
  )
}

function ProviderSection({ provider }: { provider: ProviderUI }) {
  return (
    <div className="space-y-4">
      {/* Provider Header */}
      <div className="flex items-center gap-3">
        <Image
          src={provider.logo}
          alt={`${provider.name} logo`}
          width={32}
          height={32}
          className="rounded-sm"
        />
        <h2 className="text-lg font-semibold text-foreground">{provider.name}</h2>
        <Badge variant="secondary" className="text-xs">
          {provider.accounts.length}
        </Badge>
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {provider.accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  )
}

const LinkedAccounts = () => {
  const fetchAccounts = async () => {
    const accessToken = await getJwtToken()
    if (!accessToken?.token) return null
    const res = await fetch('/api/accounts', {
      headers: {
        'access_token': accessToken.token,
      },
    })
    return (await res.json()) as AccountResponse
  }

  const { data: response, isLoading } = useQuery<AccountResponse>({
    queryKey: ['linked-accounts'],
    queryFn: fetchAccounts,
  })

  const providers: ProviderUI[] = useMemo(() => {
    const accountsByProvider: AccountsByProvider | undefined = response?.data?.data?.accounts
    if (!accountsByProvider) return []

    const result: ProviderUI[] = []
    Object.entries(PROVIDER_META).forEach(([key, meta]) => {
      const accounts = accountsByProvider[key]
      if (accounts && accounts.length > 0) {
        result.push({
          name: meta.label,
          logo: meta.logo,
          accounts: accounts.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            avatar: a.avatar_url || '/user.png',
            status: 'healthy',
            storage: {
              used: bytesToGB(a.used_storage),
              total: bytesToGB(a.total_storage),
              unit: 'GB',
            },
            lastSynced: a.last_synced_at ? new Date(a.last_synced_at).toLocaleString() : '—',
          })),
        })
      }
    })
    return result
  }, [response])

  return (
    <div className="flex flex-col gap-4 flex-1 col-span-3 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 py-4 lg:py-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Linked Accounts</h1>
            <p className="text-sm text-muted-foreground">
              Manage your connected cloud storage accounts and monitor their sync status.
            </p>
          </div>
          <AddAccountDialog>
            <Button>
              Add Account
            </Button>
          </AddAccountDialog>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : providers.length === 0 ? (
        <div className="text-sm text-muted-foreground">No connected accounts yet.</div>
      ) : (
        <div className="space-y-8">
          {providers.map((provider) => (
            <ProviderSection key={provider.name} provider={provider} />
          ))}
        </div>
      )}
    </div>
  )
}

export default LinkedAccounts
