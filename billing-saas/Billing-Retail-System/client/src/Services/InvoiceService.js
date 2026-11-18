import axios from "axios";
import {API_BASE, authHeaders} from "../util/api.js";

export const createInvoice = async (invoice) => {
    return await axios.post(`${API_BASE}/invoices`, invoice, {headers: authHeaders()});
};

export const fetchInvoices = async () => {
    return await axios.get(`${API_BASE}/invoices`, {headers: authHeaders()});
};

export const fetchSalesReport = async ({financialYear, clientId} = {}) => {
    const params = {};
    if (financialYear) params.financialYear = financialYear;
    if (clientId) params.clientId = clientId;
    return await axios.get(`${API_BASE}/invoices/reports/sales`, {
        headers: authHeaders(),
        params,
    });
};

export const fetchInvoiceById = async (invoiceId) => {
    return await axios.get(`${API_BASE}/invoices/${invoiceId}`, {headers: authHeaders()});
};

export const updateInvoicePayment = async (invoiceId, payload) => {
    return await axios.patch(`${API_BASE}/invoices/${invoiceId}/payment`, payload, {
        headers: authHeaders(),
    });
};

export const updateInvoice = async (invoiceId, payload) => {
    return await axios.put(`${API_BASE}/invoices/${invoiceId}`, payload, {
        headers: authHeaders(),
    });
};
