import "./InvoiceDetail.css";
import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import toast from "react-hot-toast";
import {fetchInvoiceById, updateInvoicePayment} from "../../Services/InvoiceService.js";
import {amountInWords} from "../../util/amountInWords.js";

const money = (value) => {
    if (value === null || value === undefined) return "0.00";
    const n = Number(value);
    return Number.isNaN(n) ? "0.00" : n.toFixed(2);
};

const moneyPlain = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return "0.00";
    const s = money(value);
    return s.endsWith(".00") ? s.slice(0, -3) : s;
};

const formatDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y) return iso;
    return `${d}-${m}-${y}`;
};

const dash = (v) => (v === null || v === undefined || v === "" ? "" : v);

const normalizeAddressText = (raw) =>
    (raw || "")
        .trim()
        .replace(/,\s*,+/g, ", ")
        .replace(/\s+/g, " ");

const twoLineFromText = (raw) => {
    if (!raw?.trim()) return {line1: "", line2: ""};
    const parts = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
        return {line1: parts[0], line2: parts.slice(1).join(", ")};
    }
    return {line1: parts[0], line2: ""};
};

/** Split long comma-separated addresses (e.g. Jaibalaji: estate line 1, K.T. Park / Vasai line 2). */
const splitCommaAddress = (raw) => {
    const text = normalizeAddressText(raw);
    if (!text) return {line1: "", line2: ""};

    const ktSplit = text.match(/^(.+?),\s*((?:K\.?\s*T\.?).+)$/i);
    if (ktSplit) {
        const line1 = ktSplit[1].trim();
        return {
            line1: line1.endsWith(",") ? line1 : `${line1},`,
            line2: ktSplit[2].trim(),
        };
    }

    const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 4) {
        const mid = Math.ceil(parts.length / 2);
        const line1 = parts.slice(0, mid).join(", ");
        return {
            line1: line1.endsWith(",") ? line1 : `${line1},`,
            line2: parts.slice(mid).join(", "),
        };
    }

    return {line1: text, line2: ""};
};

/** Street on line 1; city, state, pin — or split when all stored in one address field. */
const resolveAddressLines = (street, city, state, pin) => {
    const line2FromParts = [city, state, pin].filter(Boolean).join(", ");
    const line1 = street?.trim() || "";
    if (line2FromParts) {
        return {line1, line2: line2FromParts};
    }
    const fromNewline = twoLineFromText(street);
    if (fromNewline.line2) {
        return fromNewline;
    }
    return splitCommaAddress(street);
};

const lineGross = (item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    return qty * rate;
};

/** Minimum line rows in the goods table (item rows + empty fillers before totals). */
const MIN_LINE_ITEM_ROWS = 7;

