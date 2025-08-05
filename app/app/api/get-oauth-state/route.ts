import { auth } from "@/lib/auth";
import { redisClient } from "@/lib/redis";
import httpErrors from "http-errors";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await auth.api.getSession({
      headers: await headers(),
    });

    if (!data?.user && data?.session) {
      throw new httpErrors.Unauthorized("unauthorized");
    }

    const nonce = crypto.randomUUID();

    const state = btoa(JSON.stringify({ user_id: data?.user?.id, nonce }));

    await redisClient.set(`link-nonce:${nonce}`, nonce, "EX", 30);

    return NextResponse.json({ state }, { status: 200 });
  } catch (error) {
    if (error instanceof httpErrors.HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        message:
          (error as Error)?.message ||
          "An error occured while generating oauth state",
      },
      { status: 500 },
    );
  }
}
