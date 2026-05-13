"use client";

import { useMemo, useState } from "react";
import { AdminTopBar } from "@/components/admin/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { HallPill, StatusPill } from "@/components/ui/Pills";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useRoomiss } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import { RM } from "@/lib/tokens";
import { fmtAgo } from "@/lib/format";
import type { Hall } from "@/lib/types";

export default function AdminUsersPage() {
  // Selector returns the raw record; the filter happens in useMemo so the
  // selector's return is reference-stable. See notifications/page.tsx for
  // the full explanation of why this matters (avoids useSyncExternalStore
  // infinite loop).
  const usersRecord = useRoomiss((s) => s.users);
  const users = useMemo(
    () => Object.values(usersRecord).filter((u) => u.role === "user"),
    [usersRecord],
  );
  const profiles = useRoomiss((s) => s.profiles);
  const [q, setQ] = useState("");
  const [hallFilter, setHallFilter] = useState<Hall | "all">("all");
  const [banning, setBanning] = useState<string | null>(null);

  const filtered = users
    .filter((u) => hallFilter === "all" || u.hall === hallFilter)
    .filter((u) => {
      if (!q.trim()) return true;
      const p = profiles[u.id];
      const hay = `${u.email} ${p?.displayName ?? ""} ${p?.legalName ?? ""} ${p?.branch ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase().trim());
    });

  return (
    <>
      <AdminTopBar
        title="Users"
        sub={`${users.filter((u) => u.verificationStatus === "verified").length} verified · ${users.filter((u) => u.verificationStatus === "pending").length} pending`}
      />
      <div className="px-6 py-3 flex items-center gap-2.5" style={{ flexShrink: 0 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, roll, branch…"
          className="flex-1 outline-none"
          style={{
            padding: "8px 14px", borderRadius: 10,
            background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}`, fontSize: 13,
          }}
        />
        <div
          className="flex p-0.5 rounded-full"
          style={{ background: "rgba(27,26,23,0.06)", border: `1px solid ${RM.hairline}` }}
        >
          {(["all", "LBS", "SNVH"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHallFilter(h)}
              style={{
                padding: "5px 11px", borderRadius: 999, border: "none",
                background: hallFilter === h ? RM.surface : "transparent",
                color: hallFilter === h ? RM.ink : RM.ink3,
                fontFamily: RM.mono, fontSize: 10.5, letterSpacing: 0.3,
                fontWeight: hallFilter === h ? 600 : 500, cursor: "pointer",
              }}
            >
              {h === "all" ? "ALL" : h}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <table className="w-full" style={{ fontSize: 14 }}>
            <thead>
              <tr style={{ background: RM.surface2 }}>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Hall</Th>
                <Th>Status</Th>
                <Th>Last active</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const p = profiles[u.id];
                return (
                  <tr key={u.id} style={{ borderTop: `1px solid ${RM.hairline}` }}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p?.displayName ?? u.id} hall={u.hall ?? "LBS"} size={28} />
                        <span style={{ fontWeight: 500 }}>{p?.displayName ?? u.id}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="font-mono" style={{ fontSize: 12, color: RM.ink3 }}>
                        {u.email}
                      </span>
                    </Td>
                    <Td>{u.hall && <HallPill hall={u.hall} />}</Td>
                    <Td>
                      <StatusPill
                        tone={
                          u.verificationStatus === "verified"
                            ? "verified"
                            : u.verificationStatus === "pending"
                              ? "pending"
                              : u.verificationStatus === "rejected"
                                ? "danger"
                                : "neutral"
                        }
                        dot={false}
                      >
                        {u.verificationStatus}
                      </StatusPill>
                    </Td>
                    <Td>
                      <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                        {fmtAgo(u.lastActiveAt)}
                      </span>
                    </Td>
                    <Td>
                      {u.banned ? (
                        <StatusPill tone="danger" dot={false}>banned</StatusPill>
                      ) : (
                        <button
                          onClick={() => setBanning(u.id)}
                          className="font-mono"
                          style={{
                            fontSize: 10.5, padding: "4px 9px",
                            border: `1px solid ${RM.bad}40`, borderRadius: 8,
                            color: RM.bad, background: "transparent",
                            cursor: "pointer", letterSpacing: 0.3,
                          }}
                        >
                          Ban
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm" style={{ color: RM.ink3 }}>
              No users match those filters.
            </div>
          )}
        </div>
      </div>

      {banning && (() => {
        const u = useRoomiss.getState().users[banning];
        const p = useRoomiss.getState().profiles[banning];
        if (!u) return null;
        return (
          <ConfirmDialog
            title={`Ban ${p?.displayName ?? u.email}?`}
            body="They'll be removed from any group, their pending requests get invalidated, and they can't sign in. Reversible by manually un-banning."
            typeToConfirm={u.email}
            reasonPrompt="Reason (audit log only)"
            confirmLabel="Ban user"
            danger
            onClose={() => setBanning(null)}
            onConfirm={async (reason) => {
              await supabase.rpc("admin_ban_user", { p_user_id: banning, p_reason: reason });
              useRoomiss.setState((s) => ({
                ...s,
                users: { ...s.users, [banning]: { ...s.users[banning], banned: true } },
              }));
            }}
          />
        );
      })()}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left px-4 py-2.5 font-mono uppercase"
      style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5, fontWeight: 500 }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5">{children}</td>;
}
