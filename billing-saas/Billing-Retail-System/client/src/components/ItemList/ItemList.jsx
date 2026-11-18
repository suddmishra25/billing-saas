import {useContext, useMemo, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import {deleteItem} from "../../Services/ItemService.js";
import toast from "react-hot-toast";
import "./ItemList.css";

const ItemList = ({onEditItem, onCancelEdit, editingItemId}) => {
    const {itemsData, setItemsData} = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState("");
    const [clientFilter, setClientFilter] = useState("");

    const filteredItems = itemsData.filter((item) => {
        const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClient = !clientFilter || item.clientId === clientFilter;
        return matchesSearch && matchesClient;
    });

    const clientFilterOptions = useMemo(() => {
        const map = new Map();
        for (const item of itemsData) {
            if (item.clientId && !map.has(item.clientId)) {
                map.set(item.clientId, item.clientName || item.clientId);
            }
        }
        return [...map.entries()].sort((a, b) =>
            String(a[1]).localeCompare(String(b[1]), undefined, {sensitivity: "base"})
        );
    }, [itemsData]);

    const removeItem = async (item) => {
        if (!item.clientId) {
            toast.error("Missing client for this item");
            return;
        }
        try {
            const response = await deleteItem(item.itemId, item.clientId);
            if (response.status === 204) {
                setItemsData(itemsData.filter((i) => i.itemId !== item.itemId));
                if (editingItemId === item.itemId) {
                    onCancelEdit?.();
                }
                toast.success("Item deleted");
            }
        } catch (err) {
            console.error(err);
            toast.error("Unable to delete item");
        }
    };

    return (
        <div className="category-list-container" style={{height: "100vh", overflowY: "auto", overflowX: "hidden"}}>
            <div className="row g-2 mb-3">
                <div className="col-12">
                    <select
                        className="form-select form-select-sm"
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                    >
                        <option value="">All clients</option>
                        {clientFilterOptions.map(([id, label]) => (
                            <option key={id} value={id}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Search by name"
                        className="form-control"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                    />
                    <span className="input-group-text bg-warning">
                        <i className="bi bi-search" />
                    </span>
                </div>
            </div>
            <div className="row g-3">
                {filteredItems.map((item) => (
                    <div className="col-lg-12" key={item.itemId}>
                        <div
                            className={`card p-3 bg-dark item-card${editingItemId === item.itemId ? " border border-warning" : ""}`}
                        >
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h6 className="mb-1 text-white">{item.name}</h6>
                                    {item.clientName && (
                                        <p className="mb-0 text-white-50 small">Client: {item.clientName}</p>
                                    )}
                                    <span className="badge rounded-pill text-bg-warning">
                                        ₹{item.sellingPrice ?? "—"}
                                    </span>
                                    {(item.cgstRate != null || item.sgstRate != null) && (
                                        <span className="badge rounded-pill text-bg-secondary ms-1">
                                            CGST {item.cgstRate ?? "0"}% / SGST {item.sgstRate ?? "0"}%
                                        </span>
                                    )}
                                </div>
                                <div className="d-flex gap-1">
                                    <button
                                        type="button"
                                        className="btn btn-warning btn-sm"
                                        title="Edit"
                                        onClick={() => onEditItem?.(item)}
                                    >
                                        <i className="bi bi-pencil" />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        title="Delete"
                                        onClick={() => removeItem(item)}
                                    >
                                        <i className="bi bi-trash" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ItemList;
