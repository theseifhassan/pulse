/*
 * Placeholder for the unread feed. The full implementation lands in
 * pulse-my8.13 — this page renders the empty-state copy and the visual
 * shell so the app boots into a complete-feeling state before the data
 * fetching is wired.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="font-serif text-2xl font-semibold text-[color:var(--ink)] sm:text-3xl">
        Nothing new to inspect.
      </h1>
      <p className="max-w-md text-sm text-[color:var(--ink-mute)]">
        Layla will surface things worth your attention here. The unread feed
        view ships in pulse-my8.13.
      </p>
    </div>
  );
}
