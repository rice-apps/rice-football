test_that("get_plays() returns only the requested game's plays", {
  plays <- get_plays("game-1")

  expect_gt(nrow(plays), 0)
  expect_true(all(plays$game_id == "game-1"))
})

test_that("get_plays() rejects unknown games and invalid input", {
  expect_error(get_plays("game-99"), "Unknown game_id")
  expect_error(get_plays(1), "single non-empty string")
  expect_error(get_plays(""), "single non-empty string")
})
