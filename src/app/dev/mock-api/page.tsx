"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

// Same shape as the objects in src/app/api/mock/teams/route.ts
type Team = {
  id: string;
  name: string;
  mascot: string;
};

export default function MockApiPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Runs once in the browser after the page first renders.
  // This is the same request your browser makes when you visit /api/mock/teams directly.
  useEffect(() => {
    fetch("/api/mock/teams")
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then(setTeams)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className={styles.page}>
      <h1>Mock API test</h1>
      <p className={styles.subtitle}>
        Data from <code>GET /api/mock/teams</code>
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Mascot</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id}>
              <td>{team.id}</td>
              <td>{team.name}</td>
              <td>{team.mascot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
