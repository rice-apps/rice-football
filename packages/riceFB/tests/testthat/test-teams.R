test_that("get_teams() returns teams", {
  teams <- get_teams()

  expect_s3_class(teams, "data.frame")
  expect_gt(nrow(teams), 0)
  expect_true("Rice" %in% teams$school)
})
