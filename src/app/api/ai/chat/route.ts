import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

// Define tools for Gemini
const tools = [
  {
    name: "fill_compose",
    description: "Opens the email compose window and fills it with the provided details.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "array", items: { type: "string" }, description: "List of email addresses" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body content" }
      }
    }
  },
  {
    name: "open_compose",
    description: "Opens an empty email compose window.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "navigate_to_view",
    description: "Navigates to a specific mail view (inbox, sent).",
    parameters: {
      type: "object",
      properties: {
        view: { type: "string", enum: ["inbox", "sent"], description: "The view to navigate to" }
      },
      required: ["view"]
    }
  },
  {
    name: "filter_emails",
    description: "Filters the current email list based on criteria.",
    parameters: {
      type: "object",
      properties: {
        unread: { type: "boolean" },
        dateFrom: { type: "string" },
        dateTo: { type: "string" },
        sender: { type: "string" },
        keyword: { type: "string" }
      }
    }
  },
  {
    name: "clear_filters",
    description: "Clears all active email filters.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "search_emails",
    description: "Searches for emails using a Gmail query string.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The Gmail search query (e.g. from:sarah project)" }
      },
      required: ["query"]
    }
  },
  {
    name: "open_email",
    description: "Opens a specific email by ID.",
    parameters: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "The ID of the email to open" }
      },
      required: ["emailId"]
    }
  }
];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, context } = await req.json();
    const apiKey = process.env.AI_API_KEY || "";
    
    // Function to handle local parsing fallback
    const runLocalParser = (msg: string) => {
      const lowerMessage = msg.toLowerCase();
      let toolCalls: any[] = [];
      let replyText = "";

      if (lowerMessage.includes("send") || lowerMessage.includes("email") || lowerMessage.includes("compose") || lowerMessage.includes("@")) {
        const emailMatch = lowerMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || lowerMessage.match(/([a-zA-Z0-9._-]+[.]gmail[.]com)/gi);
        const extractedEmail = emailMatch ? emailMatch[0].replace(".gmail.com", "@gmail.com") : "demo@example.com";

        let extractedSubject = "General Inquiry";
        let generatedBody = "Hello,\n\nI am writing to follow up on our previous discussion.\n\nBest regards,\nKabil Nithi";

        if (lowerMessage.includes("birthday")) {
          extractedSubject = "Happy Birthday!";
          generatedBody = "Hi there,\n\nWishing you a very happy birthday! I hope you have a fantastic day filled with joy and celebration. Let's catch up soon!\n\nBest wishes,\nKabil Nithi";
        } else if (lowerMessage.includes("regarding")) {
          extractedSubject = msg.substring(lowerMessage.indexOf("regarding") + 9).trim();
          generatedBody = `Hello,\n\nI am writing to you regarding ${extractedSubject}.\n\nPlease let me know if you need any further information.\n\nBest regards,\nKabil Nithi`;
        } else if (lowerMessage.includes("about")) {
          extractedSubject = msg.substring(lowerMessage.indexOf("about") + 5).trim();
          generatedBody = `Hi,\n\nI wanted to reach out about ${extractedSubject}.\n\nLooking forward to hearing from you.\n\nBest,\nKabil Nithi`;
        }

        toolCalls.push({
          name: "fill_compose",
          args: {
            to: [extractedEmail],
            subject: extractedSubject.charAt(0).toUpperCase() + extractedSubject.slice(1),
            body: generatedBody
          }
        });
        replyText = "Executing your request...";
      } else if (lowerMessage.includes("clear filter") || lowerMessage.includes("reset filter")) {
        toolCalls.push({ name: "clear_filters", args: {} });
        replyText = "Clearing all filters...";
      } else if (lowerMessage.includes("filter") || lowerMessage.includes("search") || lowerMessage.includes("show") || lowerMessage.includes("find") || lowerMessage.includes("get")) {
        let keyword = "";
        let unread = lowerMessage.includes("unread");
        let sender = "";
        
        if (lowerMessage.includes("sent by ")) {
          sender = lowerMessage.split("sent by ")[1].trim();
        } else if (lowerMessage.includes("from ")) {
          sender = lowerMessage.split("from ")[1].split(" ")[0];
        }
        
        if (lowerMessage.includes("about ")) {
          keyword = lowerMessage.split("about ")[1].trim();
        } else if (lowerMessage.includes("search for ")) {
          keyword = lowerMessage.split("search for ")[1].trim();
        } else if (lowerMessage.includes("find ")) {
          const afterFind = lowerMessage.split("find ")[1].trim();
          if (!afterFind.includes("unread") && !afterFind.includes("emails from")) {
             keyword = afterFind;
          }
        }
        
        toolCalls.push({ name: "filter_emails", args: { unread, sender, keyword } });
        replyText = "Applying your filters...";
      } else if (lowerMessage.includes("inbox") || lowerMessage.includes("sent")) {
        toolCalls.push({
          name: "navigate_to_view",
          args: { view: lowerMessage.includes("sent") ? "sent" : "inbox" }
        });
        replyText = "Navigating to your requested view...";
      } else {
        replyText = "I'm ready to help! You can ask me to send an email, filter your messages (e.g., 'show unread emails from John'), or navigate your inbox.";
      }
      return { replyText, toolCalls };
    };

    if (apiKey === "demo") {
      const localResult = runLocalParser(message);
      return NextResponse.json({ reply: localResult.replyText, toolCalls: localResult.toolCalls });
    }

    const prompt = `
You are an AI mail assistant controlling a mail application UI.
You can call functions to update the UI based on user requests.

CURRENT UI CONTEXT:
${JSON.stringify(context, null, 2)}

USER REQUEST:
${message}

If the user wants to reply to the currently open email, use the 'fill_compose' function and prepend 'Re: ' to the current subject, and use the current sender as the 'to' address.
If the user wants to send a new email, use 'fill_compose'.
If the user wants to filter emails, use 'filter_emails' or 'search_emails'.
If the user is just saying hello, you can just reply with text.
`;

    const modelsToTry = ["gemini-3.8-flash", "gemini-3.7-flash"];
    let result;
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          tools: [{ functionDeclarations: tools }]
        });
        result = await model.generateContent(prompt);
        break; // Success!
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err.message);
      }
    }

    if (!result) {
      console.warn("All network AI models failed. Falling back to local offline parser.");
      const localFallback = runLocalParser(message);
      return NextResponse.json({ 
        reply: "[Network Unavailable] " + localFallback.replyText, 
        toolCalls: localFallback.toolCalls 
      });
    }

    const response = result.response;
    
    const functionCalls = response.functionCalls();
    
    const toolCalls = functionCalls ? functionCalls.map(call => ({
      name: call.name,
      args: call.args
    })) : [];
    
    let replyText = "";
    if (response.candidates && response.candidates[0].content.parts) {
       const textPart = response.candidates[0].content.parts.find(p => p.text);
       if (textPart) replyText = textPart.text;
    }

    if (!replyText && toolCalls.length > 0) {
       replyText = "Executing your request...";
    }

    return NextResponse.json({ reply: replyText, toolCalls });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process AI request" }, { status: 500 });
  }
}
