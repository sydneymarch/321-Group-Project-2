// SeaTrue Marketplace JavaScript
// Handles catch display, filtering, and API interactions for buyers

document.addEventListener('DOMContentLoaded', function() {
    // Initialize marketplace functionality
    initializeMarketplace();
    initializeFilters();
    initializeModals();
});

// Global variables
let allCatches = [];
let filteredCatches = [];
let currentCatchId = null;
const API_BASE_URL = 'http://localhost:5142/api/SeaTrue';

// Initialize marketplace
async function initializeMarketplace() {
    try {
        showLoadingState();
        await Promise.all([
            loadCatches(),
            loadSpeciesFilters(),
            loadLocationFilters()
        ]);
        hideLoadingState();
        displayCatches(filteredCatches);
    } catch (error) {
        console.error('Error initializing marketplace:', error);
        showErrorState('Failed to load catches. Please try again.');
    }
}

// Load catches from API
async function loadCatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/catches`);
        if (response.ok) {
            allCatches = await response.json();
            filteredCatches = [...allCatches];
        } else {
            throw new Error('Failed to load catches');
        }
    } catch (error) {
        console.error('Error loading catches:', error);
        throw error;
    }
}

// Load species filters from API
async function loadSpeciesFilters() {
    try {
        const response = await fetch(`${API_BASE_URL}/species`);
        if (response.ok) {
            const species = await response.json();
            const speciesFilter = document.getElementById('speciesFilter');
            
            // Clear existing options except the first one
            speciesFilter.innerHTML = '<option value="">All Species</option>';
            
            // Add species options
            species.forEach(sp => {
                const option = document.createElement('option');
                option.value = sp.toLowerCase();
                option.textContent = sp;
                speciesFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading species:', error);
    }
}

// Load location filters from API
async function loadLocationFilters() {
    try {
        const response = await fetch(`${API_BASE_URL}/locations`);
        if (response.ok) {
            const locations = await response.json();
            const locationFilter = document.getElementById('locationFilter');
            
            // Clear existing options except the first one
            locationFilter.innerHTML = '<option value="">All States</option>';
            
            // Add location options
            locations.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc;
                option.textContent = loc;
                locationFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

// Display catches in grid
function displayCatches(catches) {
    const grid = document.getElementById('catchesGrid');
    
    if (catches.length === 0) {
        showNoResultsState();
        return;
    }
    
    hideNoResultsState();
    
    grid.innerHTML = catches.map(catchItem => createCatchCard(catchItem)).join('');
    
    // Add click handlers to cards
    document.querySelectorAll('.catch-card').forEach(card => {
        card.addEventListener('click', function() {
            const catchId = parseInt(this.dataset.catchId);
            showCatchDetails(catchId);
        });
    });
}

// Create catch card HTML
function createCatchCard(catchData) {
    const statusClass = catchData.status === 'fresh' ? 'status-fresh' : 
                       catchData.status === 'frozen' ? 'status-frozen' : 'status-fresh';
    
    const statusText = catchData.status === 'fresh' ? 'Fresh' : 
                      catchData.status === 'frozen' ? 'Frozen' : 'Fresh';
    
    const verifiedBadge = catchData.verified ? 
        '<span class="status-badge status-verified ms-2">Verified</span>' : '';
    
    return `
        <div class="col-lg-4 col-md-6">
            <div class="catch-card fade-in" data-catch-id="${catchData.id}">
                <div class="position-relative">
                    <div class="catch-image-placeholder">
                        <i class="bi bi-fish"></i>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${verifiedBadge}
                </div>
                <div class="catch-info">
                    <h5 class="catch-species">${catchData.species}</h5>
                    ${catchData.scientificName ? `<p class="text-muted small fst-italic mb-2">${catchData.scientificName}</p>` : ''}
                    ${catchData.conservationStatus ? `<p class="badge bg-info text-dark mb-2">${catchData.conservationStatus}</p>` : ''}
                    <div class="catch-details">
                        <div class="catch-detail">
                            <i class="bi bi-speedometer2"></i>
                            <span>${catchData.weight} lbs</span>
                        </div>
                        ${catchData.length > 0 ? `
                        <div class="catch-detail">
                            <i class="bi bi-rulers"></i>
                            <span>${catchData.length}"</span>
                        </div>` : ''}
                        <div class="catch-detail">
                            <i class="bi bi-geo-alt"></i>
                            <span>${catchData.location}</span>
                        </div>
                    </div>
                    <div class="catch-price">$${catchData.price.toFixed(2)}/lb</div>
                    <div class="catch-fisher">Fisher: ${catchData.fisherName}</div>
                    <div class="catch-date">Caught: ${formatDate(catchData.catchDate)}</div>
                    ${catchData.description ? `<div class="catch-description">${catchData.description}</div>` : ''}
                    <div class="catch-actions">
                        <button class="btn btn-view-details" onclick="event.stopPropagation(); showCatchDetails(${catchData.id})">
                            <i class="bi bi-eye me-1"></i>View Details
                        </button>
                        <button class="btn btn-contact" onclick="event.stopPropagation(); contactFisher(${catchData.id})">
                            <i class="bi bi-envelope me-1"></i>Contact
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize filters
function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const speciesFilter = document.getElementById('speciesFilter');
    const locationFilter = document.getElementById('locationFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortBy = document.getElementById('sortBy');
    const clearFilters = document.getElementById('clearFilters');
    
    // Add event listeners
    searchInput.addEventListener('input', applyFilters);
    speciesFilter.addEventListener('change', applyFilters);
    locationFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
    sortBy.addEventListener('change', applySorting);
    clearFilters.addEventListener('click', clearAllFilters);
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const speciesFilter = document.getElementById('speciesFilter').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    filteredCatches = allCatches.filter(catchItem => {
        // Search filter
        const matchesSearch = !searchTerm || 
            catchItem.species.toLowerCase().includes(searchTerm) ||
            catchItem.location.toLowerCase().includes(searchTerm) ||
            catchItem.fisherName.toLowerCase().includes(searchTerm) ||
            (catchItem.description && catchItem.description.toLowerCase().includes(searchTerm));
        
        // Species filter
        const matchesSpecies = !speciesFilter || 
            catchItem.species.toLowerCase() === speciesFilter;
        
        // Location filter - exact state match
        const matchesLocation = !locationFilter || 
            catchItem.location === locationFilter;
        
        // Price filter
        let matchesPrice = true;
        if (priceFilter) {
            const [min, max] = priceFilter.split('-').map(p => parseFloat(p));
            if (max) {
                matchesPrice = catchItem.price >= min && catchItem.price <= max;
            } else {
                matchesPrice = catchItem.price >= min;
            }
        }
        
        return matchesSearch && matchesSpecies && matchesLocation && matchesPrice;
    });
    
    // Apply sorting if one is selected
    const sortBy = document.getElementById('sortBy').value;
    if (sortBy) {
        applySorting();
    } else {
        displayCatches(filteredCatches);
    }
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('speciesFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('sortBy').value = '';
    
    filteredCatches = [...allCatches];
    displayCatches(filteredCatches);
}

// Apply sorting
function applySorting() {
    const sortBy = document.getElementById('sortBy').value;
    
    if (!sortBy) {
        displayCatches(filteredCatches);
        return;
    }
    
    // Apply sorting to filtered catches
    const sortedCatches = [...filteredCatches].sort((a, b) => {
        const [field, direction] = sortBy.split('-');
        const isDescending = direction === 'desc';
        
        let comparison = 0;
        
        switch (field) {
            case 'weight':
                comparison = a.weight - b.weight;
                break;
            case 'length':
                comparison = a.length - b.length;
                break;
            case 'date':
                comparison = new Date(a.catchDate) - new Date(b.catchDate);
                break;
            case 'price':
                comparison = a.price - b.price;
                break;
            default:
                return 0;
        }
        
        return isDescending ? -comparison : comparison;
    });
    
    displayCatches(sortedCatches);
}

// Initialize modals
function initializeModals() {
    // Catch details modal
    const contactFisherBtn = document.getElementById('contactFisher');
    const claimPurchaseBtn = document.getElementById('claimPurchase');
    
    contactFisherBtn.addEventListener('click', function() {
        if (currentCatchId) {
            contactFisher(currentCatchId);
        }
    });

    claimPurchaseBtn.addEventListener('click', function() {
        if (currentCatchId) {
            claimPurchase(currentCatchId);
        }
    });
}

// Show catch details
function showCatchDetails(catchId) {
    const catchData = allCatches.find(c => c.id === catchId);
    if (!catchData) return;
    
    currentCatchId = catchId;
    
    const modalContent = document.getElementById('catchDetailsContent');
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="catch-image-placeholder">
                    <i class="bi bi-fish"></i>
                </div>
            </div>
            <div class="col-md-6">
                <h4 class="text-primary">${catchData.species}</h4>
                ${catchData.scientificName ? `<p class="fst-italic text-muted">${catchData.scientificName}</p>` : ''}
                ${catchData.conservationStatus ? `<p><span class="badge bg-info text-dark">${catchData.conservationStatus}</span></p>` : ''}
                ${catchData.verified ? '<p><span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Verified</span></p>' : ''}
                
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Weight:</strong> ${catchData.weight} lbs
                    </div>
                    ${catchData.length > 0 ? `
                    <div class="col-6">
                        <strong>Length:</strong> ${catchData.length} inches
                    </div>` : ''}
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Price:</strong> $${catchData.price.toFixed(2)}/lb
                    </div>
                    <div class="col-6">
                        <strong>Total Value:</strong> $${(catchData.weight * catchData.price).toFixed(2)}
                    </div>
                </div>
                <div class="mb-3">
                    <strong>Location:</strong> ${catchData.location}
                </div>
                ${catchData.landingPort ? `
                <div class="mb-3">
                    <strong>Landing Port:</strong> ${catchData.landingPort}
                </div>` : ''}
                <div class="mb-3">
                    <strong>Catch Date:</strong> ${formatDate(catchData.catchDate)}
                </div>
                <div class="mb-3">
                    <strong>Status:</strong> <span class="text-capitalize">${catchData.status}</span>
                </div>
                ${catchData.storageMethod ? `
                <div class="mb-3">
                    <strong>Storage:</strong> ${catchData.storageMethod}
                </div>` : ''}
                <div class="mb-3">
                    <strong>Fisher:</strong> ${catchData.fisherName}
                </div>
                <div class="mb-3">
                    <strong>Contact:</strong> ${catchData.contactEmail}
                </div>
                ${catchData.aiConfidenceScore > 0 ? `
                <div class="mb-3">
                    <strong>AI Verification Score:</strong> ${catchData.aiConfidenceScore.toFixed(1)}%
                </div>` : ''}
                ${catchData.description ? `
                <div class="mb-3">
                    <strong>Description:</strong><br>
                    ${catchData.description}
                </div>` : ''}
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('catchDetailsModal'));
    modal.show();
}

