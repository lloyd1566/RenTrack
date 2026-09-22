import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
  indicatorClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, indicatorClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative inline-block w-full", wrapperClassName)}>
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border border-border bg-surface pl-3 pr-9 py-2 text-sm text-text-primary transition-all duration-200 cursor-pointer",
            "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary",
            indicatorClassName
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
