# 🧪 SeaTrue - Comprehensive Testing Guide

## ✅ All Functional Bugs Fixed!

All critical functional bugs have been resolved:
- ✅ Fisher catch submission now works and saves to database
- ✅ Order creation properly creates Order records when buyers claim purchases
- ✅ Authentication checks implemented for all protected actions
- ✅ Admin actions use session user ID instead of hardcoded values
- ✅ Photo upload converts to base64 and saves reference

---

## 📋 Pre-Testing Setup

### 1. Start the Backend API
```bash
cd api
dotnet run
```
**Expected Output:** API should start on `http://localhost:5142`

### 2. Start the Frontend
Use Live Server or similar:
- Right-click on `client/resources/homepage.html`
- Select "Open with Live Server"
- Should open at `http://127.0.0.1:5500/client/resources/homepage.html`

### 3. Verify Database Exists
Check that `api/database.db` exists. If not:
```bash
cd api
sqlite3 database.db < schema.sql
sqlite3 database.db < seed-admin-simple.sql
sqlite3 database.db < add_sample_data.sql
```

---

## 🧑‍💼 TEST SUITE 1: ADMIN FUNCTIONALITY

### Test 1.1: Admin Login
**Steps:**
1. Go to homepage
2. Click "Login"
3. Enter credentials:
   - Email: `admin@seatrue.com`
   - Password: `admin123`
4. Click "Login"

**Expected Results:**
- ✅ Navbar shows "Admin" link
- ✅ Redirects to admin.html
- ✅ Dashboard loads with metrics

### Test 1.2: View Fisher List
**Steps:**
1. Login as admin (Test 1.1)
2. Navigate to Admin page
3. Check "Fisher Management" section

**Expected Results:**
- ✅ List of fishers displays
- ✅ Shows certification status for each
- ✅ Shows trust scores
- ✅ Can filter by status (Pending/Certified/etc.)

### Test 1.3: Approve Fisher
**Steps:**
1. Login as admin
2. Find a "Pending" fisher
3. Click "Approve" button
4. Check database: `SELECT * FROM FisherProfile WHERE FisherID = X;`

**Expected Results:**
- ✅ Status changes to "Certified"
- ✅ CertifiedBy field has admin's UserID (not hardcoded 1)
- ✅ CertifiedAt timestamp is set
- ✅ Success message displays

### Test 1.4: Verify Catch
**Steps:**
1. Login as admin
2. Go to "Catch Verification" section
3. Find an unverified catch
4. Click "Verify"
5. Add optional notes
6. Confirm verification

**Expected Results:**
- ✅ Catch IsAdminVerified = 1
- ✅ VerifiedBy has admin's UserID (not hardcoded)
- ✅ VerifiedAt timestamp set
- ✅ Verification notes saved

### Test 1.5: Export Data
**Steps:**
1. Login as admin
2. Click "Export Catches" (JSON format)
3. Check browser downloads
4. Verify database: `SELECT * FROM SharedDataLog ORDER BY LogID DESC LIMIT 1;`

**Expected Results:**
- ✅ JSON file downloads with catch data
- ✅ SharedDataLog has entry with admin's UserID (not hardcoded 1)
- ✅ CSV export also works

---

## 🎣 TEST SUITE 2: FISHER FUNCTIONALITY

### Test 2.1: Fisher Signup
**Steps:**
1. Go to homepage
2. Click "Sign Up"
3. Select Role: "Fisher"
4. Fill basic info:
   - Email: `testfisher@test.com`
   - Password: `fisher123`
   - First Name: `Test`
   - Last Name: `Fisher`
   - Phone: `555-1234`
5. Fill fisher details:
   - National ID: `NAT-12345`
   - Date of Birth: `1990-01-01`
   - Address: `123 Ocean Ave`
   - City: `Portland`
   - State: `Maine`
   - Country: `USA`
   - Postal Code: `04101`
   - Years Experience: `10`
   - Fishing Method: `Line fishing`
   - Home Port: `Portland Harbor`
6. Fill license info:
   - License Number: `ME-FISH-001`
   - License Type: `Commercial`
   - Issuing Authority: `Maine DMR`
   - Issue Date: `2020-01-01`
   - Expiry Date: `2025-12-31`
