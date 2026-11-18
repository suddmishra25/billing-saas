/** Backend origin without trailing slash — set VITE_API_ORIGIN in Vercel (e.g. https://your-api.onrender.com) */
const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "http://localhost:8080").replace(/\/$/, "");

export const API_BASE = `${API_ORIGIN}/api/v1.0`;
export const SAAS_BASE = `${API_ORIGIN}/saas`;
export const ADMIN_BASE = `${API_ORIGIN}/admin`;
export const ORDERS_BASE = `${API_ORIGIN}/orders`;
export const PAYMENTS_BASE = `${API_ORIGIN}/payments`;

export const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});