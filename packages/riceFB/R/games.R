get_games <- function(season) {
    check_season(season)
    games <- read_fixture("games")
    result <- games[games$season == season, ]
    rownames(result) <- NULL
    result
}