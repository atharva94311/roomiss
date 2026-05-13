/**
 * Root suspense fallback used during route segment transitions. Intentionally
 * minimal so it doesn't visually compete with the per-screen skeletons.
 */
export default function RootLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F7F2E9",
        color: "#85806F",
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 12,
        letterSpacing: 0.4,
      }}
    >
      loading…
    </div>
  );
}
