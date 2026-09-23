"use client";

import { User } from "next-auth";
import { MailProvider } from "@/lib/context/mail-context";
import { Sidebar } from "./sidebar";
import { MailList } from "./mail-list";
import { MailDetail } from "./mail-detail";
import { ComposeDialog } from "../compose/compose-dialog";
import { AssistantPanel } from "../assistant/assistant-panel";

export function MailClient({ user }: { user: User }) {
  return (
    <MailProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar user={user} />
        <main className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex w-full flex-1 flex-col overflow-hidden sm:flex-row min-h-0">
            <MailList className="w-full border-r sm:w-[400px] lg:w-[500px]" />
            <MailDetail className="hidden flex-1 sm:block min-h-0" />
          </div>
        </main>
        <AssistantPanel />
        <ComposeDialog />
      </div>
    </MailProvider>
  );
}
