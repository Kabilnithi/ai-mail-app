"use client";

import { useEffect, useState } from "react";
import { useMail } from "@/lib/context/mail-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getMessages, markAsRead } from "@/lib/gmail/actions";

export function MailList({ className }: { className?: string }) {
  const { currentView, openEmail, activeFilters, setActiveFilters, selectedEmailId, refreshKey } = useMail();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    async function loadMessages() {
      setLoading(true);
      try {
        let query = currentView === "inbox" ? "in:inbox" : "in:sent";
        if (activeFilters.unread) query += " is:unread";
        if (activeFilters.sender) query += ` from:${activeFilters.sender}`;
        if (activeFilters.keyword) query += ` ${activeFilters.keyword}`;
        
        const msgs = await getMessages(query);
        setEmails(msgs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [currentView, activeFilters, refreshKey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    try {
      const msgs = await getMessages(searchInput);
      setEmails(msgs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden min-h-0", className)}>
      <div className="flex items-center p-4 border-b shrink-0">
        <h1 className="text-xl font-bold flex-1 capitalize">{currentView}</h1>
      </div>
      <div className="p-4 border-b shrink-0 flex items-center gap-2">
        <form className="relative flex-1" onSubmit={handleSearch}>
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search emails..." 
            className="pl-8" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Button 
          variant={activeFilters.unread ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActiveFilters({ ...activeFilters, unread: !activeFilters.unread })}
        >
          Unread
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-2 p-4 pt-0 mt-4">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-4">Loading...</div>
          ) : emails.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">No emails found</div>
          ) : (
            emails.map((email) => (
              <button
                key={email.id}
                onClick={() => {
                  openEmail(email.id);
                  if (email.unread) {
                    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, unread: false } : e));
                    markAsRead(email.id);
                  }
                }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                  selectedEmailId === email.id && "bg-accent"
                )}
              >
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">
                        {currentView === "sent" ? `To: ${email.recipient.split('<')[0]}` : email.sender.split('<')[0]}
                      </div>
                      {email.unread && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {email.date}
                    </div>
                  </div>
                  <div className="text-xs font-medium">{email.subject}</div>
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  {email.snippet}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
