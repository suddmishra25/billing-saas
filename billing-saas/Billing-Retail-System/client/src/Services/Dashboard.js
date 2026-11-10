import axios from "axios";
import {API_BASE, authHeaders} from "../util/api.js";

export const fetchDashboardData = async (page = 0, size = 10) => {
    return await axios.get(`${API_BASE}/dashboard`, {
        headers: authHeaders(),
        params: {page, size},
    });
};
