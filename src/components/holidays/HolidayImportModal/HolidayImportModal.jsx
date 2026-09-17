
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";

import Button from "../../common/Button/Button";
import "./HolidayImportModal.css";

const IGNITE_FIELDS = [
  {
    key: "name",
    label: "Holiday Name",
    required: true,
  },
  {
    key: "date",
    label: "Date",
    required: true,
  },
  {
    key: "type",
    label: "Type",
    required: false,
  },
  {
    key: "description",
    label: "Description",
    required: false,
  },
  {
    key: "recurring",
    label: "Recurring",
    required: false,
  },
];

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const HEADER_ALIASES = {
  name: [
    "name",
    "holiday name",
    "holiday",
    "event",
    "event name",
    "holiday title",
  ],
  date: [
    "date",
    "holiday date",
    "event date",
    "start date",
  ],
  type: [
    "type",
    "holiday type",
    "category",
    "holiday category",
  ],
  description: [
    "description",
    "notes",
    "note",
    "remarks",
    "details",
  ],
  recurring: [
    "recurring",
    "is recurring",
    "repeat",
    "annual",
    "yearly",
  ],
};

const autoMapColumns = (headers) => {
  const mapping = {};

  IGNITE_FIELDS.forEach((field) => {
    const aliases = HEADER_ALIASES[field.key] || [];

    const matchedHeader = headers.find((header) =>
      aliases.includes(normalizeHeader(header))
    );

    mapping[field.key] = matchedHeader || "";
  });

  return mapping;
};

const parseCSVLine = (line) => {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
};

const parseCSV = (text) => {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("The CSV file does not contain any holiday rows.");
  }

  const headers = parseCSVLine(lines[0]);

  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);

    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });

  return { headers, rows };
};

const normalizeBoolean = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  return ["yes", "true", "1", "y", "annual", "yearly"].includes(normalized);
};

const normalizeDate = (value) => {
  const raw = String(value || "").trim();

  if (!raw) return "";

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

const getDayName = (date) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleDateString("en-IN", {
    weekday: "long",
  });
};

