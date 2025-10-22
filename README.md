# 🌊 SeaTrue - Transparent Fishing Traceability Platform

A comprehensive traceability system for small-scale fisheries, enabling fishers to verify catches, buyers to purchase verified fish, and admins to manage the ecosystem.

## 🚀 Quick Start

### Backend (API)
```bash
cd api
dotnet run
```
API runs on: `http://localhost:5142`

### Frontend (Client)
Open `client/resources/homepage.html` with Live Server or similar.

## 📚 Documentation

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete end-to-end testing instructions
- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** - Authentication system documentation
- **[SHOPPING_CART_GUIDE.md](./SHOPPING_CART_GUIDE.md)** - 🛒 Shopping cart & checkout system
- **[SPECIES_SYSTEM.md](./SPECIES_SYSTEM.md)** - Species autocomplete with GBIF/IUCN integration

## 🛒 NEW: Shopping Cart & Checkout System

**Full e-commerce experience implemented!**

### Features:
- ✅ **Shopping Cart** - Add multiple catches, adjust quantities, remove items
- ✅ **Cart Badge** - Real-time item count in navbar
- ✅ **Persistent Cart** - Items saved in localStorage
- ✅ **Checkout Flow** - Shipping address, delivery notes, order summary
- ✅ **Order Creation** - Automatic Order records, marks catches unavailable
- ✅ **Order Confirmation** - Order ID, delivery date, success modal

### How It Works:
1. **Add to Cart**: Click "Add to Cart" on any catch
2. **View Cart**: Click cart icon (🛒) in navbar
3. **Update Items**: Change quantities or remove items
4. **Checkout**: Enter shipping info, review order
5. **Place Order**: Creates Order in database, clears cart

**See [SHOPPING_CART_GUIDE.md](./SHOPPING_CART_GUIDE.md) for complete documentation.**

---

## ✨ Recent Bug Fixes (Latest)

All critical functional bugs have been fixed:

### Fixed Issues:
1. ✅ **Fisher Catch Submission** - Now properly submits to API and saves to database
2. ✅ **Order Creation** - Creates actual Order records when buyers claim purchases
3. ✅ **Authentication on Purchases** - Buyers must be logged in, BuyerID from session
4. ✅ **Admin Session IDs** - All admin actions use logged-in admin's UserID (not hardcoded)
5. ✅ **Photo Upload** - Converts to base64 and saves reference
6. ✅ **Shopping Cart** - Full cart system replacing simple "claim" button

### What Was Fixed:
- `SeaTrueController.cs`: Added `/catches/submit` endpoint with proper authentication
- `SeaTrueController.cs`: Added `/order/create` endpoint for cart checkout
- `AdminController.cs`: All admin actions now use `HttpContext.Session.GetInt32("UserId")`
- `fisher.js`: Implemented actual API submission with photo upload
- `marketplace.js`: Replaced claim with add-to-cart functionality
- `cart.js`: New shopping cart manager with localStorage persistence

## 🧪 Testing

See **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** for comprehensive testing instructions.

### Quick Test:
1. **Start API**: `cd api && dotnet run`
2. **Open Frontend**: Use Live Server on `client/resources/homepage.html`
3. **Test Fisher Flow**:
   - Sign up as Fisher
   - Submit a catch
   - Verify in database: `SELECT * FROM CatchRecord ORDER BY CatchID DESC LIMIT 1;`
4. **Test Buyer Flow**:
   - Sign up as Buyer
   - Claim a purchase
   - Verify Order: `SELECT * FROM "Order" ORDER BY OrderID DESC LIMIT 1;`

## 🏗️ Architecture

### Backend
- ASP.NET Core 9.0
- SQLite Database
- Session-based authentication
- RESTful API endpoints

### Frontend
- Vanilla JavaScript
- Bootstrap 5
- Responsive design
- Real-time form validation

## 📁 Project Structure

```
321-Group-Project-2/
├── api/                          # Backend API
│   ├── Controllers/              # API controllers
│   │   ├── AuthController.cs     # Authentication endpoints
│   │   ├── SeaTrueController.cs  # Fisher/Buyer endpoints
│   │   ├── AdminController.cs    # Admin management
│   │   └── SpeciesController.cs  # Species data endpoints
│   ├── database.db              # SQLite database
│   ├── schema.sql               # Database schema
│   └── Program.cs               # API configuration
│
├── client/resources/            # Frontend
│   ├── *.html                   # Page templates
│   ├── scripts/                 # JavaScript modules
│   │   ├── auth.js             # Authentication manager
│   │   ├── fisher.js           # Fisher functionality
│   │   ├── marketplace.js      # Buyer marketplace
│   │   └── admin.js            # Admin dashboard
│   └── styles/                  # CSS files
│
├── TESTING_GUIDE.md            # Testing documentation
├── AUTHENTICATION_GUIDE.md     # Auth system docs
└── README.md                   # This file
```

## 🔐 Default Test Accounts

### Admin
- Email: `admin@seatrue.com`
- Password: `admin123`

### Fisher
- Create via signup or use test account from database

### Buyer
- Create via signup or use test account from database

## 📊 Database Schema

See `api/schema.sql` for complete database structure including:
- User management (User, FisherProfile, BuyerProfile)
- Catch tracking (CatchRecord, CatchPhoto)
- Orders and transactions
- Admin verification logs
- Species and regulatory data

## 🛠️ Technology Stack

**Backend:**
- ASP.NET Core 9.0
- Microsoft.Data.SQLite
- Session-based auth (cookies)

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3
- Bootstrap Icons
- Animate.css

## 🎯 Features

### For Fishers
- Complete profile with license verification
- Submit catches with AI verification
- Photo upload support
- GPS location tracking
- QR code generation for traceability

### For Buyers
- Browse verified catches
- Advanced filtering (species, location, price, conservation status)
- Claim purchases with automatic order creation
- Organization support for businesses

### For Admins
- Dashboard with real-time metrics
- Fisher approval/revocation
- Catch verification
- Data export (JSON/CSV)
- Audit logging

## 🔜 Known Limitations

1. **Photos**: Base64 encoding works, but files don't save to disk (placeholder paths)
2. **Password Security**: Using SHA256 (should upgrade to bcrypt/Argon2)
3. **Sessions**: In-memory storage (won't scale horizontally)
4. **Validation**: Primarily client-side (need server-side validation)
5. **Real-time Updates**: No WebSocket support yet

## 📈 Next Steps for Enterprise

See testing guide for full enterprise roadmap. Priority items:
1. Implement bcrypt password hashing
2. Add JWT token authentication
3. Move to PostgreSQL/SQL Server
4. Implement Entity Framework Core
5. Add comprehensive server-side validation
6. Setup CI/CD pipeline
7. Add monitoring & logging (Application Insights)
8. Containerize with Docker

## 👥 Team

MIS 321 Group Project - Fall 2025

## 📄 License

Educational Project - Baylor University