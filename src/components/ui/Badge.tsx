import type { HTMLAttributes } from "react";

/**
 * badge1: gray
 * badge2: Rice blue
 * badge3: blue
 * badge4: green
 * badge5: amber
 * badge6: red
 */
export type BadgeVariant = "badge1" | "badge2" | "badge3" | "badge4" | "badge5" | "badge6";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "badge1", className, ...props }: BadgeProps) {
  return <span className={["ui-badge", `ui-badge--${variant}`, className].filter(Boolean).join(" ")} {...props} />;
}
