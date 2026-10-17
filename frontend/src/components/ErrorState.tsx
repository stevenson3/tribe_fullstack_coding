interface Props {
  title?: string;
  message: string;
  onRetry?: () => void;
  /** inline notification instead of a full panel */
  compact?: boolean;
}

export default function ErrorState({ title = "Something went wrong", message, onRetry, compact }: Props) {
  const retry = onRetry && (
    <button type="button" className={`button is-danger is-outlined ${compact ? "is-small mt-2" : "mt-3"}`} onClick={onRetry}>
      Try again
    </button>
  );

  if (compact) {
    return (
      <div className="fade-in notification is-danger is-light" role="alert">
        <p>
          <strong>{title}</strong>
        </p>
        <p>{message}</p>
        {retry}
      </div>
    );
  }

  return (
    <div className="fade-in box has-text-centered py-6" role="alert">
      <p className="is-size-1 mb-2">⚠️</p>
      <p className="title is-5 has-text-danger">{title}</p>
      <p className="subtitle is-6 has-text-grey">{message}</p>
      {retry}
    </div>
  );
}
