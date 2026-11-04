package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.entity.TenantInvoiceSequence;
import in.sudhanshu.Billingsoftware.repository.TenantInvoiceSequenceRepository;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.InvoiceNumberService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@AllArgsConstructor
public class InvoiceNumberServiceImpl implements InvoiceNumberService {

    private final TenantInvoiceSequenceRepository sequenceRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public String generateInvoiceNumber(Long tenantId) {

        TenantEntity tenant =
                tenantRepository.findById(tenantId)
                        .orElseThrow(() ->
                                new RuntimeException("Tenant not found")
                        );

        String financialYear = getFinancialYear();

        TenantInvoiceSequence sequence =
                sequenceRepository
                        .findForUpdate(
                                tenantId,
                                financialYear
                        )
                        .orElseGet(() -> {

                            TenantInvoiceSequence newSequence =
                                    TenantInvoiceSequence.builder()
                                            .tenant(tenant)
                                            .financialYear(financialYear)
                                            .lastNumber(0L)
                                            .build();

                            return sequenceRepository.save(newSequence);
                        });

        // Increment
        Long nextNumber =
                sequence.getLastNumber() + 1;

        sequence.setLastNumber(nextNumber);

        sequenceRepository.save(sequence);

        return "INV-" + financialYear + "-" + nextNumber;
    }


    private String getFinancialYear() {

        LocalDate today = LocalDate.now();

        int year = today.getYear();

        int month = today.getMonthValue();

        if (month >= 4) {
            return year + "-" + String.valueOf(year + 1).substring(2);
        } else {
            return (year - 1) + "-" + String.valueOf(year).substring(2);
        }
    }
}
