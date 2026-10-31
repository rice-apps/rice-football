import Link from "next/link";
import { navItems } from "./navItems";

export default function Header() {
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
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`app-header__nav-link ${
              item.label === "Home" ? "app-header__nav-link--active" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
