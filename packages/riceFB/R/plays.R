get_plays <- function(game_id) {
  check_string(game_id, "game_id")

  games <- read_fixture("games")
  if (!game_id %in% games$game_id) {
    stop(sprintf("Unknown game_id \"%s\". See get_games() for available games.", game_id), call. = FALSE)
  }

  plays <- read_fixture("plays")
  result <- plays[plays$game_id == game_id, ]
  rownames(result) <- NULL
  result
}
 