import "./CreateInvoice.css";
import {useEffect, useState} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import toast from "react-hot-toast";
import {createClient, fetchClients} from "../../Services/ClientService.js";
import {fetchClientItems} from "../../Services/ItemService.js";
import {createInvoice, fetchInvoiceById, updateInvoice} from "../../Services/InvoiceService.js";
import {fetchTenantBranding} from "../../Services/TenantBrandingService.js";
import {Link} from "react-router-dom";
import {assertPhoneOptional, phoneValidationMessage, sanitizePhoneInput} from "../../util/phone.js";

const emptyLine = () => ({
    itemId: "",
    quantity: 1,
    rate: "",
    discount: 0,
});

const formatNum = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const n = Number(value);
    return Number.isNaN(n) ? value : n.toFixed(2);
};

const CreateInvoice = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {invoiceId: routeInvoiceId} = useParams();
    const isEdit = Boolean(routeInvoiceId) && location.pathname.endsWith("/edit");

    const [clients, setClients] = useState([]);
    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingInvoice, setLoadingInvoice] = useState(isEdit);
    const [invoiceMeta, setInvoiceMeta] = useState(null);
    const [clientId, setClientId] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [amountPaid, setAmountPaid] = useState("");
    const [notes, setNotes] = useState("");
    const [placeOfSupply, setPlaceOfSupply] = useState("");
    const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [eWayBillNumber, setEWayBillNumber] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [challanNumber, setChallanNumber] = useState("");
    const [challanDated, setChallanDated] = useState("");
    const [lines, setLines] = useState([emptyLine()]);
    const [showNewClient, setShowNewClient] = useState(false);
    const [newClient, setNewClient] = useState({
        name: "",
        phoneNumber: "",
        email: "",
    });
    const [branding, setBranding] = useState(null);
    const [brandingLoading, setBrandingLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setBrandingLoading(true);
            try {
                const res = await fetchTenantBranding();
                setBranding(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setBrandingLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetchClients();
                setClients(res.data || []);
            } catch (e) {
                console.error(e);
                toast.error("Could not load clients");
            }
        })();
    }, []);

    useEffect(() => {
        if (!clientId) {
            setCatalogItems([]);
            setLines([emptyLine()]);
            return;
        }
        (async () => {
            try {
                const res = await fetchClientItems(clientId);
                setCatalogItems(res.data || []);
            } catch (e) {
                console.error(e);
                toast.error("Could not load items for client");
                setCatalogItems([]);
            }
        })();
    }, [clientId]);

    useEffect(() => {
        if (!isEdit || !routeInvoiceId) return;
        (async () => {
            setLoadingInvoice(true);
            try {
                const res = await fetchInvoiceById(routeInvoiceId);
                const inv = res.data;
                setInvoiceMeta({
                    invoiceId: inv.invoiceId,
                    invoiceNumber: inv.invoiceNumber,
                });
                setClientId(inv.clientId || "");
                setInvoiceDate(inv.invoiceDate || "");
                setDueDate(inv.dueDate || "");
                setPaymentMethod(inv.paymentMethod || "");
                setAmountPaid(inv.amountPaid != null ? String(inv.amountPaid) : "");
                setNotes(inv.notes || "");
                setPlaceOfSupply(inv.placeOfSupply || "");
                setPurchaseOrderNumber(inv.purchaseOrderNumber || "");
                setReferenceNumber(inv.referenceNumber || "");
                setEWayBillNumber(inv.eWayBillNumber || "");
                setVehicleNumber(inv.vehicleNumber || "");
                setChallanNumber(inv.challanNumber || "");
                setChallanDated(inv.challanDated || "");
                const mapped =
                    inv.items?.length > 0
                        ? inv.items.map((item) => ({
                              itemId: item.itemId || "",
                              quantity: item.quantity ?? 1,
                              rate: item.rate != null ? String(item.rate) : "",
                              discount: item.discount ?? 0,
                          }))
                        : [emptyLine()];
                setLines(mapped);
            } catch (e) {
                console.error(e);
                toast.error("Could not load invoice");
                navigate("/invoices");
            } finally {
                setLoadingInvoice(false);
            }
        })();
    }, [isEdit, routeInvoiceId, navigate]);

    const updateLine = (index, field, value) => {
        setLines((prev) =>
            prev.map((line, i) => {
                if (i !== index) return line;
                const next = {...line, [field]: value};
                if (field === "itemId") {
                    const item = catalogItems.find((it) => it.itemId === value);
                    if (item?.sellingPrice != null) {
                        next.rate = String(item.sellingPrice);
                    }
                }
                return next;
            })
        );
    };

    const addLine = () => setLines((prev) => [...prev, emptyLine()]);

    const onCreateClient = async (e) => {
        e.preventDefault();
        if (!newClient.name?.trim()) {
            toast.error("Client name is required");
            return;
        }
        try {
            assertPhoneOptional(newClient.phoneNumber);
        } catch {
            toast.error(phoneValidationMessage);
            return;
        }
        try {
            const res = await createClient(newClient);
            if (res.status === 201) {
                const created = res.data;
                setClients((prev) => [...prev, created]);
                setClientId(created.clientId);
                setNewClient({name: "", phoneNumber: "", email: ""});
                setShowNewClient(false);
                toast.success("Client created");
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not create client");
        }
    };

    const removeLine = (index) => {
        if (lines.length === 1) {
            setLines([emptyLine()]);
            return;
        }
        setLines((prev) => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!clientId) {
            toast.error("Select a client");
            return;
        }
        const items = lines
            .filter((l) => l.itemId && Number(l.quantity) > 0)
            .map((l) => ({
                itemId: l.itemId,
                quantity: Number(l.quantity),
                rate: l.rate !== "" ? Number(l.rate) : undefined,
                discount: l.discount !== "" ? Number(l.discount) : 0,
            }));

        if (items.length === 0) {
            toast.error("Add at least one line item");
            return;
        }

        const payload = {
            clientId,
            invoiceDate: invoiceDate || undefined,
            dueDate: dueDate || undefined,
            paymentMethod: paymentMethod || null,
            amountPaid: amountPaid !== "" ? Number(amountPaid) : 0,
            notes: notes || undefined,
            placeOfSupply: placeOfSupply || undefined,
            purchaseOrderNumber: purchaseOrderNumber || undefined,
            referenceNumber: referenceNumber || undefined,
            eWayBillNumber: eWayBillNumber || undefined,
            vehicleNumber: vehicleNumber || undefined,
            challanNumber: challanNumber || undefined,
            challanDated: challanDated || undefined,
            items,
        };

        setLoading(true);
        try {
            if (isEdit && routeInvoiceId) {
                const res = await updateInvoice(routeInvoiceId, payload);
                toast.success("Invoice updated");
                navigate(`/invoices/${res.data.invoiceId}`, {replace: true});
            } else {
                const res = await createInvoice(payload);
                if (res.status === 201) {
                    toast.success("Invoice created");
                    navigate(`/invoices/${res.data.invoiceId}`, {replace: true});
                }
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to create invoice";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loadingInvoice) {
        return (
            <div className="create-invoice-container text-light p-4">
                <p>Loading invoice…</p>
            </div>
        );
    }

    return (
        <div className="create-invoice-container">
            <h2 className="create-invoice-title">{isEdit ? "Edit invoice" : "Create invoice"}</h2>
            {isEdit && invoiceMeta && (
                <p className="text-white-50 small mb-3">
                    Bill no. <strong>{invoiceMeta.invoiceNumber}</strong> · {invoiceMeta.invoiceId}
                </p>
            )}

            <div className="create-invoice-branding-panel card bg-dark border-secondary mb-4">
                <div className="card-body text-light py-3">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-2 flex-wrap">
                        <div>
                            <h6 className="text-warning mb-1">On this invoice</h6>
                            <p className="small text-white-50 mb-0">
                                Seller header, GSTIN, bank details, and signature from your tenant profile.
                            </p>
                        </div>
                        <Link to="/settings/invoice" className="btn btn-sm btn-outline-warning">
                            Edit invoice settings
                        </Link>
                    </div>
                    {brandingLoading ? (
                        <p className="small mb-0">Loading…</p>
                    ) : branding ? (
                        <>
                        {!isEdit && branding.nextBillNumber != null && (
                            <p className="small mb-3">
                                Next bill no.:{" "}
                                <strong>
                                    {branding.billNumberPreview ||
                                        `${branding.nextBillNumber}`}
                                </strong>
                            </p>
                        )}
                        <div className="create-invoice-branding-grid">
                            <div className="create-invoice-branding-main">
                                {branding.headerImageUrl && (
                                    <img src={branding.headerImageUrl} alt="" className="create-invoice-branding-logo" />
                                )}
                                <div>
                                    <strong>{branding.companyName || "—"}</strong>
                                    {branding.gstin && (
                                        <div className="small text-white-50">GSTIN: {branding.gstin}</div>
                                    )}
                                    {(branding.address || branding.city) && (
                                        <div className="small text-white-50">
                                            {[branding.address, branding.city, branding.state, branding.pincode]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="small">
                                <div className="text-white-50 mb-1">Bank</div>
                                {branding.bankName || branding.bankAccountNumber || branding.bankIfsc ? (
                                    <ul className="list-unstyled mb-0">
                                        {branding.bankName && <li>{branding.bankName}</li>}
                                        {branding.bankAccountNumber && <li>A/c: {branding.bankAccountNumber}</li>}
                                        {[branding.bankBranch, branding.bankIfsc].filter(Boolean).length > 0 && (
                                            <li>{[branding.bankBranch, branding.bankIfsc].filter(Boolean).join(" · ")}</li>
                                        )}
                                    </ul>
                                ) : (
                                    <span className="text-white-50">Not set — add under invoice settings.</span>
                                )}
                            </div>
                            {branding.signatureImageUrl && (
                                <img
                                    src={branding.signatureImageUrl}
                                    alt="Signature"
                                    className="create-invoice-branding-sign"
                                />
                            )}
                        </div>
                        </>
                    ) : (
                        <p className="small text-white-50 mb-0">
                            Could not load settings.{" "}
                            <Link to="/settings/invoice">Set up invoice appearance</Link>.
                        </p>
                    )}
                </div>
            </div>

            <div className="mb-3">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setShowNewClient((v) => !v)}
                >
                    {showNewClient ? "Hide" : "Add new client"}
                </button>
            </div>
            {showNewClient && (
                <form onSubmit={onCreateClient} className="card bg-dark border-secondary p-3 mb-4">
                    <div className="row g-2">
                        <div className="col-md-4">
                            <input
                                className="form-control form-control-sm"
                                placeholder="Name"
                                value={newClient.name}
                                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <input
                                type="tel"
                                inputMode="numeric"
                                className="form-control form-control-sm"
                                placeholder="10-digit mobile"
                                value={newClient.phoneNumber}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title={phoneValidationMessage}
                                onChange={(e) =>
                                    setNewClient({
                                        ...newClient,
                                        phoneNumber: sanitizePhoneInput(e.target.value),
                                    })
                                }
                            />
                        </div>
                        <div className="col-md-4">
                            <input
                                type="email"
                                className="form-control form-control-sm"
                                placeholder="Email"
                                value={newClient.email}
                                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                            />
                        </div>
                        <div className="col-12">
                            <button type="submit" className="btn btn-sm btn-warning">
                                Save client
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <form onSubmit={onSubmit}>
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="client">
                            Client
                        </label>
                        <select
                            id="client"
                            className="form-select"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            required
                        >
                            <option value="">— Select client —</option>
                            {clients.map((c) => (
                                <option key={c.clientId} value={c.clientId}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label" htmlFor="invoiceDate">
                            Invoice date
                        </label>
                        <input
                            type="date"
                            id="invoiceDate"
                            className="form-control"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label" htmlFor="dueDate">
                            Due date
                        </label>
                        <input
                            type="date"
                            id="dueDate"
                            className="form-control"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label" htmlFor="paymentMethod">
                            Payment method
                        </label>
                        <select
                            id="paymentMethod"
                            className="form-select"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="">— Optional —</option>
                            <option value="CASH">CASH</option>
                            <option value="UPI">UPI</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label" htmlFor="amountPaid">
                            Amount paid
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            id="amountPaid"
                            className="form-control"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="col-12">
                        <hr className="border-secondary my-1" />
                        <h6 className="text-warning mb-2">Tax invoice details (optional)</h6>
                        <p className="small text-white-50 mb-0">
                            Shown on the printed GST invoice when filled in.
                        </p>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="purchaseOrderNumber">
                            P.O. No.
                        </label>
                        <input
                            type="text"
                            id="purchaseOrderNumber"
                            className="form-control"
                            value={purchaseOrderNumber}
                            onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="referenceNumber">
                            Supplier&apos;s ref.
                        </label>
                        <input
                            type="text"
                            id="referenceNumber"
                            className="form-control"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="notes">
                            Other reference(s)
                        </label>
                        <input
                            type="text"
                            id="notes"
                            className="form-control"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="challanNumber">
                            Challan No.
                        </label>
                        <input
                            type="text"
                            id="challanNumber"
                            className="form-control"
                            placeholder="e.g. 159"
                            value={challanNumber}
                            onChange={(e) => setChallanNumber(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="challanDated">
                            Challan dated
                        </label>
                        <input
                            type="text"
                            id="challanDated"
                            className="form-control"
                            placeholder="e.g. 15-09-2026"
                            value={challanDated}
                            onChange={(e) => setChallanDated(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="eWayBillNumber">
                            Despatch document no.
                        </label>
                        <input
                            type="text"
                            id="eWayBillNumber"
                            className="form-control"
                            value={eWayBillNumber}
                            onChange={(e) => setEWayBillNumber(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="placeOfSupply">
                            Destination
                        </label>
                        <input
                            type="text"
                            id="placeOfSupply"
                            className="form-control"
                            value={placeOfSupply}
                            onChange={(e) => setPlaceOfSupply(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" htmlFor="vehicleNumber">
                            Motor vehicle no.
                        </label>
                        <input
                            type="text"
                            id="vehicleNumber"
                            className="form-control"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                        />
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Line items</h5>
                    <button type="button" className="btn btn-sm btn-outline-warning" onClick={addLine}>
                        Add row
                    </button>
                </div>

                {clientId && catalogItems.length === 0 && (
                    <p className="text-warning small">
                        No products for this client. Add products under Manage Items for this client.
                    </p>
                )}

                <div className="table-responsive line-items-table p-2 mb-4">
                    <table className="table table-dark table-sm mb-0">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style={{width: "100px"}}>Qty</th>
                                <th style={{width: "120px"}}>Rate</th>
                                <th style={{width: "120px"}}>Discount</th>
                                <th style={{width: "48px"}} />
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, index) => (
                                <tr key={index}>
                                    <td>
                                        <select
                                            className="form-select form-select-sm"
                                            value={line.itemId}
                                            onChange={(e) => updateLine(index, "itemId", e.target.value)}
                                            required={index === 0}
                                        >
                                            <option value="">— Item —</option>
                                            {catalogItems.map((it) => (
                                                <option key={it.itemId} value={it.itemId}>
                                                    {it.name} (₹{formatNum(it.sellingPrice)})
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            className="form-control form-control-sm"
                                            value={line.quantity}
                                            onChange={(e) => updateLine(index, "quantity", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control form-control-sm"
                                            value={line.rate}
                                            onChange={(e) => updateLine(index, "rate", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control form-control-sm"
                                            value={line.discount}
                                            onChange={(e) => updateLine(index, "discount", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => removeLine(index)}
                                            aria-label="Remove line"
                                        >
                                            <i className="bi bi-trash" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-warning" disabled={loading}>
                        {loading ? "Saving…" : isEdit ? "Update invoice" : "Create invoice"}
                    </button>
                    {isEdit && (
                        <button
                            type="button"
                            className="btn btn-outline-light"
                            onClick={() => navigate(`/invoices/${routeInvoiceId}`)}
                        >
                            View invoice
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/dashboard")}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateInvoice;
