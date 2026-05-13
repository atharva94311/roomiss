import type { Hall } from "./types";

export const RM = {
  bg: "#F7F2E9",
  surface: "#FFFFFF",
  surface2: "#FBF6EC",
  ink: "#1B1A17",
  ink2: "#4A453C",
  ink3: "#6b6657",     // WCAG AA: 5.2:1 on white, 4.9:1 on cream (was #85806F = 2.7:1)
  hairline: "rgba(27,26,23,0.08)",
  hairline2: "rgba(27,26,23,0.14)",
  lbs: "#C46A48",
  lbsSoft: "#F5E4D8",
  lbsInk: "#7A3920",
  snvh: "#BD5C68",
  snvhSoft: "#F5DEDF",
  snvhInk: "#722F39",
  good: "#5C7A3F",
  warn: "#C99843",
  bad: "#9B4029",
  serif: '"Instrument Serif", "Iowan Old Style", Georgia, serif',
  sans: '"Geist", ui-sans-serif, -apple-system, system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, "SF Mono", monospace',
};

export interface HallTheme {
  key: Hall;
  fullName: string;
  shortName: string;
  groupSize: 3 | 4;
  gender: string;
  accent: string;
  soft: string;
  deep: string;
}

export function hallTheme(hall: Hall): HallTheme {
  if (hall === "SNVH") {
    return {
      key: "SNVH",
      fullName: "Sarojini Naidu Hall",
      shortName: "SNVH",
      groupSize: 4,
      gender: "Women",
      accent: RM.snvh,
      soft: RM.snvhSoft,
      deep: RM.snvhInk,
    };
  }
  return {
    key: "LBS",
    fullName: "Lal Bahadur Shastri Hall",
    shortName: "LBS",
    groupSize: 3,
    gender: "Men",
    accent: RM.lbs,
    soft: RM.lbsSoft,
    deep: RM.lbsInk,
  };
}

export const BRANCHES = [
  "AE", "AG", "AR", "BT", "CE", "CH", "CHEM", "CS", "CSE", "EC", "EE",
  "ENV", "EX", "GG", "HSS", "IE", "IM", "MA", "ME", "MI", "MT", "NA",
  "PH", "OE", "QM", "VL",
];

export const STATES = [
  "AP", "AR", "AS", "BR", "CG", "DL", "GA", "GJ", "HR", "HP", "JK",
  "JH", "KA", "KL", "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PB",
  "RJ", "SK", "TN", "TG", "TR", "UP", "UK", "WB", "AN", "CH", "DN",
  "DD", "LD", "PY",
];

export const LANGUAGES = [
  "Hindi", "English", "Tamil", "Telugu", "Marathi", "Kannada", "Bengali",
  "Punjabi", "Malayalam", "Odia", "Gujarati", "Urdu", "Assamese",
];

export const HOBBY_SUGGESTIONS = [
  "Cricket", "Football", "Coding", "Reading", "Music", "Gaming", "Cinema",
  "Hiking", "Photography", "Cooking", "Yoga", "Running", "Anime", "Art",
  "Dance", "Theatre", "Quizzing", "Robotics", "Chess",
];
