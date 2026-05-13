"use client";

import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { Wordmark } from "@/components/ui/Wordmark";
import { RM } from "@/lib/tokens";

export default function PrivacyPage() {
  return (
    <MobileShell>
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" style={{ color: RM.ink2, fontSize: 14 }}>
          &larr; Back
        </Link>
        <Wordmark size={18} />
        <span style={{ width: 24 }} />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <h1 className="font-serif" style={{ fontSize: 32, letterSpacing: -0.6, lineHeight: 1.1 }}>
          Privacy policy
        </h1>
        <p className="mt-2" style={{ fontSize: 13, color: RM.ink3 }}>
          Effective May 2026 · DPDPA 2023 (India) compliant.
        </p>

        <Section heading="What we collect">
          <P>
            <b>Identity</b> — your IITKGP email, JEE / admission roll number, allotted hall (LBS or
            SNVH), and a copy of your hall allotment slip. We collect these to verify you are an
            admitted fresher.
          </P>
          <P>
            <b>Profile</b> — only what you choose to add: display name, photo, branch, hometown,
            languages, sleep schedule, food preference, cleanliness, social score, bio, hobbies, and
            an optional Instagram handle. You can edit or delete any of this at any time.
          </P>
          <P>
            <b>Activity</b> — requests you send / receive, group memberships, chat messages, swipes,
            blocks, and reports. These are stored to make the matching service work.
          </P>
        </Section>

        <Section heading="What we don't collect">
          <ul style={ul}>
            <li>Phone numbers (unless you share them in chat with someone)</li>
            <li>Bank or payment details — roomiss is free</li>
            <li>Location, device fingerprints, advertising IDs</li>
            <li>Third-party analytics or behavioural ad data</li>
          </ul>
        </Section>

        <Section heading="Who can see your data">
          <P>
            Other <b>verified students in your hall</b> see your public profile, lifestyle prefs and
            display name when they discover or chat with you. They never see your slip, legal name,
            email, or roll numbers.
          </P>
          <P>
            <b>Group members</b> see each other&rsquo;s Instagram handle and full chat history once
            grouped. New joiners see prior messages — you&rsquo;ll be warned before they join.
          </P>
          <P>
            <b>Admins / verifiers</b> see everything required to review verification slips, resolve
            reports, and act on safety issues. Every admin action is logged in an append-only audit
            trail.
          </P>
        </Section>

        <Section heading="How long we keep it">
          <ul style={ul}>
            <li>Verification slips: 90 days after your account is approved, then deleted.</li>
            <li>Chats: archived 30 days after institute allotment; deleted 90 days after.</li>
            <li>Deleted accounts: scrubbed publicly within seconds; hard-purged 30 days after.</li>
            <li>All accounts: archived 90 days after allotment; PII purged after 180 days.</li>
          </ul>
        </Section>

        <Section heading="Your rights (DPDPA §6, §11, §12)">
          <ul style={ul}>
            <li>
              <b>Access</b> — download a JSON of everything we hold on you from{" "}
              <Link href="/api/export" style={{ textDecoration: "underline" }}>
                /api/export
              </Link>
              .
            </li>
            <li>
              <b>Correct</b> — edit your profile at any time from{" "}
              <Link href="/onboarding/profile" style={{ textDecoration: "underline" }}>
                Edit profile
              </Link>
              .
            </li>
            <li>
              <b>Erase</b> — Schedule account deletion from{" "}
              <Link href="/settings" style={{ textDecoration: "underline" }}>
                Settings
              </Link>
              . 30-day grace, then permanent.
            </li>
            <li>
              <b>Grievance</b> — email <a href="mailto:privacy@roomiss.in" style={{ textDecoration: "underline" }}>privacy@roomiss.in</a>.
              We respond within 7 days per DPDPA timeline.
            </li>
          </ul>
        </Section>

        <Section heading="Data Protection Officer">
          <P>
            <b>Aanya Pradhan</b> — privacy@roomiss.in
            <br />
            Hall office, IIT Kharagpur · West Bengal 721302 · India
          </P>
        </Section>

        <Section heading="Changes to this policy">
          <P>
            We&rsquo;ll surface a banner in-app at least 14 days before any material change.
            Continued use after that window counts as acceptance per DPDPA §6.
          </P>
        </Section>

        <p
          className="text-center mt-8 font-mono"
          style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.3 }}
        >
          See also: <Link href="/terms" style={{ textDecoration: "underline" }}>Terms of service</Link>
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
      <h2
        className="font-serif"
        style={{ fontSize: 20, letterSpacing: -0.3, marginBottom: 8 }}
      >
        {heading}
      </h2>
      {children}
    </div>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 14.5,
        color: RM.ink2,
        lineHeight: 1.6,
        margin: "0 0 10px",
      }}
    >
      {children}
    </p>
  );
}
