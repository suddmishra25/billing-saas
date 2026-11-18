import axios from "axios";
import {API_BASE, authHeaders} from "../util/api.js";

export const addCategory = async (category) => {
    return await axios.post(`${API_BASE}/admin/categories`, category, {headers: authHeaders()});
};

export const deleteCategory = async (categoryId) => {
    return await axios.delete(`${API_BASE}/admin/categories/${categoryId}`, {headers: authHeaders()});
};

export const fetchCategories = async () => {
    return await axios.get(`${API_BASE}/categories`, {headers: authHeaders()});
};
