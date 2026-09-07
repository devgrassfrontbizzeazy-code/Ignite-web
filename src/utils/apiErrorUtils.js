/**
 * Extract and format errors from API responses.
 *
 * Handles:
 * - DRF field-level errors (e.g., { "field_name": ["error message"] })
 * - Non-field errors (e.g., { "non_field_errors": ["error"] })
 * - Detail/message fields
 * - HTTP status codes
 * - Network errors
 */

/**
 * Map backend field names to frontend field names
 */
const FIELD_NAME_MAP = {
  // Department field mapping
  department_code: "departmentCode",
  name: "departmentName", // For departments
  description: "description",
  status: "status",
  is_active: "isActive",
  
  // Designation field mapping
  designation_code: "designationCode",
  // "name" already mapped above, but context determines if it's designation name
  department: "departmentId",
};

/**
 * Extract field errors from backend response
 * Handles DRF format: { "field": ["error 1", "error 2"], ... }
 *
 * @param {Object} data - The response data object
 * @returns {Object} - { fieldName: "First error message", ... }
 */
const extractFieldErrors = (data) => {
  if (!data || typeof data !== "object") {
    return {};
  }

  const fieldErrors = {};

  // Look for field-level errors (DRF format)
  for (const [key, value] of Object.entries(data)) {
    // Skip known non-field error keys
    if (
      key === "detail" ||
      key === "message" ||
      key === "non_field_errors"
    ) {
      continue;
    }

    // Handle array of errors
    if (Array.isArray(value) && value.length > 0) {
      const frontendFieldName = FIELD_NAME_MAP[key] || key;
      fieldErrors[frontendFieldName] = value[0]; // Use first error
    }
  }

  return fieldErrors;
};

/**
 * Extract a general error message from backend response
 * Priority:
 * 1. non_field_errors (first item)
 * 2. detail
 * 3. message
 *
 * @param {Object} data - The response data object
 * @returns {string} - The error message or empty string
 */
const extractGeneralError = (data) => {
  if (!data || typeof data !== "object") {
    return "";
  }

  // non_field_errors
  if (
    Array.isArray(data.non_field_errors) &&
    data.non_field_errors.length > 0
  ) {
    return data.non_field_errors[0];
  }

  // detail
  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  // message
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return "";
};

/**
 * Get a user-friendly message for an HTTP status code
 *
 * @param {number} status - HTTP status code
 * @returns {string} - Friendly error message
 */
const getStatusCodeMessage = (status) => {
  switch (status) {
    case 400:
      return "Please check the entered information and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The resource could not be found. It may have been removed.";
    case 409:
      return "This conflicts with an existing record. Please check the entered details.";
    case 422:
      return "Some of the entered information is invalid. Please check the highlighted fields.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Something went wrong on the server. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "The server is temporarily unavailable. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
};

/**
 * Handle a DELETE-specific 404 error with context
 * @param {string} type - "department" or "designation"
 * @returns {string}
 */
const getDeleteNotFoundMessage = (type) => {
  return `This ${type} could not be found. It may have already been deleted.`;
};

/**
 * Handle a DELETE-specific 403 error with context
 * @param {string} type - "department" or "designation"
 * @returns {string}
 */
const getDeleteForbiddenMessage = (type) => {
  return `You do not have permission to delete this ${type}.`;
};

/**
 * Handle a DELETE-specific 409 error with context
 * @param {string} type - "department" or "designation"
 * @returns {string}
 */
const getDeleteConflictMessage = (type) => {
  return `This ${type} cannot be deleted because it is currently being used.`;
};

/**
 * Extract all error information from an Axios error
 *
 * @param {Error} error - Axios error object
 * @param {Object} options - { context: "department|designation", action: "create|update|delete|toggle|load" }
 * @returns {Object} - { fieldErrors: {...}, generalError: "..." }
 */
const extractApiError = (error, options = {}) => {
  const { context = "item", action = "save" } = options;

  const result = {
    fieldErrors: {},
    generalError: "",
  };

  // Handle response errors (4xx, 5xx)
  if (error.response) {
    const { status, data } = error.response;

    // Extract field-level errors first
    result.fieldErrors = extractFieldErrors(data);

    // If we have field errors, don't override with general error
    if (Object.keys(result.fieldErrors).length > 0) {
      result.generalError = extractGeneralError(data);
      return result;
    }

    // No field errors, look for general error
    result.generalError = extractGeneralError(data);

    // If still no error, use status-code-based message
    if (!result.generalError) {
      // Special handling for delete operations
      if (action === "delete") {
        if (status === 404) {
          result.generalError = getDeleteNotFoundMessage(context);
        } else if (status === 403) {
          result.generalError = getDeleteForbiddenMessage(context);
        } else if (status === 409) {
          result.generalError = getDeleteConflictMessage(context);
        } else {
          result.generalError = getStatusCodeMessage(status);
        }
      } else {
        result.generalError = getStatusCodeMessage(status);
      }
    }

    return result;
  }

  // Handle network errors
  if (error.request) {
    result.generalError =
      "Unable to connect to the server. Please check your internet connection and try again.";
    return result;
  }

  // Handle timeout errors
  if (error.code === "ECONNABORTED") {
    result.generalError =
      "The request took too long. Please try again.";
    return result;
  }

  // Generic fallback
  result.generalError = "Something went wrong. Please try again.";
  return result;
};

export {
  extractApiError,
  extractFieldErrors,
  extractGeneralError,
  getStatusCodeMessage,
  getDeleteNotFoundMessage,
  getDeleteForbiddenMessage,
  getDeleteConflictMessage,
};
