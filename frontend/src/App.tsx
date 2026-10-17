import { Link, Navigate, Route, Routes } from "react-router-dom";
import SubmissionCreate from "./views/SubmissionCreate";
import SubmissionDetail from "./views/SubmissionDetail";
import SubmissionList from "./views/SubmissionList";

export default function App() {
  return (
    <section className="section">
      <div className="container">
        <header className="level">
          <div className="level-left">
            <h1 className="title">Intake Triage</h1>
          </div>
          <div className="level-right buttons">
            <Link className="button" to="/submissions">
              All submissions
            </Link>
            <Link className="button is-primary" to="/submissions/new">
              New submission
            </Link>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/submissions" replace />} />
          <Route path="/submissions" element={<SubmissionList />} />
          <Route path="/submissions/new" element={<SubmissionCreate />} />
          <Route path="/submissions/:id" element={<SubmissionDetail />} />
        </Routes>
      </div>
    </section>
  );
}
