import axios from "axios";
import {API_BASE, authHeaders} from "../util/api.js";

export const addItem = async (item) => {
    return await axios.post(`${API_BASE}/items`, item, {headers: authHeaders()});
};

export const updateItem = async (itemId, clientId, item) => {
    return await axios.put(`${API_BASE}/items/${itemId}/client/${clientId}`, item, {
        headers: authHeaders(),
    });
};

export const deleteItem = async (itemId, clientId) => {
    return await axios.delete(`${API_BASE}/items/${itemId}/client/${clientId}`, {
        headers: authHeaders(),
    });
};

export const fetchItems = async () => {
    return await axios.get(`${API_BASE}/items`, {headers: authHeaders()});
};

export const fetchClientItems = async (clientId) => {
    return await axios.get(`${API_BASE}/items/client/${clientId}`, {headers: authHeaders()});
};
