// SeaTrue Authentication Module
const API_BASE_URL = 'http://localhost:5142/api';

class AuthManager {
    constructor() {
        this.currentUser = null;
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeAuth());
        } else {
            this.initializeAuth();
        }
    }

    // Initialize authentication on page load
    async initializeAuth() {
        await this.checkAuthStatus();
        this.updateNavbar();
        this.setupAuthModalListeners();
    }

    // Check if user is logged in
    async checkAuthStatus() {
        const token = localStorage.getItem('sessionToken');
        console.log('Checking auth status, token:', token ? 'exists' : 'missing');
        
        if (!token) {
            this.currentUser = null;
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/Auth/me`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.currentUser.profile = data.profile;
                console.log('Auth check successful, user:', this.currentUser);
                return true;
            } else {
                console.warn('Auth check failed, status:', response.status);
                localStorage.removeItem('sessionToken');
                this.currentUser = null;
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.currentUser = null;
            return false;
        }
    }

    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/Auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                console.log('Saving sessionToken:', data.sessionToken);
                localStorage.setItem('sessionToken', data.sessionToken);
                
                // Fetch full profile first
                await this.checkAuthStatus();
                console.log('After checkAuthStatus, currentUser:', this.currentUser);
                
                this.updateNavbar();
                return { success: true, data };
            } else {
                console.warn('Login failed:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    // Signup
    async signup(signupData) {
        try {
            const response = await fetch(`${API_BASE_URL}/Auth/signup`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Signup successful, saving token:', data.sessionToken);
                localStorage.setItem('sessionToken', data.sessionToken);
                
                // Fetch full profile first
                await this.checkAuthStatus();
                console.log('After signup checkAuthStatus, currentUser:', this.currentUser);
                
                this.updateNavbar();
                return { success: true, data };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    // Logout
    async logout() {
        try {
            await fetch(`${API_BASE_URL}/Auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('sessionToken');
        this.currentUser = null;
        this.updateNavbar();
        window.location.href = 'homepage.html';
    }

    // Update navbar based on auth status
    updateNavbar() {
        const mainNav = document.querySelector('.navbar-nav.me-auto');
        const authNav = document.querySelector('.navbar-nav:last-child');
        if (!mainNav || !authNav) {
            console.warn('Navbar elements not found, retrying...');
            setTimeout(() => this.updateNavbar(), 100);
            return;
        }

        console.log('Updating navbar, currentUser:', this.currentUser);

        // Get current page
        const currentPage = window.location.pathname.split('/').pop() || 'homepage.html';

        if (this.currentUser) {
            // Update main navigation based on role
            let navItems = `
                <li class="nav-item">
                    <a class="nav-link nav-button ${currentPage === 'homepage.html' ? 'active' : ''}" href="homepage.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-button ${currentPage === 'learn.html' ? 'active' : ''}" href="learn.html">Learn</a>
                </li>
            `;

            if (this.currentUser.role === 'Buyer') {
                navItems += `
                    <li class="nav-item">
                        <a class="nav-link nav-button ${currentPage === 'marketplace.html' ? 'active' : ''}" href="marketplace.html">Marketplace</a>
                    </li>
                `;
            } else if (this.currentUser.role === 'Fisher') {
                navItems += `
                    <li class="nav-item">
                        <a class="nav-link nav-button ${currentPage === 'fisher.html' ? 'active' : ''}" href="fisher.html">Verify your catch</a>
                    </li>
                `;
            } else if (this.currentUser.role === 'Admin') {
                // Admin sees everything
                navItems += `
                    <li class="nav-item">
                        <a class="nav-link nav-button ${currentPage === 'marketplace.html' ? 'active' : ''}" href="marketplace.html">Marketplace</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link nav-button ${currentPage === 'fisher.html' ? 'active' : ''}" href="fisher.html">Verify your catch</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link nav-button ${currentPage === 'admin.html' ? 'active' : ''}" href="admin.html">Admin</a>
                    </li>
                `;
            }

            mainNav.innerHTML = navItems;

            // Update auth navigation
            authNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link nav-button" href="profile.html">
                        <i class="bi bi-person-circle me-1"></i>Profile
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-button" href="#" id="logoutBtn">
                        <i class="bi bi-box-arrow-right me-1"></i>Logout
                    </a>
                </li>
            `;

            // Setup logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        } else {
            // Not logged in - show only Home and Learn
            mainNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link nav-button ${currentPage === 'homepage.html' ? 'active' : ''}" href="homepage.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-button ${currentPage === 'learn.html' ? 'active' : ''}" href="learn.html">Learn</a>
                </li>
            `;

            authNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link nav-button" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Login</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-button" href="#" data-bs-toggle="modal" data-bs-target="#signupModal">Sign Up</a>
                </li>
            `;
        }
    }

    // Setup modal listeners
    setupAuthModalListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        console.log('Setting up login form listener, form found:', !!loginForm);
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Login form submitted!');
                await this.handleLogin(e.target);
            });
        } else {
            console.warn('Login form not found! Will retry...');
            setTimeout(() => this.setupAuthModalListeners(), 500);
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        console.log('Setting up signup form listener, form found:', !!signupForm);
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Signup form submitted!');
                await this.handleSignup(e.target);
            });
        }

        // Role change listener
        const roleSelect = document.getElementById('signupRole');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                this.updateSignupFormFields(e.target.value);
            });
        }
    }

    // Handle login form submission
    async handleLogin(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

        const email = form.querySelector('#loginEmail').value;
        const password = form.querySelector('#loginPassword').value;

        const result = await this.login(email, password);

        if (result.success) {
            this.showNotification('Login successful! Welcome back.', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal?.hide();
            form.reset();
            
            // Verify token is saved
            const savedToken = localStorage.getItem('sessionToken');
            console.log('Before redirect - Token saved:', !!savedToken, 'User:', this.currentUser);
            
            // Redirect based on role with delay to ensure localStorage writes
            setTimeout(() => {
                if (this.currentUser.role === 'Admin') {
                    console.log('Redirecting to admin.html');
                    window.location.href = 'admin.html';
                } else if (this.currentUser.role === 'Fisher') {
                    console.log('Redirecting to fisher.html');
                    window.location.href = 'fisher.html';
                } else if (this.currentUser.role === 'Buyer') {
                    console.log('Redirecting to marketplace.html');
                    window.location.href = 'marketplace.html';
                }
            }, 1000);
        } else {
            this.showNotification(result.message || 'Login failed', 'danger');
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }

    // Handle signup form submission
    async handleSignup(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';

        const formData = new FormData(form);
        const role = formData.get('role');
        
        const signupData = {
            email: formData.get('email'),
            password: formData.get('password'),
            role: role,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phoneNumber: formData.get('phoneNumber')
        };

        // Add role-specific data
        if (role === 'Fisher') {
            signupData.fisherDetails = {
                nationalID: formData.get('nationalId'),
                dateOfBirth: formData.get('dateOfBirth'),
                address: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                country: formData.get('country') || 'USA',
                postalCode: formData.get('postalCode'),
                yearsOfExperience: parseInt(formData.get('yearsOfExperience')) || 0,
                primaryFishingMethod: formData.get('primaryFishingMethod'),
                homePort: formData.get('homePort'),
                licenseDetails: {
                    licenseNumber: formData.get('licenseNumber'),
                    licenseType: formData.get('licenseType'),
                    issuingAuthority: formData.get('issuingAuthority'),
                    issuingCountry: formData.get('licenseCountry') || 'USA',
                    issueDate: formData.get('licenseIssueDate'),
                    expiryDate: formData.get('licenseExpiryDate')
                }
            };
        } else if (role === 'Buyer') {
            const hasOrganization = formData.get('hasOrganization') === 'on';
            signupData.buyerDetails = {
                buyerType: formData.get('buyerType') || 'Individual',
                dateOfBirth: formData.get('dateOfBirth'),
                preferredDeliveryAddress: formData.get('deliveryAddress'),
                organizationDetails: hasOrganization ? {
                    organizationName: formData.get('organizationName'),
                    organizationType: formData.get('organizationType'),
                    registrationNumber: formData.get('registrationNumber'),
                    taxID: formData.get('taxId'),
                    address: formData.get('orgAddress'),
                    city: formData.get('orgCity'),
                    state: formData.get('orgState'),
                    country: formData.get('orgCountry') || 'USA',
                    postalCode: formData.get('orgPostalCode'),
                    phoneNumber: formData.get('orgPhone'),
                    email: formData.get('orgEmail')
                } : null
            };
        }

        const result = await this.signup(signupData);

        if (result.success) {
            this.showNotification('Account created successfully! Welcome to SeaTrue.', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
            modal?.hide();
            form.reset();
            
            // Verify token is saved
            const savedToken = localStorage.getItem('sessionToken');
            console.log('Before redirect - Token saved:', !!savedToken, 'User:', this.currentUser);
            
            // Redirect based on role with delay to ensure localStorage writes
            setTimeout(() => {
                if (role === 'Admin') {
                    console.log('Redirecting to admin.html');
                    window.location.href = 'admin.html';
                } else if (role === 'Fisher') {
                    console.log('Redirecting to fisher.html');
                    window.location.href = 'fisher.html';
                } else if (role === 'Buyer') {
                    console.log('Redirecting to marketplace.html');
                    window.location.href = 'marketplace.html';
                }
            }, 1000);
        } else {
            this.showNotification(result.message || 'Signup failed', 'danger');
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }

    // Update signup form based on role
    updateSignupFormFields(role) {
        const fisherFields = document.getElementById('fisherSpecificFields');
        const buyerFields = document.getElementById('buyerSpecificFields');

        if (role === 'Fisher') {
            fisherFields.style.display = 'block';
            buyerFields.style.display = 'none';
        } else if (role === 'Buyer') {
            fisherFields.style.display = 'none';
            buyerFields.style.display = 'block';
        } else {
            fisherFields.style.display = 'none';
            buyerFields.style.display = 'none';
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotif = document.querySelector('.auth-notification');
        if (existingNotif) {
            existingNotif.remove();
        }

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} auth-notification position-fixed top-0 start-50 translate-middle-x mt-3 animate__animated animate__fadeInDown`;
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <span>${message}</span>
                <button type="button" class="btn-close ms-3" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('animate__fadeOutUp');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    // Check if user is authenticated (for protected routes)
    requireAuth(redirectUrl = null) {
        if (!this.currentUser) {
            this.showNotification('Please login to continue', 'warning');
            setTimeout(() => {
                if (redirectUrl) {
                    sessionStorage.setItem('redirectAfterLogin', window.location.href);
                    window.location.href = redirectUrl;
                } else {
                    // Show login modal
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                }
            }, 1000);
            return false;
        }
        return true;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

