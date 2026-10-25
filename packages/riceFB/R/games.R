#' Get games for a season
#'
#' Returns every game in riceFB's data for one season.
#'
#' @param season A single year, such as `2026`.
#' @return A data frame with one row per game, including `game_id`, `season`,
#'   `week`, `start_date`, `home_team_id`, `away_team_id`, `home_points` and
#'   `away_points`. Has zero rows if there are no games for that season.
#' @examples
#' games <- get_games(2026)
#' nrow(games)
#' @export

get_games <- function(season) {
    check_season(season)
    games <- read_fixture("games")
    result <- games[games$season == season, ]
    rownames(result) <- NULL
    result
}