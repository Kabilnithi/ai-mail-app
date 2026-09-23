"use client";

import { User } from "next-auth";
import { useMail } from "@/lib/context/mail-context";
import { Button } from "@/components/ui/button";
import { Inbox, Send, PenSquare, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar({ user }: { user: User }) {
  const { currentView, setCurrentView, updateComposeState, setActiveFilters } = useMail();

  const handleNav = (view: "inbox" | "sent") => {
    setCurrentView(view);
    setActiveFilters({ unread: false, dateFrom: "", dateTo: "", sender: "", keyword: "" });
  };

  return (
    <div className="flex w-[250px] flex-col border-r bg-muted/20">
      <div className="p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Inbox className="h-5 w-5" />
          </div>
          AI Mail
        </h2>
      </div>
      <div className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => updateComposeState({ isOpen: true })}
          >
            <PenSquare className="h-4 w-4" />
            Compose
          </Button>
          <Button
            variant={currentView === "inbox" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNav("inbox")}
          >
            <Inbox className="h-4 w-4" />
            Inbox
          </Button>
          <Button
            variant={currentView === "sent" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNav("sent")}
          >
            <Send className="h-4 w-4" />
            Sent
          </Button>
        </div>
      </div>
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate w-[120px]">
                {user.email}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
