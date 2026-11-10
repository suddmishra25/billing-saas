import "./ManageTenants.css";
import {useEffect, useState} from "react";
import toast from "react-hot-toast";
import {
    createTenant,
    deleteTenant,
    fetchTenants,
    updateTenant,
    uploadTenantHeaderForSaas,
    uploadTenantHeaderBannerForSaas,
    uploadTenantSignatureForSaas,
} from "../../Services/TenantSaasService.js";
import {assertPhoneOptional, phoneValidationMessage, sanitizePhoneInput} from "../../util/phone.js";

const brandingFields = {
    tagline: "",
    website: "",
    companyNameColor: "#CC0000",
    taglineColor: "#CC0000",
    gstin: "",
    headerImageUrl: "",
    headerBannerUrl: "",
    signatureImageUrl: "",
    bankName: "",
    bankAccountNumber: "",
    bankBranch: "",
    bankIfsc: "",
};

const emptyCreate = {
    companyName: "",
    email: "",
    phoneNumber: "",
    address: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    ...brandingFields,
};

const ManageTenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyCreate);
    const [defaultPasswordReset, setDefaultPasswordReset] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchTenants();
            setTenants(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Could not load tenants");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyCreate);
        setDefaultPasswordReset("");
        setShowForm(true);
    };

    const openEdit = (t) => {
        setEditingId(t.tenantId);
        setForm({
            companyName: t.companyName || "",
            email: t.email || "",
            phoneNumber: t.phoneNumber || "",
            address: t.address || "",
            adminName: t.adminName || "",
            adminEmail: t.adminEmail || "",
            adminPassword: "",
            tagline: t.tagline || "",
            website: t.website || "",
            companyNameColor: t.companyNameColor || "#CC0000",
            taglineColor: t.taglineColor || "#CC0000",
            gstin: t.gstin || "",
            headerImageUrl: t.headerImageUrl || "",
            headerBannerUrl: t.headerBannerUrl || "",
            signatureImageUrl: t.signatureImageUrl || "",
            bankName: t.bankName || "",
            bankAccountNumber: t.bankAccountNumber || "",
            bankBranch: t.bankBranch || "",
            bankIfsc: t.bankIfsc || "",
        });
        setDefaultPasswordReset("");
        setShowForm(true);
    };

    const onHeaderBannerFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !editingId) {
            if (!editingId && file) {
                toast.error("Save the tenant first, then upload a header banner");
            }
            return;
        }
        try {
            const res = await uploadTenantHeaderBannerForSaas(editingId, file);
            setForm((prev) => ({...prev, headerBannerUrl: res.data.url}));
            toast.success("Full header banner uploaded — used on tax invoices");
        } catch (err) {
            console.error(err);
            toast.error("Banner upload failed");
        }
    };

    const onClearHeaderBanner = async () => {
        if (!editingId) return;
        try {
            await updateTenant(editingId, {...form, headerBannerUrl: ""});
            setForm((prev) => ({...prev, headerBannerUrl: ""}));
            toast.success("Header banner removed — logo and name layout restored");
            load();
        } catch (err) {
            console.error(err);
            toast.error("Could not remove banner");
        }
    };

    const onHeaderFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !editingId) {
            if (!editingId && file) {
                toast.error("Save the tenant first, then upload a header image");
            }
            return;
        }
        try {
            const res = await uploadTenantHeaderForSaas(editingId, file);
            setForm((prev) => ({...prev, headerImageUrl: res.data.url}));
            toast.success("Header logo uploaded");
        } catch (err) {
            console.error(err);
            toast.error("Header upload failed");
        }
    };

    const onSignatureFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !editingId) {
            if (!editingId && file) {
                toast.error("Save the tenant first, then upload a signature");
            }
            return;
        }
        try {
            const res = await uploadTenantSignatureForSaas(editingId, file);
            setForm((prev) => ({...prev, signatureImageUrl: res.data.url}));
            toast.success("Signature uploaded");
        } catch (err) {
            console.error(err);
            toast.error("Signature upload failed");
        }
    };

    const onChange = (e) => {
        const {name, value} = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "phoneNumber" ? sanitizePhoneInput(value) : value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            assertPhoneOptional(form.phoneNumber);
        } catch {
            toast.error(phoneValidationMessage);
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                const payload = {
                    companyName: form.companyName,
                    email: form.email,
                    phoneNumber: form.phoneNumber,
                    address: form.address,
                    adminName: form.adminName,
                    adminEmail: form.adminEmail,
                    tagline: form.tagline,
                    website: form.website,
                    companyNameColor: form.companyNameColor,
                    taglineColor: form.taglineColor,
                    gstin: form.gstin,
                    bankName: form.bankName,
                    bankAccountNumber: form.bankAccountNumber,
                    bankBranch: form.bankBranch,
                    bankIfsc: form.bankIfsc,
                };
                if (defaultPasswordReset.trim()) {
                    payload.defaultPassword = defaultPasswordReset;
                }
                await updateTenant(editingId, payload);
                toast.success("Tenant updated");
            } else {
                if (!form.adminPassword.trim()) {
                    toast.error("Default password is required");
                    setSaving(false);
                    return;
                }
                await createTenant({
                    companyName: form.companyName,
                    email: form.email,
                    phoneNumber: form.phoneNumber,
                    address: form.address,
                    adminName: form.adminName,
                    adminEmail: form.adminEmail,
                    adminPassword: form.adminPassword,
                    tagline: form.tagline,
                    website: form.website,
                    companyNameColor: form.companyNameColor,
                    taglineColor: form.taglineColor,
                    gstin: form.gstin,
                    bankName: form.bankName,
                    bankAccountNumber: form.bankAccountNumber,
                    bankBranch: form.bankBranch,
                    bankIfsc: form.bankIfsc,
                });
                toast.success("Tenant created — admin must change password on first login");
            }
            setShowForm(false);
            await load();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (tenantId, name) => {
        if (!window.confirm(`Delete tenant "${name}" and its users? This cannot be undone.`)) {
            return;
        }
        try {
            await deleteTenant(tenantId);
            toast.success("Tenant deleted");
            await load();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Delete failed (tenant may have data)");
        }
    };

    return (
        <div className="manage-tenants-page">
            <div className="manage-tenants-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="text-warning mb-0">Manage tenants</h4>
                    <button type="button" className="btn btn-warning btn-sm" onClick={openCreate}>
                        Add tenant
                    </button>
                </div>

                {showForm && (
                    <div className="card bg-dark border-secondary mb-4">
                        <div className="card-body text-light">
                            <h5 className="card-title">{editingId ? "Edit tenant" : "New tenant"}</h5>
                            <form onSubmit={onSubmit} className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Company name</label>
                                    <input className="form-control" name="companyName" required value={form.companyName} onChange={onChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Company email</label>
                                    <input className="form-control" name="email" type="email" value={form.email} onChange={onChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        className="form-control"
                                        name="phoneNumber"
                                        value={form.phoneNumber}
                                        onChange={onChange}
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        title={phoneValidationMessage}
                                        placeholder="10-digit mobile"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Address</label>
                                    <input className="form-control" name="address" value={form.address} onChange={onChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Tagline (invoice header)</label>
                                    <input
                                        className="form-control"
                                        name="tagline"
                                        value={form.tagline}
                                        onChange={onChange}
                                        placeholder="e.g. Manufacturers of: Auto & Industrial parts"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Website (invoice header)</label>
                                    <input
                                        className="form-control"
                                        name="website"
                                        value={form.website}
                                        onChange={onChange}
                                        placeholder="www.example.com"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Company name color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color w-100"
                                        name="companyNameColor"
                                        value={form.companyNameColor}
                                        onChange={onChange}
                                        title="Color for company name on invoice"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Tagline color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color w-100"
                                        name="taglineColor"
                                        value={form.taglineColor}
                                        onChange={onChange}
                                        title="Color for tagline on invoice"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Tenant admin name</label>
                                    <input className="form-control" name="adminName" required value={form.adminName} onChange={onChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Tenant admin email (login)</label>
                                    <input className="form-control" name="adminEmail" type="email" required value={form.adminEmail} onChange={onChange} />
                                </div>
                                {editingId ? (
                                    <div className="col-md-6">
                                        <label className="form-label">Reset default password (optional)</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={defaultPasswordReset}
                                            onChange={(e) => setDefaultPasswordReset(e.target.value)}
                                            placeholder="Forces password change on next login"
                                        />
                                    </div>
                                ) : (
                                    <div className="col-md-6">
                                        <label className="form-label">Default password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="adminPassword"
                                            required
                                            value={form.adminPassword}
                                            onChange={onChange}
                                            placeholder="Admin uses this once, then must change"
                                        />
                                    </div>
                                )}

                                <div className="col-12">
                                    <hr className="border-secondary" />
                                    <h6 className="text-warning mb-2">Invoice / GST details</h6>
                                    <p className="small text-white-50 mb-0">
                                        Shown on tax invoices for this tenant (bank block, GSTIN, logo, signature).
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">GSTIN</label>
                                    <input className="form-control" name="gstin" value={form.gstin} onChange={onChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Bank name</label>
                                    <input className="form-control" name="bankName" value={form.bankName} onChange={onChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Bank account no.</label>
                                    <input
                                        className="form-control"
                                        name="bankAccountNumber"
                                        value={form.bankAccountNumber}
                                        onChange={onChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Branch</label>
                                    <input className="form-control" name="bankBranch" value={form.bankBranch} onChange={onChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">IFSC</label>
                                    <input className="form-control" name="bankIfsc" value={form.bankIfsc} onChange={onChange} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">
                                        Full-width invoice header banner (optional)
                                    </label>
                                    <p className="small text-white-50 mb-2">
                                        If uploaded, the tax invoice shows this image instead of the logo + company
                                        name + address block. Remove the banner to use the built-in header.
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-control"
                                        onChange={onHeaderBannerFile}
                                    />
                                    {form.headerBannerUrl && (
                                        <div className="mt-2">
                                            <img
                                                src={form.headerBannerUrl}
                                                alt="Invoice header banner"
                                                className="tenant-branding-preview tenant-banner-preview"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm mt-2"
                                                onClick={onClearHeaderBanner}
                                            >
                                                Remove banner
                                            </button>
                                        </div>
                                    )}
                                    {!editingId && (
                                        <div className="form-text text-white-50">
                                            Upload after the tenant is created (edit tenant).
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Header logo (built-in layout)</label>
                                    <input type="file" accept="image/*" className="form-control" onChange={onHeaderFile} />
                                    {form.headerImageUrl && (
                                        <img src={form.headerImageUrl} alt="Logo" className="tenant-branding-preview mt-2" />
                                    )}
                                    {!editingId && (
                                        <div className="form-text text-white-50">Upload after the tenant is created (edit tenant).</div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Signature image</label>
                                    <input type="file" accept="image/*" className="form-control" onChange={onSignatureFile} />
                                    {form.signatureImageUrl && (
                                        <img src={form.signatureImageUrl} alt="Signature" className="tenant-branding-preview mt-2" />
                                    )}
                                </div>

                                <div className="col-12 d-flex gap-2">
                                    <button type="submit" className="btn btn-warning" disabled={saving}>
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <p>Loading…</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-dark table-striped table-bordered align-middle">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>GSTIN</th>
                                    <th>Admin</th>
                                    <th>Admin email</th>
                                    <th>Password</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((t) => (
                                    <tr key={t.tenantId}>
                                        <td>{t.companyName}</td>
                                        <td className="small">{t.gstin || "—"}</td>
                                        <td>{t.adminName}</td>
                                        <td>{t.adminEmail}</td>
                                        <td>
                                            {t.adminMustChangePassword ? (
                                                <span className="badge bg-warning text-dark">Must change</span>
                                            ) : (
                                                <span className="badge bg-success">Updated</span>
                                            )}
                                        </td>
                                        <td className="text-nowrap">
                                            <button type="button" className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(t)}>
                                                Edit
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(t.tenantId, t.companyName)}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageTenants;
