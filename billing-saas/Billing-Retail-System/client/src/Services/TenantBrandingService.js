import axios from "axios";
import {API_BASE, authHeaders} from "../util/api.js";

export const fetchTenantBranding = async () => {
    return await axios.get(`${API_BASE}/tenant/branding`, {headers: authHeaders()});
};

export const updateTenantBranding = async (payload) => {
    return await axios.put(`${API_BASE}/tenant/branding`, payload, {headers: authHeaders()});
};

export const uploadTenantHeader = async (file) => {
    const form = new FormData();
    form.append("file", file);
    return await axios.post(`${API_BASE}/tenant/branding/header`, form, {
        headers: authHeaders(),
    });
};

export const uploadTenantSignature = async (file) => {
    const form = new FormData();
    form.append("file", file);
    return await axios.post(`${API_BASE}/tenant/branding/signature`, form, {
        headers: authHeaders(),
    });
};
