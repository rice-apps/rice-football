# riceFB

R package for Rice Football analysts.

**Current status:** functions return small local fixture data bundled with the
package (`inst/extdata/`), not live data. The function names and arguments are
intended to stay the same when real data sources are connected.

## Install

From the root of the `rice-football` repo, in R:

```r
devtools::install("packages/riceFB")
```

## Usage

```r
library(riceFB)

teams <- get_teams()

games <- get_games(2026)

rice_schedule <- get_schedule(team = "Rice", season = 2026)

plays <- get_plays("game-1")
```

Each function returns a data frame. See the help pages for details, for
example `?get_schedule`.

## Functions

| Function | Returns |
|---|---|
| `get_teams()` | all teams |
| `get_games(season)` | games in one season |
| `get_schedule(team, season)` | one team's games in one season, by date |
| `get_plays(game_id)` | plays from one game |

## Development

From `packages/riceFB/`, in R:

```r
devtools::document()  # regenerate help pages and NAMESPACE from roxygen comments
devtools::test()      # run tests
devtools::check()     # full package check
```
