import axios from "axios";
import {ORDERS_BASE, authHeaders} from "../util/api.js";

export const latestOrders = async () => {
    return await axios.get(`${ORDERS_BASE}/latest`, {headers: authHeaders()});
};

export const createOrder = async (order) => {
    return await axios.post(`${ORDERS_BASE}`, order, {headers: authHeaders()});
};

export const deleteOrder = async (id) => {
    return await axios.delete(`${ORDERS_BASE}/${id}`, {headers: authHeaders()});
};
