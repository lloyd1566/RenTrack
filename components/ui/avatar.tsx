"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({
  src,
  alt = "",
  fallback = "U",
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [error, setError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800",
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 font-semibold text-white">
          {fallback}
        </div>
      )}
    </div>
  );
}

