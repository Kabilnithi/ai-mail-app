"use server";

import { getGmailClient } from "./client";

export async function getMessages(query = "") {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 50,
    });

    const messages = res.data.messages || [];
    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (!msg.id) return null;
        const msgDetail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date", "To"],
        });

        const headers = msgDetail.data.payload?.headers;
        const subject = headers?.find((h) => h.name === "Subject")?.value || "No Subject";
        const from = headers?.find((h) => h.name === "From")?.value || "Unknown";
        const to = headers?.find((h) => h.name === "To")?.value || "Unknown";
        const date = headers?.find((h) => h.name === "Date")?.value || "";
        const unread = msgDetail.data.labelIds?.includes("UNREAD") || false;

        return {
          id: msg.id,
          subject,
          sender: from,
          recipient: to,
          snippet: msgDetail.data.snippet || "",
          date,
          unread,
        };
      })
    );

    return detailedMessages.filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    throw new Error("Failed to fetch messages");
  }
}

export async function getMessage(id: string) {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.get({
      userId: "me",
      id: id,
      format: "full",
    });

    const headers = res.data.payload?.headers;
    const subject = headers?.find((h) => h.name === "Subject")?.value || "No Subject";
    const from = headers?.find((h) => h.name === "From")?.value || "Unknown";
    const to = headers?.find((h) => h.name === "To")?.value || "Unknown";
    const date = headers?.find((h) => h.name === "Date")?.value || "";
    
    // Extract body logic
    let body = "";
    if (res.data.payload?.parts) {
      const part = res.data.payload.parts.find(p => p.mimeType === "text/plain");
      if (part && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    } else if (res.data.payload?.body?.data) {
      body = Buffer.from(res.data.payload.body.data, "base64").toString("utf-8");
    }

    return {
      id: res.data.id,
      subject,
      sender: from,
      recipient: to,
      date,
      body: body || res.data.snippet || "",
    };
  } catch (error) {
    console.error("Failed to fetch message:", error);
    throw new Error("Failed to fetch message");
  }
}

export async function sendMessage(to: string[], subject: string, body: string) {
  try {
    const gmail = await getGmailClient();
    
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `To: ${to.join(", ")}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      body,
    ];
    const message = messageParts.join("\n");
    
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send message:", error);
    throw new Error("Failed to send message");
  }
}

export async function markAsRead(id: string) {
  try {
    const gmail = await getGmailClient();
    await gmail.users.messages.modify({
      userId: "me",
      id: id,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark as read:", error);
    return { success: false };
  }
}
