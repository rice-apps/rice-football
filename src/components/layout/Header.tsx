"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="app-header__brand-wrap">
        <div className="app-header__brand-mark">RF</div>
        <div>
          <div className="app-header__eyebrow">RiceApps</div>
          <div className="app-header__title">Rice Football</div>
        </div>
      </div>

      <nav className="app-header__nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`app-header__nav-link ${
                isActive ? "app-header__nav-link--active" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
