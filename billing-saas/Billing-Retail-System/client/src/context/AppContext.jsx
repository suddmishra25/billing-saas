import {createContext, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {fetchCategories} from "../Services/CategoryService.js";
import {fetchItems} from "../Services/ItemService.js";

export const AppContext = createContext(null);

const readStoredAuth = () => ({
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
});

export const AppContextProvider = (props) => {

    const [categories, setCategories] = useState([]);
    const [itemsData, setItemsData] = useState([]);
    const [auth, setAuth] = useState(readStoredAuth);
    const [cartItems, setCartItems] = useState([]);
    const tenantLoadInFlight = useRef(false);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const reloadTenantData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setCategories([]);
            setItemsData([]);
            setCartItems([]);
            return;
        }
        if (tenantLoadInFlight.current) {
            return;
        }
        tenantLoadInFlight.current = true;
        try {
            const [categoryResponse, itemResponse] = await Promise.all([
                fetchCategories(),
                fetchItems(),
            ]);
            setCategories(categoryResponse.data ?? []);
            setItemsData(itemResponse.data ?? []);
        } catch (e) {
            console.error(e);
            setCategories([]);
            setItemsData([]);
        } finally {
            tenantLoadInFlight.current = false;
        }
    }, []);

    useEffect(() => {
        if (!localStorage.getItem("mustChangePassword")) {
            localStorage.setItem("mustChangePassword", "false");
        }
    }, []);

    useEffect(() => {
        if (!auth.token) {
            setCategories([]);
            setItemsData([]);
            setCartItems([]);
            return;
        }
        reloadTenantData();
    }, [auth.token, reloadTenantData]);

    const setAuthData = useCallback((token, role) => {
        setAuth({token, role});
        if (!token) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            setCategories([]);
            setItemsData([]);
            clearCart();
        }
    }, [clearCart]);

    const addToCart = useCallback((item) => {
        setCartItems((prev) => {
            const existingItem = prev.find((cartItem) => cartItem.name === item.name);
            if (existingItem) {
                return prev.map((cartItem) =>
                    cartItem.name === item.name
                        ? {...cartItem, quantity: cartItem.quantity + 1}
                        : cartItem
                );
            }
            return [...prev, {...item, quantity: 1}];
        });
    }, []);

    const removeFromCart = useCallback((itemId) => {
        setCartItems((prev) => prev.filter((item) => item.itemId !== itemId));
    }, []);

    const updateQuantity = useCallback((itemId, newQuantity) => {
        setCartItems((prev) =>
            prev.map((item) => (item.itemId === itemId ? {...item, quantity: newQuantity} : item))
        );
    }, []);

    const refreshItems = useCallback(async () => {
        if (!localStorage.getItem("token")) {
            return;
        }
        try {
            const itemResponse = await fetchItems();
            setItemsData(itemResponse.data ?? []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const contextValue = useMemo(
        () => ({
            categories,
            setCategories,
            auth,
            setAuthData,
            itemsData,
            setItemsData,
            reloadTenantData,
            refreshItems,
            addToCart,
            cartItems,
            removeFromCart,
            updateQuantity,
            clearCart,
        }),
        [
            categories,
            auth,
            setAuthData,
            itemsData,
            reloadTenantData,
            refreshItems,
            addToCart,
            cartItems,
            removeFromCart,
            updateQuantity,
            clearCart,
        ]
    );

    return <AppContext.Provider value={contextValue}>{props.children}</AppContext.Provider>;
};
