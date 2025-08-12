import { authClient } from "./auth-client";

interface SessionResponse {
    data: {
        session: {
            createdAt: Date;
            expiresAt: Date;
            id: string;
            ipAddress: string;
            token: string;
            updatedAt: Date;
            userAgent: string;
            userId: string;
        },
        user: {
            id: string;
            name: string;
            email: string;
            image: string;
            emailVerified: boolean;
            updatedAt: Date;
        }
    }
}


export const getJwtToken = async () => {
    const response = await authClient.getSession() as SessionResponse;
    const jwtToken = await fetch("/api/auth/token", {
        headers: {
            "Authorization": `Bearer ${response.data.session.token}`
        }
    })
    const data = await jwtToken.json();
    return data;
}