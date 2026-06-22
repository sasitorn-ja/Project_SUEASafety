import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AppPageProps = {
  children: ReactNode;
  className?: string;
};

type AppPageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
};

export function AppPage({ children, className }: AppPageProps) {
  return <div className={cn("app-page", className)}>{children}</div>;
}

export function AppPageHeader({ title, description, icon: Icon, actions, className }: AppPageHeaderProps) {
  return (
    <header className={cn("app-page-header", className)}>
      <div className="app-page-header-copy">
        {Icon && <span className="app-page-header-icon"><Icon className="h-5 w-5" strokeWidth={2.3} /></span>}
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="app-page-header-actions">{actions}</div>}
    </header>
  );
}

export function AppSection({ children, className }: AppPageProps) {
  return <section className={cn("app-section", className)}>{children}</section>;
}

export function AppEmptyState({ children, className }: AppPageProps) {
  return <div className={cn("app-empty-state", className)}>{children}</div>;
}
