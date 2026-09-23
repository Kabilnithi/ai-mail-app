# AI-Powered Mail Web Application

A production-quality mail client where an AI assistant directly controls the UI to compose emails, search, filter, and navigate your inbox using natural language.

## 1. How to Set It Up and Run It Locally

### Prerequisites
- Node.js 18+ and npm
- A Google Cloud Project with the Gmail API enabled
- A PostgreSQL Database (e.g., Supabase, Neon, or local Docker)

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd ai-mail-app
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Connection
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

   # Google OAuth (Ensure redirect URI is http://localhost:3000/api/auth/callback/google)
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secure-random-string"

   # Gemini AI Provider
   AI_API_KEY="your-gemini-api-key"
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the Application**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`. Authenticate with Google, and you can immediately begin chatting with the AI.

## 2. Architecture Decisions and Trade-offs

- **Frontend Action Dispatcher over Server-Side Execution**: 
  Instead of the AI blindly executing actions on the backend (like sending an email directly), the AI returns structured JSON `toolCalls`. The frontend intercepts these and updates the local UI State (e.g., opening the compose modal and filling it with the AI's generated text). 
  *Trade-off*: This requires the client to orchestrate API calls after the AI finishes, but it elegantly fulfills the "Human-in-the-Loop" requirement, ensuring users can review and modify emails before they are sent.

- **Offline/Resilient Fallback Mode**:
  Google's Generative AI servers can occasionally experience 503 Traffic Spikes. We built a robust retry loop that first attempts `gemini-3.8-flash`, falls back to `gemini-3.7-flash`, and if all network models fail, degrades gracefully to a **Local Rule-Based Parser**.
  *Trade-off*: The local parser is limited to simple regex matching, but it ensures the app never hard-crashes during a global outage and maintains core functionality.

- **Direct Gmail API over Database Sync**:
  We do not mirror the entire Gmail mailbox to our PostgreSQL database. Gmail remains the absolute source of truth. 
  *Trade-off*: We incur slightly higher latency on initial load by fetching directly from Google, but we completely avoid stale data issues, sync conflicts, and massive database storage costs. The DB is strictly used for NextAuth session management.

## 3. Demo: AI Assistant Controlling the UI

![AI Mail Assistant Demo](./public/demo.gif)
*(Please replace `./public/demo.gif` with your actual video or screenshot of the AI composing an email and filtering the inbox!)*

## 4. What We’d Improve With More Time

1. **Full Google Cloud Pub/Sub Webhook Integration**: 
   Currently, the app relies on frontend polling/refreshing after actions are taken. With more time, we would implement the `/api/webhooks/gmail` route to listen for Pub/Sub push notifications. This would allow the inbox to update instantaneously when a new email arrives in the background without refreshing.

2. **Advanced Email Threading**:
   The current implementation flattens emails. We would improve the Gmail API fetching logic to group `messages` by `threadId` and display cohesive conversational threads, similar to the native Gmail experience.

3. **Vector Database for Semantic Search**:
   Instead of relying purely on Gmail's native `q=` search syntax, we would sync emails to a Vector Database (like Pinecone) using `gemini-embedding` models. This would allow users to ask the AI highly semantic questions like, *"What was the key takeaway from last week's marketing meeting?"* and receive precise answers.
