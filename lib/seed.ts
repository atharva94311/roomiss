import type {
  User, Profile, Group, RoomRequest, Chat, Message, AdminAuditEntry,
} from "./types";

const now = () => new Date().toISOString();

// 12 LBS users + 12 SNVH users + admin + me
const seedUsers: User[] = [];
const seedProfiles: Profile[] = [];

interface SeedRow {
  id: string;
  hall: "LBS" | "SNVH";
  name: string;
  branch: string;
  city: string;
  state: string;
  sleep: Profile["sleepSchedule"];
  clean: Profile["cleanliness"];
  social: number;
  food: Profile["foodPref"];
  smoking: Profile["smoking"];
  drinking: Profile["drinking"];
  noise: Profile["noiseTolerance"];
  ac: Profile["acPref"];
  bio: string;
  ig?: string;
  langs: string[];
  hobbies: string[];
}

const ROWS: SeedRow[] = [
  // LBS
  { id: "u1", hall: "LBS", name: "Aarav Mehta", branch: "CSE", city: "Pune", state: "MH",
    sleep: "night", clean: "tidy", social: 3, food: "veg", smoking: "never", drinking: "rarely", noise: "medium", ac: "yes",
    bio: "CS hopeful, half-marathoner. Looking for chill, clean roommates who don't mind late-night code.",
    ig: "@aarav.m", langs: ["Hindi", "English", "Marathi"], hobbies: ["Coding", "Running", "Anime"] },
  { id: "u2", hall: "LBS", name: "Vikram Reddy", branch: "EE", city: "Hyderabad", state: "TG",
    sleep: "early", clean: "tidy", social: 2, food: "non_veg", smoking: "never", drinking: "never", noise: "low", ac: "no",
    bio: "Quiet, organized, wakes up at 6. Carrom and Spotify are my two love languages.",
    ig: "@vk.reddy", langs: ["Telugu", "English", "Hindi"], hobbies: ["Carrom", "Music", "Reading"] },
  { id: "u3", hall: "LBS", name: "Rohan Iyer", branch: "ME", city: "Mumbai", state: "MH",
    sleep: "flexible", clean: "average", social: 4, food: "non_veg", smoking: "rarely", drinking: "rarely", noise: "high", ac: "yes",
    bio: "F1 nerd, decent guitarist, can survive on Maggi. Open to anyone who isn't allergic to laughter.",
    ig: "@rohan.iy", langs: ["Tamil", "English", "Hindi"], hobbies: ["Music", "Cinema", "Cooking"] },
  { id: "u4", hall: "LBS", name: "Karthik Raman", branch: "EC", city: "Chennai", state: "TN",
    sleep: "night", clean: "tidy", social: 2, food: "veg", smoking: "never", drinking: "never", noise: "low", ac: "yes",
    bio: "Hardware tinkerer, light sleeper. Big on a clean desk and zero clutter.",
    langs: ["Tamil", "English"], hobbies: ["Robotics", "Reading", "Chess"] },
  { id: "u5", hall: "LBS", name: "Siddharth Joshi", branch: "CHEM", city: "Bhopal", state: "MP",
    sleep: "early", clean: "average", social: 3, food: "veg", smoking: "never", drinking: "rarely", noise: "medium", ac: "no",
    bio: "Plays the harmonium (badly). Will share notes, snacks, and bad jokes.",
    langs: ["Hindi", "English"], hobbies: ["Music", "Cooking"] },
  { id: "u6", hall: "LBS", name: "Aryan Bhattacharya", branch: "NA", city: "Kolkata", state: "WB",
    sleep: "flexible", clean: "average", social: 3, food: "non_veg", smoking: "rarely", drinking: "rarely", noise: "medium", ac: "yes",
    bio: "Naval Arch + cricket. Easy to live with, hard to wake up.",
    langs: ["Bengali", "English", "Hindi"], hobbies: ["Cricket", "Photography"] },
  { id: "u7", hall: "LBS", name: "Devansh Kapoor", branch: "MA", city: "Delhi", state: "DL",
    sleep: "night", clean: "messy", social: 5, food: "non_veg", smoking: "regularly", drinking: "regularly", noise: "high", ac: "either",
    bio: "Math + DJ-ing. I am chaotic. Be warned.",
    langs: ["Hindi", "English", "Punjabi"], hobbies: ["Music", "Dance"] },
  { id: "u8", hall: "LBS", name: "Pratyush Singh", branch: "CSE", city: "Lucknow", state: "UP",
    sleep: "night", clean: "tidy", social: 3, food: "veg", smoking: "never", drinking: "never", noise: "low", ac: "yes",
    bio: "Build apps, lift, sleep. In that order.",
    langs: ["Hindi", "English"], hobbies: ["Coding", "Gym"] },

  // SNVH
  { id: "s1", hall: "SNVH", name: "Ananya Sharma", branch: "CSE", city: "Delhi", state: "DL",
    sleep: "night", clean: "tidy", social: 3, food: "veg", smoking: "never", drinking: "rarely", noise: "low", ac: "yes",
    bio: "Filter coffee, Studio Ghibli, calm rooms. Looking for a thoughtful group.",
    ig: "@ananyas", langs: ["Hindi", "English"], hobbies: ["Cinema", "Reading"] },
  { id: "s2", hall: "SNVH", name: "Priya Verma", branch: "BT", city: "Lucknow", state: "UP",
    sleep: "early", clean: "tidy", social: 2, food: "veg", smoking: "never", drinking: "never", noise: "low", ac: "no",
    bio: "Bio nerd. Yoga at 6:30 a.m., reading by 10 p.m. Plant person.",
    langs: ["Hindi", "English"], hobbies: ["Yoga", "Reading"] },
  { id: "s3", hall: "SNVH", name: "Tanvi Khanna", branch: "EE", city: "Chandigarh", state: "PB",
    sleep: "night", clean: "average", social: 4, food: "non_veg", smoking: "rarely", drinking: "rarely", noise: "high", ac: "yes",
    bio: "Loud laugh, low drama. I bring the playlist; you bring the chai.",
    langs: ["Punjabi", "Hindi", "English"], hobbies: ["Music", "Dance"] },
  { id: "s4", hall: "SNVH", name: "Meera Iyengar", branch: "MA", city: "Bangalore", state: "KA",
    sleep: "flexible", clean: "tidy", social: 3, food: "veg", smoking: "never", drinking: "never", noise: "medium", ac: "yes",
    bio: "Math + sketching. Hate clutter, love balconies.",
    ig: "@meera.i", langs: ["Kannada", "Tamil", "English"], hobbies: ["Art", "Reading"] },
  { id: "s5", hall: "SNVH", name: "Riya Banerjee", branch: "AE", city: "Kolkata", state: "WB",
    sleep: "early", clean: "average", social: 5, food: "non_veg", smoking: "never", drinking: "rarely", noise: "high", ac: "no",
    bio: "Aero, choir, terrible at making the bed. Working on it.",
    langs: ["Bengali", "English", "Hindi"], hobbies: ["Music", "Theatre"] },
  { id: "s6", hall: "SNVH", name: "Nandini Rao", branch: "CSE", city: "Bangalore", state: "KA",
    sleep: "night", clean: "tidy", social: 2, food: "veg", smoking: "never", drinking: "never", noise: "low", ac: "yes",
    bio: "Will draft a roommate agreement. (Affectionately.)",
    langs: ["Kannada", "English"], hobbies: ["Coding", "Reading"] },
  { id: "s7", hall: "SNVH", name: "Ishita Sen", branch: "CH", city: "Pune", state: "MH",
    sleep: "flexible", clean: "tidy", social: 3, food: "eggetarian", smoking: "never", drinking: "never", noise: "medium", ac: "yes",
    bio: "Lab person. Loves a quiet evening and a noisy morning playlist.",
    langs: ["Marathi", "English", "Hindi"], hobbies: ["Cooking", "Hiking"] },
  { id: "s8", hall: "SNVH", name: "Aanya Pillai", branch: "HSS", city: "Kochi", state: "KL",
    sleep: "night", clean: "average", social: 4, food: "non_veg", smoking: "never", drinking: "rarely", noise: "medium", ac: "either",
    bio: "Words person. Thrift shopper. Lover of long walks and longer conversations.",
    langs: ["Malayalam", "English", "Hindi"], hobbies: ["Reading", "Photography"] },
];

