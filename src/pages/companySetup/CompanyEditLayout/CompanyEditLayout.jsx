import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./CompanyEditLayout.css";

export default function CompanyEditLayout({
  eyebrow,
  title,
  description,
  children,
  onSubmit,
  submitting = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="company-edit-page">

      <div className="company-edit-page__header">

        <button
          type="button"
          className="company-edit-page__back"
          onClick={() => navigate("/organization-overview")}
        >
          <ArrowLeft size={16} />
          Back to Organization
        </button>

        <span className="company-edit-page__eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

      </div>


      <form
        className="company-edit-page__form"
        onSubmit={onSubmit}
      >
        <div className="company-edit-page__card">
          {children}
        </div>

        <div className="company-edit-page__actions">

          <button
            type="button"
            className="company-edit-page__cancel"
            onClick={() =>
              navigate("/organization-overview")
            }
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="company-edit-page__save"
            disabled={submitting}
          >
            {submitting
              ? "Saving Changes..."
              : "Save Changes"}
          </button>

        </div>
      </form>

    </div>
  );
}