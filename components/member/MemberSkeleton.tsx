/** Placeholder, než dorazí první snímek z Convexu. */
export function MemberSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div className="h-56 animate-pulse border border-hairline bg-paper-2" />
      <div className="h-40 animate-pulse border border-hairline bg-paper-2" />
      <span className="sr-only">Načítáme členský účet…</span>
    </div>
  );
}
