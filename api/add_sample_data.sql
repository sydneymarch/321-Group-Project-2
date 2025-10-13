-- Add more impressive sample data for SeaTrue homepage

-- Insert more verified fishers (total will be ~50)
INSERT INTO User (Email, PasswordHash, Role, FirstName, LastName, PhoneNumber, LastLoginAt) VALUES
('maria.santos@fisherman.com', 'hash123', 'Fisher', 'Maria', 'Santos', '555-0101', datetime('now')),
('john.alaska@fisherman.com', 'hash123', 'Fisher', 'John', 'Alaska', '555-0102', datetime('now')),
('lucia.mediterranean@fisherman.com', 'hash123', 'Fisher', 'Lucia', 'Mediterranean', '555-0103', datetime('now')),
('takeshi.pacific@fisherman.com', 'hash123', 'Fisher', 'Takeshi', 'Pacific', '555-0104', datetime('now')),
('ahmed.redsea@fisherman.com', 'hash123', 'Fisher', 'Ahmed', 'RedSea', '555-0105', datetime('now')),
('sophie.atlantic@fisherman.com', 'hash123', 'Fisher', 'Sophie', 'Atlantic', '555-0106', datetime('now')),
('carlos.caribbean@fisherman.com', 'hash123', 'Fisher', 'Carlos', 'Caribbean', '555-0107', datetime('now')),
('anna.baltic@fisherman.com', 'hash123', 'Fisher', 'Anna', 'Baltic', '555-0108', datetime('now')),
('ibrahim.indian@fisherman.com', 'hash123', 'Fisher', 'Ibrahim', 'Indian', '555-0109', datetime('now')),
('elena.aegean@fisherman.com', 'hash123', 'Fisher', 'Elena', 'Aegean', '555-0110', datetime('now'));

-- Create Fisher Profiles for new users (starting from UserID 7 if you have 6 existing)
INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'USA', 'Maine', 'Portland', 15, 'Line fishing', 'Portland Harbor', 'Certified', 95.0
FROM User WHERE Email = 'maria.santos@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'USA', 'Alaska', 'Juneau', 20, 'Net fishing', 'Juneau Port', 'Certified', 98.0
FROM User WHERE Email = 'john.alaska@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'Spain', 'Valencia', 'Valencia', 12, 'Trap fishing', 'Valencia Harbor', 'Certified', 92.0
FROM User WHERE Email = 'lucia.mediterranean@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'Japan', 'Hokkaido', 'Sapporo', 25, 'Line fishing', 'Sapporo Port', 'Certified', 99.0
FROM User WHERE Email = 'takeshi.pacific@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'Egypt', 'Red Sea', 'Hurghada', 18, 'Net fishing', 'Hurghada Marina', 'Certified', 94.0
FROM User WHERE Email = 'ahmed.redsea@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'USA', 'Massachusetts', 'Boston', 22, 'Trolling', 'Boston Harbor', 'Certified', 97.0
FROM User WHERE Email = 'sophie.atlantic@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'Jamaica', 'Kingston', 'Kingston', 14, 'Trap fishing', 'Kingston Port', 'Certified', 93.0
FROM User WHERE Email = 'carlos.caribbean@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'Sweden', 'Stockholm', 'Stockholm', 16, 'Net fishing', 'Stockholm Harbor', 'Certified', 96.0
FROM User WHERE Email = 'anna.baltic@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'India', 'Kerala', 'Kochi', 19, 'Line fishing', 'Kochi Port', 'Certified', 95.0
FROM User WHERE Email = 'ibrahim.indian@fisherman.com';

INSERT INTO FisherProfile (UserID, Country, State, City, YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus, TrustScore)
SELECT UserID, 'Greece', 'Crete', 'Heraklion', 21, 'Trolling', 'Heraklion Marina', 'Certified', 98.0
FROM User WHERE Email = 'elena.aegean@fisherman.com';

-- Add more verified catches with good prices (total will be ~150 verified catches)
-- Bluefin Tuna (high value)
INSERT INTO CatchRecord (FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude, WeightKG, AverageSizeCM, FishCondition, StorageMethod, AIConfidenceScore, IsAdminVerified, IsAvailable, PricePerKG, LandingPort)
SELECT fp.FisherID, 3, date('now', '-' || (abs(random()) % 30) || ' days'), '08:30', 42.3601, -71.0589, 45.5 + (abs(random()) % 50), 180 + (abs(random()) % 40), 'Fresh', 'Ice', 95.0 + (abs(random()) % 5), 1, 1, 85.00 + (abs(random()) % 40), fp.HomePort
FROM FisherProfile fp WHERE fp.CertificationStatus = 'Certified' LIMIT 20;

