import {useContext, useEffect, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import toast from "react-hot-toast";
import {addItem, updateItem} from "../../Services/ItemService.js";
import {fetchClients} from "../../Services/ClientService.js";

const emptyForm = {
    clientId: "",
    name: "",
    description: "",
    hsnCode: "",
    unit: "PCS",
    sellingPrice: "",
    purchasePrice: "",
    cgstRate: "9",
    sgstRate: "9",
    discount: "0",
    stockQuantity: "",
};

const itemToFormData = (item) => ({
    clientId: item.clientId || "",
    name: item.name || "",
    description: item.description || "",
    hsnCode: item.hsnCode || "",
    unit: item.unit || "PCS",
    sellingPrice: item.sellingPrice != null ? String(item.sellingPrice) : "",
    purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
    cgstRate:
        item.cgstRate != null
            ? String(item.cgstRate)
            : item.gstRate != null
              ? String(Number(item.gstRate) / 2)
              : "9",
    sgstRate:
        item.sgstRate != null
            ? String(item.sgstRate)
            : item.gstRate != null
              ? String(Number(item.gstRate) / 2)
              : "9",
    discount: item.discount != null ? String(item.discount) : "0",
    stockQuantity: item.stockQuantity != null ? String(item.stockQuantity) : "",
});

const ItemForm = ({itemToEdit, onClearEdit}) => {
    const {refreshItems} = useContext(AppContext);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [data, setData] = useState(emptyForm);

    useEffect(() => {
        if (itemToEdit) {
            setEditing({
                itemId: itemToEdit.itemId,
                clientId: itemToEdit.clientId,
            });
            setData(itemToFormData(itemToEdit));
            document.querySelector(".item-form-container")?.scrollIntoView({behavior: "smooth", block: "start"});
        } else {
            setEditing(null);
        }
    }, [itemToEdit]);

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

    const onChangeHandler = (e) => {
        setData((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const buildPayload = () => ({
        clientId: data.clientId,
        name: data.name,
        description: data.description || undefined,
        hsnCode: data.hsnCode || undefined,
        unit: data.unit || undefined,
        sellingPrice: data.sellingPrice !== "" ? Number(data.sellingPrice) : undefined,
        purchasePrice: data.purchasePrice !== "" ? Number(data.purchasePrice) : undefined,
        cgstRate: data.cgstRate !== "" ? Number(data.cgstRate) : undefined,
        sgstRate: data.sgstRate !== "" ? Number(data.sgstRate) : undefined,
        discount: data.discount !== "" ? Number(data.discount) : undefined,
        stockQuantity: data.stockQuantity !== "" ? Number(data.stockQuantity) : undefined,
    });

    const resetForm = (keepClient = false) => {
        setEditing(null);
        onClearEdit?.();
        setData({
            ...emptyForm,
            clientId: keepClient ? data.clientId : "",
        });
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!data.clientId) {
            toast.error("Select a client");
            return;
        }
        setLoading(true);
        try {
            const payload = buildPayload();
            if (editing) {
                await updateItem(editing.itemId, editing.clientId, payload);
                await refreshItems();
                toast.success("Item updated");
            } else {
                const response = await addItem(payload);
                if (response.status === 201) {
                    await refreshItems();
                    toast.success("Item added");
                }
            }
            resetForm(true);
        } catch (error) {
            console.error(error);
            toast.error("Unable to save item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="item-form-container" style={{height: "100vh", overflowY: "auto", overflowX: "hidden"}}>
            <div className="mx-2 mt-2">
                <div className="row">
                    <div className="card col-md-12 form-container">
                        <div className="card-body">
                            <h6 className="text-warning">{editing ? "Edit product" : "Add product"}</h6>
                            <form onSubmit={onSubmitHandler}>
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="clientId">
                                        Client
                                    </label>
                                    <select
                                        name="clientId"
                                        id="clientId"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.clientId}
                                        required
                                        disabled={!!editing}
                                    >
                                        <option value="">— Select client —</option>
                                        {clients.map((c) => (
                                            <option key={c.clientId} value={c.clientId}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.name}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="sellingPrice" className="form-label">
                                        Selling price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="sellingPrice"
                                        id="sellingPrice"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.sellingPrice}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="purchasePrice" className="form-label">
                                        Purchase price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="purchasePrice"
                                        id="purchasePrice"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.purchasePrice}
                                    />
                                </div>
                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <label htmlFor="cgstRate" className="form-label">
                                            CGST (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="cgstRate"
                                            id="cgstRate"
                                            className="form-control"
                                            onChange={onChangeHandler}
                                            value={data.cgstRate}
                                            required
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label htmlFor="sgstRate" className="form-label">
                                            SGST (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="sgstRate"
                                            id="sgstRate"
                                            className="form-control"
                                            onChange={onChangeHandler}
                                            value={data.sgstRate}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="unit" className="form-label">
                                        Unit
                                    </label>
                                    <input
                                        type="text"
                                        name="unit"
                                        id="unit"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.unit}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="hsnCode" className="form-label">
                                        HSN code
                                    </label>
                                    <input
                                        type="text"
                                        name="hsnCode"
                                        id="hsnCode"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.hsnCode}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="stockQuantity" className="form-label">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="stockQuantity"
                                        id="stockQuantity"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.stockQuantity}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">
                                        Description
                                    </label>
                                    <textarea
                                        rows="4"
                                        name="description"
                                        id="description"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.description}
                                    />
                                </div>
                                <button type="submit" className="btn btn-warning w-100" disabled={loading}>
                                    {loading ? "Loading..." : editing ? "Update" : "Save"}
                                </button>
                                {editing && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary w-100 mt-2"
                                        onClick={() => resetForm()}
                                    >
                                        Cancel edit
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemForm;
