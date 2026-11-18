import "./SalesReports.css";
import {useCallback, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import toast from "react-hot-toast";
import {fetchSalesReport} from "../../Services/InvoiceService.js";
import {currentFinancialYear} from "../../util/financialYear.js";

const money = (value) => {
    if (value === null || value === undefined) return "0.00";
    const n = Number(value);
    return Number.isNaN(n) ? "0.00" : n.toFixed(2);
};

const formatDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = String(iso).split("-");
    if (!y) return iso;
    return `${d}-${m}-${y}`;
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

const SalesReports = () => {
    const [financialYear, setFinancialYear] = useState("");
    const [clientId, setClientId] = useState("");
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchSalesReport({
                financialYear: financialYear || undefined,
                clientId: clientId || undefined,
            });
            setReport(res.data);
            if (!financialYear && res.data.financialYear) {
                setFinancialYear(res.data.financialYear);
            }
        } catch (e) {
            console.error(e);
            toast.error("Could not load sales report");
        } finally {
            setLoading(false);
        }
    }, [financialYear, clientId]);

    useEffect(() => {
        load();
    }, [load]);

    const fyOptions = report?.availableFinancialYears?.length
        ? report.availableFinancialYears
        : [currentFinancialYear()];

    const onFyChange = (e) => {
        setFinancialYear(e.target.value);
        setClientId("");
    };

    const onClientFilter = (id) => {
        setClientId((prev) => (prev === id ? "" : id));
    };

    const summary = report?.summary;

    return (
        <div className="sales-reports-page text-light">
            <div className="sales-reports-header">
                <div>
                    <h2 className="text-warning mb-1">Sales &amp; invoices</h2>
                    <p className="text-white-50 small mb-0">
                        Invoices and turnover by financial year (Apr–Mar) and client. Cancelled bills are
                        excluded from sales totals.
                    </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <Link to="/invoices" className="btn btn-secondary btn-sm">
                        Invoice list
                    </Link>
                    <Link to="/invoices/new" className="btn btn-warning btn-sm">
                        New invoice
                    </Link>
                </div>
            </div>

            <div className="sales-reports-filters">
                <div>
                    <label className="d-block">Financial year</label>
                    <select
                        className="form-select form-select-sm"
                        value={financialYear || report?.financialYear || ""}
                        onChange={onFyChange}
                    >
                        {fyOptions.map((fy) => (
                            <option key={fy} value={fy}>
                                FY {fy}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="d-block">Client</label>
                    <select
                        className="form-select form-select-sm"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    >
                        <option value="">All clients</option>
                        {(report?.salesByClient || []).map((c) => (
                            <option key={c.clientId} value={c.clientId}>
                                {c.clientName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <p className="text-white-50">Loading report…</p>
            ) : (
                <>
                    {summary && (
                        <div className="sales-summary-grid">
                            <div className="sales-summary-card">
                                <div className="label">Invoices</div>
                                <div className="value">{summary.invoiceCount}</div>
                            </div>
                            <div className="sales-summary-card">
                                <div className="label">Total sales</div>
                                <div className="value">₹{money(summary.totalSales)}</div>
                            </div>
                            <div className="sales-summary-card">
                                <div className="label">GST / tax</div>
                                <div className="value">₹{money(summary.totalTax)}</div>
                            </div>
                            <div className="sales-summary-card">
                                <div className="label">Received</div>
                                <div className="value">₹{money(summary.amountReceived)}</div>
                            </div>
                            <div className="sales-summary-card">
                                <div className="label">Outstanding</div>
                                <div className="value">₹{money(summary.outstanding)}</div>
                            </div>
                            <div className="sales-summary-card">
                                <div className="label">Cancelled</div>
                                <div className="value text-white-50">{summary.cancelledCount}</div>
                            </div>
                        </div>
                    )}

                    <div className="sales-reports-section">
                        <h5>Sales by client — FY {report?.financialYear}</h5>
                        {!report?.salesByClient?.length ? (
                            <p className="text-muted">No billed sales in this year.</p>
                        ) : (
                            <div className="sales-reports-table-wrap">
                                <table className="table table-dark table-sm table-striped sales-reports-table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Client</th>
                                            <th className="text-end">Bills</th>
                                            <th className="text-end">Sales (₹)</th>
                                            <th className="text-end">Tax (₹)</th>
                                            <th className="text-end">Received (₹)</th>
                                            <th className="text-end">Due (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.salesByClient.map((c) => (
                                            <tr
                                                key={c.clientId}
                                                className={`client-row-clickable${
                                                    clientId === c.clientId ? " client-row-active" : ""
                                                }`}
                                                onClick={() => onClientFilter(c.clientId)}
                                                title="Click to filter invoices"
                                            >
                                                <td>{c.clientName}</td>
                                                <td className="text-end">{c.invoiceCount}</td>
                                                <td className="text-end">{money(c.totalSales)}</td>
                                                <td className="text-end">{money(c.totalTax)}</td>
                                                <td className="text-end">{money(c.amountReceived)}</td>
                                                <td className="text-end">{money(c.outstanding)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="sales-reports-section">
                        <h5>
                            Invoices
                            {clientId &&
                                report?.salesByClient?.find((c) => c.clientId === clientId)?.clientName && (
                                    <span className="text-white-50 fs-6 ms-2">
                                        —{" "}
                                        {
                                            report.salesByClient.find((c) => c.clientId === clientId)
                                                .clientName
                                        }
                                    </span>
                                )}
                        </h5>
                        {!report?.invoices?.length ? (
                            <p className="text-muted">No invoices match these filters.</p>
                        ) : (
                            <div className="sales-reports-table-wrap">
                                <table className="table table-dark table-sm table-hover sales-reports-table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Bill no.</th>
                                            <th>Date</th>
                                            <th>Client</th>
                                            <th className="text-end">Amount (₹)</th>
                                            <th className="text-end">Tax (₹)</th>
                                            <th>Payment</th>
                                            <th className="text-end">Balance (₹)</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.invoices.map((inv) => (
                                            <tr key={inv.invoiceId}>
                                                <td>{inv.invoiceNumber}</td>
                                                <td>{formatDate(inv.invoiceDate)}</td>
                                                <td>{inv.clientName}</td>
                                                <td className="text-end">{money(inv.grandTotal)}</td>
                                                <td className="text-end">{money(inv.totalTax)}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${paymentBadgeClass(inv.paymentStatus)}`}
                                                    >
                                                        {inv.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="text-end">{money(inv.balanceAmount)}</td>
                                                <td>
                                                    <Link
                                                        to={`/invoices/${inv.invoiceId}`}
                                                        className="btn btn-outline-warning btn-sm"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <p className="text-white-50 small border-top border-secondary pt-3">
                        <strong className="text-warning">Useful next steps:</strong> export to Excel, month-wise
                        trend within the FY, HSN-wise tax summary, and ageing of outstanding balances by client.
                    </p>
                </>
            )}
        </div>
    );
};

export default SalesReports;
