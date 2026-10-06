package com.mediledger.config;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.core.Ordered;
import org.springframework.core.PriorityOrdered;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Ensures a PostgreSQL instance is available on localhost:5432 for local development.
 * If an external PostgreSQL is already running (via Docker compose or system service),
 * this bootstrap step yields and connects to the existing server.
 * In cloud/production environments (e.g. Aiven), it automatically detects the remote URL and yields.
 */
@Component
public class LocalPostgresBootstrap implements BeanFactoryPostProcessor, PriorityOrdered, ApplicationListener<ContextClosedEvent> {

    private static final Logger log = LoggerFactory.getLogger(LocalPostgresBootstrap.class);
    private static final int DEFAULT_PORT = 5432;
    private static final String DEFAULT_DB = "mediledger";

    private static EmbeddedPostgres embeddedPostgresInstance;

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null) {
            dbUrl = System.getProperty("spring.datasource.url", "jdbc:postgresql://localhost:5432/mediledger");
        }

        // Only auto-start embedded PG if targeting localhost:5432
        if (dbUrl.contains("localhost:5432") || dbUrl.contains("127.0.0.1:5432")) {
            if (!isPortInUse("localhost", DEFAULT_PORT)) {
                log.info("No external PostgreSQL server detected on port 5432. Launching embedded PostgreSQL server for local development...");
                try {
                    embeddedPostgresInstance = EmbeddedPostgres.builder()
                            .setPort(DEFAULT_PORT)
                            .start();

                    // Ensure database 'mediledger' exists
                    try (Connection conn = embeddedPostgresInstance.getPostgresDatabase().getConnection();
                         Statement stmt = conn.createStatement()) {
                        ResultSet rs = stmt.executeQuery("SELECT 1 FROM pg_database WHERE datname = '" + DEFAULT_DB + "'");
                        if (!rs.next()) {
                            stmt.execute("CREATE DATABASE " + DEFAULT_DB);
                            log.info("Database '{}' created successfully on local PostgreSQL instance.", DEFAULT_DB);
                        }
                    }
                    log.info("Embedded PostgreSQL server is active and listening on port {}", DEFAULT_PORT);
                } catch (Exception ex) {
                    log.warn("Could not start embedded PostgreSQL server on port {}: {}. Proceeding with standard datasource connection...",
                            DEFAULT_PORT, ex.getMessage());
                }
            } else {
                log.info("Active PostgreSQL server detected on port 5432 (e.g., Docker container or system service). Using existing instance.");
            }
        } else {
            log.info("Remote PostgreSQL database configured (e.g., Aiven Cloud). Bypassing local PostgreSQL bootstrap.");
        }
    }

    private boolean isPortInUse(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 600);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    @Override
    public void onApplicationEvent(ContextClosedEvent event) {
        if (embeddedPostgresInstance != null) {
            try {
                log.info("Shutting down local PostgreSQL instance...");
                embeddedPostgresInstance.close();
            } catch (IOException e) {
                log.error("Error shutting down embedded PostgreSQL instance: {}", e.getMessage());
            }
        }
    }
}
