# SeaTrue Authentication System - Setup & Usage Guide

## ✅ What's Been Implemented

Your complete authentication system is now ready with the following features:

### 🔐 Backend (API)
- **AuthController** with comprehensive endpoints:
  - `POST /api/Auth/signup` - User registration with role-specific profiles
  - `POST /api/Auth/login` - User authentication
  - `POST /api/Auth/logout` - Session termination
  - `GET /api/Auth/me` - Get current user profile
- **Session Management** - 24-hour sessions with cookies
- **Password Hashing** - SHA256 hashing (ready for bcrypt/Argon2 upgrade)
- **Database Schema Updates** - Added DateOfBirth and PreferredDeliveryAddress to BuyerProfile

### 🎨 Frontend (Client)
- **auth.js** - Centralized authentication manager
- **Login Modals** - On all pages (homepage, marketplace, fisher, learn)
- **Signup Forms** - Comprehensive forms with role-specific fields:
  - Fisher: National ID, address, experience, fishing method, home port, license details
  - Buyer: Date of birth, delivery address, organization details (optional)
- **Dynamic Navbar** - Changes based on login status (Login/Signup vs Profile/Logout)
- **Profile Page** - View complete user and role-specific information
- **Protected Routes** - Authentication checks on:
  - Fisher page - Must be logged in as Fisher to verify catches
  - Marketplace - Must be logged in as Buyer to purchase fish

### 🔒 Security Features
- Session persistence across page refreshes (using localStorage + session cookies)
- Role-based access control
- Automatic redirects after login based on user role
- Protected actions with authentication checks

---

## 🚀 How to Test

### Step 1: Start the Backend API

```bash
cd api
dotnet run
```

The API should start on `http://localhost:5142` (or your configured port).

**⚠️ IMPORTANT:** If your API runs on a different port, update the `API_BASE_URL` in `/client/resources/scripts/auth.js`:

```javascript
const API_BASE_URL = 'http://localhost:YOUR_PORT/api';
```

### Step 2: Start the Frontend

Open the client folder in your browser using Live Server or similar:
- Right-click on `client/resources/homepage.html`
- Select "Open with Live Server"

Or manually open: `http://127.0.0.1:5500/client/resources/homepage.html`

---

## 📋 Testing Scenarios

### Scenario 1: Create a Fisher Account

1. Go to **Homepage** → Click **Sign Up**
2. Fill in basic information:
   - Email: `fisher1@test.com`
   - Password: `password123`
   - First Name: `John`
   - Last Name: `Fisher`
   - Phone: `555-1234`
   - Role: **Fisher**
3. Fill in Fisher-specific fields:
   - National ID: `NAT123456`
   - Date of Birth: `1990-01-01`
   - Address: `123 Harbor St`
   - City: `Portland`
   - State: `Maine`
   - Country: `USA`
   - Postal Code: `04101`
   - Years of Experience: `10`
   - Primary Fishing Method: `Line fishing`
   - Home Port: `Portland Harbor`
4. Fill in License Details:
   - License Number: `ME-FISH-12345`
   - License Type: `Commercial`
   - Issuing Authority: `Maine Department of Marine Resources`
   - Issue Date: `2020-01-01`
   - Expiry Date: `2025-12-31`
5. Click **Create Account**
6. You should be redirected to **fisher.html**

### Scenario 2: Create a Buyer Account

1. Go to **Homepage** → Click **Sign Up**
2. Fill in basic information:
   - Email: `buyer1@test.com`
   - Password: `password123`
   - First Name: `Jane`
   - Last Name: `Buyer`
   - Phone: `555-5678`
   - Role: **Buyer**
3. Fill in Buyer-specific fields:
   - Buyer Type: `Restaurant`
   - Date of Birth: `1985-05-15`
   - Delivery Address: `456 Main St, Boston, MA 02101`
4. (Optional) Check "I'm representing an organization" and fill:
   - Organization Name: `Seafood Restaurant Inc.`
   - Organization Type: `Restaurant`
   - Registration Number: `REG-789456`
   - Tax ID: `TAX-123789`
   - Address: `456 Main St`
   - City: `Boston`
   - State: `MA`
   - Postal Code: `02101`
5. Click **Create Account**
6. You should be redirected to **marketplace.html**

### Scenario 3: Test Login

