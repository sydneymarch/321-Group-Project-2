-- Add Fishing Licenses for All Fishers
-- This script adds realistic fishing licenses for each fisher in the database

BEGIN TRANSACTION;

-- Delete any existing test licenses to avoid duplicates
DELETE FROM License WHERE LicenseID BETWEEN 1 AND 10;

-- Fisher 1: John Fisher (Boston, Certified) - Valid license
INSERT INTO License (LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(1, 1, 'US-MA-2024-12345', 'Commercial', 'Massachusetts Division of Marine Fisheries', 'USA', '2024-01-15', '2025-12-31', 1, 1, '2024-01-20 10:00:00', '/documents/licenses/us-ma-12345.pdf');

-- Fisher 2: Maria Santos (Kenya, Certified) - Expiring soon
INSERT INTO License (LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(2, 2, 'KE-MB-2024-67890', 'Small-scale', 'Kenya Fisheries Service', 'Kenya', '2024-03-20', '2025-11-15', 1, 1, '2024-03-25 14:30:00', '/documents/licenses/ke-mb-67890.pdf');

-- Fisher 3: James Smith (Philippines, PreVerified) - Valid
INSERT INTO License (LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(3, 3, 'PH-MNL-2024-11111', 'Artisanal', 'Bureau of Fisheries and Aquatic Resources (BFAR)', 'Philippines', '2024-06-01', '2025-05-31', 1, 1, '2024-06-05 09:15:00', '/documents/licenses/ph-mnl-11111.pdf');

-- Fisher 4: Aisha Hassan (Senegal, Pending) - Unverified license
INSERT INTO License (LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(4, 4, 'SN-DKR-2024-22222', 'Small-scale', 'Ministry of Fisheries and Maritime Economy', 'Senegal', '2024-08-10', '2025-10-20', 0, NULL, NULL, '/documents/licenses/sn-dkr-22222.pdf');

-- Fisher 5: Carlos Rivera (Mexico, Certified) - Valid long-term
INSERT INTO License (LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(5, 5, 'MX-BCS-2024-33333', 'Commercial', 'Comisión Nacional de Acuacultura y Pesca (CONAPESCA)', 'Mexico', '2024-02-01', '2026-01-31', 1, 1, '2024-02-05 11:20:00', '/documents/licenses/mx-bcs-33333.pdf');

-- Add a second (expired) license for Fisher 1 (for testing)
INSERT INTO License (LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(6, 1, 'US-MA-2022-99999', 'Commercial', 'Massachusetts Division of Marine Fisheries', 'USA', '2022-01-01', '2023-12-31', 1, 1, '2022-01-10 10:00:00', '/documents/licenses/us-ma-99999-old.pdf');

-- Add secondary license for Fisher 2 (old expired one)
INSERT INTO License (LicenseID, FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(7, 2, 'KE-MB-2023-55555', 'Small-scale', 'Kenya Fisheries Service', 'Kenya', '2023-03-15', '2024-03-15', 1, 1, '2023-03-20 14:30:00', '/documents/licenses/ke-mb-55555-old.pdf');

COMMIT;

-- Verify the licenses were added
SELECT 'Licenses added successfully!' as Status;
SELECT 
    l.LicenseID,
    l.FisherID,
    u.FirstName || ' ' || u.LastName as FisherName,
    l.LicenseNumber,
    l.LicenseType,
    l.IssuingCountry,
    l.ExpiryDate,
    l.IsVerified,
    CASE 
        WHEN l.ExpiryDate < DATE('now') THEN 'EXPIRED'
        WHEN l.ExpiryDate < DATE('now', '+30 days') THEN 'EXPIRING SOON'
        ELSE 'VALID'
    END as Status
FROM License l
INNER JOIN FisherProfile fp ON l.FisherID = fp.FisherID
INNER JOIN User u ON fp.UserID = u.UserID
ORDER BY l.FisherID, l.ExpiryDate DESC;

