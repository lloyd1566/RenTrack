import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-600/10 text-primary-700 dark:text-primary-300",
        secondary:
          "border-transparent bg-secondary-600/10 text-secondary-700 dark:text-secondary-300",
        destructive:
          "border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        outline: "text-text-secondary border-border",
        success:
          "border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        warning:
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        info: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

