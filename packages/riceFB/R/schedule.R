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