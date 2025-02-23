import * as React from "react";
import { cn } from "@/lib/utils";

const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative pl-4 border-l border-border last:border-l-transparent",
      className
    )}
    {...props}
  >
    <div className="absolute left-0 top-2 -translate-x-1/2 h-2 w-2 rounded-full bg-border" />
    {props.children}
  </div>
));
TimelineItem.displayName = "TimelineItem";

export { Timeline, TimelineItem };
