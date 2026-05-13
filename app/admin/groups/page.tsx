"use client";

import { AdminTopBar } from "@/components/admin/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { HallPill, StatusPill } from "@/components/ui/Pills";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";

export default function AdminGroupsPage() {
  const groups = useRoomiss((s) => Object.values(s.groups));
  const profiles = useRoomiss((s) => s.profiles);

  return (
    <>
      <AdminTopBar
        title="Groups"
        sub={`${groups.filter((g) => g.status === "partial").length} partial · ${groups.filter((g) => g.status === "locked").length} locked · ${groups.filter((g) => g.status === "dissolved").length} dissolved`}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <table className="w-full" style={{ fontSize: 14 }}>
            <thead>
              <tr style={{ background: RM.surface2 }}>
                <Th>Group</Th>
                <Th>Hall</Th>
                <Th>Members</Th>
                <Th>Size</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} style={{ borderTop: `1px solid ${RM.hairline}` }}>
                  <Td>
                    <span className="font-mono" style={{ fontSize: 12, color: RM.ink3 }}>
                      {g.id.slice(0, 6)}…
                    </span>
                  </Td>
                  <Td>
                    <HallPill hall={g.hall} />
                  </Td>
                  <Td>
                    <div className="flex items-center -space-x-2">
                      {g.memberIds.slice(0, 4).map((id) => {
                        const p = profiles[id];
                        return (
                          <Avatar
                            key={id}
                            name={p?.displayName ?? id}
                            hall={g.hall}
                            size={28}
                          />
                        );
                      })}
                    </div>
                  </Td>
                  <Td>
                    {g.size}/{g.finalSize}
                  </Td>
                  <Td>
                    <StatusPill
                      tone={g.status === "locked" ? "locked" : g.status === "partial" ? "pending" : "neutral"}
                      dot={false}
                    >
                      {g.status}
                    </StatusPill>
                  </Td>
                  <Td>
                    <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                      {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
