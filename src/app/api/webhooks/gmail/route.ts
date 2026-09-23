import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify token if configured
    const token = req.nextUrl.searchParams.get("token");
    if (process.env.PUBSUB_VERIFICATION_TOKEN && token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (body.message && body.message.data) {
      const data = Buffer.from(body.message.data, "base64").toString("utf-8");
      const notification = JSON.parse(data);
      
      console.log("Received Gmail push notification for email:", notification.emailAddress);
      console.log("History ID:", notification.historyId);

      // In a real production app, we would:
      // 1. Fetch the history using Gmail History API to see what changed
      // 2. Broadcast a message via WebSockets/Supabase Realtime to the specific user's client
      // 3. The client would then re-fetch their inbox
      
      // For this implementation, we will rely on the client fallback polling 
      // or a basic SSE implementation if we build one.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
