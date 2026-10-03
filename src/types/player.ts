// Mock development type, loosely modeled on CollegeFootballData's RosterPlayer.
// Not the production schema.
export type Position =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "OL"
  | "DL"
  | "LB"
  | "CB"
  | "S"
  | "K"
  | "P";

export type Player = {
  id: string;
  teamId: string; // references Team.id
  firstName: string;
  lastName: string;
  position: Position;
  jersey: number;
  height: number; // inches
  weight: number; // pounds
};
