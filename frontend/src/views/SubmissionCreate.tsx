import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createSubmission } from "../api";
import ErrorState from "../components/ErrorState";
import { INDUSTRIES, type IndustryCode } from "../industries";

export default function SubmissionCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [industry, setIndustry] = useState<IndustryCode>(INDUSTRIES[0].value);
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await createSubmission({
        title,
        description,
        // datetime-local is browser-local time; send an unambiguous UTC instant
        start_datetime: new Date(start).toISOString(),
        end_datetime: new Date(end).toISOString(),
        industry,
        budget_range: budget,
      });
      navigate(`/submissions/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form className="box" onSubmit={onSubmit}>
      <h2 className="title is-4">New submission</h2>
      {error && <ErrorState compact title="Couldn't save your submission" message={error} />}

      <div className="field">
        <label className="label" htmlFor="title">Title</label>
        <div className="control">
          <input id="title" className="input" required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="description">Description</label>
        <div className="control">
          <textarea id="description" className="textarea" required value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="start">Start</label>
        <div className="control">
          <input id="start" className="input" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="end">End</label>
        <div className="control">
          <input id="end" className="input" type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="industry">Industry</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value as IndustryCode)}>
              {INDUSTRIES.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="budget">Budget range</label>
        <div className="control">
          <input
            id="budget"
            className="input"
            required
            maxLength={64}
            placeholder="e.g. $50k-$100k"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
      </div>
      <button type="submit" className={`button is-primary${saving ? " is-loading" : ""}`} disabled={saving}>
        Create
      </button>
    </form>
  );
}
