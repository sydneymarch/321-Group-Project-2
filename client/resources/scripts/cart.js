// Shopping Cart Manager
class ShoppingCart {
    constructor() {
        this.items = [];
        this.loadFromLocalStorage();
        this.updateCartBadge();
    }

    // Load cart from localStorage
    loadFromLocalStorage() {
        try {
            const savedCart = localStorage.getItem('shoppingCart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.items = [];
        }
    }

    // Save cart to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('shoppingCart', JSON.stringify(this.items));
            this.updateCartBadge();
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add item to cart
    addItem(catchData) {
        // Check if item already exists
        const existingIndex = this.items.findIndex(item => item.catchId === catchData.catchId);
        
        if (existingIndex >= 0) {
            // Item exists, increase quantity
            this.items[existingIndex].quantity = (this.items[existingIndex].quantity || 1) + 1;
            this.showNotification(`Updated quantity for ${catchData.species}`, 'info');
        } else {
            // Add new item
            this.items.push({
                catchId: catchData.catchId,
                species: catchData.species,
                scientificName: catchData.scientificName,
                weight: catchData.weight,
                length: catchData.length,
                pricePerKg: catchData.price,
                totalPrice: catchData.price * catchData.weight,
                location: catchData.location,
                fisherName: catchData.fisherName,
                fisherId: catchData.fisherId,
                photoUrl: catchData.photoUrl,
                conservationStatus: catchData.iucnRedListStatus,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
            this.showNotification(`${catchData.species} added to cart!`, 'success');
        }
        
        this.saveToLocalStorage();
        return true;
    }

    // Remove item from cart
    removeItem(catchId) {
        const index = this.items.findIndex(item => item.catchId === catchId);
        if (index >= 0) {
            const removedItem = this.items.splice(index, 1)[0];
            this.saveToLocalStorage();
            this.showNotification(`${removedItem.species} removed from cart`, 'warning');
            return true;
        }
        return false;
    }

    // Update item quantity
    updateQuantity(catchId, quantity) {
        const item = this.items.find(item => item.catchId === catchId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(catchId);
            } else {
                item.quantity = quantity;
                item.totalPrice = item.pricePerKg * item.weight * quantity;
                this.saveToLocalStorage();
            }
            return true;
        }
        return false;
    }

    // Get cart items
    getItems() {
        return this.items;
    }

    // Get cart count
    getItemCount() {
        return this.items.reduce((total, item) => total + (item.quantity || 1), 0);
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => {
            const itemTotal = item.pricePerKg * item.weight * (item.quantity || 1);
            return total + itemTotal;
        }, 0);
    }

    // Clear cart
    clear() {
        this.items = [];
        this.saveToLocalStorage();
    }

    // Update cart badge
    updateCartBadge() {
        const badge = document.querySelector('.cart-badge');
        const count = this.getItemCount();
        
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Try to use existing notification system
        if (typeof showNotification === 'function') {
            showNotification(message);
        } else {
            // Fallback to Bootstrap alert
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.appendChild(alertDiv);
            
            setTimeout(() => alertDiv.remove(), 3000);
        }
    }

    // Display cart modal
    displayCart() {
        const modalBody = document.getElementById('cartModalBody');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!modalBody) return;
        
        if (this.items.length === 0) {
            modalBody.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Your cart is empty</p>
                    <a href="marketplace.html" class="btn btn-primary">Browse Marketplace</a>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = '$0.00';
            return;
        }
        
        // Display cart items
        let html = '<div class="cart-items">';
        
        this.items.forEach(item => {
            const itemTotal = item.pricePerKg * item.weight * (item.quantity || 1);
            const conservationBadge = item.conservationStatus && item.conservationStatus !== 'Not Assessed' ? 
                `<span class="badge bg-${this.getConservationColor(item.conservationStatus)} ms-2">${item.conservationStatus}</span>` : '';
            
            html += `
                <div class="cart-item mb-3 p-3 border rounded" data-catch-id="${item.catchId}">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="${item.photoUrl || 'https://via.placeholder.com/100x80?text=No+Photo'}" 
                                 alt="${item.species}" 
                                 class="img-fluid rounded"
                                 style="max-height: 80px; object-fit: cover;">
                        </div>
                        <div class="col-md-5">
                            <h6 class="mb-1">
                                ${item.species}
                                ${conservationBadge}
                            </h6>
                            <small class="text-muted">
                                <i class="fas fa-fish"></i> ${item.scientificName || 'N/A'}<br>
                                <i class="fas fa-weight"></i> ${item.weight.toFixed(1)} kg • ${item.length.toFixed(1)} cm<br>
                                <i class="fas fa-map-marker-alt"></i> ${item.location}<br>
                                <i class="fas fa-user"></i> Fisher: ${item.fisherName}
                            </small>
                        </div>
                        <div class="col-md-2 text-center">
                            <label class="form-label small mb-1">Quantity</label>
                            <div class="input-group input-group-sm">
                                <button class="btn btn-outline-secondary btn-decrease" type="button">-</button>
                                <input type="number" class="form-control text-center quantity-input" 
                                       value="${item.quantity || 1}" min="1" max="10">
                                <button class="btn btn-outline-secondary btn-increase" type="button">+</button>
                            </div>
                        </div>
                        <div class="col-md-2 text-end">
                            <div class="fw-bold text-success">$${itemTotal.toFixed(2)}</div>
                            <small class="text-muted">$${item.pricePerKg.toFixed(2)}/kg</small>
                        </div>
                        <div class="col-md-1 text-end">
                            <button class="btn btn-sm btn-outline-danger btn-remove" type="button">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        modalBody.innerHTML = html;
        
        // Update total
        const total = this.getTotal();
        if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
        
        // Add event listeners
        this.attachCartEventListeners();
    }

    // Attach event listeners to cart items
    attachCartEventListeners() {
        // Quantity decrease
        document.querySelectorAll('.btn-decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const catchId = parseInt(cartItem.dataset.catchId);
                const input = cartItem.querySelector('.quantity-input');
                const newQty = Math.max(1, parseInt(input.value) - 1);
                input.value = newQty;
                this.updateQuantity(catchId, newQty);
                this.displayCart();
            });
        });
        
        // Quantity increase
        document.querySelectorAll('.btn-increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const catchId = parseInt(cartItem.dataset.catchId);
                const input = cartItem.querySelector('.quantity-input');
                const newQty = Math.min(10, parseInt(input.value) + 1);
                input.value = newQty;
                this.updateQuantity(catchId, newQty);
                this.displayCart();
            });
        });
        
        // Quantity manual input
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const catchId = parseInt(cartItem.dataset.catchId);
                const newQty = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                e.target.value = newQty;
                this.updateQuantity(catchId, newQty);
                this.displayCart();
            });
        });
        
        // Remove item
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const catchId = parseInt(cartItem.dataset.catchId);
                this.removeItem(catchId);
                this.displayCart();
            });
        });
    }

    // Get conservation status color for badges
    getConservationColor(status) {
        const colors = {
            'Critically Endangered': 'danger',
            'Endangered': 'danger',
            'Vulnerable': 'warning',
            'Near Threatened': 'warning',
            'Least Concern': 'success',
            'Data Deficient': 'secondary',
            'Not Assessed': 'secondary'
        };
        return colors[status] || 'secondary';
    }

    // Checkout process
    async checkout() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty', 'warning');
            return;
        }

        // Check authentication
        if (typeof authManager === 'undefined' || !authManager.currentUser) {
            this.showNotification('Please login to checkout', 'warning');
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                const modal = new bootstrap.Modal(loginModal);
                modal.show();
            }
            return;
        }

        // Check if user is a buyer
        if (authManager.currentUser.role !== 'Buyer') {
            this.showNotification('Only buyers can checkout. Please login with a buyer account.', 'danger');
            return;
        }

        try {
            // Close cart modal
            const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (cartModal) cartModal.hide();

            // Show checkout modal
            this.displayCheckoutModal();
            
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('Checkout failed. Please try again.', 'danger');
        }
    }

    // Display checkout modal
    displayCheckoutModal() {
        const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        const checkoutItems = document.getElementById('checkoutItems');
        const checkoutSubtotal = document.getElementById('checkoutSubtotal');
        const checkoutShipping = document.getElementById('checkoutShipping');
        const checkoutTotal = document.getElementById('checkoutTotal');
        
        // Display items
        let itemsHtml = '';
        this.items.forEach(item => {
            const itemTotal = item.pricePerKg * item.weight * (item.quantity || 1);
            itemsHtml += `
                <div class="d-flex justify-content-between mb-2">
                    <div>
                        <strong>${item.species}</strong> x${item.quantity}
                        <br><small class="text-muted">${item.weight.toFixed(1)}kg @ $${item.pricePerKg.toFixed(2)}/kg</small>
                    </div>
                    <div class="text-end">
                        $${itemTotal.toFixed(2)}
                    </div>
                </div>
            `;
        });
        
        checkoutItems.innerHTML = itemsHtml;
        
        // Calculate totals
        const subtotal = this.getTotal();
        const shipping = 15.00; // Flat rate shipping
        const total = subtotal + shipping;
        
        checkoutSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        checkoutShipping.textContent = `$${shipping.toFixed(2)}`;
        checkoutTotal.textContent = `$${total.toFixed(2)}`;
        
        modal.show();
    }

    // Place order
    async placeOrder() {
        try {
            const shippingAddress = document.getElementById('shippingAddress').value;
            const shippingCity = document.getElementById('shippingCity').value;
            const shippingZip = document.getElementById('shippingZip').value;
            const deliveryNotes = document.getElementById('deliveryNotes').value;

            if (!shippingAddress || !shippingCity || !shippingZip) {
                this.showNotification('Please fill in all required shipping fields', 'warning');
                return;
            }

            // Create orders for each item (since they may be from different fishers)
            const orders = [];
            
            for (const item of this.items) {
                const orderData = {
                    catchId: item.catchId,
                    fisherId: item.fisherId,
                    quantity: item.quantity || 1,
                    pricePerKg: item.pricePerKg,
                    totalPrice: item.pricePerKg * item.weight * (item.quantity || 1),
                    shippingAddress: `${shippingAddress}, ${shippingCity} ${shippingZip}`,
                    deliveryNotes: deliveryNotes
                };

                const response = await fetch('http://localhost:5142/api/SeaTrue/order/create', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    orders.push(result);
                } else {
                    throw new Error(result.message || `Failed to order ${item.species}`);
                }
            }

            // Success!
            this.showNotification(`Order placed successfully! ${orders.length} item(s) ordered.`, 'success');
            
            // Clear cart
            this.clear();
            
            // Close checkout modal
            const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
            if (checkoutModal) checkoutModal.hide();
            
            // Show order confirmation
            this.displayOrderConfirmation(orders);
            
            // Refresh marketplace if on that page
            if (typeof loadCatches === 'function') {
                await loadCatches();
                applyAllFilters();
            }

        } catch (error) {
            console.error('Place order error:', error);
            this.showNotification(error.message || 'Failed to place order. Please try again.', 'danger');
        }
    }

    // Display order confirmation
    displayOrderConfirmation(orders) {
        const modal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
        const ordersList = document.getElementById('ordersList');
        
        let html = '';
        orders.forEach(order => {
            html += `
                <div class="border rounded p-3 mb-2">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>Order #${order.orderId}</strong>
                            <br><small class="text-muted">Expected Delivery: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}</small>
                        </div>
                        <div class="text-end">
                            <strong class="text-success">$${order.totalPrice.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            `;
        });
        
        ordersList.innerHTML = html;
        modal.show();
    }
}

// Initialize cart
const shoppingCart = new ShoppingCart();

// Cart button click handler
document.addEventListener('DOMContentLoaded', function() {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            shoppingCart.displayCart();
            const modal = new bootstrap.Modal(document.getElementById('cartModal'));
            modal.show();
        });
    }

    // Checkout button in cart modal
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => shoppingCart.checkout());
    }

    // Place order button in checkout modal
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => shoppingCart.placeOrder());
    }
});

