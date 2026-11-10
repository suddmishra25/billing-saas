import "./CustomerForm.css";
import {phoneValidationMessage, sanitizePhoneInput} from "../../util/phone.js";

const CustomerForm = ({customerName, mobileNumber, setMobileNumber, setCustomerName}) => {
    return (
        <div className="p-3">
            <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="customerName" className="col-4">
                        Customer name
                    </label>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        id="customerName"
                        onChange={(e) => setCustomerName(e.target.value)}
                        value={customerName}
                        required
                    />
                </div>
            </div>
            <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="mobileNumber" className="col-4">
                        Mobile number
                    </label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        className="form-control form-control-sm"
                        id="mobileNumber"
                        onChange={(e) => setMobileNumber(sanitizePhoneInput(e.target.value))}
                        value={mobileNumber}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        title={phoneValidationMessage}
                        placeholder="10 digits"
                        required
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerForm;
