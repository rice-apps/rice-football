# Reads one of the package's fixture CSVs from inst/extdata/.
# Internal: not exported, so analysts won't call it directly.
read_fixture <- function(name) {
  path <- system.file("extdata", paste0(name, ".csv"), package = "riceFB", mustWork = TRUE)
  utils::read.csv(path, stringsAsFactors = FALSE)
}