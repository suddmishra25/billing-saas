import axios from "axios";
import {ADMIN_BASE, authHeaders} from "../util/api.js";

export const addUser = async (user) => {
    return await axios.post(`${ADMIN_BASE}/register`, user, {headers: authHeaders()});
};

export const deleteUser = async (id) => {
    return await axios.delete(`${ADMIN_BASE}/users/${id}`, {headers: authHeaders()});
};

export const fetchUsers = async () => {
    return await axios.get(`${ADMIN_BASE}/users`, {headers: authHeaders()});
};