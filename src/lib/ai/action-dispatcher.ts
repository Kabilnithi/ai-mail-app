import { MailView, MailFilters, ComposeState } from "../context/mail-context";
import { z } from "zod";
import * as schemas from "./schemas";

interface DispatcherContext {
  updateComposeState: (update: Partial<ComposeState>) => void;
  setCurrentView: (view: MailView) => void;
  openEmail: (id: string) => void;
  setActiveFilters: (filters: MailFilters) => void;
}

export function executeAiAction(
  name: string,
  args: any,
  context: DispatcherContext
) {
  console.log(`Executing AI action: ${name}`, args);

  try {
    switch (name) {
      case "open_compose":
        context.updateComposeState({ isOpen: true });
        break;

      case "fill_compose":
        const fillArgs = schemas.fillComposeSchema.parse(args);
        context.updateComposeState({
          isOpen: true,
          ...(fillArgs.to && { to: fillArgs.to }),
          ...(fillArgs.subject && { subject: fillArgs.subject }),
          ...(fillArgs.body && { body: fillArgs.body }),
        });
        break;

      case "navigate_to_view":
        const navArgs = schemas.navigateToViewSchema.parse(args);
        context.setCurrentView(navArgs.view);
        context.setActiveFilters({ unread: false, dateFrom: "", dateTo: "", sender: "", keyword: "" });
        break;

      case "open_email":
        const openArgs = schemas.openEmailSchema.parse(args);
        context.openEmail(openArgs.emailId);
        break;

      case "filter_emails":
        const filterArgs = schemas.filterEmailsSchema.parse(args);
        context.setActiveFilters(filterArgs);
        break;

      case "clear_filters":
        context.setActiveFilters({});
        break;
        
      default:
        console.warn(`Unknown action: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing action ${name}:`, error);
  }
}
