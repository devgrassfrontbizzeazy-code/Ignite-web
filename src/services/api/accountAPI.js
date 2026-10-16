import api from "./axios";

// Helper: unwrap DRF response (list, paginated, or nested data)
export const unwrapList = (response) => {
    const data = response?.data ?? response;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.results)) return data.data.results;
    return [];
};

const getAllPages = async (url, params = {}) => {
    const results = [];
    let pageParams = params;
    const visitedPages = new Set();

    while (true) {
        const response = await api.get(url, { params: pageParams });
        const payload = response?.data?.data ?? response?.data;
        const pageResults = Array.isArray(payload)
            ? payload
            : payload?.results ?? payload?.data?.results ?? payload?.data;

        if (!Array.isArray(pageResults)) {
            throw new Error(`Unexpected list response while loading ${url}.`);
        }
        results.push(...pageResults);

        const next = response?.data?.next ?? payload?.next ?? payload?.data?.next;
        if (!next) return results;

        const nextParams = Object.fromEntries(
            new URL(next, window.location.origin).searchParams.entries()
        );
        const pageKey = JSON.stringify(nextParams);
        if (visitedPages.has(pageKey)) {
            throw new Error(`Pagination loop detected while loading ${url}.`);
        }
        visitedPages.add(pageKey);
        pageParams = nextParams;
    }
};

// Helper: download Blob response
export const triggerBlobDownload = (blobData, defaultFilename = "download.pdf") => {
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

// -------------------------------------------------------------
// Payroll Settings (/account/payroll-settings/)
// -------------------------------------------------------------
export const getPayrollSettings = async () => {
    const response = await api.get("/account/payroll-settings/");
    return response.data;
};

export const createPayrollSettings = async (data) => {
    const response = await api.post("/account/payroll-settings/", data);
    return response.data;
};

export const updatePayrollSettings = async (data) => {
    const response = await api.put("/account/payroll-settings/", data);
    return response.data;
};

export const patchPayrollSettings = async (data) => {
    const response = await api.patch("/account/payroll-settings/", data);
    return response.data;
};

// -------------------------------------------------------------
// Salary Components (/account/salary-components/)
// -------------------------------------------------------------
export const getSalaryComponents = async (params = {}) => {
    return getAllPages("/account/salary-components/", params);
};

export const getSalaryComponent = async (id) => {
    const response = await api.get(`/account/salary-components/${id}/`);
    return response.data;
};

export const createSalaryComponent = async (data) => {
    const response = await api.post("/account/salary-components/", data);
    return response.data;
};

export const updateSalaryComponent = async (id, data) => {
    const response = await api.put(`/account/salary-components/${id}/`, data);
    return response.data;
};

export const patchSalaryComponent = async (id, data) => {
    const response = await api.patch(`/account/salary-components/${id}/`, data);
    return response.data;
};

export const deleteSalaryComponent = async (id) => {
    const response = await api.delete(`/account/salary-components/${id}/`);
    return response.data;
};

// -------------------------------------------------------------
// Salary Structures (/account/salary-structures/)
// -------------------------------------------------------------
export const getSalaryStructures = async (params = {}) => {
    return getAllPages("/account/salary-structures/", params);
};

export const getSalaryStructure = async (id) => {
    const response = await api.get(`/account/salary-structures/${id}/`);
    return response.data;
};

export const createSalaryStructure = async (data) => {
    const response = await api.post("/account/salary-structures/", data);
    return response.data;
};

export const updateSalaryStructure = async (id, data) => {
    const response = await api.put(`/account/salary-structures/${id}/`, data);
    return response.data;
};

export const patchSalaryStructure = async (id, data) => {
    const response = await api.patch(`/account/salary-structures/${id}/`, data);
    return response.data;
};

export const deleteSalaryStructure = async (id) => {
    const response = await api.delete(`/account/salary-structures/${id}/`);
    return response.data;
};

export const bulkAssignSalaryTemplate = async (data) => {
    const response = await api.post("/account/salary-structures/bulk-assign/", data);
    return response.data;
};

export const importSalaryStructures = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/account/salary-structures/import/", formData);
    return response.data;
};

