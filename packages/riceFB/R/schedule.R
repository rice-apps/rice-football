#' Get a team's schedule
#'
#' Returns one team's games for a season, in date order.
#'
#' @param team A school name such as `"Rice"`, or a `team_id` such as
#'   `"notre-dame"`. Case does not matter. See [get_teams()] for valid teams.
#' @param season A single year, such as `2026`.
#' @return A data frame with the same columns as [get_games()], containing only
#'   games where `team` played home or away.
#' @examples
#' rice_schedule <- get_schedule(team = "Rice", season = 2026)
#' rice_schedule[, c("week", "home_team_id", "away_team_id")]
#' @export

get_schedule <- function(team, season) {
    check_string(team, "team")
    check_season(season)
    teams <- read_fixture("teams")

    key <- tolower(team)
    team_id <- teams$team_id[tolower(teams$school) == key | teams$team_id == key]
    if (length(team_id) == 0) {
        stop(sprintf("Unknown team \"%s\". See get_teams() for available teams.", team), call. = FALSE)
    }

    games <- get_games(season)
    result <- games[games$home_team_id == team_id | games$away_team_id == team_id, ]
    result <- result[order(result$start_date), ]
    rownames(result) <- NULL
    result
}