ROWS.forEach((r, idx) => {
  seedUsers.push({
    id: r.id,
    email: `${r.id}@iitkgp.ac.in`,
    role: "user",
    hall: r.hall,
    verificationStatus: "verified",
    verifiedAt: now(),
    lastActiveAt: new Date(Date.now() - idx * 1000 * 60 * 17).toISOString(),
    createdAt: now(),
  });
  seedProfiles.push({
    userId: r.id,
    legalName: r.name,
    displayName: r.name,
    branch: r.branch,
    hometownCity: r.city,
    hometownState: r.state,
    languages: r.langs,
    sleepSchedule: r.sleep,
    studyHabits: "hybrid",
    cleanliness: r.clean,
    socialScore: r.social,
    foodPref: r.food,
    smoking: r.smoking,
    drinking: r.drinking,
    noiseTolerance: r.noise,
    acPref: r.ac,
    hobbies: r.hobbies,
    bio: r.bio,
    instagramHandle: r.ig,
    privacyHidePhoto: true,
    privacyHideInsta: true,
    privacyHideLastActive: false,
    completeness: 100,
    updatedAt: now(),
  });
});

// Seed me — unverified, no profile yet (filled during onboarding)
const meUser: User = {
  id: "me",
  email: "you@iitkgp.ac.in",
  role: "user",
  hall: null,
  verificationStatus: "unverified",
  lastActiveAt: now(),
  createdAt: now(),
};