-- Atlantic Salmon (medium-high value)
INSERT INTO CatchRecord (FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude, WeightKG, AverageSizeCM, FishCondition, StorageMethod, AIConfidenceScore, IsAdminVerified, IsAvailable, PricePerKG, LandingPort)
SELECT fp.FisherID, 2, date('now', '-' || (abs(random()) % 30) || ' days'), '09:15', 44.8378, -68.7739, 5.5 + (abs(random()) % 8), 70 + (abs(random()) % 20), 'Fresh', 'Ice', 93.0 + (abs(random()) % 7), 1, 1, 32.00 + (abs(random()) % 18), fp.HomePort
FROM FisherProfile fp WHERE fp.CertificationStatus = 'Certified' LIMIT 30;

-- Red Snapper (medium value)
INSERT INTO CatchRecord (FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude, WeightKG, AverageSizeCM, FishCondition, StorageMethod, AIConfidenceScore, IsAdminVerified, IsAvailable, PricePerKG, LandingPort)
SELECT fp.FisherID, 6, date('now', '-' || (abs(random()) % 30) || ' days'), '10:45', 29.7604, -95.3698, 3.2 + (abs(random()) % 5), 45 + (abs(random()) % 15), 'Fresh', 'Ice', 91.0 + (abs(random()) % 9), 1, 1, 28.00 + (abs(random()) % 15), fp.HomePort
FROM FisherProfile fp WHERE fp.CertificationStatus = 'Certified' LIMIT 25;

-- Yellowfin Tuna (high value)
INSERT INTO CatchRecord (FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude, WeightKG, AverageSizeCM, FishCondition, StorageMethod, AIConfidenceScore, IsAdminVerified, IsAvailable, PricePerKG, LandingPort)
SELECT fp.FisherID, 4, date('now', '-' || (abs(random()) % 30) || ' days'), '11:20', 21.3099, -157.8581, 32.0 + (abs(random()) % 35), 140 + (abs(random()) % 30), 'Fresh', 'Refrigerated', 94.0 + (abs(random()) % 6), 1, 1, 42.00 + (abs(random()) % 28), fp.HomePort
FROM FisherProfile fp WHERE fp.CertificationStatus = 'Certified' LIMIT 20;

-- Halibut (medium-high value)
INSERT INTO CatchRecord (FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude, WeightKG, AverageSizeCM, FishCondition, StorageMethod, AIConfidenceScore, IsAdminVerified, IsAvailable, PricePerKG, LandingPort)
SELECT fp.FisherID, 5, date('now', '-' || (abs(random()) % 30) || ' days'), '07:45', 58.3019, -134.4197, 18.0 + (abs(random()) % 25), 110 + (abs(random()) % 35), 'Fresh', 'Ice', 92.0 + (abs(random()) % 8), 1, 1, 35.00 + (abs(random()) % 20), fp.HomePort
FROM FisherProfile fp WHERE fp.CertificationStatus = 'Certified' LIMIT 25;

-- Mahi-Mahi (medium value)
INSERT INTO CatchRecord (FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude, WeightKG, AverageSizeCM, FishCondition, StorageMethod, AIConfidenceScore, IsAdminVerified, IsAvailable, PricePerKG, LandingPort)
SELECT fp.FisherID, 8, date('now', '-' || (abs(random()) % 30) || ' days'), '12:30', 18.2208, -66.5901, 8.5 + (abs(random()) % 12), 85 + (abs(random()) % 25), 'Fresh', 'Ice', 90.0 + (abs(random()) % 10), 1, 1, 26.00 + (abs(random()) % 14), fp.HomePort
FROM FisherProfile fp WHERE fp.CertificationStatus = 'Certified' LIMIT 20;

-- Atlantic Cod (lower-medium value)
INSERT INTO CatchRecord (FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude, WeightKG, AverageSizeCM, FishCondition, StorageMethod, AIConfidenceScore, IsAdminVerified, IsAvailable, PricePerKG, LandingPort)
SELECT fp.FisherID, 1, date('now', '-' || (abs(random()) % 30) || ' days'), '06:15', 43.6591, -70.2568, 4.8 + (abs(random()) % 7), 65 + (abs(random()) % 20), 'Fresh', 'Ice', 89.0 + (abs(random()) % 11), 1, 1, 18.00 + (abs(random()) % 10), fp.HomePort
FROM FisherProfile fp WHERE fp.CertificationStatus = 'Certified' LIMIT 20;

