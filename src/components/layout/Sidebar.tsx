"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Sidebar navigation">
      <div className="app-sidebar__section">
        <p className="app-sidebar__label">Navigation</p>
        <ul className="app-sidebar__list">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`app-sidebar__item ${
                    isActive ? "app-sidebar__item--active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
