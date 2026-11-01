# Hudl samples

Run the command in [the Hudl notes](../../docs/hudl.md) to create `raw/` locally.
It contains the original games, players, plays and tracking responses, a second
games page, and `selection.json` linking the tracking file to its game and play.

`raw/` is Git-ignored because this repository is public. Hudl data requires account
access, and play responses contain temporary signed download URLs. Share the
payloads only through an approved private team location. The fetcher preserves
response text without filtering, renaming fields or truncating tracking steps.
