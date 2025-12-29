import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Status variants
        pending: "border-transparent bg-status-pending text-status-pending-foreground",
        approved: "border-transparent bg-status-approved text-status-approved-foreground",
        rejected: "border-transparent bg-status-rejected text-status-rejected-foreground",
        completed: "border-transparent bg-status-completed text-status-completed-foreground",
        // Soft variants for less visual weight
        "pending-soft": "border-transparent bg-warning/15 text-warning",
        "approved-soft": "border-transparent bg-success/15 text-success",
        "rejected-soft": "border-transparent bg-destructive/15 text-destructive",
        "completed-soft": "border-transparent bg-primary/15 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
