"use client";

import { useState } from "react";
import { useMail } from "@/lib/context/mail-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/lib/gmail/actions";
import { toast } from "sonner";

export function ComposeDialog() {
  const { composeState, updateComposeState, triggerRefresh } = useMail();
  const [isSending, setIsSending] = useState(false);

  const handleClose = () => {
    updateComposeState({ isOpen: false });
  };

  const handleSend = async () => {
    if (!composeState.to.length || !composeState.subject || !composeState.body) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsSending(true);
    try {
      await sendMessage(composeState.to, composeState.subject, composeState.body);
      toast.success("Message sent successfully!");
      handleClose();
      updateComposeState({ to: [], subject: "", body: "" });
      triggerRefresh();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={composeState.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b bg-muted/50">
          <DialogTitle className="text-sm font-medium">New Message</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 p-4">
          <Input 
            placeholder="To" 
            className="border-0 border-b rounded-none shadow-none focus-visible:ring-0 px-0"
            value={composeState.to.join(", ")}
            onChange={(e) => updateComposeState({ to: e.target.value.split(",").map(s => s.trim()) })}
          />
          <Input 
            placeholder="Subject" 
            className="border-0 border-b rounded-none shadow-none focus-visible:ring-0 px-0"
            value={composeState.subject}
            onChange={(e) => updateComposeState({ subject: e.target.value })}
          />
          <Textarea 
            placeholder="Write your message..." 
            className="min-h-[200px] border-0 rounded-none shadow-none focus-visible:ring-0 px-0 resize-none mt-2"
            value={composeState.body}
            onChange={(e) => updateComposeState({ body: e.target.value })}
          />
        </div>
        <DialogFooter className="px-4 py-3 border-t bg-muted/50 sm:justify-between">
          <Button variant="ghost" onClick={handleClose} disabled={isSending}>Discard</Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
