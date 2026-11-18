import "./AppFooter.css";

const AppFooter = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <div className="app-footer-inner">
                © {year} Billing Retail · Invoices, clients &amp; inventory
            </div>
        </footer>
    );
};

export default AppFooter;
