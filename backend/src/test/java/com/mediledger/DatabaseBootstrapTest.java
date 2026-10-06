package com.mediledger;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseBootstrapTest {

    @Test
    void testEmbeddedPostgresStartAndQuery() throws Exception {
        try (EmbeddedPostgres pg = EmbeddedPostgres.start()) {
            try (Connection conn = pg.getPostgresDatabase().getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT 1 AS result, version() AS version")) {
                assertTrue(rs.next());
                assertEquals(1, rs.getInt("result"));
                String version = rs.getString("version");
                System.out.println("Embedded PostgreSQL Version: " + version);
                assertTrue(version.toLowerCase().contains("postgresql"));
            }
        }
    }
}