// Claim purchase
async function claimPurchase(catchId) {
    if (!confirm('Are you sure you want to claim this purchase? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/catches/${catchId}/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                buyerEmail: 'buyer@example.com', // In real app, get from auth
                buyerName: 'Current Buyer' // In real app, get from auth
            })
        });

        const result = await response.json();

        if (response.ok) {
            showSuccessMessage(result.message);
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('catchDetailsModal')).hide();
            // Reload catches
            await loadCatches();
            applyFilters();
        } else {
            showErrorMessage(result.message || 'Failed to claim purchase');
        }
    } catch (error) {
        console.error('Error claiming purchase:', error);
        showErrorMessage('Failed to claim purchase. Please try again.');
    }
}

// Contact fisher
function contactFisher(catchId) {
    const catchData = allCatches.find(c => c.id === catchId);
    if (!catchData) return;
    
    const subject = `Interested in your ${catchData.species} catch`;
    const body = `Hello ${catchData.fisherName},\n\nI'm interested in purchasing your ${catchData.species} catch. Please let me know if it's still available and how we can arrange the transaction.\n\nBest regards`;
    
    const mailtoLink = `mailto:${catchData.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showLoadingState() {
    document.getElementById('loadingState').classList.remove('d-none');
    document.getElementById('noResultsState').classList.add('d-none');
    document.getElementById('catchesGrid').innerHTML = '';
}

function hideLoadingState() {
    document.getElementById('loadingState').classList.add('d-none');
}

function showNoResultsState() {
    document.getElementById('noResultsState').classList.remove('d-none');
    document.getElementById('catchesGrid').innerHTML = '';
}

function hideNoResultsState() {
    document.getElementById('noResultsState').classList.add('d-none');
}

function showErrorState(message) {
    hideLoadingState();
    const grid = document.getElementById('catchesGrid');
    grid.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger text-center">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
            </div>
        </div>
    `;
}

function showSuccessMessage(message) {
    // Create and show success toast
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-check-circle me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

function showErrorMessage(message) {
    // Create and show error toast
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-exclamation-triangle me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}
