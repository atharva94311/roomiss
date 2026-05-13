"use client";

import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { Wordmark } from "@/components/ui/Wordmark";
import { RM } from "@/lib/tokens";

export default function TermsPage() {
  return (
    <MobileShell>
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" style={{ color: RM.ink2, fontSize: 14 }}>← Back</Link>
        <Wordmark size={18} />
        <span style={{ width: 24 }} />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <h1 className="font-serif" style={{ fontSize: 32, letterSpacing: -0.6, lineHeight: 1.1 }}>
          Terms of service
        </h1>
        <p className="mt-2" style={{ fontSize: 13, color: RM.ink3 }}>
          Plain-English version. Full policy on request.
        </p>

        <Section heading="Who can use roomiss">
          You must be an admitted IITKGP fresher allotted to LBS or SNVH. Verification is mandatory;
          fake slips, duplicate accounts, or impersonation get you banned and reported.
        </Section>
        <Section heading="What you agree to">
          <ul style={ul}>
            <li>Treat everyone with respect — no harassment, slurs, or stalking.</li>
            <li>Don&rsquo;t share other students&rsquo; personal info without consent.</li>
            <li>Don&rsquo;t spam, scam, or sell anything in chat.</li>
            <li>Report what looks wrong — we review every report.</li>
          </ul>
        </Section>
        <Section heading="What roomiss does not guarantee">
          <ul style={ul}>
            <li>
              The institute&rsquo;s official allotment is final. roomiss is a pre-allotment
              coordination tool — it has no authority over actual room assignments.
            </li>
            <li>Matches are not legally binding; behaviour during move-in is on you.</li>
          </ul>
        </Section>
        <Section heading="Liability">
          roomiss is provided as-is by IITKGP volunteers. We aren&rsquo;t liable for disputes
          between students, lost slips, or platform downtime around allotment day.
        </Section>
        <Section heading="Termination">
          Admins can suspend or ban accounts that violate these terms. You can{" "}
          <Link href="/settings" style={{ textDecoration: "underline" }}>delete your account</Link> any time;
          30-day grace, then permanent.
        </Section>
        <p
          className="text-center mt-8 font-mono"
          style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.3 }}
        >
          See also:{" "}
          <Link href="/privacy" style={{ textDecoration: "underline" }}>Privacy policy</Link>
        </p>
      </div>
    </MobileShell>
  );
}

const ul: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  fontSize: 14.5,
  color: RM.ink2,
  lineHeight: 1.6,
};

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <h2 className="font-serif" style={{ fontSize: 20, letterSpacing: -0.3, marginBottom: 8 }}>
        {heading}
      </h2>
      <div style={{ fontSize: 14.5, color: RM.ink2, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
