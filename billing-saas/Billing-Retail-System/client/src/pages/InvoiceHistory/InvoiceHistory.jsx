import "./InvoiceHistory.css";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {fetchInvoices} from "../../Services/InvoiceService.js";

const money = (value) => {
    if (value === null || value === undefined) return "—";
    const n = Number(value);
    return Number.isNaN(n) ? "—" : n.toFixed(2);
};

const paymentBadgeClass = (status) => {
    switch (status) {
        case "PAID":
            return "bg-success";
        case "PARTIAL":
            return "bg-info text-dark";
        case "CANCELLED":
            return "bg-secondary";
        default:
            return "bg-warning text-dark";
    }
};

const InvoiceHistory = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const response = await fetchInvoices();
                setInvoices(response.data || []);
            } catch (e) {
                console.error(e);
                setError("Could not load invoices");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const formatItems = (items) => {
        if (!items?.length) return "—";
        return items.map((item) => item.name || item.itemId).join(", ");
    };

    if (loading) {
        return (
            <div className="invoice-history-container text-light text-center py-4">
                Loading invoices…
            </div>
        );
    }

    if (error) {
        return (
            <div className="invoice-history-container text-light text-center py-4">
                {error}
            </div>
        );
    }

    return (
        <div className="invoice-history-container">
            <div className="invoice-history-header">
                <h2>Invoice history</h2>
                <Link to="/invoices/new" className="btn btn-warning btn-sm">
                    Create invoice
                </Link>
            </div>

            {invoices.length === 0 ? (
                <div className="text-light text-center py-4">
                    No invoices yet.{" "}
                    <Link to="/invoices/new" className="invoice-link">
                        Create your first invoice
                    </Link>
                </div>
            ) : (
                <div className="invoice-history-table-wrap table-responsive">
                    <table className="table table-dark table-striped table-hover mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Grand total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody className="text-light">
                            {invoices.map((invoice) => (
                                <tr key={invoice.invoiceId}>
                                    <td>
                                        <Link
                                            to={`/invoices/${invoice.invoiceId}`}
                                            className="invoice-link"
                                        >
                                            {invoice.invoiceNumber}
                                        </Link>
                                    </td>
                                    <td>
                                        {invoice.clientName || "—"}
                                        <br />
                                        <small className="text-muted">
                                            {invoice.clientPhone || invoice.clientEmail || ""}
                                        </small>
                                    </td>
                                    <td className="small">{formatItems(invoice.items)}</td>
                                    <td>₹{money(invoice.grandTotal)}</td>
                                    <td>{invoice.paymentMethod || "—"}</td>
                                    <td>
                                        <span
                                            className={`badge ${paymentBadgeClass(invoice.paymentStatus)}`}
                                        >
                                            {invoice.paymentStatus || "PENDING"}
                                        </span>
                                    </td>
                                    <td>{invoice.invoiceDate || "—"}</td>
                                    <td className="text-nowrap">
                                        <Link
                                            to={`/invoices/${invoice.invoiceId}`}
                                            className="btn btn-outline-warning btn-sm me-1"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            to={`/invoices/${invoice.invoiceId}/edit`}
                                            className="btn btn-outline-light btn-sm"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InvoiceHistory;
