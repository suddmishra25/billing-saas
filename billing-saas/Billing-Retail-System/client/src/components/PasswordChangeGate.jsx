import {Navigate, useLocation} from "react-router-dom";

const PasswordChangeGate = ({children}) => {
    const location = useLocation();
    const mustChange = localStorage.getItem("mustChangePassword") === "true";
    const token = localStorage.getItem("token");

    if (token && mustChange && location.pathname !== "/change-password") {
        return <Navigate to="/change-password" replace />;
    }

    if (location.pathname === "/change-password" && token && !mustChange) {
        const home = localStorage.getItem("role") === "SUPER_ADMIN" ? "/saas/tenants" : "/dashboard";
        return <Navigate to={home} replace />;
    }

    return children;
};

export default PasswordChangeGate;
