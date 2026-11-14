# Analyst data dictionary

Open `/analyst/data-dictionary` to browse existing CFBD schedule and standings
outputs, selected Hudl tracking fields, and riceFB teams, games, and plays fixtures.
The page uses a small local catalog. It makes no vendor or database requests and
does not define a production football database.

The shared header and sidebar include a Data Dictionary link, added at the project
lead’s request. The page is also accessible directly at the route above.

## Files

- [Catalog and entry types](../src/lib/data-dictionary/catalog.ts)
- [Search](../src/lib/data-dictionary/search.ts)
- [Page route](../src/app/analyst/data-dictionary/page.tsx)
- [Page content and controls](../src/components/data-dictionary/DataDictionary.tsx)
- [Page styles](../src/components/data-dictionary/DataDictionary.module.css)

The page links to the existing [riceFB installation and usage guide](../packages/riceFB/README.md).
Source-file references in the catalog are for developer maintenance and are not
shown on the page. They are ordinary repository paths, not access controls.

## Add or update an entry

1. Read the existing types, conversion code, sample notes, and package loaders
   relevant to the structure. For CSV fixtures, check every header and how R reads
   the values. A sample alone does not prove what all future responses contain.
2. Add an item to `dictionaryCatalog`, following `DictionaryStructure`. Give it a
   unique `id`, a clear name, its source, purpose, and one of these classifications:
   - `API output`: data returned by an API and prepared for the app.
   - `Raw vendor payload`: data in the provider’s original format.
   - `Package fixture`: sample data bundled with riceFB.
3. Add repository-relative `sourceFiles` for reviewers to check. Write
   `nullabilityNotes` explaining the evidence about missing values, and
   `limitations` explaining what analysts should keep in mind. Use plain language.
4. Add every relevant field to `fields`, preserving its exact name. Use `[]` for
   items in nested lists, such as `tracks[].steps[].timestamp`. Each field needs
   a `type`, `description`, and `nullability`:
   - `not-null`: the app’s type definition does not allow null.
   - `nullable`: the type explicitly allows null.
   - `unverified`: the source’s missing-value rules have not been confirmed.
5. Use `relationship` for documented record connections, stating the source and
   target fields. Use `uncertainty` starting with `Unverified:` for unknown meanings,
   units, allowed values, or relationships. Do not infer meanings from field names.

Type labels describe the existing source: TypeScript/JSON types for app and Hudl
fields, and R types for package fixtures. They do not enforce a schema. An app type
requiring a field does not prove that the vendor always supplies it. A CSV with no
missing cells does not prove future values cannot be missing.

Keep CFBD, Hudl, and fixture IDs separate. Do not imply that matching names or
numbers establish the same team, player, or game across sources. Keep real API
samples distinct from fictional fixtures. Never include credentials, signed URLs,
or restricted raw payloads in catalog entries.

## Search behavior

Search ignores letter case and surrounding spaces. A match in the structure’s
name, source, purpose, classification, missing-value notes, or limitations shows
all its fields. Otherwise, matching field names, descriptions, relationships, or
uncertainty notes show only those rows, together with their structure’s context.
An empty search shows the full catalog. The page reports result counts and offers
clear-search and no-results controls.

## R checks reported by the user

The user ran the following checks against their installed riceFB package using
R 4.6.1 and shared the console output. All reported types match this catalog.

| Output | Rows | Fields | Missing values |
| --- | ---: | ---: | ---: |
| `get_teams()` | 7 | 6 | 0 |
| `get_games(2026)` | 5 | 10 | 0 |
| `get_plays("game-1")` | 12 | 14 | 0 |

For each output, `str()` showed the field types and `colSums(is.na(...))` returned
zero for every column. Team fields were all character values. Game fields were
character or integer values; `start_date` was character, not an R Date. Play fields
were character or integer values, with `scoring` logical (TRUE/FALSE).

These checks cover the installed package outputs listed above. They do not confirm
other seasons or games, the installed package's exact source revision, future
missing-value rules, undocumented field meanings, or any live vendor behavior.
The missing-value rules therefore remain marked `unverified`.

To repeat the checks in R:

```r
library(riceFB)
teams <- get_teams()
games <- get_games(2026)
plays <- get_plays("game-1")

str(teams)
colSums(is.na(teams))
str(games)
colSums(is.na(games))
str(plays)
colSums(is.na(plays))
```

## Check changes

Use Node 22+ and run these from the repository root:

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build
npm run dev
```

Open `http://localhost:3000/analyst/data-dictionary` (use the port printed by Next.js
if different). Check:

- `gameId` shows the CFBD schedule field, its source, and ID limitations.
- `  YARDS_GAINED  ` finds the riceFB plays field and its sample-data caveats.
- `timestamp` shows the Hudl field and unverified time units.
- A structure name shows all its fields; a phrase in a field description finds
  that field.
- An unrelated search shows no-results feedback. Both reset controls restore the
  catalog and focus the search input.
- Keyboard navigation, narrow-screen table scrolling, and the riceFB usage link
  work. Source-file sections are absent. Capture a screenshot for the PR.

Lint, TypeScript, production build, focused search checks, and an HTTP page-content
check passed during implementation. The build logged CFBD connection failures for
the existing homepage; the dictionary uses local content. Browser interactions,
narrow-screen appearance, and screenshots remain unverified because Computer Use
permissions were unavailable. No live vendor behavior was verified by this work.
