import "./Dashboard.css";
import {useCallback, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {fetchDashboardData} from "../../Services/Dashboard.js";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

const money = (value) => {
    const n = Number(value);
    return Number.isNaN(n) ? "0.00" : n.toFixed(2);
};

const monthLabel = () =>
    new Date().toLocaleDateString(undefined, {month: "long", year: "numeric"});

const paymentBadgeClass = (status) => {
    switch (status) {
        case "PAID":
            return "status-paid";
        case "PARTIAL":
            return "status-partial";
        case "CANCELLED":
            return "status-cancelled";
        default:
            return "status-pending";
    }
};

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);

    const loadData = useCallback(async (pageIndex) => {
        setLoading(true);
        try {
            const response = await fetchDashboardData(pageIndex, PAGE_SIZE);
            setData(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Unable to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(page);
    }, [page, loadData]);

    if (loading && !data) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="dashboard-error">Failed to load dashboard data.</div>;
    }

    const canPrev = page > 0;
    const canNext = data.totalPages > 0 && page < data.totalPages - 1;
    const invoices = data.recentInvoices || [];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-currency-rupee" />
                        </div>
                        <div className="stat-content">
                            <h3>Month sales ({monthLabel()})</h3>
                            <p>₹{money(data.monthSales)}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-receipt" />
                        </div>
                        <div className="stat-content">
                            <h3>Invoices this month</h3>
                            <p>{data.monthInvoiceCount ?? 0}</p>
                        </div>
                    </div>
                </div>

                <div className="recent-orders-card">
                    <div className="recent-orders-header">
                        <h3 className="recent-orders-title">
                            <i className="bi bi-clock-history" />
                            Recent invoices
                        </h3>
                        <div className="dashboard-pagination">
                            <span className="pagination-meta">
                                Page {data.currentPage + 1} of {Math.max(data.totalPages, 1)}
                                {" · "}
                                {data.totalElements} total
                            </span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-light"
                                disabled={!canPrev || loading}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-warning"
                                disabled={!canNext || loading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="orders-table-container">
                        {invoices.length === 0 ? (
                            <p className="text-muted mb-0">No invoices yet.</p>
                        ) : (
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.invoiceId}>
                                            <td>
                                                <Link
                                                    to={`/invoices/${invoice.invoiceId}`}
                                                    className="invoice-dashboard-link"
                                                >
                                                    {invoice.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td>{invoice.clientName || "—"}</td>
                                            <td>₹{money(invoice.grandTotal)}</td>
                                            <td>
                                                <span
                                                    className={`payment-method ${
                                                        invoice.paymentMethod
                                                            ? invoice.paymentMethod.toLowerCase()
                                                            : ""
                                                    }`}
                                                >
                                                    {invoice.paymentMethod || "—"}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge ${paymentBadgeClass(
                                                        invoice.paymentStatus
                                                    )}`}
                                                >
                                                    {invoice.paymentStatus || "PENDING"}
                                                </span>
                                            </td>
                                            <td>{invoice.invoiceDate || "—"}</td>
                                            <td>
                                                <Link
                                                    to={`/invoices/${invoice.invoiceId}`}
                                                    className="btn btn-sm btn-outline-warning"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
