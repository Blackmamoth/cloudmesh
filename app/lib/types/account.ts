interface Account {
    avatar_url: string;
    email: string;
    id: string;
    last_synced_at: string;
    name: string;
    provider: string;
    total_storage: number;
    used_storage: number;
}

interface AccountsByProvider {
    google?: Account[];
    dropbox?: Account[];
    onedrive?: Account[];
    [key: string]: Account[] | undefined;
}

interface AccountData {
    accounts: AccountsByProvider;
    total_accounts: number;
    last_synced: string;
}

interface AccountResponse {
    data: {
        data: AccountData;
    };
    status: number;
}

export type { Account, AccountResponse, AccountData, AccountsByProvider };