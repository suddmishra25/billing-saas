import axios from "axios";

const SAAS_BASE = "http://localhost:8080/saas";

const saasHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const fetchTenants = async () => {
    return await axios.get(`${SAAS_BASE}/tenants`, {headers: saasHeaders()});
};

export const fetchTenant = async (tenantId) => {
    return await axios.get(`${SAAS_BASE}/tenants/${tenantId}`, {headers: saasHeaders()});
};

export const createTenant = async (payload) => {
    return await axios.post(`${SAAS_BASE}/tenants`, payload, {headers: saasHeaders()});
};

export const updateTenant = async (tenantId, payload) => {
    return await axios.put(`${SAAS_BASE}/tenants/${tenantId}`, payload, {headers: saasHeaders()});
};

export const deleteTenant = async (tenantId) => {
    return await axios.delete(`${SAAS_BASE}/tenants/${tenantId}`, {headers: saasHeaders()});
};

export const uploadTenantHeaderForSaas = async (tenantId, file) => {
    const form = new FormData();
    form.append("file", file);
    return await axios.post(`${SAAS_BASE}/tenants/${tenantId}/header`, form, {
        headers: saasHeaders(),
    });
};

export const uploadTenantHeaderBannerForSaas = async (tenantId, file) => {
    const form = new FormData();
    form.append("file", file);
    return await axios.post(`${SAAS_BASE}/tenants/${tenantId}/header-banner`, form, {
        headers: saasHeaders(),
    });
};

export const uploadTenantSignatureForSaas = async (tenantId, file) => {
    const form = new FormData();
    form.append("file", file);
    return await axios.post(`${SAAS_BASE}/tenants/${tenantId}/signature`, form, {
        headers: saasHeaders(),
    });
};
