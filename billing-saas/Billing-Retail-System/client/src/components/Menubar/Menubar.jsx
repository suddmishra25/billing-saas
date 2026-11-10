import './Menubar.css';
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useContext} from "react";
import {AppContext} from "../../context/AppContext.jsx";

const Menubar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {setAuthData, auth} = useContext(AppContext);
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("mustChangePassword");
        setAuthData(null, null);
        navigate("/login");
    }

    const isActive = (path) => {
        return location.pathname === path;
    }

    const isAdmin = auth.role === "ROLE_ADMIN";
    const isSuperAdmin = auth.role === "SUPER_ADMIN";
    const isTenantStaff = auth.role === "TENANT_ADMIN" || auth.role === "USER";

    return (
        <nav className="navbar navbar-expand-lg navbar-dark app-navbar px-2">
            <Link className="navbar-brand app-brand" to={isSuperAdmin ? "/saas/tenants" : "/dashboard"}>
                <span className="app-brand-mark" aria-hidden>
                    <i className="bi bi-receipt-cutoff" />
                </span>
                <span className="app-brand-text">BillFlow</span>
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse p-2" id="navbarNav">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    {isSuperAdmin ? (
                        <li className="nav-item">
                            <Link
                                className={`nav-link ${isActive("/saas/tenants") ? "fw-bold text-warning" : ""}`}
                                to="/saas/tenants"
                            >
                                Manage tenants
                            </Link>
                        </li>
                    ) : (
                        <>
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive("/dashboard") ? "fw-bold text-warning" : ""}`}
                                    to="/dashboard"
                                >
                                    Dashboard
                                </Link>
                            </li>
                            {!isTenantStaff && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${isActive("/explore") ? "fw-bold text-warning" : ""}`}
                                        to="/explore"
                                    >
                                        Explore
                                    </Link>
                                </li>
                            )}
                            {isTenantStaff && (
                                <>
                                    <li className="nav-item">
                                        <Link
                                            className={`nav-link ${isActive("/clients") ? "fw-bold text-warning" : ""}`}
                                            to="/clients"
                                        >
                                            Clients
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link
                                            className={`nav-link ${isActive("/items") ? "fw-bold text-warning" : ""}`}
                                            to="/items"
                                        >
                                            Products
                                        </Link>
                                    </li>
                                </>
                            )}
                            {isAdmin && (
                                <>
                                    <li className="nav-item">
                                        <Link
                                            className={`nav-link ${isActive("/category") ? "fw-bold text-warning" : ""}`}
                                            to="/category"
                                        >
                                            Manage Categories
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link
                                            className={`nav-link ${isActive("/users") ? "fw-bold text-warning" : ""}`}
                                            to="/users"
                                        >
                                            Manage Users
                                        </Link>
                                    </li>
                                </>
                            )}
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${
                                        location.pathname === "/invoices" ||
                                        (location.pathname.startsWith("/invoices/") &&
                                            location.pathname !== "/invoices/voice" &&
                                            location.pathname !== "/invoices/challan" &&
                                            !location.pathname.startsWith("/invoices/new"))
                                            ? "fw-bold text-warning"
                                            : ""
                                    }`}
                                    to="/invoices"
                                >
                                    Invoices
                                </Link>
                            </li>
                            {isTenantStaff && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${
                                            isActive("/invoices/voice") ? "fw-bold text-warning" : ""
                                        }`}
                                        to="/invoices/voice"
                                    >
                                        Voice invoice
                                    </Link>
                                </li>
                            )}
                            {isTenantStaff && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${
                                            isActive("/invoices/challan") ? "fw-bold text-warning" : ""
                                        }`}
                                        to="/invoices/challan"
                                    >
                                        From challan
                                    </Link>
                                </li>
                            )}
                            {isTenantStaff && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${
                                            isActive("/reports/sales") ||
                                            location.pathname.startsWith("/reports/sales")
                                                ? "fw-bold text-warning"
                                                : ""
                                        }`}
                                        to="/reports/sales"
                                    >
                                        Sales reports
                                    </Link>
                                </li>
                            )}
                            {!isTenantStaff && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${isActive("/orders") ? "fw-bold text-warning" : ""}`}
                                        to="/orders"
                                    >
                                        Order History
                                    </Link>
                                </li>
                            )}
                        </>
                    )}
                </ul>
                {/*Add the dropdown for userprofile*/}
                <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
                    <li className="nav-item dropdown">
                        <a
                            href="#"
                            className="nav-link dropdown-toggle d-flex align-items-center py-0"
                            id="navbarDropdown"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <span className="nav-profile-btn" aria-label="Account menu">
                                <i className="bi bi-person-circle" />
                            </span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                            {!isSuperAdmin && (
                                <>
                                    <li>
                                        <Link to="/settings/invoice" className="dropdown-item">
                                            Invoice settings
                                        </Link>
                                    </li>
                                    <li>
                                        <hr className="dropdown-divider" />
                                    </li>
                                </>
                            )}
                            <li>
                                <button type="button" className="dropdown-item" onClick={logout}>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    )
}

export default Menubar;
