-- Add Fishing Licenses for All Fishers (Simple Version)
-- Works around generated column constraint by not specifying specific IDs

BEGIN TRANSACTION;

-- Fisher 1: John Fisher (Boston, Certified) - Valid license
INSERT INTO License (FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(1, 'US-MA-2024-12345', 'Commercial', 'Massachusetts Division of Marine Fisheries', 'USA', '2024-01-15', '2025-12-31', 1, 1, '2024-01-20 10:00:00', '/documents/licenses/us-ma-12345.pdf');

-- Fisher 2: Maria Santos (Kenya, Certified) - Expiring soon (Nov 2025)
INSERT INTO License (FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(2, 'KE-MB-2024-67890', 'Small-scale', 'Kenya Fisheries Service', 'Kenya', '2024-03-20', '2025-11-15', 1, 1, '2024-03-25 14:30:00', '/documents/licenses/ke-mb-67890.pdf');

-- Fisher 3: James Smith (Philippines, PreVerified) - Valid until May 2025
INSERT INTO License (FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(3, 'PH-MNL-2024-11111', 'Artisanal', 'Bureau of Fisheries and Aquatic Resources (BFAR)', 'Philippines', '2024-06-01', '2025-05-31', 1, 1, '2024-06-05 09:15:00', '/documents/licenses/ph-mnl-11111.pdf');

-- Fisher 4: Aisha Hassan (Senegal, Pending) - Unverified license
INSERT INTO License (FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(4, 'SN-DKR-2024-22222', 'Small-scale', 'Ministry of Fisheries and Maritime Economy', 'Senegal', '2024-08-10', '2025-10-20', 0, NULL, NULL, '/documents/licenses/sn-dkr-22222.pdf');

-- Fisher 5: Carlos Rivera (Mexico, Certified) - Valid long-term (until Jan 2026)
INSERT INTO License (FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(5, 'MX-BCS-2024-33333', 'Commercial', 'Comisión Nacional de Acuacultura y Pesca (CONAPESCA)', 'Mexico', '2024-02-01', '2026-01-31', 1, 1, '2024-02-05 11:20:00', '/documents/licenses/mx-bcs-33333.pdf');

-- Add a second (EXPIRED) license for Fisher 1 (for testing expiry display)
INSERT INTO License (FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(1, 'US-MA-2022-99999', 'Commercial', 'Massachusetts Division of Marine Fisheries', 'USA', '2022-01-01', '2023-12-31', 1, 1, '2022-01-10 10:00:00', '/documents/licenses/us-ma-99999-old.pdf');

-- Add an old EXPIRED license for Fisher 2 
INSERT INTO License (FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry, IssueDate, ExpiryDate, IsVerified, VerifiedBy, VerifiedAt, DocumentURL)
VALUES 
(2, 'KE-MB-2023-55555', 'Small-scale', 'Kenya Fisheries Service', 'Kenya', '2023-03-15', '2024-03-15', 1, 1, '2023-03-20 14:30:00', '/documents/licenses/ke-mb-55555-old.pdf');

COMMIT;

-- Verify the licenses were added (simple query without DATE functions)
SELECT 'Licenses added successfully!' as Status;
SELECT COUNT(*) as TotalLicenses FROM License;
SELECT 
    l.LicenseID,
    l.FisherID,
    u.FirstName || ' ' || u.LastName as FisherName,
    l.LicenseNumber,
    l.LicenseType,
    l.IssuingCountry,
    l.ExpiryDate,
    l.IsVerified
FROM License l
INNER JOIN FisherProfile fp ON l.FisherID = fp.FisherID
INNER JOIN User u ON fp.UserID = u.UserID
ORDER BY l.FisherID, l.ExpiryDate DESC;

