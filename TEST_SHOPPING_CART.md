# 🛒 Shopping Cart Test Plan

## Quick 5-Minute Test

### 1. Start the System
```bash
# Terminal 1 - API
cd api
dotnet run

# Open marketplace.html with Live Server
```

### 2. Login as Buyer
```
Email: jane.buyer@example.com
Password: password123
```

### 3. Test Cart Functions

#### ✅ Test 1: Add to Cart
1. Click any catch card (e.g., "Atlantic Cod")
2. In modal, click **"Add to Cart"** (green button)
3. **Expected**:
   - ✅ Modal closes
   - ✅ Cart badge shows "1"
   - ✅ Green notification: "Atlantic Cod added to cart!"

#### ✅ Test 2: View Cart
1. Click **cart icon** (🛒) in navbar
2. **Expected**:
   - ✅ Cart modal opens
   - ✅ See item with photo
   - ✅ Shows species, weight, price
   - ✅ Quantity controls visible
   - ✅ Total price shown at bottom

#### ✅ Test 3: Update Quantity
1. In cart modal, click **"+"** button
2. **Expected**:
   - ✅ Quantity changes to 2
   - ✅ Total price doubles
   - ✅ Cart badge shows "2"

3. Click **"-"** button
4. **Expected**:
   - ✅ Quantity back to 1
   - ✅ Total price returns to original
   - ✅ Cart badge shows "1"

#### ✅ Test 4: Add Multiple Items
1. Close cart modal
2. Click another catch card (e.g., "Yellowfin Tuna")
3. Click **"Add to Cart"**
4. Repeat for third catch
5. Open cart
6. **Expected**:
   - ✅ All 3 items listed
   - ✅ Cart badge shows "3"
   - ✅ Correct total (sum of all items)

#### ✅ Test 5: Remove Item
1. In cart, click **trash icon** on one item
2. **Expected**:
   - ✅ Item disappears
   - ✅ Yellow notification: "Removed from cart"
   - ✅ Cart badge decreases
   - ✅ Total updates

#### ✅ Test 6: Checkout Flow
1. In cart with 2+ items, click **"Proceed to Checkout"**
2. **Expected**:
   - ✅ Cart modal closes
   - ✅ Checkout modal opens
   - ✅ Left side: shipping form
   - ✅ Right side: order summary
   - ✅ All items listed
   - ✅ Subtotal shown
   - ✅ Shipping: $15.00
   - ✅ Total = Subtotal + Shipping

#### ✅ Test 7: Place Order
1. Fill out shipping form:
   - **Address**: `123 Ocean Ave`
   - **City**: `Portland`
   - **ZIP**: `04101`
   - **Notes** (optional): `Ring doorbell twice`

2. Click **"Place Order"** (green button)

3. **Expected**:
   - ✅ Loading/processing state
   - ✅ Checkout modal closes
   - ✅ Success modal appears
   - ✅ Shows order ID
   - ✅ Shows delivery date (3 days from now)
   - ✅ Cart badge resets to 0
   - ✅ Cart is empty

#### ✅ Test 8: Verify Database
```sql
-- In terminal
sqlite3 api/database.db

-- Check order was created
SELECT * FROM "Order" ORDER BY OrderID DESC LIMIT 1;

-- Check catch is unavailable
SELECT CatchID, IsAvailable FROM CatchRecord 
WHERE CatchID = (SELECT CatchID FROM "Order" ORDER BY OrderID DESC LIMIT 1);
-- IsAvailable should be 0

-- Exit
.exit
```

#### ✅ Test 9: Cart Persistence
1. Add items to cart
2. **Refresh the page** (F5)
3. Click cart icon
4. **Expected**:
   - ✅ Cart items still there
   - ✅ Quantities preserved
   - ✅ Badge shows correct count

#### ✅ Test 10: Auth Check
1. Logout (if logout button exists, or clear session)
2. Try to checkout
3. **Expected**:
   - ✅ Shows "Please login" message
   - ✅ Redirects to login modal

---

## Visual Checklist

### Cart Icon
- [ ] Visible in navbar
- [ ] Badge shows correct count
- [ ] Badge hidden when cart empty
- [ ] Clicking opens cart modal

### Cart Modal
- [ ] Shows "Shopping Cart" title
- [ ] Lists all items
- [ ] Each item has:
  - [ ] Photo thumbnail
  - [ ] Species name
  - [ ] Weight & length
  - [ ] Price per kg
  - [ ] Location
  - [ ] Fisher name
  - [ ] Conservation badge (if applicable)
  - [ ] Quantity controls
  - [ ] Remove button
- [ ] Total price at bottom
- [ ] "Continue Shopping" button
- [ ] "Proceed to Checkout" button (green)

### Checkout Modal
- [ ] Shows "Checkout" title
- [ ] Left side: Form
  - [ ] Street Address field *
  - [ ] City field *
  - [ ] ZIP Code field *
  - [ ] Delivery Notes textarea
- [ ] Right side: Summary
  - [ ] All items listed
  - [ ] Subtotal
  - [ ] Shipping ($15.00)
  - [ ] Total
