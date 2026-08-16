import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md";
}

export function HelpTooltip({ content, className, side = "top", size = "sm" }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none",
            size === "sm" ? "w-4 h-4" : "w-5 h-5",
            className
          )}
          onClick={(e) => e.preventDefault()}
        >
          <HelpCircle className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-sm">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

// Page-level help badge with title + description
interface PageHelpProps {
  title: string;
  description: string;
  className?: string;
}

export function PageHelp({ title, description, className }: PageHelpProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 rounded-full px-2 py-0.5 transition-colors",
            className
          )}
        >
          <HelpCircle className="h-3 w-3" />
          <span>Help</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm">
        <div className="space-y-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
