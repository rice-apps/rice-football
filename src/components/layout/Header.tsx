const navItems = ["Overview", "Workspace", "Components", "Settings"];

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
          <a
            key={item}
            href="#"
            className={`app-header__nav-link ${
              item === "Overview" ? "app-header__nav-link--active" : ""
            }`}
          >
            {item}
          </a>
        ))}
      </nav>

      <button type="button" className="button button--primary button--sm">
        New view
      </button>
    </header>
  );
}