const HolidayImportModal = ({ existingHolidays = [], onImport, onClose }) => {
  const [step, setStep] = useState("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const text = String(loadEvent.target.result || "");
        const parsed = parseCSV(text);

        if (!parsed.headers.length) {
          throw new Error("No columns were found in the CSV file.");
        }

        setFileName(file.name);
        setHeaders(parsed.headers);
        setRows(parsed.rows);
        setMapping(autoMapColumns(parsed.headers));
        setStep("mapping");
      } catch (parseError) {
        setError(
          parseError.message || "Unable to read this CSV file."
        );
      }
    };

    reader.readAsText(file);
  };

  const mappedRows = useMemo(() => {
    return rows.map((row, index) => {
      const name = String(row[mapping.name] || "").trim();
      const date = normalizeDate(row[mapping.date]);

      const type = mapping.type
        ? String(row[mapping.type] || "").trim()
        : "";

      const description = mapping.description
        ? String(row[mapping.description] || "").trim()
        : "";

      const recurring = mapping.recurring
        ? normalizeBoolean(row[mapping.recurring])
        : false;

      const errors = [];

      if (!name) {
        errors.push("Holiday name is missing");
      }

      if (!date) {
        errors.push("Date is missing or invalid");
      }

      const duplicate = existingHolidays.some(
        (holiday) =>
          holiday.name?.trim().toLowerCase() === name.toLowerCase() &&
          holiday.date === date
      );

      return {
        rowNumber: index + 2,
        name,
        date,
        day: date ? getDayName(date) : "",
        type: type || "Public Holiday",
        description,
        recurring,
        status: "Active",
        errors,
        duplicate,
      };
    });
  }, [rows, mapping, existingHolidays]);

  const validRows = mappedRows.filter(
    (row) => row.errors.length === 0 && !row.duplicate
  );

  const invalidRows = mappedRows.filter(
    (row) => row.errors.length > 0
  );

  const duplicateRows = mappedRows.filter(
    (row) => row.errors.length === 0 && row.duplicate
  );

  const missingRequiredMapping =
    !mapping.name || !mapping.date;

  const handleImport = () => {
    if (!validRows.length) return;

    onImport(validRows);
  };

  const updateMapping = (field, value) => {
    setMapping((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="holiday-import-overlay">
      <div className="holiday-import-modal">
        <div className="holiday-import-header">
          <div>
            <span className="holiday-import-eyebrow">
              Holiday Calendar
            </span>

            <h2>Import Holidays</h2>

            <p>
              Upload your company's CSV and map its columns to Ignite.
            </p>
          </div>

          <button
            type="button"
            className="holiday-import-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="holiday-import-steps">
          <div className={step === "upload" ? "active" : "completed"}>
            <span>1</span>
            Upload
          </div>

          <ChevronRight size={15} />

          <div className={step === "mapping" ? "active" : "completed"}>
            <span>2</span>
            Map Columns
          </div>

          <ChevronRight size={15} />

          <div className={step === "preview" ? "active" : ""}>
            <span>3</span>
            Preview
          </div>
        </div>

        {error && (
          <div className="holiday-import-error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="holiday-import-upload">
            <div className="holiday-import-upload-icon">
              <FileSpreadsheet size={28} />
            </div>

            <h3>Upload your CSV file</h3>

            <p>
              Your CSV can use any column names or column order.
              Ignite will help you map them.
            </p>

            <label className="holiday-import-upload-button">
              <Upload size={16} />
              Choose CSV File
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
              />
            </label>

            <div className="holiday-import-required">
              <strong>Required:</strong> Holiday Name and Date
            </div>

            <div className="holiday-import-supported">
              Optional: Type, Description, Recurring
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="holiday-import-content">
            <div className="holiday-import-file">
              <FileSpreadsheet size={18} />
              <div>
                <strong>{fileName}</strong>
                <span>{rows.length} rows found</span>
              </div>
            </div>

            <div className="holiday-import-info">
              Match the columns from your CSV with the fields used by
              Ignite.
            </div>

            <div className="holiday-import-mapping">
              {IGNITE_FIELDS.map((field) => (
                <div className="holiday-import-mapping-row" key={field.key}>
                  <div>
                    <strong>{field.label}</strong>
                    {field.required && <span>Required</span>}
                  </div>

                  <select
                    value={mapping[field.key] || ""}
                    onChange={(event) =>
                      updateMapping(field.key, event.target.value)
                    }
                  >
                    <option value="">Not available</option>

                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {missingRequiredMapping && (
              <div className="holiday-import-warning">
                <AlertCircle size={16} />
                Please map both Holiday Name and Date before continuing.
              </div>
            )}

            <div className="holiday-import-actions">
              <Button variant="secondary" onClick={() => setStep("upload")}>
                Back
              </Button>

              <Button
                variant="primary"
                disabled={missingRequiredMapping}
                onClick={() => setStep("preview")}
              >
                Preview Import
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="holiday-import-content">
            <div className="holiday-import-summary">
              <div>
                <CheckCircle2 size={17} />
                <strong>{validRows.length}</strong>
                <span>Ready to import</span>
              </div>

              <div>
                <AlertCircle size={17} />
                <strong>{invalidRows.length}</strong>
                <span>Invalid rows</span>
              </div>

              <div>
                <AlertCircle size={17} />
                <strong>{duplicateRows.length}</strong>
                <span>Duplicates</span>
              </div>
            </div>

            <div className="holiday-import-preview">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Holiday</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {mappedRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>{row.name || "—"}</td>
                      <td>{row.date || "—"}</td>
                      <td>{row.type}</td>
                      <td>
                        {row.errors.length > 0 ? (
                          <span className="import-status invalid">
                            {row.errors[0]}
                          </span>
                        ) : row.duplicate ? (
                          <span className="import-status duplicate">
                            Duplicate
                          </span>
                        ) : (
                          <span className="import-status valid">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="holiday-import-actions">
              <Button variant="secondary" onClick={() => setStep("mapping")}>
                Back
              </Button>

              <Button
                variant="primary"
                disabled={!validRows.length}
                onClick={handleImport}
              >
                Import {validRows.length} Holidays
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayImportModal;
