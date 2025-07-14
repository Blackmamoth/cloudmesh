import { getUserFromSession } from "@/lib/action";
import { redisClient } from "@/lib/redis";
import httpErrors from "http-errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromSession();

    const nonce = crypto.randomUUID();

    await redisClient.set(`link-nonce:${nonce}`, nonce, "EX", 30);
    return NextResponse.json({ nonce }, { status: 200 });
  } catch (error) {
    if (error instanceof httpErrors.HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      {
        message: "An error occured while generation nonce",
      },
      { status: 500 }
    );
  }
}
