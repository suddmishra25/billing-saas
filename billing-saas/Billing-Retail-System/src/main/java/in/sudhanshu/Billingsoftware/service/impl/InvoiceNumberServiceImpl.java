package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.entity.TenantInvoiceSequence;
import in.sudhanshu.Billingsoftware.repository.TenantInvoiceSequenceRepository;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.InvoiceNumberService;
import in.sudhanshu.Billingsoftware.util.InvoiceNumberFormatUtil;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

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

        String sequenceKey = InvoiceNumberFormatUtil.sequenceBucket(tenant);

        TenantInvoiceSequence sequence =
                sequenceRepository
                        .findForUpdate(
                                tenantId,
                                sequenceKey
                        )
                        .orElseGet(() -> {

                            TenantInvoiceSequence newSequence =
                                    TenantInvoiceSequence.builder()
                                            .tenant(tenant)
                                            .financialYear(sequenceKey)
                                            .lastNumber(0L)
                                            .build();

                            return sequenceRepository.save(newSequence);
                        });

        // Increment
        Long nextNumber =
                sequence.getLastNumber() + 1;

        sequence.setLastNumber(nextNumber);

        sequenceRepository.save(sequence);

        return InvoiceNumberFormatUtil.format(tenant, nextNumber);
    }

    @Override
    @Transactional
    public void syncNextBillNumber(Long tenantId, long nextBillNumber) {
        if (nextBillNumber < 1) {
            throw new RuntimeException("Next bill number must be at least 1");
        }
        TenantEntity tenant =
                tenantRepository.findById(tenantId)
                        .orElseThrow(() -> new RuntimeException("Tenant not found"));
        String sequenceKey = InvoiceNumberFormatUtil.sequenceBucket(tenant);
        long lastNumber = nextBillNumber - 1;

        TenantInvoiceSequence sequence =
                sequenceRepository
                        .findByTenantIdAndFinancialYear(tenantId, sequenceKey)
                        .orElseGet(
                                () ->
                                        TenantInvoiceSequence.builder()
                                                .tenant(tenant)
                                                .financialYear(sequenceKey)
                                                .lastNumber(0L)
                                                .build());

        sequence.setLastNumber(lastNumber);
        sequenceRepository.save(sequence);
    }

    @Override
    @Transactional
    public long resolveNextBillNumber(Long tenantId) {
        TenantEntity tenant =
                tenantRepository.findById(tenantId)
                        .orElseThrow(() -> new RuntimeException("Tenant not found"));
        String sequenceKey = InvoiceNumberFormatUtil.sequenceBucket(tenant);
        return sequenceRepository
                .findByTenantIdAndFinancialYear(tenantId, sequenceKey)
                .map(s -> s.getLastNumber() + 1)
                .orElse(1L);
    }
}
