export default function Loading() {
  return (
    <main className="page-loading" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>Loading the journal…</span>
    </main>
  );
}
