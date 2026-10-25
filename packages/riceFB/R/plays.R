#' Get plays for a game
#'
#' Returns the plays recorded for one game.
#'
#' @param game_id A single game ID, such as `"game-1"`. See [get_games()] for
#'   valid IDs.
#' @return A data frame with one row per play, including `play_id`, `game_id`,
#'   `offense_team_id`, `defense_team_id`, `period`, `down`, `distance`,
#'   `yards_gained`, `play_type` and `play_text`.
#' @examples
#' plays <- get_plays("game-1")
#' table(plays$play_type)
#' @export

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
 