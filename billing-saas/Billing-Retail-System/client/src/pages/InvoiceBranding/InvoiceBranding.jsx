import "./InvoiceBranding.css";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import toast from "react-hot-toast";
import {assertPhoneOptional, phoneValidationMessage, sanitizePhoneInput} from "../../util/phone.js";
import {
    fetchTenantBranding,
    updateTenantBranding,
    uploadTenantHeader,
    uploadTenantSignature,
} from "../../Services/TenantBrandingService.js";
import {formatBillNumberPreview} from "../../util/invoiceBillPreview.js";

const DEFAULT_DECLARATION =
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";

const DEFAULT_TERMS = `1. All disputes are subject to local jurisdiction only.
2. Goods once sold will not be taken back.
3. Delivery as per agreed schedule; risk passes on dispatch.
4. Interest @18% p.a. may apply on overdue payments.`;

const emptyForm = {
    companyName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    website: "",
    tagline: "",
    companyNameColor: "#CC0000",
    taglineColor: "#CC0000",
    headerImageUrl: "",
    signatureImageUrl: "",
    bankName: "",
    bankAccountNumber: "",
    bankBranch: "",
    bankIfsc: "",
    declarationText: DEFAULT_DECLARATION,
    termsAndConditions: DEFAULT_TERMS,
    invoiceNumberPrefix: "",
    invoiceNumberIncludeFinancialYear: true,
    nextBillNumber: "",
    financialYear: "",
};

