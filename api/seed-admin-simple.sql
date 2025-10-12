-- Simplified Seed Data for Admin Testing
-- Avoids issues with generated columns

BEGIN TRANSACTION;

-- Insert admin user
DELETE FROM User WHERE UserID = 1;
INSERT INTO User (UserID, Email, PasswordHash, Role, FirstName, LastName, PhoneNumber, CreatedAt, IsActive)
VALUES (1, 'admin@seatrue.com', 'hash123', 'Admin', 'System', 'Admin', '555-0100', CURRENT_TIMESTAMP, 1);

-- Insert sample fishers
DELETE FROM User WHERE UserID BETWEEN 10 AND 14;
INSERT INTO User (UserID, Email, PasswordHash, Role, FirstName, LastName, PhoneNumber, CreatedAt, IsActive)
VALUES 
(10, 'fisher1@email.com', 'hash123', 'Fisher', 'John', 'Fisher', '555-0101', CURRENT_TIMESTAMP, 1),
(11, 'fisher2@email.com', 'hash123', 'Fisher', 'Maria', 'Santos', '555-0102', CURRENT_TIMESTAMP, 1),
(12, 'fisher3@email.com', 'hash123', 'Fisher', 'James', 'Smith', '555-0103', CURRENT_TIMESTAMP, 1),
(13, 'fisher4@email.com', 'hash123', 'Fisher', 'Aisha', 'Hassan', '555-0104', CURRENT_TIMESTAMP, 1),
(14, 'fisher5@email.com', 'hash123', 'Fisher', 'Carlos', 'Rivera', '555-0105', CURRENT_TIMESTAMP, 1);

-- Insert fisher profiles
DELETE FROM FisherProfile WHERE FisherID BETWEEN 1 AND 5;
INSERT INTO FisherProfile (FisherID, UserID, Country, HomePort, YearsOfExperience, PrimaryFishingMethod, CertificationStatus, TrustScore, CreatedAt)
VALUES 
(1, 10, 'USA', 'Boston Harbor', 15, 'Line fishing', 'Certified', 92.5, CURRENT_TIMESTAMP),
(2, 11, 'Kenya', 'Mombasa', 8, 'Net fishing', 'Certified', 88.0, CURRENT_TIMESTAMP),
(3, 12, 'Philippines', 'Manila Bay', 12, 'Trap fishing', 'PreVerified', 75.5, CURRENT_TIMESTAMP),
(4, 13, 'Senegal', 'Dakar', 6, 'Line fishing', 'Pending', 0, CURRENT_TIMESTAMP),
(5, 14, 'Mexico', 'Cabo San Lucas', 20, 'Longline', 'Certified', 95.0, CURRENT_TIMESTAMP);

-- Insert sample species (skip if exists)
INSERT OR IGNORE INTO Species (SpeciesID, CommonName, ScientificName, Category, ConservationStatus, IUCNRedListStatus, IsCommerciallyAllowed)
VALUES 
(1, 'Atlantic Cod', 'Gadus morhua', 'Finfish', 'Vulnerable', 'VU', 1),
(2, 'Yellowfin Tuna', 'Thunnus albacares', 'Finfish', 'Near Threatened', 'NT', 1),
(3, 'Red Snapper', 'Lutjanus campechanus', 'Finfish', 'Vulnerable', 'VU', 1),
(4, 'Mahi-Mahi', 'Coryphaena hippurus', 'Finfish', 'Least Concern', 'LC', 1),
(5, 'King Mackerel', 'Scomberomorus cavalla', 'Finfish', 'Least Concern', 'LC', 1);

-- Insert catch records
DELETE FROM CatchRecord WHERE CatchID BETWEEN 1 AND 10;
INSERT INTO CatchRecord (
    CatchID, FisherID, SpeciesID, CatchDate, CatchLatitude, CatchLongitude, 
    WeightKG, PricePerKG, AIConfidenceScore, IsAdminVerified, VerifiedBy, 
    IsAvailable, FishCondition, StorageMethod, LandingPort
)
VALUES 
-- Verified catches
(1, 1, 1, '2025-10-10', 42.3601, -71.0589, 25.5, 12.50, 95.2, 1, 1, 1, 'Fresh', 'Ice', 'Boston Harbor'),
(2, 2, 4, '2025-10-09', -4.0435, 39.6682, 18.2, 8.75, 92.8, 1, 1, 1, 'Fresh', 'Ice', 'Mombasa'),
(3, 5, 2, '2025-10-08', 22.8905, -109.9167, 45.0, 15.00, 96.5, 1, 1, 1, 'Fresh', 'Refrigerated', 'Cabo San Lucas'),
(4, 1, 3, '2025-10-11', 42.3601, -71.0589, 12.3, 18.50, 91.0, 1, 1, 1, 'Fresh', 'Ice', 'Boston Harbor'),
-- AI verified, pending admin
(5, 2, 5, '2025-10-11', -4.0435, 39.6682, 8.5, 6.25, 90.5, 0, NULL, 1, 'Fresh', 'Ice', 'Mombasa'),
(6, 5, 4, '2025-10-11', 22.8905, -109.9167, 22.0, 9.50, 93.2, 0, NULL, 1, 'Fresh', 'Ice', 'Cabo San Lucas'),
-- Flagged catches
(7, 3, 1, '2025-10-10', 14.5995, 120.9842, 15.0, 10.00, 75.5, 0, NULL, 1, 'Fresh', 'Ice', 'Manila Bay'),
(8, 3, 3, '2025-10-09', 14.5995, 120.9842, 10.2, 16.00, 68.2, 0, NULL, 1, 'Fresh', 'Ice', 'Manila Bay'),
-- Recent catches
(9, 1, 5, '2025-10-12', 42.3601, -71.0589, 14.5, 7.50, 94.8, 0, NULL, 1, 'Fresh', 'Ice', 'Boston Harbor'),
(10, 2, 2, '2025-10-12', -4.0435, 39.6682, 38.0, 14.50, 92.0, 0, NULL, 1, 'Fresh', 'Refrigerated', 'Mombasa');

