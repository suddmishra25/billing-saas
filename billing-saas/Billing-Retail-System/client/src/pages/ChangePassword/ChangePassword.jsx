import "./ChangePassword.css";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import {changePassword} from "../../Services/AuthService.js";

const PASSWORD_HINT =
    "At least 8 characters, with uppercase, lowercase, a number, and a special character. Cannot match your current password.";

const ChangePassword = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const onChange = (e) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await changePassword(form);
            localStorage.setItem("mustChangePassword", "false");
            toast.success("Password updated. You can use the app now.");
            const home =
                localStorage.getItem("role") === "SUPER_ADMIN" ? "/saas/tenants" : "/dashboard";
            navigate(home, {replace: true});
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Could not update password");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="change-password-page">
            <div className="change-password-card">
                <h4 className="text-warning mb-2">Update your password</h4>
                <p className="change-password-hint mb-4">
                    You signed in with a default password. Choose a new password before continuing.
                </p>
                <p className="change-password-hint mb-3">{PASSWORD_HINT}</p>
                <form onSubmit={onSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Current password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="currentPassword"
                            required
                            value={form.currentPassword}
                            onChange={onChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">New password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="newPassword"
                            required
                            value={form.newPassword}
                            onChange={onChange}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Confirm new password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="confirmPassword"
                            required
                            value={form.confirmPassword}
                            onChange={onChange}
                        />
                    </div>
                    <button type="submit" className="btn btn-warning w-100" disabled={saving}>
                        {saving ? "Saving…" : "Save new password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