// Admin user
const adminUser: User = {
  id: "admin1",
  email: "admin@roomiss.in",
  role: "admin",
  hall: null,
  verificationStatus: "verified",
  verifiedAt: now(),
  lastActiveAt: now(),
  createdAt: now(),
};

const seedGroups: Group[] = [
  {
    id: "g1", hall: "LBS", status: "partial", size: 2, finalSize: 3,
    sharedBio: "Quiet block, late-night vibe. Looking for one more.",
    createdAt: now(), memberIds: ["u3", "u6"],
  },
  {
    id: "g2", hall: "SNVH", status: "partial", size: 2, finalSize: 4,
    sharedBio: "Tidy, mostly veg, big on plants and study breaks.",
    createdAt: now(), memberIds: ["s2", "s4"],
  },
  {
    id: "g3", hall: "SNVH", status: "partial", size: 3, finalSize: 4,
    sharedBio: "We laugh too loud and clean too rarely. Looking for the 4th.",
    createdAt: now(), memberIds: ["s3", "s5", "s8"],
  },
];

const seedRequests: RoomRequest[] = [
  {
    id: "r1", type: "solo_solo", initiatorUserId: "u2", targetUserId: "me",
    note: "Hey, our profiles look like a fit — late-night code lover here too.",
    status: "pending",
    expiresAt: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    acceptances: [
      { userId: "u2", side: "initiator", decision: "accept" },
      { userId: "me", side: "target", decision: "pending" },
    ],
  },
  {
    id: "r2", type: "solo_solo", initiatorUserId: "u4", targetUserId: "me",
    note: "Same hall, same branch — let's chat.", status: "pending",
    expiresAt: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    acceptances: [
      { userId: "u4", side: "initiator", decision: "accept" },
      { userId: "me", side: "target", decision: "pending" },
    ],
  },
];

const seedChats: Chat[] = [];
const seedMessages: Message[] = [];

const adminAudit: AdminAuditEntry[] = [
  { id: 1, adminId: "admin1", action: "user_verified", targetUserId: "u1", createdAt: now() },
  { id: 2, adminId: "admin1", action: "user_verified", targetUserId: "s1", createdAt: now() },
  { id: 3, adminId: "admin1", action: "verification_rejected", targetUserId: "u9", metadata: { reason: "slip mismatch" }, createdAt: now() },
];

export const SEED = {
  users: [...seedUsers, meUser, adminUser],
  profiles: seedProfiles,
  groups: seedGroups,
  requests: seedRequests,
  chats: seedChats,
  messages: seedMessages,
  audit: adminAudit,
  pendingVerifications: [
    { id: "v9", userId: "v-aarav", jeeRoll: "JEE-2400412", admissionRoll: "ADM-114", hallClaimed: "LBS" as const,
      slipUrl: "/slips/v9.pdf", status: "pending" as const, createdAt: now(), name: "Aarav Mehta" },
    { id: "v10", userId: "v-ananya", jeeRoll: "JEE-2401789", admissionRoll: "ADM-118", hallClaimed: "SNVH" as const,
      slipUrl: "/slips/v10.pdf", status: "pending" as const, createdAt: now(), name: "Ananya Sharma" },
    { id: "v11", userId: "v-vikram", jeeRoll: "JEE-2402344", admissionRoll: "ADM-202", hallClaimed: "LBS" as const,
      slipUrl: "/slips/v11.pdf", status: "pending" as const, createdAt: now(), name: "Vikram Reddy",
      flags: ["Slip resolution low"] },
    { id: "v12", userId: "v-tanvi", jeeRoll: "JEE-2403102", admissionRoll: "ADM-310", hallClaimed: "SNVH" as const,
      slipUrl: "/slips/v12.pdf", status: "pending" as const, createdAt: now(), name: "Tanvi Khanna" },
    { id: "v13", userId: "v-sumit", jeeRoll: "JEE-2400887", admissionRoll: "ADM-411", hallClaimed: "LBS" as const,
      slipUrl: "/slips/v13.pdf", status: "pending" as const, createdAt: now(), name: "Sumit Pawar",
      flags: ["Roll# already used"] },
  ],
};
