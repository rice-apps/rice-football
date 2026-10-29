test_that("get_games() returns only the requested season", {
  games <- get_games(2026)

  expect_gt(nrow(games), 0)
  expect_true(all(games$season == 2026))
  expect_false("game-5" %in% games$game_id) # the 2025 game
})

test_that("get_games() returns zero rows for a season with no games", {
  expect_equal(nrow(get_games(1999)), 0)
})

test_that("get_games() rejects invalid seasons", {
  expect_error(get_games("banana"), "single year")
  expect_error(get_games(c(2025, 2026)), "single year")
  expect_error(get_games(2026.5), "single year")
})
