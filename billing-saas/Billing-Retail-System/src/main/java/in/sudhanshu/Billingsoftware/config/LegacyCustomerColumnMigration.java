package in.sudhanshu.Billingsoftware.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Hibernate ddl-auto=update adds client_id but does not remove legacy NOT NULL customer_id.
 * Drops customer_id from items/invoices when present (PostgreSQL).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class LegacyCustomerColumnMigration implements ApplicationRunner {

    private static final List<String> TABLES = List.of("items", "invoices");

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            for (String table : TABLES) {
                removeLegacyCustomerIdColumn(table);
            }
        } catch (Exception e) {
            log.error(
                    "Legacy customer_id cleanup failed — run scripts/fix-customer-to-client-columns.sql then restart",
                    e
            );
            throw new IllegalStateException("Database schema still has legacy customer_id columns", e);
        }
    }

    private void removeLegacyCustomerIdColumn(String tableName) {
        if (!TABLES.contains(tableName)) {
            return;
        }
        Boolean exists = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_schema = 'public'
                              AND table_name = ?
                              AND column_name = 'customer_id'
                        )
                        """,
                Boolean.class,
                tableName
        );

        if (!Boolean.TRUE.equals(exists)) {
            return;
        }

        log.warn("Legacy column public.{}.customer_id found — removing for client_id model", tableName);

        List<String> fkNames = jdbcTemplate.query(
                """
                        SELECT con.conname AS name
                        FROM pg_constraint con
                        JOIN pg_class rel ON rel.oid = con.conrelid
                        JOIN pg_attribute att ON att.attrelid = rel.oid
                            AND att.attnum = ANY (con.conkey)
                        WHERE rel.relname = ?
                          AND att.attname = 'customer_id'
                          AND con.contype = 'f'
                        """,
                (rs, rowNum) -> rs.getString("name"),
                tableName
        );

        for (String constraintName : fkNames) {
            if (!constraintName.matches("^[a-zA-Z0-9_]+$")) {
                log.warn("Skipping unsafe constraint name: {}", constraintName);
                continue;
            }
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " DROP CONSTRAINT IF EXISTS \"" + constraintName + "\""
            );
        }

        jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP COLUMN IF EXISTS customer_id");
        log.info("Dropped customer_id from public.{}", tableName);
    }
}
