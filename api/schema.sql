-- ============================================
-- SeaTrue: Transparent Traceability Database
-- SQLite Schema for Small-Scale Fisheries
-- ============================================

-- ============================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- ============================================

CREATE TABLE User (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK(Role IN ('Fisher', 'Buyer', 'Admin', 'NGO')),
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(20),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastLoginAt DATETIME,
    IsActive BOOLEAN DEFAULT 1,
    UNIQUE(Email)
);

CREATE INDEX idx_user_email ON User(Email);
CREATE INDEX idx_user_role ON User(Role);

-- ============================================
-- 2. FISHER VERIFICATION & CERTIFICATION
-- ============================================

CREATE TABLE FisherProfile (
    FisherID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    
    -- Personal Identification
    NationalID VARCHAR(50),
    DateOfBirth DATE,
    Address TEXT,
    City VARCHAR(100),
    State VARCHAR(100),
    Country VARCHAR(100) NOT NULL,
    PostalCode VARCHAR(20),
    
    -- Fisher-Specific Data
    YearsOfExperience INTEGER,
    PrimaryFishingMethod VARCHAR(100), -- e.g., "Line fishing", "Net fishing", "Trap fishing"
    HomePort VARCHAR(100), -- Main harbor/landing site
    
    -- Certification Status
    CertificationStatus VARCHAR(20) DEFAULT 'Pending' 
        CHECK(CertificationStatus IN ('Pending', 'PreVerified', 'Certified', 'Suspended', 'Revoked')),
    CertifiedAt DATETIME,
    CertifiedBy INTEGER, -- AdminID who approved
    SuspensionReason TEXT,
    
    -- Trust Score (0-100)
    TrustScore DECIMAL(5,2) DEFAULT 0.00,
    LastTrustScoreUpdate DATETIME,
    
    -- Demo/Testing Limits
    DemoCatchesLogged INTEGER DEFAULT 0, -- Count for pre-verified fishers (max 3)
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CertifiedBy) REFERENCES User(UserID)
);

CREATE INDEX idx_fisher_status ON FisherProfile(CertificationStatus);
CREATE INDEX idx_fisher_trust ON FisherProfile(TrustScore);
CREATE INDEX idx_fisher_user ON FisherProfile(UserID);

-- ============================================
-- 3. LICENSES & PERMITS
-- ============================================

CREATE TABLE License (
    LicenseID INTEGER PRIMARY KEY AUTOINCREMENT,
    FisherID INTEGER NOT NULL,
    
    -- License Details
    LicenseNumber VARCHAR(100) UNIQUE NOT NULL,
    LicenseType VARCHAR(50) NOT NULL, -- e.g., "Commercial", "Small-scale", "Artisanal"
    IssuingAuthority VARCHAR(200) NOT NULL, -- Government agency name
    IssuingCountry VARCHAR(100) NOT NULL,
    
    -- Dates
    IssueDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    IsExpired BOOLEAN GENERATED ALWAYS AS (ExpiryDate < DATE('now')) STORED,
    
    -- Verification
    IsVerified BOOLEAN DEFAULT 0,
    VerifiedBy INTEGER, -- AdminID
    VerifiedAt DATETIME,
    
    -- Document Storage
    DocumentURL TEXT, -- Path to scanned license image
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (FisherID) REFERENCES FisherProfile(FisherID) ON DELETE CASCADE,
    FOREIGN KEY (VerifiedBy) REFERENCES User(UserID)
);

CREATE INDEX idx_license_fisher ON License(FisherID);
CREATE INDEX idx_license_expiry ON License(ExpiryDate);
CREATE INDEX idx_license_verified ON License(IsVerified);

-- ============================================
-- 4. VESSELS & BOAT REGISTRATION
-- ============================================

