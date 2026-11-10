package in.sudhanshu.Billingsoftware.service;

public interface InvoiceNumberService {

    String generateInvoiceNumber(Long tenantId);

    /** Sets the next issued bill number for the current financial year (e.g. 159 → next invoice is …-159). */
    void syncNextBillNumber(Long tenantId, long nextBillNumber);

    long resolveNextBillNumber(Long tenantId);
}
