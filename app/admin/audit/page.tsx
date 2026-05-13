"use client";

import { AdminTopBar } from "@/components/admin/TopBar";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";

export default function AdminAuditPage() {
  // Audit is already returned newest-first by hydrate; sort defensively.
  const audit = useRoomiss((s) =>
    [...s.audit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  const users = useRoomiss((s) => s.users);
  const profiles = useRoomiss((s) => s.profiles);
  return (
    <>
      <AdminTopBar
        title="Audit log"
        sub={`${audit.length} actions · append-only · cannot be edited`}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          {audit.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: RM.ink3 }}>
              No actions yet.
            </div>
          ) : (
            audit.map((a, i) => (
              <div
                key={a.id}
                className="px-4 py-3 flex items-center gap-4"
                style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none" }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: 11, color: RM.ink3, width: 40 }}
                >
                  #{a.id.toString().padStart(4, "0")}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>
                  {a.action.replace(/_/g, " ")}
                </span>
                {a.targetUserId && (
                  <span className="font-mono" style={{ fontSize: 12, color: RM.ink2 }}>
                    user · {profiles[a.targetUserId]?.displayName ?? users[a.targetUserId]?.email ?? a.targetUserId.slice(0, 6)}
                  </span>
                )}
                {a.targetGroupId && (
                  <span className="font-mono" style={{ fontSize: 12, color: RM.ink2 }}>
                    group · {a.targetGroupId.slice(0, 6)}
                  </span>
                )}
                {a.metadata && (
                  <span className="text-xs italic" style={{ color: RM.ink3 }}>
                    {JSON.stringify(a.metadata)}
                  </span>
                )}
                <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                  by {profiles[a.adminId]?.displayName ?? users[a.adminId]?.email ?? a.adminId.slice(0, 6)}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