CREATE TABLE Vessel (
    VesselID INTEGER PRIMARY KEY AUTOINCREMENT,
    OwnerFisherID INTEGER NOT NULL,
    
    -- Vessel Identification
    VesselName VARCHAR(200) NOT NULL,
    RegistrationNumber VARCHAR(100) UNIQUE NOT NULL,
    IMO_Number VARCHAR(50), -- International Maritime Organization number
    CallSign VARCHAR(50),
    FlagState VARCHAR(100) NOT NULL, -- Country of registration
    
    -- Physical Characteristics
    VesselType VARCHAR(100), -- e.g., "Longline vessel", "Trawler", "Canoe"
    LengthMeters DECIMAL(6,2),
    TonnageGT DECIMAL(8,2), -- Gross Tonnage
    HullMaterial VARCHAR(50), -- e.g., "Wood", "Fiberglass", "Steel"
    EngineType VARCHAR(100),
    EnginePowerHP DECIMAL(8,2),
    
    -- Registration & Compliance
    RegistrationDate DATE,
    RegistrationExpiryDate DATE,
    IsRegistrationValid BOOLEAN GENERATED ALWAYS AS (RegistrationExpiryDate >= DATE('now')) STORED,
    
    -- Documentation
    RegistrationDocumentURL TEXT,
    
    IsActive BOOLEAN DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (OwnerFisherID) REFERENCES FisherProfile(FisherID) ON DELETE CASCADE
);

CREATE INDEX idx_vessel_owner ON Vessel(OwnerFisherID);
CREATE INDEX idx_vessel_registration ON Vessel(RegistrationNumber);
CREATE INDEX idx_vessel_active ON Vessel(IsActive);

-- ============================================
-- 5. FISHING GEAR & EQUIPMENT
-- ============================================

CREATE TABLE FishingGear (
    GearID INTEGER PRIMARY KEY AUTOINCREMENT,
    FisherID INTEGER NOT NULL,
    
    -- Gear Details
    GearType VARCHAR(100) NOT NULL, -- e.g., "Gillnet", "Longline", "Fish trap", "Hand line"
    GearSubtype VARCHAR(100), -- e.g., "Bottom gillnet", "Pelagic longline"
    Quantity INTEGER, -- Number of units (e.g., 5 traps, 3 nets)
    
    -- Physical Specs (for nets/lines)
    MeshSizeMM DECIMAL(6,2), -- Mesh size in millimeters
    LengthMeters DECIMAL(8,2), -- Length of net or line
    HookCount INTEGER, -- For longlines
    
    -- Compliance
    IsLegalGear BOOLEAN DEFAULT 1, -- Some gear types prohibited in certain areas
    Notes TEXT,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (FisherID) REFERENCES FisherProfile(FisherID) ON DELETE CASCADE
);

CREATE INDEX idx_gear_fisher ON FishingGear(FisherID);
CREATE INDEX idx_gear_type ON FishingGear(GearType);

-- ============================================
-- 6. SPECIES REFERENCE DATA
-- ============================================

