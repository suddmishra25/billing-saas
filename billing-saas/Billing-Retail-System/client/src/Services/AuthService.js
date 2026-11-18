import axios from "axios";
import {API_BASE, authHeaders} from "../util/api.js";

export const login = async (data) => {
    return await axios.post(`${API_BASE}/login`, data);
};

export const changePassword = async (payload) => {
    return await axios.post(`${API_BASE}/auth/change-password`, payload, {
        headers: authHeaders(),
    });
};
