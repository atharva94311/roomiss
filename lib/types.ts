export type Hall = "LBS" | "SNVH";

export type SleepSchedule = "early" | "flexible" | "night";
export type StudyHabit = "in_room" | "library" | "hybrid";
export type Cleanliness = "tidy" | "average" | "messy";
export type FoodPref = "veg" | "non_veg" | "eggetarian" | "jain";
export type Habit = "never" | "rarely" | "regularly";
export type NoiseTolerance = "low" | "medium" | "high";
export type AcPref = "yes" | "no" | "either";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "in_review"
  | "verified"
  | "rejected"
  | "resubmit_requested";

export type Role = "user" | "admin" | "verifier";

export interface User {
  id: string;
  email: string;
  role: Role;
  hall: Hall | null;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  suspendedUntil?: string;
  banned?: boolean;
  lastActiveAt: string;
  scheduledDeletionAt?: string;
  createdAt: string;
}

export interface Profile {
  userId: string;
  legalName: string;
  displayName: string;
  branch: string;
  hometownCity?: string;
  hometownState?: string;
  languages: string[];
  sleepSchedule: SleepSchedule;
  studyHabits: StudyHabit;
  cleanliness: Cleanliness;
  socialScore: number; // 1..5
  foodPref: FoodPref;
  smoking: Habit;
  drinking: Habit;
  noiseTolerance: NoiseTolerance;
  acPref: AcPref;
  hobbies: string[];
  bio: string;
  instagramHandle?: string;
  privacyHidePhoto: boolean;
  privacyHideInsta: boolean;
  privacyHideLastActive: boolean;
  primaryPhotoUrl?: string;
  secondaryPhotoUrls?: string[];
  completeness: number;
  updatedAt: string;
}

export interface Verification {
  id: string;
  userId: string;
  jeeRoll: string;
  admissionRoll: string;
  hallClaimed: Hall;
  slipUrl: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "resubmit_requested";
  reviewerId?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  rejectionCategory?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  hall: Hall;
  status: "partial" | "locked" | "dissolved";
  size: number;
  finalSize: 3 | 4;
  sharedBio?: string;
  lockedAt?: string;
  dissolvedAt?: string;
  createdAt: string;
  memberIds: string[];
}

export type RequestType = "solo_solo" | "solo_group" | "group_solo" | "group_group";
export type RequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired"
  | "invalidated";

export interface RoomRequest {
  id: string;
  type: RequestType;
  initiatorUserId?: string;
  initiatorGroupId?: string;
  targetUserId?: string;
  targetGroupId?: string;
  note?: string;
  status: RequestStatus;
  invalidatedReason?: string;
  expiresAt: string;
  createdAt: string;
  resolvedAt?: string;
  acceptances: { userId: string; side: "initiator" | "target"; decision: "pending" | "accept" | "decline" }[];
}

export interface Chat {
  id: string;
  type: "dm" | "group";
  groupId?: string;
  status: "active" | "archived" | "deleted";
  archivedAt?: string;
  createdAt: string;
  participantIds: string[];
}

export interface ChatParticipant {
  chatId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
  historyVisibleFrom?: string;
  lastReadAt?: string;
  notificationsMuted: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId?: string;
  body: string;
  kind: "text" | "image" | "system";
  attachmentUrl?: string;
  replyToMessageId?: string;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: string;
}

export type ReportCategory = "harassment" | "fake_profile" | "spam" | "inappropriate" | "other";

export interface Report {
  id: string;
  reporterId: string;
  targetUserId: string;
  targetMessageId?: string;
  category: ReportCategory;
  details?: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  reviewerId?: string;
  reviewedAt?: string;
  actionTaken?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: number;
  adminId: string;
  action: string;
  targetUserId?: string;
  targetGroupId?: string;
  targetMessageId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Cooldown {
  id: string;
  userId: string;
  reason: "decline" | "left_group" | "blocked" | "hall_changed";
  targetUserId?: string;
  targetGroupId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface PlatformSettings {
  closeT0: string; // ISO date for institute allotment
  reviewSlaHours: number;
}

// ─── Swipe mode ────────────────────────────────────────────────────────
export type SwipeDecision = "like" | "pass";
export type SwipeTargetType = "user" | "group";

export interface SwipeRecord {
  targetType: SwipeTargetType;
  targetId: string;
  decision: SwipeDecision;
  at: string;
  /** If a request was sent on right-swipe, its id — used for undo (withdraw). */
  requestId?: string;
}

export interface SwipeFilters {
  /** Only solo profiles (no partial groups) in the deck. */
  onlySolos: boolean;
  /** Only partial groups with exactly 1 open seat. */
  lookingForOne: boolean;
  /** Only profiles whose `lastActiveAt` is within 7 days. */
  activeLast7d: boolean;
}

export type ViewMode = "feed" | "swipe";