CREATE TABLE Species (
    SpeciesID INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Names
    CommonName VARCHAR(200) NOT NULL,
    ScientificName VARCHAR(200) NOT NULL,
    LocalName VARCHAR(200), -- Regional/indigenous name
    
    -- Classification
    Family VARCHAR(100),
    Category VARCHAR(50), -- e.g., "Finfish", "Shellfish", "Cephalopod"
    
    -- Conservation Status
    ConservationStatus VARCHAR(50), -- e.g., "Least Concern", "Endangered", "Critically Endangered"
    IUCNRedListStatus VARCHAR(50),
    
    -- Regulations
    MinimumLegalSizeCM DECIMAL(6,2), -- Minimum catch size
    IsCommerciallyAllowed BOOLEAN DEFAULT 1,
    QuotaRestrictions TEXT, -- Seasonal limits, daily limits
    
    -- Reference
    FAOCode VARCHAR(10), -- FAO 3-alpha species code (e.g., COD for Atlantic cod)
    ImageURL TEXT,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_species_common ON Species(CommonName);
CREATE INDEX idx_species_scientific ON Species(ScientificName);
CREATE INDEX idx_species_fao ON Species(FAOCode);

-- ============================================
-- 7. REGULATORY ZONES & FISHING AREAS
-- ============================================

CREATE TABLE RegulatoryZone (
    ZoneID INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Zone Identification
    ZoneName VARCHAR(200) NOT NULL,
    ZoneCode VARCHAR(50) UNIQUE, -- e.g., "EEZ-US-01", "MPA-KENYA-03"
    ZoneType VARCHAR(100) NOT NULL, -- e.g., "EEZ", "Territorial Waters", "Marine Protected Area"
    ManagingAuthority VARCHAR(200),
    Country VARCHAR(100),
    
    -- Geographic Boundaries (simplified; could use PostGIS for real polygons)
    CenterLatitude DECIMAL(10,7),
    CenterLongitude DECIMAL(10,7),
    RadiusKM DECIMAL(8,2), -- Approximate circular zone
    BoundaryGeoJSON TEXT, -- GeoJSON polygon for precise boundaries
    
    -- Regulations
    IsOpenToFishing BOOLEAN DEFAULT 1,
    AllowedGearTypes TEXT, -- JSON array or comma-separated
    ProhibitedGearTypes TEXT,
    SeasonalClosures TEXT, -- Description of closure periods
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zone_type ON RegulatoryZone(ZoneType);
CREATE INDEX idx_zone_country ON RegulatoryZone(Country);

-- ============================================
-- 8. CATCH RECORDS & TRACEABILITY
-- ============================================

CREATE TABLE CatchRecord (
    CatchID INTEGER PRIMARY KEY AUTOINCREMENT,
    FisherID INTEGER NOT NULL,
    VesselID INTEGER,
    GearID INTEGER,
    
    -- Catch Event Details
    CatchDate DATE NOT NULL,
    CatchTime TIME,
    LandingDate DATE, -- When fish was brought to shore
    LandingPort VARCHAR(200),
    
    -- Location Data
    CatchLatitude DECIMAL(10,7) NOT NULL,
    CatchLongitude DECIMAL(10,7) NOT NULL,
    CatchZoneID INTEGER, -- Link to RegulatoryZone
    DepthMeters DECIMAL(8,2),
    
    -- Species & Quantity
    SpeciesID INTEGER NOT NULL,
    WeightKG DECIMAL(10,3) NOT NULL,
    Quantity INTEGER, -- Number of individual fish
    AverageSizeCM DECIMAL(6,2),
    
    -- Condition & Quality
    FishCondition VARCHAR(50) DEFAULT 'Fresh', -- e.g., "Fresh", "Frozen", "Damaged"
    StorageMethod VARCHAR(100), -- e.g., "Ice", "Refrigerated", "Live"
    
    -- AI Verification
    AIConfidenceScore DECIMAL(5,2), -- 0-100, from dummy AI
    IsAIVerified BOOLEAN GENERATED ALWAYS AS (AIConfidenceScore >= 90.00) STORED,
    AIVerifiedAt DATETIME,
    
    -- Admin Review
    IsAdminVerified BOOLEAN DEFAULT 0,
    VerifiedBy INTEGER, -- AdminID
    VerifiedAt DATETIME,
    VerificationNotes TEXT,
    
    -- Traceability
    QRCode VARCHAR(255) UNIQUE, -- Unique QR identifier
    BatchNumber VARCHAR(100), -- For grouped catches
    
    -- Marketplace
    IsAvailable BOOLEAN DEFAULT 1, -- Available for purchase
    PricePerKG DECIMAL(10,2),
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (FisherID) REFERENCES FisherProfile(FisherID) ON DELETE CASCADE,
    FOREIGN KEY (VesselID) REFERENCES Vessel(VesselID) ON DELETE SET NULL,
    FOREIGN KEY (GearID) REFERENCES FishingGear(GearID) ON DELETE SET NULL,
    FOREIGN KEY (SpeciesID) REFERENCES Species(SpeciesID),
    FOREIGN KEY (CatchZoneID) REFERENCES RegulatoryZone(ZoneID),
    FOREIGN KEY (VerifiedBy) REFERENCES User(UserID)
);

CREATE INDEX idx_catch_fisher ON CatchRecord(FisherID);
CREATE INDEX idx_catch_date ON CatchRecord(CatchDate);
CREATE INDEX idx_catch_species ON CatchRecord(SpeciesID);
CREATE INDEX idx_catch_qr ON CatchRecord(QRCode);
CREATE INDEX idx_catch_verified ON CatchRecord(IsAIVerified, IsAdminVerified);
CREATE INDEX idx_catch_available ON CatchRecord(IsAvailable);

-- ============================================
-- 9. CATCH PHOTOS & MEDIA
-- ============================================

CREATE TABLE CatchPhoto (
    PhotoID INTEGER PRIMARY KEY AUTOINCREMENT,
    CatchID INTEGER NOT NULL,
    
    -- Image Data
    PhotoURL TEXT NOT NULL, -- Path to stored image
    ThumbnailURL TEXT,
    Caption VARCHAR(500),
    
    -- Metadata
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FileSize INTEGER, -- Bytes
    ImageWidth INTEGER,
    ImageHeight INTEGER,
    
    -- AI Analysis Results
    AIDetectedSpecies VARCHAR(200), -- What AI thinks it sees
    AIConfidence DECIMAL(5,2),
    
    FOREIGN KEY (CatchID) REFERENCES CatchRecord(CatchID) ON DELETE CASCADE
);

CREATE INDEX idx_photo_catch ON CatchPhoto(CatchID);

-- ============================================
-- 10. BUYER & ORGANIZATION PROFILES
-- ============================================

CREATE TABLE Organization (
    OrganizationID INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Basic Info
    OrganizationName VARCHAR(300) NOT NULL,
    OrganizationType VARCHAR(100), -- e.g., "Restaurant", "Wholesaler", "Retailer", "NGO", "Cooperative"
    RegistrationNumber VARCHAR(100),
    TaxID VARCHAR(100),
    
    -- Contact
    Address TEXT,
    City VARCHAR(100),
    State VARCHAR(100),
    Country VARCHAR(100) NOT NULL,
    PostalCode VARCHAR(20),
    PhoneNumber VARCHAR(20),
    Email VARCHAR(255),
    Website VARCHAR(300),
    
    -- Certifications
    HasSustainabilityCert BOOLEAN DEFAULT 0,
    CertificationBody VARCHAR(200), -- e.g., "MSC", "BAP"
    
    IsActive BOOLEAN DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_org_type ON Organization(OrganizationType);
CREATE INDEX idx_org_name ON Organization(OrganizationName);

CREATE TABLE BuyerProfile (
    BuyerID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    OrganizationID INTEGER,
    
    -- Buyer Type
    BuyerType VARCHAR(100) NOT NULL, -- e.g., "Restaurant", "Wholesaler", "Individual"
    
    -- Preferences
    PreferredSpecies TEXT, -- JSON array of SpeciesIDs
    MaxPricePerKG DECIMAL(10,2),
    DeliveryRadius INTEGER, -- KM
    
    -- Verification
    IsVerified BOOLEAN DEFAULT 0,
    VerifiedAt DATETIME,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
    FOREIGN KEY (OrganizationID) REFERENCES Organization(OrganizationID) ON DELETE SET NULL
);

CREATE INDEX idx_buyer_user ON BuyerProfile(UserID);
CREATE INDEX idx_buyer_org ON BuyerProfile(OrganizationID);

-- ============================================
-- 11. ORDERS & TRANSACTIONS
-- ============================================

CREATE TABLE "Order" (
    OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
    CatchID INTEGER NOT NULL,
    BuyerID INTEGER NOT NULL,
    FisherID INTEGER NOT NULL, -- Denormalized for quick queries
    
    -- Order Details
    OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    QuantityKG DECIMAL(10,3) NOT NULL,
    PricePerKG DECIMAL(10,2) NOT NULL,
    TotalPrice DECIMAL(12,2) GENERATED ALWAYS AS (QuantityKG * PricePerKG) STORED,
    
    -- Status
    OrderStatus VARCHAR(50) DEFAULT 'Pending' 
        CHECK(OrderStatus IN ('Pending', 'Confirmed', 'InTransit', 'Delivered', 'Cancelled')),
    StatusUpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Fulfillment
    ExpectedDeliveryDate DATE,
    ActualDeliveryDate DATE,
    DeliveryAddress TEXT,
    
    -- Notes
    BuyerNotes TEXT,
    FisherNotes TEXT,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (CatchID) REFERENCES CatchRecord(CatchID),
    FOREIGN KEY (BuyerID) REFERENCES BuyerProfile(BuyerID),
    FOREIGN KEY (FisherID) REFERENCES FisherProfile(FisherID)
);

CREATE INDEX idx_order_catch ON "Order"(CatchID);
CREATE INDEX idx_order_buyer ON "Order"(BuyerID);
CREATE INDEX idx_order_fisher ON "Order"(FisherID);
CREATE INDEX idx_order_status ON "Order"(OrderStatus);
CREATE INDEX idx_order_date ON "Order"(OrderDate);

-- ============================================
-- 12. PAYMENTS
-- ============================================

CREATE TABLE Payment (
    PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderID INTEGER NOT NULL,
    
    -- Payment Details
    Amount DECIMAL(12,2) NOT NULL,
    PaymentMethod VARCHAR(100), -- e.g., "Mobile Money", "Bank Transfer", "Cash", "Credit Card"
    PaymentStatus VARCHAR(50) DEFAULT 'Pending' 
        CHECK(PaymentStatus IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    
    -- Transaction Info
    TransactionID VARCHAR(255), -- External payment gateway transaction ID
    PaymentGateway VARCHAR(100), -- e.g., "M-Pesa", "Stripe", "PayPal"
    
    -- Dates
    PaymentDate DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Receipt
    ReceiptURL TEXT,
    
    FOREIGN KEY (OrderID) REFERENCES "Order"(OrderID) ON DELETE CASCADE
);

CREATE INDEX idx_payment_order ON Payment(OrderID);
CREATE INDEX idx_payment_status ON Payment(PaymentStatus);

-- ============================================
-- 13. CERTIFICATES & TRAINING
-- ============================================

CREATE TABLE Certificate (
    CertificateID INTEGER PRIMARY KEY AUTOINCREMENT,
    FisherID INTEGER NOT NULL,
    
    -- Certificate Details
    CertificateType VARCHAR(200) NOT NULL, -- e.g., "Safety Training", "Sustainable Fishing", "First Aid"
    CertificateName VARCHAR(300) NOT NULL,
    IssuingOrganization VARCHAR(300) NOT NULL,
    CertificateNumber VARCHAR(100),
    
    -- Dates
    IssueDate DATE NOT NULL,
    ExpiryDate DATE,
    IsExpired BOOLEAN GENERATED ALWAYS AS (ExpiryDate < DATE('now')) STORED,
    
    -- Verification
    IsVerified BOOLEAN DEFAULT 0,
    VerifiedBy INTEGER,
    VerifiedAt DATETIME,
    
    -- Document
    CertificateURL TEXT,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (FisherID) REFERENCES FisherProfile(FisherID) ON DELETE CASCADE,
    FOREIGN KEY (VerifiedBy) REFERENCES User(UserID)
);

CREATE INDEX idx_cert_fisher ON Certificate(FisherID);
CREATE INDEX idx_cert_expiry ON Certificate(ExpiryDate);

-- ============================================
-- 14. VERIFICATION AUDIT LOG
-- ============================================

CREATE TABLE VerificationResult (
    VerificationID INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- What was verified
    EntityType VARCHAR(50) NOT NULL, -- "FisherProfile", "License", "Catch", "Certificate"
    EntityID INTEGER NOT NULL, -- ID of the verified entity
    
    -- Verification Details
    VerificationType VARCHAR(100) NOT NULL, -- e.g., "Auto", "Manual", "AI", "Document Review"
    VerificationStatus VARCHAR(50) NOT NULL, -- "Passed", "Failed", "Pending"
    ConfidenceScore DECIMAL(5,2), -- 0-100
    
    -- Who & When
    VerifiedBy INTEGER, -- NULL if auto-verification
    VerifiedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Details
    VerificationNotes TEXT,
    FailureReasons TEXT, -- JSON array of failure reasons
    
    FOREIGN KEY (VerifiedBy) REFERENCES User(UserID)
);

CREATE INDEX idx_verification_entity ON VerificationResult(EntityType, EntityID);
CREATE INDEX idx_verification_status ON VerificationResult(VerificationStatus);

-- ============================================
-- 15. DATA SHARING & EXPORT LOG
-- ============================================

CREATE TABLE SharedDataLog (
    LogID INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- What was shared
    DataType VARCHAR(100) NOT NULL, -- e.g., "Catch Data", "Fisher Data", "Aggregated Stats"
    RecipientType VARCHAR(100), -- e.g., "NGO", "Government", "Research Institution"
    RecipientName VARCHAR(300),
    
    -- Anonymization
    IsAnonymized BOOLEAN DEFAULT 1,
    DataFormat VARCHAR(50), -- e.g., "CSV", "JSON", "PDF"
    
    -- When & By Whom
    SharedBy INTEGER,
    SharedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Details
    Description TEXT,
    FileURL TEXT,
    
    FOREIGN KEY (SharedBy) REFERENCES User(UserID)
);

CREATE INDEX idx_shared_type ON SharedDataLog(DataType);
CREATE INDEX idx_shared_date ON SharedDataLog(SharedAt);

-- ============================================
-- 16. NOTIFICATIONS
-- ============================================

CREATE TABLE Notification (
    NotificationID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    
    -- Notification Content
    NotificationType VARCHAR(100) NOT NULL, -- e.g., "LicenseExpiring", "OrderReceived", "CatchVerified"
    Title VARCHAR(300) NOT NULL,
    Message TEXT NOT NULL,
    
    -- Delivery
    DeliveryMethod VARCHAR(50), -- e.g., "Email", "SMS", "InApp"
    IsSent BOOLEAN DEFAULT 0,
    SentAt DATETIME,
    
    -- Status
    IsRead BOOLEAN DEFAULT 0,
    ReadAt DATETIME,
    
    -- Link
    ActionURL VARCHAR(500), -- Link to relevant page
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);

CREATE INDEX idx_notif_user ON Notification(UserID);
CREATE INDEX idx_notif_unread ON Notification(IsRead);

-- ============================================
-- 17. SYSTEM SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE SystemSetting (
    SettingID INTEGER PRIMARY KEY AUTOINCREMENT,
    SettingKey VARCHAR(100) UNIQUE NOT NULL,
    SettingValue TEXT NOT NULL,
    Description TEXT,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO SystemSetting (SettingKey, SettingValue, Description) VALUES
('MIN_TRUST_SCORE_FOR_CERTIFICATION', '70.00', 'Minimum trust score required for fisher certification'),
('MAX_DEMO_CATCHES_PRE_VERIFIED', '3', 'Maximum catches a pre-verified fisher can log'),
('AI_CONFIDENCE_THRESHOLD', '90.00', 'Minimum AI confidence score for automatic verification'),
('LICENSE_EXPIRY_WARNING_DAYS', '30', 'Days before license expiry to send warning notification'),
('AUTO_SUSPEND_EXPIRED_LICENSE', '1', 'Automatically suspend fishers with expired licenses (1=yes, 0=no)');

-- ============================================
-- 18. TRUST SCORE HISTORY
-- ============================================

CREATE TABLE TrustScoreHistory (
    HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    FisherID INTEGER NOT NULL,
    
    -- Score Details
    PreviousScore DECIMAL(5,2),
    NewScore DECIMAL(5,2) NOT NULL,
    ScoreChange DECIMAL(5,2) GENERATED ALWAYS AS (NewScore - PreviousScore) STORED,
    
    -- Reason
    ChangeReason VARCHAR(300) NOT NULL, -- e.g., "License verified", "Training completed", "Violation reported"
    ChangedBy INTEGER,
    ChangedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    Notes TEXT,
    
    FOREIGN KEY (FisherID) REFERENCES FisherProfile(FisherID) ON DELETE CASCADE,
    FOREIGN KEY (ChangedBy) REFERENCES User(UserID)
);

CREATE INDEX idx_trustscore_fisher ON TrustScoreHistory(FisherID);
CREATE INDEX idx_trustscore_date ON TrustScoreHistory(ChangedAt);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Verified Catches Available for Purchase
CREATE VIEW VerifiedCatchesAvailable AS
SELECT 
    c.CatchID,
    c.CatchDate,
    c.WeightKG,
    c.PricePerKG,
    c.QRCode,
    s.CommonName AS SpeciesName,
    s.ScientificName,
    f.UserID,
    u.FirstName || ' ' || u.LastName AS FisherName,
    fp.HomePort,
    fp.CertificationStatus,
    v.VesselName,
    c.CatchLatitude,
    c.CatchLongitude,
    c.AIConfidenceScore
FROM CatchRecord c
INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
INNER JOIN FisherProfile fp ON c.FisherID = fp.FisherID
INNER JOIN User u ON fp.UserID = u.UserID
LEFT JOIN Vessel v ON c.VesselID = v.VesselID
WHERE c.IsAvailable = 1
  AND c.IsAIVerified = 1
  AND fp.CertificationStatus = 'Certified';

-- View: Fisher Dashboard Summary
CREATE VIEW FisherDashboardSummary AS
SELECT 
    fp.FisherID,
    fp.UserID,
    u.FirstName || ' ' || u.LastName AS FisherName,
    fp.CertificationStatus,
    fp.TrustScore,
    COUNT(DISTINCT c.CatchID) AS TotalCatches,
    SUM(c.WeightKG) AS TotalWeightKG,
    COUNT(DISTINCT o.OrderID) AS TotalOrders,
    SUM(o.TotalPrice) AS TotalRevenue,
    MAX(l.ExpiryDate) AS NextLicenseExpiry
FROM FisherProfile fp
INNER JOIN User u ON fp.UserID = u.UserID
LEFT JOIN CatchRecord c ON fp.FisherID = c.FisherID
LEFT JOIN "Order" o ON fp.FisherID = o.FisherID
LEFT JOIN License l ON fp.FisherID = l.FisherID
GROUP BY fp.FisherID;

-- View: Admin Verification Queue
CREATE VIEW AdminVerificationQueue AS
SELECT 
    'Fisher' AS EntityType,
    fp.FisherID AS EntityID,
    u.FirstName || ' ' || u.LastName AS EntityName,
    fp.CertificationStatus AS Status,
    fp.CreatedAt AS SubmittedAt
FROM FisherProfile fp
INNER JOIN User u ON fp.UserID = u.UserID
WHERE fp.CertificationStatus IN ('Pending', 'PreVerified')

UNION ALL

SELECT 
    'Catch' AS EntityType,
    c.CatchID AS EntityID,
    s.CommonName AS EntityName,
    CASE 
        WHEN c.IsAdminVerified = 0 AND c.IsAIVerified = 1 THEN 'AI Verified - Needs Admin Review'
        WHEN c.IsAdminVerified = 0 AND c.IsAIVerified = 0 THEN 'Pending Verification'
        ELSE 'Verified'
    END AS Status,
    c.CreatedAt AS SubmittedAt
FROM CatchRecord c
INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
WHERE c.IsAdminVerified = 0;