1. Go to any page → Click **Login**
2. Enter credentials:
   - Email: `fisher1@test.com`
   - Password: `password123`
3. Click **Login**
4. You should see:
   - Navbar updates to show **Profile** and **Logout**
   - Redirected based on role (Fisher → fisher.html, Buyer → marketplace.html)

### Scenario 4: Test Profile Page

1. After logging in, click **Profile** in the navbar
2. You should see:
   - Your basic information
   - Role-specific profile details
   - For Fishers: Trust score, license information
   - For Buyers: Organization details (if provided)

### Scenario 5: Test Protected Routes

**Fisher Page Protection:**
1. Logout if logged in
2. Go to **fisher.html**
3. Try to submit a catch form
4. You should see a login prompt

**Marketplace Purchase Protection:**
1. Logout if logged in
2. Go to **marketplace.html**
3. Click on a catch → Click **Claim Purchase**
4. You should see a login prompt

### Scenario 6: Test Session Persistence

1. Login with any account
2. Refresh the page
3. You should remain logged in
4. Navigate between pages
5. Your session should persist

---

## 🎯 Key Features to Demonstrate

### Dynamic Navbar
- **Before Login:** Shows "Login" and "Sign Up"
- **After Login:** Shows "Profile" and "Logout"

### Role-Based Redirects
- **Fisher login:** Redirected to fisher.html
- **Buyer login:** Redirected to marketplace.html

### Authentication Checks
- **Fisher page:** Only fishers can verify catches
- **Marketplace:** Only buyers can purchase fish

### Profile Display
- **Fisher Profile:** Shows license details, trust score, fishing experience
- **Buyer Profile:** Shows delivery address, organization details

---

## 🔧 Troubleshooting

### Issue: "Network error" when trying to login/signup
**Solution:** 
- Check if the backend API is running
- Verify the port in `auth.js` matches your API port
- Check browser console for CORS errors

### Issue: "Not authenticated" error
**Solution:**
- Clear browser localStorage: `localStorage.clear()`
- Clear cookies
- Try logging in again

### Issue: Signup form doesn't show role-specific fields
**Solution:**
- Select a role (Fisher or Buyer) first
- JavaScript should automatically show/hide fields

### Issue: Can't see catches in marketplace
**Solution:**
- Make sure you have seeded data in your database
- Check if the catches API endpoint is working

---

## 🚀 Next Steps (Future Enhancements)

1. **Password Hashing:** Upgrade from SHA256 to bcrypt or Argon2
2. **JWT Tokens:** Replace simple session with JWT for better scalability
3. **Email Verification:** Send verification emails on signup
4. **Password Reset:** Add forgot password functionality
5. **Profile Editing:** Allow users to update their profile
6. **File Uploads:** Allow fishers to upload license documents
7. **Two-Factor Authentication:** Add 2FA for enhanced security
8. **Remember Me:** Add "Remember Me" checkbox on login

---

## 📝 API Endpoints Reference

### Authentication Endpoints

#### POST /api/Auth/signup
**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "role": "Fisher" | "Buyer",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string (optional)",
  "fisherDetails": { ... },  // If role is Fisher
  "buyerDetails": { ... }    // If role is Buyer
}
```

**Response:**
```json
{
  "message": "Signup successful",
  "userId": 1,
  "role": "Fisher",
  "sessionToken": "guid"
}
```

#### POST /api/Auth/login
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "userId": 1,
  "email": "user@example.com",
  "role": "Fisher",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "555-1234",
  "sessionToken": "guid"
}
```

#### POST /api/Auth/logout
**Response:**
```json
{
  "message": "Logout successful"
}
```

#### GET /api/Auth/me
**Response:**
```json
{
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "role": "Fisher",
    "firstName": "John",
    "lastName": "Doe",
    ...
  },
  "profile": {
    "fisher": { ... } or "buyer": { ... }
  }
}
```

---

## ✨ Summary

Your authentication system is fully functional with:
- ✅ Complete signup/login/logout flow
- ✅ Role-specific registration (Fisher & Buyer)
- ✅ Session persistence
- ✅ Protected routes
- ✅ Dynamic navbar
- ✅ Profile viewing
- ✅ Organization support for buyers
- ✅ License management for fishers

Test it out and let me know if you need any adjustments!

