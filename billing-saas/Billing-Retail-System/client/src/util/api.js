export const API_BASE = "http://localhost:8080/api/v1.0";

export const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});
