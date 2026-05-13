// Generated from Supabase project `roomiss` (ttycyzyeogdpzfkcnhlm).
// Regenerate via: mcp `generate_typescript_types` then paste here.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: Database["public"]["Enums"]["user_role"];
          hall: Database["public"]["Enums"]["hall"] | null;
          verification_status: Database["public"]["Enums"]["verification_status"];
          verified_at: string | null;
          suspended_until: string | null;
          banned: boolean;
          last_active_at: string;
          scheduled_deletion_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          legal_name: string;
          display_name: string;
          branch: string;
          hometown_city: string | null;
          hometown_state: string | null;
          languages: string[];
          sleep_schedule: Database["public"]["Enums"]["sleep_schedule"];
          study_habits: Database["public"]["Enums"]["study_habit"];
          cleanliness: Database["public"]["Enums"]["cleanliness"];
          social_score: number;
          food_pref: Database["public"]["Enums"]["food_pref"];
          smoking: Database["public"]["Enums"]["habit_freq"];
          drinking: Database["public"]["Enums"]["habit_freq"];
          noise_tolerance: Database["public"]["Enums"]["noise_tolerance"];
          ac_pref: Database["public"]["Enums"]["ac_pref"];
          hobbies: string[];
          bio: string | null;
          instagram_handle: string | null;
          privacy_hide_photo: boolean;
          privacy_hide_insta: boolean;
          privacy_hide_last_active: boolean;
          primary_photo_url: string | null;
          secondary_photo_urls: string[];
          completeness: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          user_id: string;
          legal_name: string;
          display_name: string;
          branch: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      verifications: {
        Row: {
          id: string;
          user_id: string;
          jee_roll: string;
          admission_roll: string;
          hall_claimed: Database["public"]["Enums"]["hall"];
          slip_url: string;
          legal_name: string | null;
          status: Database["public"]["Enums"]["verification_review_status"];
          reviewer_id: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          rejection_category: string | null;
          flags: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["verifications"]["Row"]> & {
          user_id: string;
          jee_roll: string;
          admission_roll: string;
          hall_claimed: Database["public"]["Enums"]["hall"];
          slip_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["verifications"]["Row"]>;
        Relationships: [];
      };
      cooldowns: {
        Row: {
          id: string;
          user_id: string;
          reason: Database["public"]["Enums"]["cooldown_reason"];
          target_user_id: string | null;
          target_group_id: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cooldowns"]["Row"]> & {
          user_id: string;
          reason: Database["public"]["Enums"]["cooldown_reason"];
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["cooldowns"]["Row"]>;
        Relationships: [];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["blocks"]["Row"];
        Update: Partial<Database["public"]["Tables"]["blocks"]["Row"]>;
        Relationships: [];
      };
      swipe_seen: {
        Row: {
          swiper_id: string;
          target_type: Database["public"]["Enums"]["swipe_target_type"];
          target_id: string;
          decision: Database["public"]["Enums"]["swipe_decision"];
          request_id: string | null;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["swipe_seen"]["Row"];
        Update: Partial<Database["public"]["Tables"]["swipe_seen"]["Row"]>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: string;
          close_t0: string;
          review_sla_hours: number;
          demo_mode: boolean;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["platform_settings"]["Row"];
        Update: Partial<Database["public"]["Tables"]["platform_settings"]["Row"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          hall: Database["public"]["Enums"]["hall"];
          status: Database["public"]["Enums"]["group_status"];
          size: number;
          final_size: number;
          shared_bio: string | null;
          locked_at: string | null;
          dissolved_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["groups"]["Row"]> & {
          hall: Database["public"]["Enums"]["hall"];
          final_size: number;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Row"]>;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          joined_at: string;
          left_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["group_members"]["Row"]> & {
          group_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Row"]>;
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["request_type"];
          initiator_user_id: string | null;
          initiator_group_id: string | null;
          target_user_id: string | null;
          target_group_id: string | null;
          note: string | null;
          status: Database["public"]["Enums"]["request_status"];
          invalidated_reason: string | null;
          expires_at: string;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["requests"]["Row"]> & {
          type: Database["public"]["Enums"]["request_type"];
        };
        Update: Partial<Database["public"]["Tables"]["requests"]["Row"]>;
        Relationships: [];
      };
      request_acceptances: {
        Row: {
          request_id: string;
          user_id: string;
          side: Database["public"]["Enums"]["acceptance_side"];
          decision: Database["public"]["Enums"]["acceptance_decision"];
          decided_at: string | null;
        };
        Insert: Database["public"]["Tables"]["request_acceptances"]["Row"];
        Update: Partial<Database["public"]["Tables"]["request_acceptances"]["Row"]>;
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["chat_type"];
          group_id: string | null;
          status: Database["public"]["Enums"]["chat_status"];
          archived_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chats"]["Row"]> & {
          type: Database["public"]["Enums"]["chat_type"];
        };
        Update: Partial<Database["public"]["Tables"]["chats"]["Row"]>;
        Relationships: [];
      };
      chat_participants: {
        Row: {
          chat_id: string;
          user_id: string;
          joined_at: string;
          left_at: string | null;
          history_visible_from: string | null;
          last_read_at: string | null;
          notifications_muted: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["chat_participants"]["Row"]> & {
          chat_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_participants"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string | null;
          body: string;
          kind: Database["public"]["Enums"]["message_kind"];
          attachment_url: string | null;
          reply_to_message_id: string | null;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          chat_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_user_id: string;
          target_message_id: string | null;
          category: Database["public"]["Enums"]["report_category"];
          details: string | null;
          status: Database["public"]["Enums"]["report_status"];
          reviewer_id: string | null;
          reviewed_at: string | null;
          action_taken: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reports"]["Row"]> & {
          reporter_id: string;
          target_user_id: string;
          category: Database["public"]["Enums"]["report_category"];
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: number;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          target_group_id: string | null;
          target_message_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_audit_log"]["Row"]> & {
          admin_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_audit_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      profiles_safe: {
        // Same shape as profiles.Row but with photo/insta/legal_name nullable
        // per privacy gating (already nullable in the table type).
        Row: Database["public"]["Tables"]["profiles"]["Row"];
        Relationships: [];
      };
      profile_media: {
        Row: {
          user_id: string;
          primary_photo_url: string | null;
          secondary_photo_urls: string[];
          instagram_handle: string | null;
          legal_name: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      submit_verification: {
        Args: {
          p_jee_roll: string;
          p_admission_roll: string;
          p_hall_claimed: Database["public"]["Enums"]["hall"];
          p_slip_url: string;
          p_legal_name: string;
        };
        Returns: string;
      };
      admin_approve_verification: { Args: { p_verification_id: string }; Returns: undefined };
      admin_reject_verification: {
        Args: { p_verification_id: string; p_reason: string; p_category: string };
        Returns: undefined;
      };
      send_solo_solo_request: {
        Args: { p_target_user_id: string; p_note?: string };
        Returns: string;
      };
      send_solo_group_request: {
        Args: { p_target_group_id: string; p_note?: string };
        Returns: string;
      };
      accept_request: { Args: { p_request_id: string }; Returns: undefined };
      decline_request: { Args: { p_request_id: string }; Returns: undefined };
      withdraw_request: { Args: { p_request_id: string }; Returns: undefined };
      leave_group: { Args: { p_reason?: string }; Returns: undefined };
      initiate_merge: { Args: { p_other_group_id: string }; Returns: string };
      swipe: {
        Args: {
          p_target_type: Database["public"]["Enums"]["swipe_target_type"];
          p_target_id: string;
          p_decision: Database["public"]["Enums"]["swipe_decision"];
        };
        Returns: Json;
      };
      undo_last_swipe: { Args: Record<string, never>; Returns: Json };
      clear_swipe_history: { Args: Record<string, never>; Returns: undefined };
      upsert_profile: {
        Args: {
          p_legal_name?: string;
          p_display_name?: string;
          p_branch?: string;
          p_hometown_city?: string;
          p_hometown_state?: string;
          p_languages?: string[];
          p_sleep_schedule?: Database["public"]["Enums"]["sleep_schedule"];
          p_study_habits?: Database["public"]["Enums"]["study_habit"];
          p_cleanliness?: Database["public"]["Enums"]["cleanliness"];
          p_social_score?: number;
          p_food_pref?: Database["public"]["Enums"]["food_pref"];
          p_smoking?: Database["public"]["Enums"]["habit_freq"];
          p_drinking?: Database["public"]["Enums"]["habit_freq"];
          p_noise_tolerance?: Database["public"]["Enums"]["noise_tolerance"];
          p_ac_pref?: Database["public"]["Enums"]["ac_pref"];
          p_hobbies?: string[];
          p_bio?: string;
          p_instagram_handle?: string;
          p_primary_photo_url?: string;
          p_secondary_photo_urls?: string[];
          p_privacy_hide_photo?: boolean;
          p_privacy_hide_insta?: boolean;
          p_privacy_hide_last_active?: boolean;
          p_completeness?: number;
        };
        Returns: undefined;
      };
      toggle_privacy: { Args: { p_key: string }; Returns: undefined };
      change_hall: { Args: { p_new_hall: Database["public"]["Enums"]["hall"] }; Returns: undefined };
      delete_account: { Args: Record<string, never>; Returns: string };
      block_user: { Args: { p_blocked_id: string; p_reason?: string }; Returns: undefined };
      unblock_user: { Args: { p_blocked_id: string }; Returns: undefined };
      report_user: {
        Args: {
          p_target_user_id: string;
          p_category: Database["public"]["Enums"]["report_category"];
          p_details: string;
          p_target_message_id?: string;
        };
        Returns: string;
      };
      mark_chat_read: { Args: { p_chat_id: string }; Returns: undefined };
      toggle_chat_mute: { Args: { p_chat_id: string }; Returns: undefined };
      mark_notification_read: { Args: { p_id: string }; Returns: undefined };
      admin_warn_user: { Args: { p_user_id: string; p_message: string }; Returns: undefined };
      admin_suspend_user: {
        Args: { p_user_id: string; p_days: number; p_reason: string };
        Returns: undefined;
      };
      admin_ban_user: { Args: { p_user_id: string; p_reason: string }; Returns: undefined };
      admin_resolve_report: {
        Args: {
          p_report_id: string;
          p_status: Database["public"]["Enums"]["report_status"];
          p_action_taken: string;
        };
        Returns: undefined;
      };
      demo_self_approve_verification: { Args: Record<string, never>; Returns: string };
      cancel_account_deletion: { Args: Record<string, never>; Returns: undefined };
      compat: { Args: { a: string; b: string }; Returns: number };
      compat_breakdown: { Args: { a: string; b: string }; Returns: Json };
      compat_user_vs_group: { Args: { uid: string; gid: string }; Returns: number };
      compat_many: {
        Args: { target_ids: string[] };
        Returns: { target_id: string; score: number }[];
      };
      admin_dashboard_stats: { Args: Record<string, never>; Returns: Json };
      session_ping: { Args: Record<string, never>; Returns: undefined };
      mark_all_notifications_read: { Args: Record<string, never>; Returns: number };
      recent_messages: {
        Args: { per_chat?: number };
        Returns: Database["public"]["Tables"]["messages"]["Row"][];
      };
      is_matching_open: { Args: Record<string, never>; Returns: boolean };
      is_chat_writable: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: { uid?: string }; Returns: boolean };
      is_verified: { Args: { uid?: string }; Returns: boolean };
      my_hall: { Args: { uid?: string }; Returns: Database["public"]["Enums"]["hall"] };
    };
    Enums: {
      ac_pref: "yes" | "no" | "either";
      acceptance_decision: "pending" | "accept" | "decline";
      acceptance_side: "initiator" | "target";
      chat_status: "active" | "archived" | "deleted";
      chat_type: "dm" | "group";
      cleanliness: "tidy" | "average" | "messy";
      cooldown_reason: "decline" | "left_group" | "blocked" | "hall_changed";
      food_pref: "veg" | "non_veg" | "eggetarian" | "jain";
      group_status: "partial" | "locked" | "dissolved";
      habit_freq: "never" | "rarely" | "regularly";
      hall: "LBS" | "SNVH";
      message_kind: "text" | "image" | "system";
      noise_tolerance: "low" | "medium" | "high";
      report_category: "harassment" | "fake_profile" | "spam" | "inappropriate" | "other";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      request_status:
        | "pending"
        | "accepted"
        | "declined"
        | "withdrawn"
        | "expired"
        | "invalidated";
      request_type: "solo_solo" | "solo_group" | "group_solo" | "group_group";
      sleep_schedule: "early" | "flexible" | "night";
      study_habit: "in_room" | "library" | "hybrid";
      swipe_decision: "like" | "pass";
      swipe_target_type: "user" | "group";
      user_role: "user" | "admin" | "verifier";
      verification_review_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "resubmit_requested";
      verification_status:
        | "unverified"
        | "pending"
        | "in_review"
        | "verified"
        | "rejected"
        | "resubmit_requested";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
