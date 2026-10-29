test_that("get_schedule() returns only that team's games in that season", {
  schedule <- get_schedule("Rice", 2026)

  expect_equal(schedule$game_id, c("game-1", "game-2", "game-3", "game-4"))
  expect_true(all(schedule$season == 2026))
  expect_true(all(schedule$home_team_id == "rice" | schedule$away_team_id == "rice"))
})

test_that("get_schedule() ignores case and accepts team IDs", {
  expect_equal(get_schedule("rice", 2026), get_schedule("Rice", 2026))
  expect_equal(nrow(get_schedule("notre-dame", 2026)), 1)
})

test_that("get_schedule() rejects unknown teams and invalid input", {
  expect_error(get_schedule("Rcie", 2026), "Unknown team")
  expect_error(get_schedule("Rice", "2026"), "single year")
  expect_error(get_schedule(123, 2026), "single non-empty string")
})