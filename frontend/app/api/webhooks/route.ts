import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    const eventType = evt.type;

    if (eventType === "user.created") {
      const data = evt.data;
      const userData = {
        id: data.id,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        email_address: data.email_addresses[0].email_address,
        provider: data.external_accounts[0]?.provider ?? "email",
        image_url: data.image_url,
      };

      await fetch(`${process.env.API_URL}/v1/api/webhook/sync/user`, {
        method: "POST",
        body: JSON.stringify(userData),
      });
    }

    return new Response("webhook receieved", { status: 200 });
  } catch (err) {
    return new Response(`Error verifying webhook: ${err}`, { status: 400 });
  }
}
