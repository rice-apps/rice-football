import type { ReactNode } from "react";

type PageContainerProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageContainer({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: PageContainerProps) {
  return (
    <div className="page-container">
      <div className="page-container__header">
        <div>
          {eyebrow ? <p className="page-container__eyebrow">{eyebrow}</p> : null}
          <h1 className="page-container__title">{title}</h1>
          {subtitle ? <p className="page-container__subtitle">{subtitle}</p> : null}
        </div>

        {actions ? <div className="page-container__actions">{actions}</div> : null}
      </div>

      {children}
    </div>
  );
}
