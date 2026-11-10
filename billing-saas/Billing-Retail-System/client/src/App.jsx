import Menubar from "./components/Menubar/Menubar.jsx";
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import ManageCategory from "./pages/ManageCategory/ManageCategory.jsx";
import ManageUsers from "./pages/ManageUsers/ManageUsers.jsx";
import ManageItems from "./pages/ManageItems/ManageItems.jsx";
import Explore from "./pages/Explore/Explore.jsx";
import {Toaster} from "react-hot-toast";
import Login from "./pages/Login/Login.jsx";
import OrderHistory from "./pages/OrderHistory/OrderHistory.jsx";
import CreateInvoice from "./pages/CreateInvoice/CreateInvoice.jsx";
import ManageClients from "./pages/ManageClients/ManageClients.jsx";
import InvoiceDetail from "./pages/InvoiceDetail/InvoiceDetail.jsx";
import InvoiceHistory from "./pages/InvoiceHistory/InvoiceHistory.jsx";
import SalesReports from "./pages/SalesReports/SalesReports.jsx";
import VoiceInvoice from "./pages/VoiceInvoice/VoiceInvoice.jsx";
import ChallanInvoice from "./pages/ChallanInvoice/ChallanInvoice.jsx";
import InvoiceBranding from "./pages/InvoiceBranding/InvoiceBranding.jsx";
import {useContext} from "react";
import {AppContext} from "./context/AppContext.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";
import AppFooter from "./components/AppFooter/AppFooter.jsx";
import PasswordChangeGate from "./components/PasswordChangeGate.jsx";
import ManageTenants from "./pages/ManageTenants/ManageTenants.jsx";
import ChangePassword from "./pages/ChangePassword/ChangePassword.jsx";
import "./App.css";

const App = () => {
    const location = useLocation();
    const {auth} = useContext(AppContext);

    const homePath =
        auth.role === "SUPER_ADMIN" ? "/saas/tenants" : "/dashboard";

    const LoginRoute = ({element}) => {
        if (auth.token) {
            if (localStorage.getItem("mustChangePassword") === "true") {
                return <Navigate to="/change-password" replace />;
            }
            return <Navigate to={homePath} replace />;
        }
        return element;
    }

    const ProtectedRoute = ({element, allowedRoles}) => {
        if (!auth.token) {
            return <Navigate to="/login" replace />;
        }

        if (allowedRoles && !allowedRoles.includes(auth.role)) {
            return <Navigate to={homePath} replace />;
        }

        return element;
    }

    const TenantAppRoute = ({element, allowedRoles}) => {
        if (!auth.token) {
            return <Navigate to="/login" replace />;
        }
        if (auth.role === "SUPER_ADMIN") {
            return <Navigate to="/saas/tenants" replace />;
        }
        if (allowedRoles && !allowedRoles.includes(auth.role)) {
            return <Navigate to="/dashboard" replace />;
        }
        return element;
    }

    const isTenantStaff =
        auth.role === "TENANT_ADMIN" || auth.role === "USER";

    const showChrome =
        location.pathname !== "/login" &&
        location.pathname !== "/" &&
        location.pathname !== "/change-password";

    return (
        <div className="app-shell">
            {showChrome && <Menubar />}
            <Toaster />
            <main className="app-main">
            <PasswordChangeGate>
            <Routes>
                <Route
                    path="/dashboard"
                    element={
                        auth.role === "SUPER_ADMIN" ? (
                            <Navigate to="/saas/tenants" replace />
                        ) : (
                            <Dashboard />
                        )
                    }
                />
                <Route
                    path="/explore"
                    element={
                        auth.role === "SUPER_ADMIN" ? (
                            <Navigate to="/saas/tenants" replace />
                        ) : isTenantStaff ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Explore />
                        )
                    }
                />
                {/*Admin only routes*/}
                <Route path="/category" element={<ProtectedRoute element={<ManageCategory />} allowedRoles={['ROLE_ADMIN']} />} />
                <Route path="/users" element={<ProtectedRoute element={<ManageUsers />} allowedRoles={["ROLE_ADMIN"]} />} />
                <Route
                    path="/items"
                    element={
                        <TenantAppRoute
                            element={<ManageItems />}
                            allowedRoles={["ROLE_ADMIN", "TENANT_ADMIN", "USER"]}
                        />
                    }
                />
                <Route
                    path="/clients"
                    element={<TenantAppRoute element={<ManageClients />} allowedRoles={["TENANT_ADMIN", "USER"]} />}
                />

                <Route path="/login" element={<LoginRoute element={<Login />} />} />
                <Route
                    path="/orders"
                    element={
                        auth.role === "SUPER_ADMIN" ? (
                            <Navigate to="/saas/tenants" replace />
                        ) : isTenantStaff ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <OrderHistory />
                        )
                    }
                />
                <Route path="/invoices/new" element={<TenantAppRoute element={<CreateInvoice />} />} />
                <Route path="/invoices/voice" element={<TenantAppRoute element={<VoiceInvoice />} />} />
                <Route path="/invoices/challan" element={<TenantAppRoute element={<ChallanInvoice />} />} />
                <Route path="/invoices/:invoiceId/edit" element={<TenantAppRoute element={<CreateInvoice />} />} />
                <Route path="/invoices" element={<TenantAppRoute element={<InvoiceHistory />} />} />
                <Route path="/reports/sales" element={<TenantAppRoute element={<SalesReports />} />} />
                <Route path="/invoices/:invoiceId" element={<TenantAppRoute element={<InvoiceDetail />} />} />
                <Route
                    path="/settings/invoice"
                    element={<TenantAppRoute element={<InvoiceBranding />} allowedRoles={["TENANT_ADMIN", "USER"]} />}
                />
                <Route
                    path="/saas/tenants"
                    element={<ProtectedRoute element={<ManageTenants />} allowedRoles={["SUPER_ADMIN"]} />}
                />
                <Route
                    path="/change-password"
                    element={
                        auth.token ? <ChangePassword /> : <Navigate to="/login" replace />
                    }
                />
                <Route path="/" element={<Login />} />
                <Route path="*" element={<NotFound />} />

            </Routes>
            </PasswordChangeGate>
            </main>
            {showChrome && <AppFooter />}
        </div>
    );
}

export default App;
