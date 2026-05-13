"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminTopBar } from "@/components/admin/TopBar";
import { useRoomiss } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import { RM } from "@/lib/tokens";

interface DashboardStats {
  total_users: number;
  verified: number;
  pending_verifs: number;
  open_reports: number;
  groups_partial_2: number;
  groups_partial_3: number;
  groups_locked: number;
  groups_dissolved: number;
  lbs_verified: number;
  snvh_verified: number;
  banned_users: number;
  scheduled_deletion: number;
  time_to_lock_median_hours: number;
  last_24h_signups: number;
  last_24h_messages: number;
  last_24h_requests: number;
}

export default function AdminDashboard() {
  const audit = useRoomiss((s) => s.audit);
  const users = useRoomiss((s) => s.users);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLive, setAuditLive] = useState(audit);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data }, { data: auditRows }] = await Promise.all([
        supabase.rpc("admin_dashboard_stats"),
        supabase
          .from("admin_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;
      if (data) setStats(data as unknown as DashboardStats);
      if (auditRows) {
        setAuditLive(
          auditRows.map((a) => ({
            id: a.id, adminId: a.admin_id, action: a.action,
            targetUserId: a.target_user_id ?? undefined,
            targetGroupId: a.target_group_id ?? undefined,
            targetMessageId: a.target_message_id ?? undefined,
            metadata: (a.metadata ?? undefined) as Record<string, unknown> | undefined,
            createdAt: a.created_at,
          })),
        );
      }
    };
    load();
    const interval = setInterval(load, 15_000); // refresh every 15s
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const lockedHours = stats?.time_to_lock_median_hours ?? 0;
  const medianFmt = lockedHours === 0 ? "—" : lockedHours < 24
    ? `${lockedHours}h` : `${Math.round(lockedHours / 24 * 10) / 10}d`;

  return (
    <>
      <AdminTopBar
        title="Dashboard"
        sub={
          stats
            ? `${stats.verified} verified · ${stats.pending_verifs} pending · ${stats.open_reports} open reports · ${stats.last_24h_signups} signups today`
            : "Loading…"
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <Stat
            label="Verified users"
            value={`${stats?.verified ?? "—"}`}
            hint={stats ? `${stats.lbs_verified} LBS · ${stats.snvh_verified} SNVH` : ""}
          />
          <Stat
            label="Pending verifs"
            value={`${stats?.pending_verifs ?? "—"}`}
            hint="awaiting admin review"
          />
          <Stat
            label="Locked groups"
            value={`${stats?.groups_locked ?? "—"}`}
            hint={stats
              ? `${stats.groups_partial_2} partial-2 · ${stats.groups_partial_3} partial-3`
              : ""}
          />
          <Stat
            label="Open reports"
            value={`${stats?.open_reports ?? "—"}`}
            hint={stats?.banned_users ? `${stats.banned_users} banned` : "all clear"}
          />
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="font-mono uppercase mb-2.5"
            style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.5 }}
          >
            Time-to-lock
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Median" value={medianFmt} hint="signup → lock" />
            <Stat
              label="24h activity"
              value={`${(stats?.last_24h_messages ?? 0) + (stats?.last_24h_requests ?? 0)}`}
              hint={stats ? `${stats.last_24h_messages} msgs · ${stats.last_24h_requests} reqs` : ""}
            />
            <Stat
              label="Scheduled deletes"
              value={`${stats?.scheduled_deletion ?? 0}`}
              hint="30-day grace"
            />
          </div>
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div className="flex justify-between items-baseline mb-3">
            <div
              className="font-mono uppercase"
              style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.5 }}
            >
              Recent admin actions (live)
            </div>
            <Link href="/admin/audit" className="text-xs underline" style={{ color: RM.ink3 }}>
              full audit log →
            </Link>
          </div>
          <div className="space-y-2">
            {auditLive.length === 0 && (
              <div style={{ fontSize: 13, color: RM.ink3 }}>No admin actions yet.</div>
            )}
            {auditLive.slice(0, 6).map((a) => {
              const target = a.targetUserId ? users[a.targetUserId] : null;
              return (
                <div
                  key={a.id}
                  className="flex justify-between items-center text-sm py-1.5"
                  style={{ borderBottom: `1px solid ${RM.hairline}` }}
                >
                  <span style={{ color: RM.ink2 }}>
                    <b style={{ color: RM.ink }}>{a.action.replace(/_/g, " ")}</b>
                    {target && ` · ${target.email}`}
                  </span>
                  <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      className="p-3.5 rounded-xl"
      style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
    >
      <div
        className="font-mono uppercase"
        style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
      >
        {label}
      </div>
      <div className="font-serif" style={{ fontSize: 28, letterSpacing: -0.5, marginTop: 6 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: RM.ink3, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
