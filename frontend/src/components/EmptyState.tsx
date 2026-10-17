import type { ReactNode } from "react";

interface Props {
  title: string;
  message?: string;
  /** e.g. a call-to-action button */
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({ title, message, action, compact }: Props) {
  return (
    <div className={`fade-in box has-text-centered ${compact ? "py-4" : "py-6"}`}>
      {!compact && <p className="is-size-1 mb-2">📭</p>}
      <p className="title is-5">{title}</p>
      {message && <p className="subtitle is-6 has-text-grey">{message}</p>}
      {action}
    </div>
  );
}
