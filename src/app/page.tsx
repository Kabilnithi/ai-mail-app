import { auth } from "@/auth";
import { MailClient } from "@/components/mail/mail-client";
import { LoginForm } from "@/components/auth/login-form";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <LoginForm />
      </div>
    );
  }

  return <MailClient user={session.user} />;
}