7. Click "Create Account"

**Expected Results:**
- ✅ Account created successfully
- ✅ Redirects to fisher.html
- ✅ User record created in database
- ✅ FisherProfile created
- ✅ License record created
- ✅ Session token saved

### Test 2.2: Fisher Login
**Steps:**
1. Logout if logged in
2. Click "Login"
3. Enter:
   - Email: `testfisher@test.com`
   - Password: `fisher123`
4. Click "Login"

**Expected Results:**
- ✅ Login successful
- ✅ Redirects to fisher.html
- ✅ Navbar shows "Verify your catch"
- ✅ Session persists on refresh

### Test 2.3: Submit Catch (CRITICAL TEST)
**Steps:**
1. Login as fisher
2. Go to fisher.html
3. Fill catch form:
   - Species: `Atlantic Cod` (or any valid species from dropdown - DO NOT select "Other")
   - Weight: `15.5` lbs
   - Length: `28` inches
   - Catch Date: (today's date)
   - Catch Time: `08:30`
   - Click "Use Current Location" (or enter manually):
     - Latitude: `43.6591`
     - Longitude: `-70.2568`
   - Fishing Method: `Line fishing`
   - Water Depth: `150` meters
   - Condition: `Fresh`
   - Storage: `Ice`
   - Quantity: `1`
   - Price per KG: `25.00`
   - Landing Port: `Portland Harbor`
4. Upload a photo (any image)
5. Click "Submit Catch"
6. Review AI verification modal
7. Click "Confirm Upload"

**Expected Results:**
- ✅ Loading spinner shows
- ✅ API POST request to `/api/SeaTrue/catches/submit`
- ✅ Success message with QR Code and AI confidence score
- ✅ Database check: `SELECT * FROM CatchRecord ORDER BY CatchID DESC LIMIT 1;`
  - FisherID matches logged-in fisher
  - Weight converted from lbs to kg (15.5 lbs = ~7.03 kg)
  - Length converted from inches to cm (28 in = ~71.12 cm)
  - QRCode starts with "ST-"
  - AIConfidenceScore calculated
  - IsAvailable = 1
- ✅ CatchPhoto record created (if photo uploaded)
- ✅ Form resets after submission

### Test 2.4: Submit Catch Without Login
**Steps:**
1. Logout
2. Try to access fisher.html
3. Try to submit catch

**Expected Results:**
- ✅ Can access form
- ✅ On submit, returns 401 Unauthorized
- ✅ Shows "Not authenticated" error

---

## 🛒 TEST SUITE 3: BUYER FUNCTIONALITY

### Test 3.1: Buyer Signup
**Steps:**
1. Click "Sign Up"
2. Select Role: "Buyer"
3. Fill basic info:
   - Email: `testbuyer@test.com`
   - Password: `buyer123`
   - First Name: `Test`
   - Last Name: `Buyer`
   - Phone: `555-5678`
4. Fill buyer details:
   - Buyer Type: `Restaurant`
   - Date of Birth: `1985-05-15`
   - Delivery Address: `456 Main St, Boston, MA`
5. (Optional) Check "I'm representing an organization"
   - Organization Name: `Ocean Bistro`
   - Type: `Restaurant`
   - Registration: `REG-001`
   - Tax ID: `TAX-001`
6. Click "Create Account"

**Expected Results:**
- ✅ Account created
- ✅ Redirects to marketplace.html
- ✅ BuyerProfile created
- ✅ Organization created (if checked)

### Test 3.2: View Marketplace
**Steps:**
1. Go to marketplace.html
2. Browse available catches

**Expected Results:**
- ✅ List of available catches displays
- ✅ Shows species, weight, price, location
- ✅ Shows verification badges
- ✅ Conservation status badges
- ✅ Filters work (species, location, price range)

### Test 3.3: Claim Purchase (CRITICAL TEST)
**Steps:**
1. Login as buyer (`testbuyer@test.com` / `buyer123`)
2. Go to marketplace
3. Click on a catch card
4. Review details in modal
5. Click "Claim Purchase"

**Expected Results:**
- ✅ Success message with Order ID and total price
- ✅ Database check: `SELECT * FROM "Order" ORDER BY OrderID DESC LIMIT 1;`
  - CatchID matches selected catch
  - BuyerID matches logged-in buyer (from session)
  - FisherID matches catch fisher
  - OrderStatus = 'Pending'
  - TotalPrice calculated correctly
  - ExpectedDeliveryDate = 3 days from now
- ✅ Catch IsAvailable updated to 0
- ✅ Catch removed from marketplace
- ✅ Modal closes

### Test 3.4: Claim Purchase Without Login
**Steps:**
1. Logout
2. Go to marketplace
3. Click on catch
4. Click "Claim Purchase"

**Expected Results:**
- ✅ Shows "Please login as a buyer" alert
- ✅ Login modal opens (if available)
- ✅ No order created

### Test 3.5: Fisher Tries to Claim Purchase
**Steps:**
1. Login as fisher
2. Go to marketplace
3. Try to claim purchase

**Expected Results:**
- ✅ Shows "Only buyers can claim purchases" error
- ✅ No order created

---

## 🔄 TEST SUITE 4: CROSS-FUNCTIONAL TESTS

### Test 4.1: End-to-End Flow
**Steps:**
1. Fisher signs up → submits catch
2. Admin logs in → verifies catch
3. Buyer logs in → claims purchase
4. Verify all database records

**Expected Results:**
- ✅ User → FisherProfile → License chain created
- ✅ CatchRecord created with proper conversions
- ✅ Admin verification updates catch
- ✅ Order created linking buyer, fisher, and catch
- ✅ Catch marked unavailable

### Test 4.2: Session Persistence
**Steps:**
1. Login as any user
2. Refresh page
3. Navigate between pages
4. Close browser and reopen

**Expected Results:**
- ✅ User stays logged in on refresh
- ✅ User stays logged in when navigating
- ✅ Session persists for 24 hours
- ✅ Navbar updates correctly

### Test 4.3: Role-Based Access
**Steps:**
1. Login as Fisher → Try to access admin endpoints
2. Login as Buyer → Try to submit catch
3. Login as Admin → Try all features

**Expected Results:**
- ✅ Fisher cannot approve other fishers
- ✅ Buyer cannot submit catches
- ✅ Only logged-in fishers can submit catches
- ✅ Only logged-in buyers can claim purchases
- ✅ Admin can access all admin features

---

## 🐛 TEST SUITE 5: ERROR HANDLING

### Test 5.1: Invalid Data
**Steps:**
1. Submit catch with invalid coordinates (lat > 90)
2. Submit catch with negative weight
3. Submit catch with non-existent species

**Expected Results:**
- ✅ Validation errors shown
- ✅ No database records created
- ✅ User-friendly error messages

### Test 5.2: Network Errors
**Steps:**
1. Stop API server
2. Try to submit catch
3. Try to claim purchase

**Expected Results:**
- ✅ "Network error" message displays
- ✅ Form doesn't reset
- ✅ User can retry after fixing connection

### Test 5.3: Duplicate Actions
**Steps:**
1. Submit same catch twice
2. Claim already claimed purchase
3. Approve already approved fisher

**Expected Results:**
- ✅ Appropriate error messages
- ✅ No duplicate records
- ✅ Database integrity maintained

---

## 📊 DATABASE VERIFICATION QUERIES

### Check Catch Submission
```sql
-- Most recent catch
SELECT 
    c.CatchID, 
    c.FisherID, 
    s.CommonName, 
    c.WeightKG, 
    c.AIConfidenceScore, 
    c.QRCode,
    u.Email as FisherEmail
FROM CatchRecord c
JOIN Species s ON c.SpeciesID = s.SpeciesID
JOIN FisherProfile fp ON c.FisherID = fp.FisherID
JOIN User u ON fp.UserID = u.UserID
ORDER BY c.CatchID DESC 
LIMIT 1;
```

### Check Order Creation
```sql
-- Most recent order
SELECT 
    o.OrderID,
    o.OrderStatus,
    o.TotalPrice,
    ub.Email as BuyerEmail,
    uf.Email as FisherEmail,
    s.CommonName as Species
FROM "Order" o
JOIN BuyerProfile bp ON o.BuyerID = bp.BuyerID
JOIN User ub ON bp.UserID = ub.UserID
JOIN FisherProfile fp ON o.FisherID = fp.FisherID
JOIN User uf ON fp.UserID = uf.UserID
JOIN CatchRecord c ON o.CatchID = c.CatchID
JOIN Species s ON c.SpeciesID = s.SpeciesID
ORDER BY o.OrderID DESC
LIMIT 1;
```

### Check Admin Actions
```sql
-- Recent admin verifications (should have actual admin ID, not 1)
SELECT 
    VerificationID,
    EntityType,
    EntityID,
    VerifiedBy,
    u.Email as AdminEmail,
    VerifiedAt
FROM VerificationResult vr
LEFT JOIN User u ON vr.VerifiedBy = u.UserID
ORDER BY VerificationID DESC
LIMIT 5;
```

### Check Photo Upload
```sql
-- Catches with photos
SELECT 
    c.CatchID,
    s.CommonName,
    cp.PhotoURL,
    cp.UploadedAt
FROM CatchPhoto cp
JOIN CatchRecord c ON cp.CatchID = c.CatchID
JOIN Species s ON c.SpeciesID = s.SpeciesID
ORDER BY cp.PhotoID DESC
LIMIT 5;
```

---

## ✅ SUCCESS CRITERIA CHECKLIST

### Fisher Flow
- [ ] Fisher can sign up with complete profile
- [ ] Fisher can login successfully
- [ ] Fisher can submit catch with all fields
- [ ] Catch saves to database with proper conversions (lbs→kg, in→cm)
- [ ] AI confidence score calculates correctly
- [ ] QR code generates uniquely
- [ ] Photo uploads and saves reference
- [ ] Form resets after successful submission
- [ ] Unauthenticated users get 401 error

### Buyer Flow
- [ ] Buyer can sign up with/without organization
- [ ] Buyer can browse marketplace
- [ ] Buyer can view catch details
- [ ] Buyer can claim purchase when logged in
- [ ] Order record creates correctly
- [ ] Buyer ID comes from session (not hardcoded)
- [ ] Catch becomes unavailable after purchase
- [ ] Unauthenticated users see login prompt
- [ ] Non-buyers cannot claim purchases

### Admin Flow
- [ ] Admin can login
- [ ] Admin can view dashboard metrics
- [ ] Admin can view fisher list
- [ ] Admin can approve fishers
- [ ] Admin can verify catches
- [ ] Admin actions use session UserID (not hardcoded 1)
- [ ] Admin can export data
- [ ] Export logs save with correct admin ID

### General
- [ ] Sessions persist across page refreshes
- [ ] Role-based redirects work (Fisher→fisher.html, Buyer→marketplace.html, Admin→admin.html)
- [ ] Navbar updates based on login status
- [ ] Logout works correctly
- [ ] All API endpoints use proper authentication
- [ ] Database transactions maintain integrity

---

## 🚨 KNOWN LIMITATIONS

1. **Photo Storage**: Photos convert to base64 but don't actually save files to disk (placeholder path only)
2. **Password Security**: Still using SHA256 (should upgrade to bcrypt)
3. **Session Storage**: In-memory sessions (won't work with multiple API instances)
4. **Error Messages**: Some errors could be more user-friendly
5. **Validation**: Client-side only (should add server-side validation)

---

## 📝 TESTING NOTES

- Test with **different browsers** (Chrome, Firefox, Safari)
- Test **mobile responsiveness**
- Use **browser DevTools** to monitor network requests
- Check **browser console** for JavaScript errors
- Use **SQLite browser** to verify database changes
- Test **concurrent users** (open multiple browser windows)

---

## 🎯 NEXT STEPS AFTER TESTING

If all tests pass:
1. ✅ Document any bugs found
2. ✅ Fix critical issues
3. ✅ Deploy to staging environment
4. ✅ Perform load testing
5. ✅ Security audit
6. ✅ Production deployment planning

Good luck with your testing! 🚀

