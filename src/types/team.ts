// Mock development type, loosely modeled on CollegeFootballData's Team.
// Not production schema.
export type Team = {
  id: string; // e.g. "rice", "notre-dame" — other records reference this
  school: string; // display name, e.g. "Rice"
  mascot: string;
  abbreviation: string;
  conference: string;
  classification: "fbs" | "fcs";
};
