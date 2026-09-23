"use client";

import { useState, useRef, useEffect } from "react";
import { useMail } from "@/lib/context/mail-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { executeAiAction } from "@/lib/ai/action-dispatcher";

export function AssistantPanel({ className }: { className?: string }) {
  const { currentView, selectedEmailId, activeFilters, composeState, updateComposeState, setCurrentView, openEmail, setActiveFilters } = useMail();
  const [messages, setMessages] = useState<{role: "user" | "assistant", content: string}[]>([
    { role: "assistant", content: "Hi! I'm your mail assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const context = {
        currentView,
        selectedEmailId,
        activeFilters,
        composeState
      };

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, context }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to communicate with AI");
      }

      const data = await response.json();
      
      // The AI will return both a conversational reply and an array of tool calls
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }

      if (data.toolCalls && data.toolCalls.length > 0) {
        // Dispatch actions to update UI
        for (const call of data.toolCalls) {
          executeAiAction(call.name, call.args, {
            updateComposeState,
            setCurrentView,
            openEmail,
            setActiveFilters
          });
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className={cn("fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden", className)}>
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">AI Assistant</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    msg.role === "user" 
                      ? "ml-auto bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-muted w-max max-w-[85%] rounded-lg px-3 py-2 text-sm text-muted-foreground flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-muted/10">
            <form 
              className="flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            >
              <Input 
                placeholder="Ask me to send an email..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="bg-background"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