- [ ] "Cancel" button
- [ ] "Place Order" button (green)

### Order Confirmation Modal
- [ ] Success icon (✅)
- [ ] "Thank you" message
- [ ] Order details:
  - [ ] Order ID
  - [ ] Delivery date
  - [ ] Total price
- [ ] Email notification message
- [ ] "Close" button
- [ ] "Continue Shopping" button

---

## Expected Console Output

### Adding to Cart:
```
[cart.js] Adding item to cart: {catchId: 1, species: "Atlantic Cod", ...}
[cart.js] Cart updated, saving to localStorage
[cart.js] Cart badge updated: 1
```

### Checkout:
```
[cart.js] Starting checkout process
[cart.js] User authenticated: jane.buyer@example.com
[cart.js] Displaying checkout modal
```

### Place Order:
```
[cart.js] Placing order for 2 items
POST http://localhost:5142/api/SeaTrue/order/create 200 OK
[cart.js] Order 5 created successfully
[cart.js] Clearing cart
[cart.js] Displaying order confirmation
```

---

## Common Issues & Solutions

### Cart badge not showing?
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Items disappearing from cart?
- Check if catch was already ordered (IsAvailable = 0)
- Verify localStorage: `localStorage.getItem('shoppingCart')`

### Checkout fails?
- Ensure logged in as buyer
- Check all required fields filled
- Verify API is running
- Check browser console for errors

### Order not in database?
```bash
# Restart API
cd api
dotnet run

# Check database
sqlite3 database.db
SELECT * FROM "Order";
```

---

## Success Criteria

✅ **Cart System Works** if:
1. Can add multiple items
2. Cart badge updates correctly
3. Quantities adjust properly
4. Items persist after refresh
5. Checkout flow completes
6. Order created in database
7. Cart clears after order
8. Catch marked unavailable

✅ **UI/UX Works** if:
1. All modals display correctly
2. Buttons are responsive
3. Notifications appear
4. No console errors
5. Mobile-friendly

✅ **Security Works** if:
1. Must be logged in to checkout
2. Must be buyer role
3. BuyerID from session (not client)
4. Transaction rolls back on error

---

## Performance Check

### Speed Test
- Cart open: < 100ms
- Add item: < 50ms
- Update quantity: < 50ms
- Checkout load: < 200ms
- Place order: < 1s (API call)

### Memory Check
```javascript
// In console:
console.log('Cart size:', 
  new Blob([localStorage.getItem('shoppingCart')]).size, 
  'bytes'
);
// Should be < 50KB for 10 items
```

---

## Video Demo Script

**30-Second Demo:**

1. "Let's add some catches to cart" [Add 3 items]
2. "View our cart" [Click cart icon, show items]
3. "Adjust quantities" [Use +/- buttons]
4. "Proceed to checkout" [Fill shipping form]
5. "Place order" [Click button, show confirmation]
6. "Order created successfully!" [Show order modal]

---

## Test Data

### Buyer Account
```
Email: jane.buyer@example.com
Password: password123
```

### Sample Shipping Addresses
```
123 Ocean Ave, Portland, ME 04101
456 Harbor Rd, Boston, MA 02110
789 Coastal Blvd, Seattle, WA 98101
```

### Expected Delivery
```
Order Date: 2025-10-13
Expected: 2025-10-16 (3 days)
```

---

## Database Verification Queries

### View Latest Order
```sql
SELECT 
    o.OrderID,
    o.OrderDate,
    o.OrderStatus,
    o.ExpectedDeliveryDate,
    o.DeliveryAddress,
    c.CatchID,
    s.CommonName as Species,
    c.IsAvailable,
    o.QuantityKG,
    o.PricePerKG
FROM "Order" o
JOIN CatchRecord c ON o.CatchID = c.CatchID
JOIN Species s ON c.SpeciesID = s.SpeciesID
ORDER BY o.OrderID DESC
LIMIT 1;
```

### Check Unavailable Catches
```sql
SELECT 
    c.CatchID,
    s.CommonName,
    c.IsAvailable,
    COUNT(o.OrderID) as OrderCount
FROM CatchRecord c
JOIN Species s ON c.SpeciesID = s.SpeciesID
LEFT JOIN "Order" o ON c.CatchID = o.CatchID
WHERE c.IsAvailable = 0
GROUP BY c.CatchID;
```

### Buyer's Orders
```sql
SELECT 
    o.OrderID,
    o.OrderDate,
    s.CommonName,
    o.QuantityKG || ' kg' as Quantity,
    '$' || o.PricePerKG as PricePerKG,
    o.OrderStatus,
    o.ExpectedDeliveryDate
FROM "Order" o
JOIN CatchRecord c ON o.CatchID = c.CatchID
JOIN Species s ON c.SpeciesID = s.SpeciesID
JOIN BuyerProfile b ON o.BuyerID = b.BuyerID
JOIN UserAccount u ON b.UserID = u.UserID
WHERE u.Email = 'jane.buyer@example.com'
ORDER BY o.OrderDate DESC;
```

---

**Happy Testing! 🐟🛒**

