import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session?.session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Return the session token which can be used for backend authentication
    // Better-auth sessions are already secure tokens that can be verified by the backend
    return NextResponse.json({ token: session.session.token }, { status: 200 });
  } catch (error) {
    console.error("Token retrieval error:", error);
    return NextResponse.json(
      { message: "Failed to get token" },
      { status: 500 }
    );
  }
} 