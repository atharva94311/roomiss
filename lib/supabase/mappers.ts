// Adapters: Supabase row shapes (snake_case) → local model (camelCase).
// Keeping the local model untouched means the existing screens don't have to
// change shape. The mappers are the boundary.

import type { Database } from "@/lib/database.types";
import type {
  User, Profile, Group, RoomRequest, Chat, ChatParticipant, Message,
  Block, Report, Notification, AdminAuditEntry, Cooldown,
} from "@/lib/types";

type Tbl<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export function rowToUser(r: Tbl<"users">): User {
  return {
    id: r.id,
    email: r.email,
    role: r.role,
    hall: r.hall,
    verificationStatus: r.verification_status,
    verifiedAt: r.verified_at ?? undefined,
    suspendedUntil: r.suspended_until ?? undefined,
    banned: r.banned ?? undefined,
    lastActiveAt: r.last_active_at,
    scheduledDeletionAt: r.scheduled_deletion_at ?? undefined,
    createdAt: r.created_at,
  };
}

export function rowToProfile(r: Tbl<"profiles">): Profile {
  return {
    userId: r.user_id,
    legalName: r.legal_name,
    displayName: r.display_name,
    branch: r.branch,
    hometownCity: r.hometown_city ?? undefined,
    hometownState: r.hometown_state ?? undefined,
    languages: r.languages,
    sleepSchedule: r.sleep_schedule,
    studyHabits: r.study_habits,
    cleanliness: r.cleanliness,
    socialScore: r.social_score,
    foodPref: r.food_pref,
    smoking: r.smoking,
    drinking: r.drinking,
    noiseTolerance: r.noise_tolerance,
    acPref: r.ac_pref,
    hobbies: r.hobbies,
    bio: r.bio ?? "",
    instagramHandle: r.instagram_handle ?? undefined,
    primaryPhotoUrl: r.primary_photo_url ?? undefined,
    secondaryPhotoUrls: r.secondary_photo_urls,
    privacyHidePhoto: r.privacy_hide_photo,
    privacyHideInsta: r.privacy_hide_insta,
    privacyHideLastActive: r.privacy_hide_last_active,
    completeness: r.completeness,
    updatedAt: r.updated_at,
  };
}

export function rowToGroup(
  r: Tbl<"groups">,
  memberIds: string[],
): Group {
  return {
    id: r.id,
    hall: r.hall,
    status: r.status,
    size: r.size,
    finalSize: r.final_size as 3 | 4,
    sharedBio: r.shared_bio ?? undefined,
    lockedAt: r.locked_at ?? undefined,
    dissolvedAt: r.dissolved_at ?? undefined,
    createdAt: r.created_at,
    memberIds,
  };
}

export function rowToRequest(
  r: Tbl<"requests">,
  acceptances: Tbl<"request_acceptances">[],
): RoomRequest {
  return {
    id: r.id,
    type: r.type,
    initiatorUserId: r.initiator_user_id ?? undefined,
    initiatorGroupId: r.initiator_group_id ?? undefined,
    targetUserId: r.target_user_id ?? undefined,
    targetGroupId: r.target_group_id ?? undefined,
    note: r.note ?? undefined,
    status: r.status,
    invalidatedReason: r.invalidated_reason ?? undefined,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at ?? undefined,
    acceptances: acceptances.map((a) => ({
      userId: a.user_id, side: a.side, decision: a.decision,
    })),
  };
}

export function rowToChat(
  r: Tbl<"chats">,
  participantIds: string[],
): Chat {
  return {
    id: r.id,
    type: r.type,
    groupId: r.group_id ?? undefined,
    status: r.status,
    archivedAt: r.archived_at ?? undefined,
    createdAt: r.created_at,
    participantIds,
  };
}

export function rowToParticipant(r: Tbl<"chat_participants">): ChatParticipant {
  return {
    chatId: r.chat_id,
    userId: r.user_id,
    joinedAt: r.joined_at,
    leftAt: r.left_at ?? undefined,
    historyVisibleFrom: r.history_visible_from ?? undefined,
    lastReadAt: r.last_read_at ?? undefined,
    notificationsMuted: r.notifications_muted,
  };
}

export function rowToMessage(r: Tbl<"messages">): Message {
  return {
    id: r.id,
    chatId: r.chat_id,
    senderId: r.sender_id ?? undefined,
    body: r.body,
    kind: r.kind,
    attachmentUrl: r.attachment_url ?? undefined,
    replyToMessageId: r.reply_to_message_id ?? undefined,
    createdAt: r.created_at,
    editedAt: r.edited_at ?? undefined,
    deletedAt: r.deleted_at ?? undefined,
  };
}

export function rowToBlock(r: Tbl<"blocks">): Block {
  return {
    blockerId: r.blocker_id,
    blockedId: r.blocked_id,
    reason: r.reason ?? undefined,
    createdAt: r.created_at,
  };
}

export function rowToReport(r: Tbl<"reports">): Report {
  return {
    id: r.id,
    reporterId: r.reporter_id,
    targetUserId: r.target_user_id,
    targetMessageId: r.target_message_id ?? undefined,
    category: r.category,
    details: r.details ?? undefined,
    status: r.status,
    reviewerId: r.reviewer_id ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined,
    actionTaken: r.action_taken ?? undefined,
    createdAt: r.created_at,
  };
}

export function rowToNotification(r: Tbl<"notifications">): Notification {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    readAt: r.read_at ?? undefined,
    createdAt: r.created_at,
  };
}

export function rowToCooldown(r: Tbl<"cooldowns">): Cooldown {
  return {
    id: r.id,
    userId: r.user_id,
    reason: r.reason,
    targetUserId: r.target_user_id ?? undefined,
    targetGroupId: r.target_group_id ?? undefined,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

export function rowToAudit(r: Tbl<"admin_audit_log">): AdminAuditEntry {
  return {
    id: r.id,
    adminId: r.admin_id,
    action: r.action,
    targetUserId: r.target_user_id ?? undefined,
    targetGroupId: r.target_group_id ?? undefined,
    targetMessageId: r.target_message_id ?? undefined,
    metadata: (r.metadata ?? undefined) as Record<string, unknown> | undefined,
    createdAt: r.created_at,
  };
}
