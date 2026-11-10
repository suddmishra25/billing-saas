import "./ChallanInvoice.css";
import {useEffect, useRef, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import {fetchClients} from "../../Services/ClientService.js";
import {fetchClientItems} from "../../Services/ItemService.js";
import {createInvoice} from "../../Services/InvoiceService.js";
import {recognizeChallanImage} from "../../util/challanOcr.js";
import {
    mapHintsToInvoiceLines,
    parseChallanText,
    parseChallanTextsPickBest,
    resolveClientFromHint,
} from "../../util/challanParse.js";
import {assets} from "../../assets/assets.js";

const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/bmp";

const ChallanInvoice = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [clients, setClients] = useState([]);
    const [clientId, setClientId] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [challanNumber, setChallanNumber] = useState("");
    const [challanDated, setChallanDated] = useState("");
    const [catalogItems, setCatalogItems] = useState([]);
    const [lines, setLines] = useState([]);
    const [ocrText, setOcrText] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [phase, setPhase] = useState("upload");
    const [scanning, setScanning] = useState(false);
    const [creating, setCreating] = useState(false);
    const [pastedText, setPastedText] = useState("");
    const [clientNameHint, setClientNameHint] = useState("");
    const [parsedHints, setParsedHints] = useState([]);
    const [parseSummary, setParseSummary] = useState(null);

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
            return;
        }
        (async () => {
            try {
                const res = await fetchClientItems(clientId);
                setCatalogItems(res.data || []);
            } catch (e) {
                console.error(e);
                toast.error("Could not load products for client");
                setCatalogItems([]);
            }
        })();
    }, [clientId]);

    useEffect(() => {
        if (clientId || !clientNameHint.trim() || !clients.length) return;
        const client = resolveClientFromHint(clientNameHint, clients);
        if (client) setClientId(client.clientId);
    }, [clients, clientNameHint, clientId]);

    useEffect(() => {
        if (!parsedHints.length) return;
        setLines((prev) => {
            const mapped = mapHintsToInvoiceLines(parsedHints, catalogItems);
            if (!prev.length) return mapped;
            return prev.map((row, i) => {
                if (row.itemId && catalogItems.some((it) => it.itemId === row.itemId)) {
                    return row;
                }
                return mapped[i] || row;
            });
        });
    }, [catalogItems, parsedHints]);

    const applyParsedDraft = (parsed) => {
        setChallanNumber(parsed.challanNumber || "");
        setChallanDated(parsed.challanDated || "");
        setClientNameHint(parsed.clientHint || "");
        setParsedHints(parsed.lineHints || []);
        setOcrText(parsed.rawText || "");
        setParseSummary({
            client: parsed.clientHint || null,
            challanNumber: parsed.challanNumber || null,
            challanDated: parsed.challanDated || null,
            productCount: parsed.lineHints?.length || 0,
        });
        const client = resolveClientFromHint(parsed.clientHint, clients);
        if (client) setClientId(client.clientId);

        setLines(mapHintsToInvoiceLines(parsed.lineHints || [], catalogItems));
        setPhase("review");

        const missing = [];
        if (!parsed.clientHint) missing.push("client (Customer M/s)");
        if (!parsed.challanNumber) missing.push("challan no.");
        if (!parsed.challanDated) missing.push("challan date");
        if (!parsed.lineHints?.length) missing.push("product / quantity");

        if (missing.length === 4) {
            toast.error("Could not read the challan — edit fields below or paste text");
        } else if (missing.length) {
            toast(`Read partially — check: ${missing.join(", ")}`, {icon: "⚠️"});
        } else {
            toast.success("Challan parsed — confirm client and products");
        }
    };

    const onReparseOcr = () => {
        if (!ocrText.trim()) return;
        applyParsedDraft(parseChallanText(ocrText));
    };

    const onFindClientFromHint = () => {
        const client = resolveClientFromHint(clientNameHint, clients);
        if (client) {
            setClientId(client.clientId);
            toast.success(`Matched client: ${client.name}`);
        } else {
            toast.error("No matching client — pick from the list or fix the name");
        }
    };

    const runOcrOnFile = async (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Use a photo or scan (JPEG, PNG, WebP)");
            return;
        }
        setScanning(true);
        setPhase("scanning");
        try {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return objectUrl;
            });
            const ocrTexts = await recognizeChallanImage(file);
            const parsed = parseChallanTextsPickBest(ocrTexts);
            applyParsedDraft(parsed);
        } catch (e) {
            console.error(e);
            toast.error("Could not read the image — try a clearer scan or paste text");
            setPhase("upload");
        } finally {
            setScanning(false);
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) runOcrOnFile(file);
        e.target.value = "";
    };

    const onParsePasted = () => {
        const text = pastedText.trim();
        if (!text) {
            toast.error("Paste challan text first");
            return;
        }
        const parsed = parseChallanText(text);
        applyParsedDraft(parsed);
    };

    const updateLine = (index, field, value) => {
        setLines((prev) =>
            prev.map((row, i) => {
                if (i !== index) return row;
                const next = {...row, [field]: value};
                if (field === "itemId") {
                    const item = catalogItems.find((it) => it.itemId === value);
                    next.name = item?.name || row.name;
                    next.rate =
                        item?.sellingPrice != null ? String(item.sellingPrice) : row.rate;
                    next.matched = Boolean(item);
                }
                return next;
            })
        );
    };

    const addLine = () => {
        setLines((prev) => [
            ...prev,
            {itemId: "", name: "", quantity: 1, rate: "", matched: false},
        ]);
    };

    const removeLine = (index) => {
        setLines((prev) => prev.filter((_, i) => i !== index));
    };

    const onCreate = async () => {
        if (!invoiceDate) {
            toast.error("Bill date is required");
            return;
        }
        if (!clientId) {
            toast.error("Select the client for this challan");
            return;
        }
        const items = lines
            .filter((l) => l.itemId && Number(l.quantity) > 0)
            .map((l) => ({
                itemId: l.itemId,
                quantity: Number(l.quantity),
                rate: l.rate !== "" ? Number(l.rate) : undefined,
                discount: 0,
            }));
        if (!items.length) {
            toast.error("Map at least one product to the catalogue");
            return;
        }
        setCreating(true);
        try {
            const res = await createInvoice({
                clientId,
                invoiceDate,
                amountPaid: 0,
                challanNumber: challanNumber || undefined,
                challanDated: challanDated || undefined,
                items,
            });
            toast.success("Invoice created from challan");
            navigate(`/invoices/${res.data.invoiceId}`);
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || "Could not create invoice");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="challan-invoice-page text-light">
            <div className="challan-invoice-hero mb-4">
                <h2>Invoice from challan</h2>
                <p className="challan-hint mb-0">
                    Upload your pink <strong>Delivery Challan</strong> (photo/scan), set the{" "}
                    <strong>bill date</strong> for the tax invoice, then confirm client (
                    <em>Customer M/s</em>), challan no./date, and line items (Description → Quantity).
                </p>
            </div>

            <div className="challan-layout">
                <section className="challan-card">
                    <h5 className="text-warning mb-3">1. Bill date &amp; challan</h5>
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label small">Bill date (invoice dated)</label>
                            <input
                                type="date"
                                className="form-control"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small">Challan no. (from scan)</label>
                            <input
                                className="form-control"
                                value={challanNumber}
                                onChange={(e) => setChallanNumber(e.target.value)}
                                placeholder="Auto-filled after scan"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small">Challan dated</label>
                            <input
                                type="date"
                                className="form-control"
                                value={challanDated}
                                onChange={(e) => setChallanDated(e.target.value)}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label small">Client from challan (Customer M/s)</label>
                            <div className="input-group">
                                <input
                                    className="form-control"
                                    value={clientNameHint}
                                    onChange={(e) => setClientNameHint(e.target.value)}
                                    placeholder="e.g. Sunshine Billiards"
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-warning"
                                    onClick={onFindClientFromHint}
                                >
                                    Match client
                                </button>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small">Client in system</label>
                            <select
                                className="form-select"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                            >
                                <option value="">— Select client —</option>
                                {clients.map((c) => (
                                    <option key={c.clientId} value={c.clientId}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {parseSummary && (
                        <div className="challan-parse-summary small mb-3">
                            <strong className="text-warning">Detected</strong>
                            <ul className="mb-0 mt-1">
                                <li className={parseSummary.client ? "text-success" : "text-danger"}>
                                    Client: {parseSummary.client || "—"}
                                </li>
                                <li className={parseSummary.challanNumber ? "text-success" : "text-danger"}>
                                    Challan no.: {parseSummary.challanNumber || "—"}
                                </li>
                                <li className={parseSummary.challanDated ? "text-success" : "text-danger"}>
                                    Challan date: {parseSummary.challanDated || "—"}
                                </li>
                                <li className={parseSummary.productCount ? "text-success" : "text-danger"}>
                                    Products: {parseSummary.productCount || "none"}
                                </li>
                            </ul>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT_IMAGE}
                        className="d-none"
                        onChange={onFileChange}
                    />
                    <button
                        type="button"
                        className="challan-upload-zone w-100"
                        disabled={scanning}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <img src={assets.upload} alt="" width={40} height={40} className="mb-2" />
                        <div className="fw-semibold">
                            {scanning ? "Reading challan…" : "Upload challan image"}
                        </div>
                        <div className="small text-muted">JPEG, PNG or WebP — good lighting helps</div>
                    </button>

                    <details className="challan-paste mt-3">
                        <summary className="small text-warning">Or paste challan text</summary>
                        <textarea
                            className="form-control mt-2"
                            rows={5}
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="Copy text from a PDF or type line items…"
                        />
                        <button
                            type="button"
                            className="btn btn-outline-warning btn-sm mt-2"
                            onClick={onParsePasted}
                        >
                            Parse text
                        </button>
                    </details>
                </section>

                <section className="challan-card">
                    <h5 className="text-warning mb-3">2. Review line items</h5>
                    {previewUrl && (
                        <img src={previewUrl} alt="Challan preview" className="challan-preview mb-3" />
                    )}
                    {phase === "upload" && !lines.length && (
                        <p className="text-muted small">Upload a challan to fill this section.</p>
                    )}
                    {clientId && catalogItems.length === 0 && (
                        <p className="text-warning small">
                            No products for this client — add them under Products first.
                        </p>
                    )}
                    {lines.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-dark table-sm align-middle">
                                <thead>
                                    <tr>
                                        <th>From challan</th>
                                        <th>Catalogue item</th>
                                        <th style={{width: "90px"}}>Qty</th>
                                        <th style={{width: "40px"}} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((row, index) => (
                                        <tr
                                            key={index}
                                            className={row.matched ? "" : "challan-row-unmatched"}
                                        >
                                            <td className="small">{row.name}</td>
                                            <td>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={row.itemId}
                                                    onChange={(e) =>
                                                        updateLine(index, "itemId", e.target.value)
                                                    }
                                                >
                                                    <option value="">— Match product —</option>
                                                    {catalogItems.map((it) => (
                                                        <option key={it.itemId} value={it.itemId}>
                                                            {it.name}
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
                                                    value={row.quantity}
                                                    onChange={(e) =>
                                                        updateLine(index, "quantity", e.target.value)
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-sm text-danger p-0"
                                                    onClick={() => removeLine(index)}
                                                    aria-label="Remove row"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {phase !== "upload" && (
                        <button
                            type="button"
                            className="btn btn-outline-warning btn-sm"
                            onClick={addLine}
                        >
                            Add row
                        </button>
                    )}
                    {ocrText && (
                        <details className="mt-3" open={phase === "review" && !lines.length}>
                            <summary className="small text-muted">OCR text</summary>
                            <pre className="challan-ocr-pre small">{ocrText}</pre>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm mt-2"
                                onClick={onReparseOcr}
                            >
                                Re-parse OCR text
                            </button>
                        </details>
                    )}
                </section>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                    type="button"
                    className="btn btn-warning"
                    disabled={creating || !lines.length}
                    onClick={onCreate}
                >
                    {creating ? "Creating…" : "Create invoice"}
                </button>
                <Link to="/invoices/new" className="btn btn-secondary">
                    Manual form
                </Link>
                <Link to="/invoices/voice" className="btn btn-secondary">
                    Voice invoice
                </Link>
            </div>
        </div>
    );
};

export default ChallanInvoice;
