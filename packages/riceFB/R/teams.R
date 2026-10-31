#' Get teams
#'
#' Returns the teams available in riceFB's data. Use `team_id` to match teams
#' to the `home_team_id`, `away_team_id`, `offense_team_id` and
#' `defense_team_id` columns returned by other functions.
#'
#' @return A data frame with one row per team and columns `team_id`, `school`,
#'   `mascot`, `abbreviation`, `conference` and `classification`.
#' @examples
#' teams <- get_teams()
#' head(teams)
#' @export

get_teams <- function() {
  read_fixture("teams")
}