import axios from "axios";
import {API_BASE, authHeaders} from "../util/api.js";

export const fetchClients = async () => {
    return await axios.get(`${API_BASE}/clients`, {headers: authHeaders()});
};

export const createClient = async (client) => {
    return await axios.post(`${API_BASE}/clients`, client, {headers: authHeaders()});
};

export const updateClient = async (clientId, client) => {
    return await axios.put(`${API_BASE}/clients/${clientId}`, client, {headers: authHeaders()});
};

export const deleteClient = async (clientId) => {
    return await axios.delete(`${API_BASE}/clients/${clientId}`, {headers: authHeaders()});
};