const InvoiceBranding = () => {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetchTenantBranding();
                setForm({...emptyForm, ...res.data});
            } catch (e) {
                console.error(e);
                toast.error("Could not load invoice settings");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onChange = (e) => {
        const {name, value, type, checked} = e.target;
        const next =
            name === "phoneNumber" ? sanitizePhoneInput(value) : type === "checkbox" ? checked : value;
        setForm((prev) => ({
            ...prev,
            [name]: next,
        }));
    };

    const onSave = async (e) => {
        e.preventDefault();
        try {
            assertPhoneOptional(form.phoneNumber);
        } catch {
            toast.error(phoneValidationMessage);
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                nextBillNumber:
                    form.nextBillNumber === "" || form.nextBillNumber == null
                        ? null
                        : Number(form.nextBillNumber),
            };
            const res = await updateTenantBranding(payload);
            setForm({...emptyForm, ...res.data});
            toast.success("Invoice settings saved");
        } catch (err) {
            console.error(err);
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    const onHeaderFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await uploadTenantHeader(file);
            setForm((prev) => ({...prev, headerImageUrl: res.data.url}));
            toast.success("Header image uploaded");
        } catch (err) {
            console.error(err);
            toast.error("Header upload failed");
        }
    };

    const onSignatureFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await uploadTenantSignature(file);
            setForm((prev) => ({...prev, signatureImageUrl: res.data.url}));
            toast.success("Signature uploaded");
        } catch (err) {
            console.error(err);
            toast.error("Signature upload failed");
        }
    };

    if (loading) {
        return (
            <div className="invoice-branding-page">
                <p>Loading…</p>
            </div>
        );
    }

    return (
        <div className="invoice-branding-page">
            <div className="invoice-branding-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0 text-warning">Invoice appearance &amp; bank details</h4>
                    <Link to="/invoices" className="btn btn-secondary btn-sm">
                        Back to invoices
                    </Link>
                </div>
                <p className="small text-white-50">
                    These details appear on printed tax invoices (company header, bank block, terms).
                </p>

                <form onSubmit={onSave}>
                    <h6 className="text-warning mt-2">Bill numbering</h6>
                    <p className="small text-white-50">
                        Next bill example:{" "}
                        <strong>
                            {formatBillNumberPreview({
                                invoiceNumberPrefix: form.invoiceNumberPrefix,
                                invoiceNumberIncludeFinancialYear: form.invoiceNumberIncludeFinancialYear,
                                financialYear: form.financialYear,
                                nextBillNumber: form.nextBillNumber,
                            })}
                        </strong>
                        . Leave prefix empty to omit it. Uncheck financial year for numbers like{" "}
                        <strong>INV-159</strong> or <strong>159</strong> only.
                    </p>
                    <div className="row g-3 mb-2">
                        <div className="col-md-4">
                            <label className="form-label">Bill prefix (optional)</label>
                            <input
                                className="form-control"
                                name="invoiceNumberPrefix"
                                placeholder="e.g. INV — leave blank for none"
                                value={form.invoiceNumberPrefix ?? ""}
                                onChange={onChange}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Next bill number</label>
                            <input
                                type="number"
                                min="1"
                                className="form-control"
                                name="nextBillNumber"
                                value={form.nextBillNumber ?? ""}
                                onChange={onChange}
                            />
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                            <div className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="includeFinancialYear"
                                    name="invoiceNumberIncludeFinancialYear"
                                    checked={form.invoiceNumberIncludeFinancialYear !== false}
                                    onChange={onChange}
                                />
                                <label className="form-check-label" htmlFor="includeFinancialYear">
                                    Include financial year ({form.financialYear || "—"})
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Company name</label>
                            <input className="form-control" name="companyName" value={form.companyName} onChange={onChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Tagline</label>
                            <input
                                className="form-control"
                                name="tagline"
                                placeholder='e.g. Manufacturers of: Auto & Industrial parts'
                                value={form.tagline || ""}
                                onChange={onChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Company name color</label>
                            <input
                                type="color"
                                className="form-control form-control-color w-100"
                                name="companyNameColor"
                                value={form.companyNameColor || "#CC0000"}
                                onChange={onChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Tagline color</label>
                            <input
                                type="color"
                                className="form-control form-control-color w-100"
                                name="taglineColor"
                                value={form.taglineColor || "#CC0000"}
                                onChange={onChange}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Address</label>
                            <textarea className="form-control" rows={2} name="address" value={form.address || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">City</label>
                            <input className="form-control" name="city" value={form.city || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">State</label>
                            <input className="form-control" name="state" value={form.state || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Pincode</label>
                            <input className="form-control" name="pincode" value={form.pincode || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">GSTIN</label>
                            <input className="form-control" name="gstin" value={form.gstin || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Phone</label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                className="form-control"
                                name="phoneNumber"
                                value={form.phoneNumber || ""}
                                onChange={onChange}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title={phoneValidationMessage}
                                placeholder="10-digit mobile"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Email</label>
                            <input className="form-control" name="email" type="email" value={form.email || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Website</label>
                            <input className="form-control" name="website" value={form.website || ""} onChange={onChange} />
                        </div>
                    </div>

                    <hr className="border-secondary my-4" />
                    <h6 className="text-warning">Header logo / banner</h6>
                    <div className="mb-3">
                        <input type="file" accept="image/*" className="form-control" onChange={onHeaderFile} />
                        {form.headerImageUrl && (
                            <img src={form.headerImageUrl} alt="Header" className="invoice-branding-preview mt-2" />
                        )}
                    </div>

                    <h6 className="text-warning mt-3">Authorized signatory</h6>
                    <div className="mb-3">
                        <input type="file" accept="image/*" className="form-control" onChange={onSignatureFile} />
                        {form.signatureImageUrl && (
                            <img src={form.signatureImageUrl} alt="Signature" className="invoice-branding-preview mt-2" />
                        )}
                    </div>

                    <hr className="border-secondary my-4" />
                    <h6 className="text-warning">Bank details (printed on invoice)</h6>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Bank name</label>
                            <input className="form-control" name="bankName" value={form.bankName || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Account number</label>
                            <input className="form-control" name="bankAccountNumber" value={form.bankAccountNumber || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Branch</label>
                            <input className="form-control" name="bankBranch" value={form.bankBranch || ""} onChange={onChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">IFSC code</label>
                            <input className="form-control" name="bankIfsc" value={form.bankIfsc || ""} onChange={onChange} />
                        </div>
                    </div>

                    <hr className="border-secondary my-4" />
                    <label className="form-label">Declaration</label>
                    <textarea className="form-control mb-3" rows={2} name="declarationText" value={form.declarationText || ""} onChange={onChange} />

                    <label className="form-label">Terms &amp; conditions</label>
                    <textarea className="form-control mb-4" rows={5} name="termsAndConditions" value={form.termsAndConditions || ""} onChange={onChange} />

                    <button type="submit" className="btn btn-warning" disabled={saving}>
                        {saving ? "Saving…" : "Save settings"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InvoiceBranding;
