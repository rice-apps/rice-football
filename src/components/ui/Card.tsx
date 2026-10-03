import type { HTMLAttributes, ReactNode } from "react";

// Reusable shell for content panels. Keeps the layout generic so it can be used for
// summaries, lists, forms, and other future page sections without coupling to a feature.
type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
  ...props
}: CardProps) {
  // Header is optional so cards can be used for simple content blocks or full panels.
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <div className={`card ${className}`.trim()} {...props}>
      {hasHeader ? (
        <div className="card__header">
          <div className="card__header-text">
            {title ? <div className="card__title">{title}</div> : null}
            {subtitle ? <div className="card__subtitle">{subtitle}</div> : null}
          </div>

          {/* Keep actions aligned to the right so buttons, badges, or filters can live here. */}
          {actions ? <div className="card__actions">{actions}</div> : null}
        </div>
      ) : null}

      {children ? <div className="card__body">{children}</div> : null}
    </div>
  );
}
