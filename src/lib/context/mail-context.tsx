"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type MailView = "inbox" | "sent" | "email-detail";

export interface MailFilters {
  unread?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sender?: string;
  keyword?: string;
}

export interface ComposeState {
  isOpen: boolean;
  to: string[];
  subject: string;
  body: string;
}

interface MailContextType {
  currentView: MailView;
  setCurrentView: (view: MailView) => void;
  selectedEmailId: string | null;
  setSelectedEmailId: (id: string | null) => void;
  activeFilters: MailFilters;
  setActiveFilters: (filters: MailFilters) => void;
  composeState: ComposeState;
  setComposeState: (state: ComposeState) => void;
  updateComposeState: (update: Partial<ComposeState>) => void;
  openEmail: (id: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const MailContext = createContext<MailContextType | undefined>(undefined);

export function MailProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<MailView>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<MailFilters>({});
  const [composeState, setComposeState] = useState<ComposeState>({
    isOpen: false,
    to: [],
    subject: "",
    body: "",
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const updateComposeState = (update: Partial<ComposeState>) => {
    setComposeState((prev) => ({ ...prev, ...update }));
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openEmail = (id: string) => {
    setSelectedEmailId(id);
  };

  return (
    <MailContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedEmailId,
        setSelectedEmailId,
        activeFilters,
        setActiveFilters,
        composeState,
        setComposeState,
        updateComposeState,
        openEmail,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </MailContext.Provider>
  );
}

export function useMail() {
  const context = useContext(MailContext);
  if (context === undefined) {
    throw new Error("useMail must be used within a MailProvider");
  }
  return context;
}
