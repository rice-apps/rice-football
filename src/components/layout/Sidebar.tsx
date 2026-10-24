const groups = [
  {
    label: "Workspace",
    items: ["Dashboard", "Components", "Content", "Reports"],
  },
  {
    label: "Resources",
    items: ["Data sources", "Templates", "Reference", "Help"],
  },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar" aria-label="Sidebar navigation">
      <div className="app-sidebar__section">
        <p className="app-sidebar__label">Navigation</p>
        <div className="app-sidebar__group">
          {groups.map((group) => (
            <div key={group.label} className="app-sidebar__group-block">
              <p className="app-sidebar__group-title">{group.label}</p>
              <ul className="app-sidebar__list">
                {group.items.map((item, index) => (
                  <li key={item}>
                    <button
                      type="button"
                      className={`app-sidebar__item ${
                        index === 0 ? "app-sidebar__item--active" : ""
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