export const exportSalaryStructures = async (params = {}) => {
    const response = await api.get("/account/salary-structures/export/", {
        params,
        responseType: "blob",
    });
    return response.data;
};

// -------------------------------------------------------------
// Salary Templates (/account/salary-templates/)
// -------------------------------------------------------------
export const getSalaryTemplates = async (params = {}) => {
    return getAllPages("/account/salary-templates/", params);
};

export const getSalaryTemplate = async (id) => {
    const response = await api.get(`/account/salary-templates/${id}/`);
    return response.data;
};

export const createSalaryTemplate = async (data) => {
    const response = await api.post("/account/salary-templates/", data);
    return response.data;
};

export const updateSalaryTemplate = async (id, data) => {
    const response = await api.put(`/account/salary-templates/${id}/`, data);
    return response.data;
};

export const patchSalaryTemplate = async (id, data) => {
    const response = await api.patch(`/account/salary-templates/${id}/`, data);
    return response.data;
};

export const deleteSalaryTemplate = async (id) => {
    const response = await api.delete(`/account/salary-templates/${id}/`);
    return response.data;
};

// -------------------------------------------------------------
// Payroll Processing & Calculations (/account/payroll/...)
// -------------------------------------------------------------
export const calculatePayroll = async (payloadOrParams) => {
    const response = await api.post("/account/payroll/calculate/", payloadOrParams);
    return response.data;
};

// -------------------------------------------------------------
// Payroll Drafts & Lifecycle (/account/payroll/drafts/)
// -------------------------------------------------------------
export const getPayrollDrafts = async (params = {}) => {
    return getAllPages("/account/payroll/drafts/", params);
};

export const getPayrollDraft = async (id) => {
    const response = await api.get(`/account/payroll/drafts/${id}/`);
    return response.data;
};

export const createPayrollDraft = async (data) => {
    const response = await api.post("/account/payroll/drafts/", data);
    return response.data;
};

export const updatePayrollDraft = async (id, data) => {
    const response = await api.put(`/account/payroll/drafts/${id}/`, data);
    return response.data;
};

export const patchPayrollDraft = async (id, data) => {
    const response = await api.patch(`/account/payroll/drafts/${id}/`, data);
    return response.data;
};

export const adjustPayrollRecord = async (id, recordId, data) => {
    const response = await api.patch(
        `/account/payroll/drafts/${id}/adjust-record/${recordId}/`,
        data
    );
    return response.data;
};

export const approvePayrollDraft = async (id) => {
    const response = await api.post(`/account/payroll/drafts/${id}/approve/`);
    return response.data;
};

export const cancelPayrollRun = async (id, data = {}) => {
    const response = await api.post(`/account/payroll/drafts/${id}/cancel/`, data);
    return response.data;
};

export const finalizePayrollRun = async (id) => {
    const response = await api.post(`/account/payroll/drafts/${id}/finalize/`);
    return response.data;
};

export const lockPayrollRun = async (id) => {
    const response = await api.post(`/account/payroll/drafts/${id}/lock/`);
    return response.data;
};

export const recalculatePayrollDraft = async (id) => {
    const response = await api.post(`/account/payroll/drafts/${id}/recalculate/`);
    return response.data;
};

export const exportPayrollRun = async (id) => {
    const response = await api.get(`/account/payroll/drafts/${id}/export/`, {
        responseType: "blob",
    });
    return response.data;
};

// -------------------------------------------------------------
// Payslips (/account/payslips/)
// -------------------------------------------------------------
export const getPayslips = async (params = {}) => {
    return getAllPages("/account/payslips/", params);
};

export const getPayslip = async (id) => {
    const response = await api.get(`/account/payslips/${id}/`);
    return response.data;
};

export const downloadPayslip = async (id) => {
    const response = await api.get(`/account/payslips/${id}/download/`, {
        responseType: "blob",
    });
    return response.data;
};
