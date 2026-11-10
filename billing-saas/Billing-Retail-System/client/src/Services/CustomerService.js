import axios from "axios";

const SAAS_BASE = "http://localhost:8080/saas";

export const fetchCustomers = async () => {
    return await axios.get(`${SAAS_BASE}/customers`, {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
    });
};

export const createCustomer = async (customer) => {
    return await axios.post(`${SAAS_BASE}/customers`, customer, {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
    });
};
