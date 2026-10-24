// Mock development type, loosely modeled on CollegeFootballData's Play.
// Not the production schema.
export type PlayType =
  | "Rush"
  | "Pass Reception"
  | "Pass Incompletion"
  | "Sack"
  | "Interception"
  | "Punt"
  | "Field Goal Good"
  | "Field Goal Missed"
  | "Rushing Touchdown"
  | "Passing Touchdown";

export type Play = {
  id: string;
  gameId: string; // references Game.id
  offenseTeamId: string; // references Team.id
  defenseTeamId: string; // references Team.id
  driveNumber: number; // order of the drive within the game
  playNumber: number; // order of the play within the drive
  period: number; // quarter, 1-4
  down: number; // 1-4
  distance: number; // yards needed for a first down
  yardsToGoal: number; // yards from the end zone the offense is attacking
  yardsGained: number; // negative for a loss
  playType: PlayType;
  playText: string;
  scoring: boolean;
};
