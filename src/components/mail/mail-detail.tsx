"use client";

import { useEffect, useState } from "react";
import { useMail } from "@/lib/context/mail-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Reply, Forward, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMessage } from "@/lib/gmail/actions";

export function MailDetail({ className }: { className?: string }) {
  const { currentView, selectedEmailId, updateComposeState } = useMail();
  const [email, setEmail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEmail() {
      if (!selectedEmailId) {
        setEmail(null);
        return;
      }
      setLoading(true);
      try {
        const msg = await getMessage(selectedEmailId);
        setEmail(msg);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadEmail();
  }, [selectedEmailId]);

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-muted-foreground", className)}>
        <p>Loading message...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-muted-foreground", className)}>
        <p>No message selected</p>
      </div>
    );
  }

  const handleReply = () => {
    updateComposeState({
      isOpen: true,
      to: [email.sender],
      subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
      body: "",
    });
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden min-h-0", className)}>
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleReply}>
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Forward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  {currentView === "sent" 
                    ? email.recipient?.charAt(0).toUpperCase() 
                    : email.sender?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">
                  {currentView === "sent" ? `To: ${email.recipient}` : email.sender}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentView === "sent" ? `From: ${email.sender}` : "To: me"}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{email.date}</div>
          </div>
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold">{email.subject}</h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {email.body}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
