import Link from "next/link";
import { navItems } from "./navItems";

export default function Sidebar() {
  return (
    <aside className="app-sidebar" aria-label="Sidebar navigation">
      <div className="app-sidebar__section">
        <p className="app-sidebar__label">Navigation</p>
        <ul className="app-sidebar__list">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`app-sidebar__item ${
                  item.label === "Home" ? "app-sidebar__item--active" : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
