-- Fix License Table - Remove Generated Column Issue
-- The IsExpired generated column using DATE('now') prevents inserts
-- We'll remove it and calculate expiry in application logic instead

BEGIN TRANSACTION;

-- Create backup of existing licenses (if any)
CREATE TEMP TABLE LicenseBackup AS SELECT * FROM License;

-- Drop the existing License table
DROP TABLE License;

-- Recreate License table WITHOUT the problematic generated column
CREATE TABLE License (
    LicenseID INTEGER PRIMARY KEY AUTOINCREMENT,
    FisherID INTEGER NOT NULL,
    
    -- License Details
    LicenseNumber VARCHAR(100) UNIQUE NOT NULL,
    LicenseType VARCHAR(50) NOT NULL,
    IssuingAuthority VARCHAR(200) NOT NULL,
    IssuingCountry VARCHAR(100) NOT NULL,
    
    -- Dates
    IssueDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    -- IsExpired removed - calculate in application
    
    -- Verification
    IsVerified BOOLEAN DEFAULT 0,
    VerifiedBy INTEGER,
    VerifiedAt DATETIME,
    
    -- Document Storage
    DocumentURL TEXT,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (FisherID) REFERENCES FisherProfile(FisherID) ON DELETE CASCADE,
    FOREIGN KEY (VerifiedBy) REFERENCES User(UserID)
);

-- Restore any existing data (excluding IsExpired column)
INSERT INTO License SELECT LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL, CreatedAt, UpdatedAt FROM LicenseBackup;

-- Recreate indexes
CREATE INDEX idx_license_fisher ON License(FisherID);
CREATE INDEX idx_license_expiry ON License(ExpiryDate);
CREATE INDEX idx_license_verified ON License(IsVerified);

COMMIT;

SELECT 'License table fixed successfully!' as Status;
SELECT 'Generated column removed - IsExpired will be calculated in app logic' as Note;

