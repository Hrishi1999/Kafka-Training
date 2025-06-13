package com.acme.kafka.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Validation result container for payment validation
 */
public class ValidationResult {
    
    private final boolean valid;
    private final String invalidReason;
    private final List<String> warnings;
    private final List<String> infoMessages;

    private ValidationResult(boolean valid, String invalidReason, 
                           List<String> warnings, List<String> infoMessages) {
        this.valid = valid;
        this.invalidReason = invalidReason;
        this.warnings = warnings != null ? warnings : new ArrayList<>();
        this.infoMessages = infoMessages != null ? infoMessages : new ArrayList<>();
    }

    public boolean isValid() {
        return valid;
    }

    public String getInvalidReason() {
        return invalidReason;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public List<String> getInfoMessages() {
        return infoMessages;
    }

    /**
     * Builder for ValidationResult
     */
    public static class Builder {
        private boolean valid = true;
        private String invalidReason;
        private List<String> warnings = new ArrayList<>();
        private List<String> infoMessages = new ArrayList<>();

        public Builder invalid(String reason) {
            this.valid = false;
            this.invalidReason = reason;
            return this;
        }

        public Builder warning(String warning) {
            this.warnings.add(warning);
            return this;
        }

        public Builder info(String info) {
            this.infoMessages.add(info);
            return this;
        }

        public ValidationResult build() {
            return new ValidationResult(valid, invalidReason, warnings, infoMessages);
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}