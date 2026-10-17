export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fade-in has-text-centered py-6" role="status">
      <div className="is-flex is-justify-content-center mb-3">
        <div className="loader is-large" />
      </div>
      <p className="has-text-grey">{label}</p>
    </div>
  );
}
