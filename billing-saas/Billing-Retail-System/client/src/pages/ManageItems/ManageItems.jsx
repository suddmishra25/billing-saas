import "./ManageItems.css";
import {useState} from "react";
import ItemForm from "../../components/ItemForm/ItemForm.jsx";
import ItemList from "../../components/ItemList/ItemList.jsx";

const ManageItems = () => {
    const [itemToEdit, setItemToEdit] = useState(null);

    return (
        <div className="items-container text-light">
            <div className="left-column">
                <ItemForm itemToEdit={itemToEdit} onClearEdit={() => setItemToEdit(null)} />
            </div>
            <div className="right-column">
                <ItemList
                    editingItemId={itemToEdit?.itemId}
                    onEditItem={(item) => setItemToEdit(item)}
                    onCancelEdit={() => setItemToEdit(null)}
                />
            </div>
        </div>
    );
};

export default ManageItems;
