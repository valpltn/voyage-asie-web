export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}
