import axios from "axios";
import {PAYMENTS_BASE, authHeaders} from "../util/api.js";

export const createRazorpayOrder = async (data) => {
    return await axios.post(`${PAYMENTS_BASE}/create-order`, data, {headers: authHeaders()});
};

export const verifyPayment = async (paymentData) => {
    return await axios.post(`${PAYMENTS_BASE}/verify`, paymentData, {headers: authHeaders()});
};