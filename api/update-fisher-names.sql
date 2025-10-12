-- Update Fisher Names and Emails
-- Make names more diverse and fix email format to firstnamelastname@gmail.com

BEGIN TRANSACTION;

-- Fisher 1: Update to more unique name and proper email
UPDATE User 
SET FirstName = 'Marcus', 
    LastName = 'Thompson',
    Email = 'marcusthompson@gmail.com'
WHERE UserID = 10;

-- Fisher 2: Update to more unique name and proper email
UPDATE User 
SET FirstName = 'Elena', 
    LastName = 'Rodriguez',
    Email = 'elenarodriguez@gmail.com'
WHERE UserID = 11;

-- Fisher 3: Update to more unique name and proper email
UPDATE User 
SET FirstName = 'Kwame', 
    LastName = 'Osei',
    Email = 'kwameosei@gmail.com'
WHERE UserID = 12;

-- Fisher 4: Update to more unique name and proper email
UPDATE User 
SET FirstName = 'Priya', 
    LastName = 'Sharma',
    Email = 'priyasharma@gmail.com'
WHERE UserID = 13;

-- Fisher 5: Update to more unique name and proper email
UPDATE User 
SET FirstName = 'Diego', 
    LastName = 'Fernandez',
    Email = 'diegofernandez@gmail.com'
WHERE UserID = 14;

-- Update buyer emails too for consistency
UPDATE User 
SET Email = 'sarahjohnson@gmail.com'
WHERE UserID = 20;

UPDATE User 
SET Email = 'michaelchen@gmail.com'
WHERE UserID = 21;

COMMIT;

-- Verify the updates
SELECT 'Fisher names and emails updated successfully!' as Status;
SELECT '---' as Separator;
SELECT 'Updated Fishers:' as Info;
SELECT 
    u.UserID,
    u.FirstName || ' ' || u.LastName as FullName,
    u.Email,
    fp.CertificationStatus,
    fp.Country,
    fp.HomePort
FROM User u
INNER JOIN FisherProfile fp ON u.UserID = fp.UserID
ORDER BY u.UserID;

