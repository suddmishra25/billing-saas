import "./VoiceInvoice.css";
import {useCallback, useEffect, useRef, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import {fetchClients} from "../../Services/ClientService.js";
import {fetchClientItems} from "../../Services/ItemService.js";
import {createInvoice} from "../../Services/InvoiceService.js";
import {
    getSpeechRecognition,
    isProductsDonePhrase,
    isSkipPhrase,
    matchClient,
    matchItem,
    parseSpokenDate,
    parseSpokenQuantity,
    speakPrompt,
} from "../../util/voiceInvoiceParse.js";

const STEP = {
    BILL_DATE: "billDate",
    CLIENT: "client",
    CHALLAN_NO: "challanNo",
    CHALLAN_DATE: "challanDate",
    PRODUCT: "product",
    QTY: "qty",
    REVIEW: "review",
};

const QUESTIONS = {
    [STEP.BILL_DATE]:
        "What is the bill date? For example, say 10 dash 11 dash 2026.",
    [STEP.CLIENT]: "Which client is this invoice for? Say the client name.",
    [STEP.CHALLAN_NO]:
        "What is the challan number? Say skip if there is no challan.",
    [STEP.CHALLAN_DATE]:
        "What is the challan date? Say skip if same as bill or not applicable.",
    [STEP.PRODUCT]:
        "Say the product name. When all products are added, say done.",
    [STEP.QTY]: "How many pieces or quantity for this product?",
    [STEP.REVIEW]: "Review your bill and click Generate invoice.",
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const VoiceInvoice = () => {
    const navigate = useNavigate();
    const recognitionRef = useRef(null);
    const [step, setStep] = useState(STEP.BILL_DATE);
    const [speechSupported, setSpeechSupported] = useState(true);
    const [listening, setListening] = useState(false);
    const [heard, setHeard] = useState("");
    const [clients, setClients] = useState([]);
    const [catalogItems, setCatalogItems] = useState([]);
    const [creating, setCreating] = useState(false);

    const [invoiceDate, setInvoiceDate] = useState("");
    const [clientId, setClientId] = useState("");
    const [clientName, setClientName] = useState("");
    const [challanNumber, setChallanNumber] = useState("");
    const [challanDated, setChallanDated] = useState("");
    const [pendingProductName, setPendingProductName] = useState("");
    const [pendingItemId, setPendingItemId] = useState("");
    const [lines, setLines] = useState([]);

    useEffect(() => {
        setSpeechSupported(Boolean(getSpeechRecognition()));
        fetchClients()
            .then((res) => setClients(res.data || []))
            .catch(() => toast.error("Could not load clients"));
    }, []);

    useEffect(() => {
        if (!clientId) {
            setCatalogItems([]);
            return;
        }
        fetchClientItems(clientId)
            .then((res) => setCatalogItems(res.data || []))
            .catch(() => {
                toast.error("Could not load products for this client");
                setCatalogItems([]);
            });
    }, [clientId]);

    const promptForStep = useCallback((s) => {
        const q = QUESTIONS[s];
        if (q) speakPrompt(q);
    }, []);

    useEffect(() => {
        promptForStep(step);
    }, [step, promptForStep]);

    const stopListening = useCallback(() => {
        try {
            recognitionRef.current?.stop();
        } catch {
            /* ignore */
        }
        setListening(false);
    }, []);

    const startListening = () => {
        const SR = getSpeechRecognition();
        if (!SR) {
            toast.error("Use Chrome or Edge for voice input.");
            return;
        }
        stopListening();
        const rec = new SR();
        rec.lang = "en-IN";
        rec.interimResults = false;
        rec.continuous = false;
        rec.onresult = (event) => {
            const text = event.results[0]?.[0]?.transcript?.trim() || "";
            setHeard(text);
        };
        rec.onerror = () => {
            toast.error("Could not hear — try again or type your answer.");
            stopListening();
        };
        rec.onend = () => setListening(false);
        recognitionRef.current = rec;
        setListening(true);
        setHeard("");
        rec.start();
    };

    const goNext = (nextStep) => {
        setHeard("");
        setStep(nextStep);
    };

    const onProductPick = (itemId) => {
        setPendingItemId(itemId);
        const item = catalogItems.find((i) => i.itemId === itemId);
        setPendingProductName(item?.name || "");
        if (item?.name) setHeard(item.name);
    };

    const confirmAnswer = () => {
        const text = heard.trim();
        const productPickedFromList = step === STEP.PRODUCT && pendingItemId;
        if (
            !text &&
            step !== STEP.CHALLAN_NO &&
            step !== STEP.CHALLAN_DATE &&
            !productPickedFromList
        ) {
            toast.error("Say or type an answer first");
            return;
        }

        switch (step) {
            case STEP.BILL_DATE: {
                const iso = parseSpokenDate(text) || (text.match(/^\d{4}-\d{2}-\d{2}$/) ? text : "");
                if (!iso) {
                    toast.error("Could not understand date — try 10-11-2026");
                    return;
                }
                setInvoiceDate(iso);
                goNext(STEP.CLIENT);
                break;
            }
            case STEP.CLIENT: {
                const client = matchClient(text, clients);
                if (!client) {
                    toast.error("Client not found — pick from the list below or try again");
                    return;
                }
                setClientId(client.clientId);
                setClientName(client.name);
                goNext(STEP.CHALLAN_NO);
                break;
            }
            case STEP.CHALLAN_NO: {
                if (isSkipPhrase(text)) {
                    setChallanNumber("");
                } else {
                    setChallanNumber(text.replace(/^(challan\s*(number|no)?\s*)/i, "").trim());
                }
                goNext(STEP.CHALLAN_DATE);
                break;
            }
            case STEP.CHALLAN_DATE: {
                if (isSkipPhrase(text)) {
                    setChallanDated("");
                } else {
                    const iso = parseSpokenDate(text);
                    setChallanDated(iso || text);
                }
                goNext(STEP.PRODUCT);
                break;
            }
            case STEP.PRODUCT: {
                if (text && isProductsDonePhrase(text)) {
                    if (lines.length === 0) {
                        toast.error("Add at least one product before saying done");
                        return;
                    }
                    goNext(STEP.REVIEW);
                    return;
                }
                if (!catalogItems.length) {
                    toast.error("No products for this client — add products first");
                    return;
                }
                if (pendingItemId) {
                    const picked = catalogItems.find((i) => i.itemId === pendingItemId);
                    if (picked) {
                        setPendingProductName(picked.name);
                        goNext(STEP.QTY);
                        break;
                    }
                }
                const item = text ? matchItem(text, catalogItems) : null;
                if (!item) {
                    toast.error("Pick a product from the list or say the product name");
                    return;
                }
                setPendingProductName(item.name);
                setPendingItemId(item.itemId);
                goNext(STEP.QTY);
                break;
            }
            case STEP.QTY: {
                const qty = parseSpokenQuantity(text);
                if (!qty || qty <= 0) {
                    toast.error("Say a number for quantity, for example 50");
                    return;
                }
                const item =
                    catalogItems.find((i) => i.itemId === pendingItemId) ||
                    matchItem(pendingProductName, catalogItems);
                if (!item) {
                    toast.error("Product not matched — go back and say the product name again");
                    goNext(STEP.PRODUCT);
                    return;
                }
                setLines((prev) => [
                    ...prev,
                    {
                        itemId: item.itemId,
                        name: item.name,
                        quantity: qty,
                        rate: item.sellingPrice != null ? String(item.sellingPrice) : "",
                    },
                ]);
                setPendingProductName("");
                setPendingItemId("");
                toast.success("Product added — say the next product or done");
                goNext(STEP.PRODUCT);
                break;
            }
            default:
                break;
        }
    };

    const onGenerate = async () => {
        if (!clientId || !invoiceDate) {
            toast.error("Client and bill date are required");
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
            toast.error("Add at least one product");
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
            toast.success("Invoice created");
            navigate(`/invoices/${res.data.invoiceId}`);
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || "Could not create invoice");
        } finally {
            setCreating(false);
        }
    };

    const stepIndex = [
        STEP.BILL_DATE,
        STEP.CLIENT,
        STEP.CHALLAN_NO,
        STEP.CHALLAN_DATE,
        STEP.PRODUCT,
        STEP.REVIEW,
    ].indexOf(step);

    return (
        <div className="voice-invoice-page text-light">
            <div className="voice-invoice-hero">
                <h2 className="mb-1">Voice invoice</h2>
                <p className="voice-hint mb-0">
                    Step {step === STEP.REVIEW ? "—" : stepIndex + 1} of 5 — answer each question,
                    then add products one by one. Say <strong>done</strong> when finished, then{" "}
                    <strong>Generate invoice</strong>.
                </p>
            </div>

            <div className="voice-wizard-layout">
                <div className="voice-question-card">
                    <div className="voice-step-label">
                        {step === STEP.QTY ? "Quantity" : step === STEP.PRODUCT ? "Product" : step}
                    </div>
                    <p className="voice-question-text">{QUESTIONS[step]}</p>
                    <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                        <button
                            type="button"
                            className={`btn btn-warning voice-mic-btn-sm${listening ? " listening" : ""}`}
                            onClick={listening ? stopListening : startListening}
                            disabled={!speechSupported || step === STEP.REVIEW}
                        >
                            <i className={`bi ${listening ? "bi-stop-fill" : "bi-mic-fill"}`} />
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-light btn-sm"
                            onClick={() => promptForStep(step)}
                            disabled={step === STEP.REVIEW}
                        >
                            Repeat question
                        </button>
                    </div>
                    <input
                        className="form-control mb-2"
                        placeholder="Or type your answer here…"
                        value={heard}
                        onChange={(e) => setHeard(e.target.value)}
                        disabled={step === STEP.REVIEW}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") confirmAnswer();
                        }}
                    />
                    {step !== STEP.REVIEW && (
                        <button type="button" className="btn btn-warning" onClick={confirmAnswer}>
                            Confirm &amp; next
                        </button>
                    )}
                    {step === STEP.PRODUCT && lines.length > 0 && (
                        <button
                            type="button"
                            className="btn btn-outline-warning btn-sm ms-2"
                            onClick={() => goNext(STEP.REVIEW)}
                        >
                            Done adding products
                        </button>
                    )}
                    {step === STEP.CLIENT && (
                        <div className="mt-3">
                            <label className="form-label small">Or pick client</label>
                            <select
                                className="form-select form-select-sm"
                                value={clientId}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    const c = clients.find((x) => x.clientId === id);
                                    setClientId(id);
                                    setClientName(c?.name || "");
                                    if (id && step === STEP.CLIENT) goNext(STEP.CHALLAN_NO);
                                }}
                            >
                                <option value="">—</option>
                                {clients.map((c) => (
                                    <option key={c.clientId} value={c.clientId}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {clientId && (step === STEP.PRODUCT || step === STEP.QTY) && (
                        <div className="mt-3 voice-product-pick">
                            <label className="form-label small">
                                Products for {clientName} — pick from list
                            </label>
                            {!catalogItems.length ? (
                                <p className="small text-muted mb-0">
                                    No products for this client. Add products under Products first.
                                </p>
                            ) : (
                                <select
                                    className="form-select"
                                    value={pendingItemId}
                                    onChange={(e) => onProductPick(e.target.value)}
                                >
                                    <option value="">— Select product —</option>
                                    {catalogItems.map((it) => (
                                        <option key={it.itemId} value={it.itemId}>
                                            {it.name}
                                            {it.sellingPrice != null ? ` (₹${it.sellingPrice})` : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                    {step === STEP.QTY && pendingProductName && (
                        <p className="small text-white-50 mt-2 mb-0">
                            Selected: <strong className="text-light">{pendingProductName}</strong>
                        </p>
                    )}
                </div>

                <div className="voice-summary-card">
                    <h6 className="text-warning mb-3">Bill so far</h6>
                    <ul className="voice-summary-list">
                        <li className={invoiceDate ? "done" : ""}>
                            Bill date: {invoiceDate || "—"}
                        </li>
                        <li className={clientName ? "done" : ""}>
                            Client: {clientName || "—"}
                        </li>
                        <li className={challanNumber || challanDated ? "done" : ""}>
                            Challan: {challanNumber || "—"} {challanDated ? `(${challanDated})` : ""}
                        </li>
                        <li className={lines.length ? "done" : ""}>
                            Products: {lines.length || 0}
                        </li>
                    </ul>
                    {lines.length > 0 && (
                        <table className="table table-dark table-sm mt-2 mb-0">
                            <tbody>
                                {lines.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.name}</td>
                                        <td className="text-end">{row.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {step === STEP.REVIEW && (
                        <div className="mt-3">
                            <p className="small text-white-50 mb-2">
                                Click generate when all products are added.
                            </p>
                            <button
                                type="button"
                                className="btn btn-warning w-100"
                                disabled={creating}
                                onClick={onGenerate}
                            >
                                {creating ? "Creating…" : "Generate invoice"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-link btn-sm text-warning mt-2 p-0"
                                onClick={() => goNext(STEP.PRODUCT)}
                            >
                                Add more products
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-3">
                <Link to="/invoices/new" className="text-warning">
                    Manual invoice form
                </Link>
            </p>
        </div>
    );
};

export default VoiceInvoice;
