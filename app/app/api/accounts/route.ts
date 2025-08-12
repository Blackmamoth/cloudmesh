import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const accessToken = request.headers.get("access_token");
        console.log(accessToken);
        if (!accessToken) {
            return NextResponse.json(
                { error: "Unauthorized - No access token provided" }, 
                { status: 401 }
            );
        }
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/account/get-accounts`, 
            {
                headers: {
                    'Authorization':`Bearer ${accessToken}`
                },
               
            }
        );
        
        
        const data = await response.json();
        return NextResponse.json({data}, {status: response.status});
        
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        );
    }
}