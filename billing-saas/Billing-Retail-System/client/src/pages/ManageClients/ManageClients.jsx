import "./ManageClients.css";
import {useEffect, useState} from "react";
import toast from "react-hot-toast";
import {
    createClient,
    deleteClient,
    fetchClients,
    updateClient,
} from "../../Services/ClientService.js";
import {assertPhoneOptional, phoneValidationMessage, sanitizePhoneInput} from "../../util/phone.js";

const emptyForm = {
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    stateCode: "",
};

const ManageClients = () => {
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadClients = async () => {
        try {
            const res = await fetchClients();
            setClients(res.data || []);
        } catch (e) {
            console.error(e);
            toast.error("Could not load clients");
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const onChange = (e) => {
        const {name, value} = e.target;
        setForm({
            ...form,
            [name]: name === "phoneNumber" ? sanitizePhoneInput(value) : value,
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.name?.trim()) {
            toast.error("Client name is required");
            return;
        }
        try {
            assertPhoneOptional(form.phoneNumber);
        } catch {
            toast.error(phoneValidationMessage);
            return;
        }
        setLoading(true);
        try {
            if (editingId) {
                await updateClient(editingId, form);
                toast.success("Client updated");
            } else {
                await createClient(form);
                toast.success("Client created");
            }
            setForm(emptyForm);
            setEditingId(null);
            await loadClients();
        } catch (err) {
            console.error(err);
            toast.error("Save failed");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (client) => {
        setEditingId(client.clientId);
        setForm({
            name: client.name || "",
            email: client.email || "",
            phoneNumber: client.phoneNumber || "",
            address: client.address || "",
            city: client.city || "",
            state: client.state || "",
            pincode: client.pincode || "",
            gstin: client.gstin || "",
            stateCode: client.stateCode || "",
        });
    };

    const removeClient = async (clientId) => {
        try {
            await deleteClient(clientId);
            toast.success("Client deleted");
            if (editingId === clientId) {
                setEditingId(null);
                setForm(emptyForm);
            }
            await loadClients();
        } catch (e) {
            console.error(e);
            toast.error("Delete failed");
        }
    };

    return (
        <div className="clients-container">
            <div className="card bg-dark border-secondary">
                <div className="card-body">
                    <h5 className="card-title text-warning">
                        {editingId ? "Edit client" : "Add client"}
                    </h5>
                    <form onSubmit={onSubmit}>
                        <div className="mb-2">
                            <input
                                className="form-control form-control-sm"
                                name="name"
                                placeholder="Name *"
                                value={form.name}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="mb-2">
                            <input
                                type="tel"
                                inputMode="numeric"
                                className="form-control form-control-sm"
                                name="phoneNumber"
                                placeholder="10-digit mobile"
                                value={form.phoneNumber}
                                onChange={onChange}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title={phoneValidationMessage}
                            />
                        </div>
                        <div className="mb-2">
                            <input
                                type="email"
                                className="form-control form-control-sm"
                                name="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={onChange}
                            />
                        </div>
                        <div className="mb-2">
                            <input
                                className="form-control form-control-sm"
                                name="gstin"
                                placeholder="GSTIN"
                                value={form.gstin}
                                onChange={onChange}
                            />
                        </div>
                        <div className="mb-2">
                            <textarea
                                className="form-control form-control-sm"
                                name="address"
                                rows={2}
                                placeholder="Address"
                                value={form.address}
                                onChange={onChange}
                            />
                        </div>
                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-warning btn-sm" disabled={loading}>
                                {loading ? "Saving…" : "Save"}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                        setEditingId(null);
                                        setForm(emptyForm);
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div>
                <h5 className="text-light mb-3">Your clients</h5>
                {clients.length === 0 ? (
                    <p className="text-muted">No clients yet.</p>
                ) : (
                    <div className="list-group">
                        {clients.map((c) => (
                            <div
                                key={c.clientId}
                                className="list-group-item list-group-item-dark d-flex justify-content-between align-items-start mb-2 rounded border-secondary"
                            >
                                <div>
                                    <strong>{c.name}</strong>
                                    {c.gstin && (
                                        <div className="small text-muted">GSTIN: {c.gstin}</div>
                                    )}
                                    {c.phoneNumber && (
                                        <div className="small">{c.phoneNumber}</div>
                                    )}
                                </div>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        type="button"
                                        className="btn btn-outline-warning"
                                        onClick={() => startEdit(c)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={() => removeClient(c.clientId)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageClients;