const InvoiceDetail = () => {
    const {invoiceId} = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState("PENDING");
    const [amountPaid, setAmountPaid] = useState("0");
    const [savingPayment, setSavingPayment] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchInvoiceById(invoiceId);
            setInvoice(res.data);
            setPaymentStatus(res.data.paymentStatus || "PENDING");
            setAmountPaid(String(res.data.amountPaid ?? "0"));
        } catch (e) {
            console.error(e);
            toast.error("Invoice not found");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (invoiceId) load();
    }, [invoiceId]);

    const branding = invoice?.branding || {};
    const sellerName = invoice?.sellerName || branding.companyName || "";
    const sellerAddress = invoice?.sellerAddress || branding.address || "";
    const sellerCity = invoice?.sellerCity || branding.city || "";
    const sellerState = invoice?.sellerState || branding.state || "";
    const sellerPin = invoice?.sellerPincode || branding.pincode || "";
    const sellerGst = invoice?.sellerGstin || branding.gstin || "";

    const grandTotalNum = Number(invoice?.grandTotal) || 0;
    const roundedGrand = Math.round(grandTotalNum);

    const {cgstPct, sgstPct} = useMemo(() => {
        const items = invoice?.items || [];
        if (!items.length) {
            return {cgstPct: "0", sgstPct: "0"};
        }
        const first = items[0];
        let cgst = first.cgstRate != null ? Number(first.cgstRate) : NaN;
        let sgst = first.sgstRate != null ? Number(first.sgstRate) : NaN;
        if (Number.isNaN(cgst) && first.gstRate != null) {
            cgst = Number(first.gstRate) / 2;
        }
        if (Number.isNaN(sgst) && first.gstRate != null) {
            sgst = Number(first.gstRate) / 2;
        }
        const fmt = (n) => (Number.isNaN(n) ? "0" : String(n).replace(/\.0$/, ""));
        return {cgstPct: fmt(cgst), sgstPct: fmt(sgst)};
    }, [invoice]);

    const onPrint = () => {
        document.body.classList.add("print-invoice");
        const cleanup = () => {
            document.body.classList.remove("print-invoice");
            window.removeEventListener("afterprint", cleanup);
        };
        window.addEventListener("afterprint", cleanup);
        window.print();
    };

    const onSavePayment = async () => {
        setSavingPayment(true);
        try {
            const payload = {paymentStatus};
            if (paymentStatus === "PARTIAL") {
                payload.amountPaid = Number(amountPaid);
            }
            const res = await updateInvoicePayment(invoiceId, payload);
            setInvoice(res.data);
            setPaymentStatus(res.data.paymentStatus);
            setAmountPaid(String(res.data.amountPaid ?? "0"));
            toast.success("Payment status updated");
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || "Could not update payment");
        } finally {
            setSavingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="invoice-detail-container text-light p-4">
                <p>Loading invoice…</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="invoice-detail-container text-light p-4">
                <p>Invoice could not be loaded.</p>
                <Link to="/invoices/new" className="btn btn-warning btn-sm">
                    Create invoice
                </Link>
            </div>
        );
    }

    const declaration =
        branding.declarationText ||
        "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";

    const terms =
        branding.termsAndConditions ||
        "1. Subject to local jurisdiction.\n2. Goods once sold will not be taken back.\n3. Delivery as per schedule.\n4. Interest may apply on overdue payments.";

    const phone = branding.phoneNumber || invoice.sellerPhone;
    const email = branding.email || invoice.sellerEmail;
    const website = branding.website;
    const companyNameColor = branding.companyNameColor || "#CC0000";
    const taglineColor = branding.taglineColor || "#CC0000";

    const contactParts = [];
    if (phone) contactParts.push(`Mob.: ${phone}`);
    if (email) contactParts.push(`email: ${email}`);
    if (website) contactParts.push(website);

    const sellerAddressLines = resolveAddressLines(
        sellerAddress,
        sellerCity,
        sellerState,
        sellerPin
    );
    const sellerAddressOneLine = [
        sellerAddressLines.line1,
        sellerAddressLines.line2,
    ]
        .filter(Boolean)
        .join(sellerAddressLines.line1?.endsWith(",") ? " " : ", ")
        .replace(/\s+/g, " ")
        .trim();
    const buyerAddressLines = (() => {
        const fromText = twoLineFromText(invoice.clientAddress);
        if (fromText.line2) return fromText;
        return splitCommaAddress(invoice.clientAddress);
    })();

    const items = invoice.items || [];
    const fillerCount = Math.max(0, MIN_LINE_ITEM_ROWS - items.length);

    const paymentTerms = invoice.paymentMethod
        ? String(invoice.paymentMethod).replace(/_/g, " ")
        : "";

    return (
        <div className="invoice-detail-container">
            <div className="invoice-detail-actions d-flex flex-wrap gap-2 d-print-none">
                <Link to="/invoices" className="btn btn-secondary btn-sm">
                    Invoice history
                </Link>
                <Link to="/settings/invoice" className="btn btn-secondary btn-sm">
                    Invoice settings
                </Link>
                <Link to="/invoices/new" className="btn btn-secondary btn-sm">
                    New invoice
                </Link>
                <Link to={`/invoices/${invoiceId}/edit`} className="btn btn-secondary btn-sm">
                    Edit invoice
                </Link>
                <button type="button" className="btn btn-warning btn-sm" onClick={onPrint}>
                    Print invoice
                </button>
            </div>

            <div className="invoice-payment-panel d-print-none">
                <div className="d-flex flex-wrap gap-3 align-items-end">
                    <div>
                        <label className="form-label small mb-1">Payment status</label>
                        <select
                            className="form-select form-select-sm"
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                            <option value="PENDING">Unpaid</option>
                            <option value="PARTIAL">Partially paid</option>
                            <option value="PAID">Fully paid</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    {paymentStatus === "PARTIAL" && (
                        <div>
                            <label className="form-label small mb-1">Amount received (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control form-control-sm"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                            />
                        </div>
                    )}
                    <div>
                        <button
                            type="button"
                            className="btn btn-warning btn-sm"
                            disabled={savingPayment}
                            onClick={onSavePayment}
                        >
                            {savingPayment ? "Saving…" : "Update payment"}
                        </button>
                    </div>
                    <div className="ms-auto small">
                        Balance: <strong>₹{money(invoice.balanceAmount)}</strong>
                        <span className="badge ms-2 bg-secondary payment-status-badge">{invoice.paymentStatus}</span>
                    </div>
                </div>
            </div>

            <div className="invoice-paper" id="gst-invoice-print">
                <header className="gst-invoice-header">
                    <h2 className="gst-invoice-title">TAX INVOICE</h2>

                    {branding.headerBannerUrl ? (
                        <img
                            src={branding.headerBannerUrl}
                            alt=""
                            className="gst-invoice-header-banner"
                        />
                    ) : (
                        <>
                            <div
                                className={`gst-brand-banner${
                                    branding.headerImageUrl ? "" : " gst-brand-banner--no-logo"
                                }`}
                            >
                                <div className="gst-brand-side">
                                    {branding.headerImageUrl ? (
                                        <img
                                            src={branding.headerImageUrl}
                                            alt=""
                                            className="gst-invoice-logo"
                                        />
                                    ) : null}
                                </div>
                                <div className="gst-brand-text">
                                    <h1
                                        className="gst-invoice-company"
                                        style={{color: companyNameColor}}
                                    >
                                        {sellerName}
                                    </h1>
                                    {branding.tagline && (
                                        <div
                                            className="gst-invoice-tagline"
                                            style={{color: taglineColor}}
                                        >
                                            {branding.tagline}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(sellerAddressOneLine || contactParts.length > 0) && (
                                <div className="gst-invoice-contact">
                                    {sellerAddressOneLine && (
                                        <div className="gst-invoice-contact-address">
                                            {sellerAddressOneLine}
                                        </div>
                                    )}
                                    {contactParts.length > 0 && (
                                        <div className="gst-invoice-contact-line">
                                            {contactParts.join(" | ")}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </header>

                <div className="gst-sheet">
                    {/* Supplier / invoice meta */}
                    <table>
                        <tbody>
                            <tr>
                                <td className="gst-meta-left">
                                    <strong>{sellerName}</strong>
                                    <br />
                                    {sellerAddressLines.line1}
                                    {sellerAddressLines.line1 && sellerAddressLines.line2 && <br />}
                                    {sellerAddressLines.line2}
                                    {sellerGst && (
                                        <>
                                            <br />
                                            <strong>GSTIN/UIN :</strong> {sellerGst}
                                        </>
                                    )}
                                    {sellerState && (
                                        <>
                                            <br />
                                            <strong>State Name :</strong> {sellerState}
                                        </>
                                    )}
                                </td>
                                <td className="gst-meta-right">
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>Bill No.</td>
                                                <td>{invoice.invoiceNumber}</td>
                                            </tr>
                                            <tr>
                                                <td>Dated</td>
                                                <td>{formatDate(invoice.invoiceDate)}</td>
                                            </tr>
                                            <tr>
                                                <td>P.O. No.</td>
                                                <td>{dash(invoice.purchaseOrderNumber)}</td>
                                            </tr>
                                            <tr>
                                                <td>Mode/Terms of Payment</td>
                                                <td>{dash(paymentTerms)}</td>
                                            </tr>
                                            <tr>
                                                <td>Supplier&apos;s Ref.</td>
                                                <td>{dash(invoice.referenceNumber)}</td>
                                            </tr>
                                            <tr>
                                                <td>Other Reference(s)</td>
                                                <td>{dash(invoice.notes)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td className="gst-meta-left">
                                    <span className="gst-section-label">Buyer</span>
                                    <strong>{invoice.clientName}</strong>
                                    <br />
                                    {buyerAddressLines.line1}
                                    {buyerAddressLines.line1 && buyerAddressLines.line2 && <br />}
                                    {buyerAddressLines.line2}
                                    {invoice.clientGst && (
                                        <>
                                            {(buyerAddressLines.line1 || buyerAddressLines.line2) && (
                                                <br />
                                            )}
                                            <strong>GSTIN/UIN :</strong> {invoice.clientGst}
                                        </>
                                    )}
                                </td>
                                <td className="gst-meta-right">
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>Challan No.</td>
                                                <td>{dash(invoice.challanNumber)}</td>
                                            </tr>
                                            <tr>
                                                <td>Dated</td>
                                                <td>{dash(invoice.challanDated)}</td>
                                            </tr>
                                            <tr>
                                                <td>Despatch Document No.</td>
                                                <td>{dash(invoice.eWayBillNumber)}</td>
                                            </tr>
                                            <tr>
                                                <td>Destination</td>
                                                <td>{dash(invoice.placeOfSupply)}</td>
                                            </tr>
                                            <tr>
                                                <td>Bill of Lading/LR-RR No.</td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td>Motor Vehicle No.</td>
                                                <td>{dash(invoice.vehicleNumber)}</td>
                                            </tr>
                                            <tr>
                                                <td>Terms of Delivery</td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Line items + totals (single table) */}
                    <table className="gst-lines">
                        <thead>
                            <tr>
                                <th className="col-sr">Sr No.</th>
                                <th>Description of Goods</th>
                                <th className="col-hsn">HSN/SAC</th>
                                <th className="col-qty">Quantity (pcs)</th>
                                <th className="col-rate">Rate per piece (in Rs.)</th>
                                <th className="col-amt">Amount (in Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="center">{idx + 1}.</td>
                                    <td className="desc">
                                        {item.name}
                                        {item.description ? ` ${item.description}` : ""}
                                    </td>
                                    <td className="center">{item.hsnCode || ""}</td>
                                    <td className="num center">{item.quantity ?? ""}</td>
                                    <td className="num">{money(item.rate)}</td>
                                    <td className="num">{money(lineGross(item))}</td>
                                </tr>
                            ))}
                            {Array.from({length: fillerCount}).map((_, i) => (
                                <tr key={`f-${i}`} className="filler">
                                    <td>&nbsp;</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            ))}
                            <tr className="summary">
                                <td colSpan={5} className="summary-label">
                                    Total
                                </td>
                                <td className="num">{moneyPlain(invoice.subtotal)}</td>
                            </tr>
                            <tr className="summary">
                                <td colSpan={5} className="summary-label">
                                    CGST {cgstPct}%
                                </td>
                                <td className="num">{money(invoice.cgst)}</td>
                            </tr>
                            <tr className="summary">
                                <td colSpan={5} className="summary-label">
                                    SGST {sgstPct}%
                                </td>
                                <td className="num">{money(invoice.sgst)}</td>
                            </tr>
                            <tr className="summary">
                                <td colSpan={5} className="summary-label">
                                    Total (gst inclusive)
                                </td>
                                <td className="num">{money(invoice.grandTotal)}</td>
                            </tr>
                            <tr className="summary grand-total">
                                <td colSpan={5} className="summary-label">
                                    Grand Total
                                </td>
                                <td className="num">{roundedGrand}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table>
                        <tbody>
                            <tr className="gst-words-row">
                                <td colSpan={6}>
                                    <strong>Amount Chargeable (in words):</strong> Indian Rupees{" "}
                                    {amountInWords(roundedGrand)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="gst-declaration">{declaration}</div>
                </div>

                <div className="gst-invoice-footer-block gst-sheet">
                    <table className="gst-footer-table">
                        <tbody>
                            <tr className="gst-footer-top">
                                <td className="gst-footer-terms">
                                    <strong>Terms &amp; Conditions</strong>
                                    <pre>{terms}</pre>
                                </td>
                                <td className="gst-footer-right">
                                    <div className="gst-bank-title">Company&apos;s Bank Details</div>
                                    <div className="gst-bank-lines">
                                        <div>
                                            <strong>Bank&apos;s Name :</strong> {dash(branding.bankName)}
                                        </div>
                                        <div>
                                            <strong>A/c No. :</strong> {dash(branding.bankAccountNumber)}
                                        </div>
                                        <div>
                                            <strong>Branch &amp; IFS Code :</strong>{" "}
                                            {[branding.bankBranch, branding.bankIfsc].filter(Boolean).join(", ") ||
                                                ""}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="gst-footer-sign-row">
                                <td className="gst-footer-customer-sign">
                                    <div className="gst-sign-cell">
                                        <strong>Customer&apos;s Seal and Signature</strong>
                                        <div className="gst-sign-area" aria-hidden="true" />
                                    </div>
                                </td>
                                <td className="gst-footer-auth-sign">
                                    <div className="gst-sign-cell gst-sign-cell--auth">
                                        <div className="gst-auth-for">
                                            for <strong>{sellerName}</strong>
                                        </div>
                                        <div className="gst-sign-area gst-sign-area--auth">
                                            {branding.signatureImageUrl && (
                                                <img src={branding.signatureImageUrl} alt="Signatory" />
                                            )}
                                        </div>
                                        <div className="gst-auth-label">
                                            <strong>Authorised Signatory</strong>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetail;
