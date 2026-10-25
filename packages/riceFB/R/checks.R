check_season <- function(season) {
    if(!is.numeric(season) || length(season) != 1 || is.na(season) || season != round(season)) {
        stop("`season` must be a single year, like 2026.", call. = FALSE)
    }
}

check_string <- function(value, arg) {
    if(!is.character(value) || length(value) != 1 || is.na(value) || value == "") {
        stop(sprintf("`%s` must be a single non-empty string.", arg), call. = FALSE)
    }
}