-- Insert sample buyers
DELETE FROM User WHERE UserID BETWEEN 20 AND 21;
INSERT INTO User (UserID, Email, PasswordHash, Role, FirstName, LastName, PhoneNumber, CreatedAt, IsActive)
VALUES 
(20, 'buyer1@restaurant.com', 'hash123', 'Buyer', 'Sarah', 'Johnson', '555-0201', CURRENT_TIMESTAMP, 1),
(21, 'buyer2@market.com', 'hash123', 'Buyer', 'Michael', 'Chen', '555-0202', CURRENT_TIMESTAMP, 1);

DELETE FROM BuyerProfile WHERE BuyerID BETWEEN 1 AND 2;
INSERT INTO BuyerProfile (BuyerID, UserID, BuyerType, IsVerified)
VALUES 
(1, 20, 'Restaurant', 1),
(2, 21, 'Wholesaler', 1);

-- Insert sample orders
DELETE FROM "Order" WHERE OrderID BETWEEN 1 AND 4;
INSERT INTO "Order" (OrderID, CatchID, BuyerID, FisherID, OrderDate, QuantityKG, PricePerKG, OrderStatus)
VALUES 
(1, 1, 1, 1, '2025-10-10 14:30:00', 25.5, 12.50, 'Delivered'),
(2, 2, 2, 2, '2025-10-09 16:45:00', 18.2, 8.75, 'Delivered'),
(3, 3, 1, 5, '2025-10-08 11:20:00', 45.0, 15.00, 'InTransit'),
(4, 4, 2, 1, '2025-10-11 09:15:00', 12.3, 18.50, 'Confirmed');

-- Insert audit log entries
DELETE FROM VerificationResult WHERE VerificationID BETWEEN 1 AND 10;
INSERT INTO VerificationResult (EntityType, EntityID, VerificationType, VerificationStatus, ConfidenceScore, VerifiedBy, VerificationNotes)
VALUES 
('FisherProfile', 1, 'Manual', 'Passed', 100, 1, 'Fisher approved after document verification'),
('FisherProfile', 2, 'Manual', 'Passed', 100, 1, 'Fisher approved - all documents in order'),
('Catch', 1, 'Manual', 'Passed', 95.2, 1, 'Catch manually verified by admin'),
('Catch', 2, 'Manual', 'Passed', 92.8, 1, 'Catch manually verified by admin'),
('Catch', 3, 'Manual', 'Passed', 96.5, 1, 'Catch manually verified by admin'),
('FisherProfile', 5, 'Manual', 'Passed', 100, 1, 'Fisher approved - excellent track record'),
('Catch', 4, 'Manual', 'Passed', 91.0, 1, 'Catch manually verified by admin');

-- Update trust score timestamps
UPDATE FisherProfile 
SET LastTrustScoreUpdate = CURRENT_TIMESTAMP
WHERE FisherID IN (1, 2, 3, 4, 5);

-- Insert trust score history
DELETE FROM TrustScoreHistory WHERE FisherID BETWEEN 1 AND 5;
INSERT INTO TrustScoreHistory (FisherID, PreviousScore, NewScore, ChangeReason, ChangedBy)
VALUES 
(1, 85.0, 92.5, 'Consistent verified catches', 1),
(2, 80.0, 88.0, 'License verified', 1),
(3, 70.0, 75.5, 'Profile pre-verified', 1),
(5, 90.0, 95.0, 'Excellent track record', 1);

COMMIT;

-- Success message
SELECT 'Seed data loaded successfully!' as Status;
SELECT COUNT(*) as TotalFishers FROM FisherProfile;
SELECT COUNT(*) as TotalCatches FROM CatchRecord;
SELECT COUNT(*) as TotalOrders FROM "Order";

