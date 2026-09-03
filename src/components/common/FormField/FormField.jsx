import "./FormField.css";

const FormField = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = "",
}) => {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-field__label" htmlFor={htmlFor}>
          {label}

          {required && (
            <span className="form-field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="form-field__control">
        {children}
      </div>

      {error && (
        <span className="form-field__error">
          {error}
        </span>
      )}

      {!error && hint && (
        <span className="form-field__hint">
          {hint}
        </span>
      )}
    </div>
  );
};

export default FormField;