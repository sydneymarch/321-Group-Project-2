// SeaTrue Marketplace JavaScript
// Handles catch upload, display, filtering, and API interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize marketplace functionality
    initializeMarketplace();
    initializeFilters();
    initializeUploadForm();
    initializeModals();
});

// Global variables
let allCatches = [];
let filteredCatches = [];
let currentCatchId = null;

// Initialize marketplace
async function initializeMarketplace() {
    try {
        showLoadingState();
        await loadCatches();
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
        // Try to fetch from real API first
        const response = await fetch('/api/SeaTrue/catches');
        if (response.ok) {
            allCatches = await response.json();
            filteredCatches = [...allCatches];
        } else {
            // Fallback to mock data if API is not available
            console.warn('API not available, using mock data');
            const mockCatches = await fetchMockCatches();
            allCatches = mockCatches;
            filteredCatches = [...allCatches];
        }
    } catch (error) {
        console.error('Error loading catches:', error);
        // Fallback to mock data
        const mockCatches = await fetchMockCatches();
        allCatches = mockCatches;
        filteredCatches = [...allCatches];
    }
}

// Mock data for demonstration
async function fetchMockCatches() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
        {
            id: 1,
            species: 'Salmon',
            weight: 12.5,
            length: 28,
            price: 8.50,
            location: 'Alaska',
            catchDate: '2024-01-15',
            fisherName: 'John Smith',
            contactEmail: 'john@example.com',
            description: 'Fresh Atlantic salmon caught in pristine Alaskan waters. Sustainably fished using traditional methods.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        },
        {
            id: 2,
            species: 'Tuna',
            weight: 45.2,
            length: 36,
            price: 12.00,
            location: 'California',
            catchDate: '2024-01-14',
            fisherName: 'Maria Garcia',
            contactEmail: 'maria@example.com',
            description: 'Premium yellowfin tuna, caught fresh this morning. Perfect for sushi or sashimi.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        },
        {
            id: 3,
            species: 'Cod',
            weight: 8.7,
            length: 24,
            price: 6.75,
            location: 'Maine',
            catchDate: '2024-01-13',
            fisherName: 'Bob Wilson',
            contactEmail: 'bob@example.com',
            description: 'Atlantic cod caught using sustainable fishing practices. Great for fish and chips or baking.',
            imageUrl: null,
            status: 'frozen',
            verified: false
        },
        {
            id: 4,
            species: 'Halibut',
            weight: 22.3,
            length: 32,
            price: 15.25,
            location: 'Alaska',
            catchDate: '2024-01-12',
            fisherName: 'Sarah Johnson',
            contactEmail: 'sarah@example.com',
            description: 'Large Pacific halibut, perfect for restaurants. Caught using longline fishing method.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        },
        {
            id: 5,
            species: 'Snapper',
            weight: 6.8,
            length: 20,
            price: 9.50,
            location: 'Florida',
            catchDate: '2024-01-11',
            fisherName: 'Carlos Rodriguez',
            contactEmail: 'carlos@example.com',
            description: 'Red snapper caught in the Gulf of Mexico. Fresh and ready for cooking.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        },
        {
            id: 6,
            species: 'Salmon',
            weight: 15.2,
            length: 30,
            price: 9.25,
            location: 'Washington',
            catchDate: '2024-01-10',
            fisherName: 'Mike Chen',
            contactEmail: 'mike@example.com',
            description: 'Pacific salmon from Washington waters. Fresh catch from this morning.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        },
        {
            id: 7,
            species: 'Lobster',
            weight: 2.1,
            length: 12,
            price: 18.50,
            location: 'Maine',
            catchDate: '2024-01-09',
            fisherName: 'Lisa Anderson',
            contactEmail: 'lisa@example.com',
            description: 'Fresh Maine lobster, perfect for restaurants. Caught this morning.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        },
        {
            id: 8,
            species: 'Crab',
            weight: 3.5,
            length: 8,
            price: 14.75,
            location: 'Oregon',
            catchDate: '2024-01-08',
            fisherName: 'David Kim',
            contactEmail: 'david@example.com',
            description: 'Dungeness crab from Oregon coast. Fresh and ready for cooking.',
            imageUrl: null,
            status: 'fresh',
            verified: false
        },
        {
            id: 9,
            species: 'Tuna',
            weight: 38.7,
            length: 34,
            price: 11.50,
            location: 'Hawaii',
            catchDate: '2024-01-07',
            fisherName: 'Keoni Nakamura',
            contactEmail: 'keoni@example.com',
            description: 'Bigeye tuna from Hawaiian waters. Premium quality for sushi.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        },
        {
            id: 10,
            species: 'Shrimp',
            weight: 1.2,
            length: 6,
            price: 22.00,
            location: 'Louisiana',
            catchDate: '2024-01-06',
            fisherName: 'Pierre LeBlanc',
            contactEmail: 'pierre@example.com',
            description: 'Fresh Gulf shrimp from Louisiana. Perfect for seafood dishes.',
            imageUrl: null,
            status: 'fresh',
            verified: true
        }
    ];
}

// Display catches in grid
function displayCatches(catches) {
    const grid = document.getElementById('catchesGrid');
    
    if (catches.length === 0) {
        showNoResultsState();
        return;
    }
    
    hideNoResultsState();
    
    grid.innerHTML = catches.map(catch => createCatchCard(catch)).join('');
    
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
                       catchData.status === 'frozen' ? 'status-frozen' : 'status-verified';
    
    const statusText = catchData.status === 'fresh' ? 'Fresh' : 
                      catchData.status === 'frozen' ? 'Frozen' : 'Verified';
    
    return `
        <div class="col-lg-4 col-md-6">
            <div class="catch-card fade-in" data-catch-id="${catchData.id}">
                <div class="position-relative">
                    ${catchData.imageUrl ? 
                        `<img src="${catchData.imageUrl}" alt="${catchData.species}" class="catch-image">` :
                        `<div class="catch-image-placeholder">
                            <i class="bi bi-fish"></i>
                        </div>`
                    }
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="catch-info">
                    <h5 class="catch-species">${catchData.species}</h5>
                    <div class="catch-details">
                        <div class="catch-detail">
                            <i class="bi bi-speedometer2"></i>
                            <span>${catchData.weight} lbs</span>
                        </div>
                        <div class="catch-detail">
                            <i class="bi bi-rulers"></i>
                            <span>${catchData.length}"</span>
                        </div>
                        <div class="catch-detail">
                            <i class="bi bi-geo-alt"></i>
                            <span>${catchData.location}</span>
                        </div>
                    </div>
                    <div class="catch-price">$${catchData.price.toFixed(2)}/lb</div>
                    <div class="catch-fisher">Fisher: ${catchData.fisherName}</div>
                    <div class="catch-date">Caught: ${formatDate(catchData.catchDate)}</div>
                    <div class="catch-description">${catchData.description}</div>
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
    const locationFilter = document.getElementById('locationFilter').value.toLowerCase();
    const priceFilter = document.getElementById('priceFilter').value;
    
    filteredCatches = allCatches.filter(catch => {
        // Search filter
        const matchesSearch = !searchTerm || 
            catch.species.toLowerCase().includes(searchTerm) ||
            catch.location.toLowerCase().includes(searchTerm) ||
            catch.fisherName.toLowerCase().includes(searchTerm) ||
            catch.description.toLowerCase().includes(searchTerm);
        
        // Species filter
        const matchesSpecies = !speciesFilter || 
            catch.species.toLowerCase() === speciesFilter;
        
        // Location filter - exact state match
        const matchesLocation = !locationFilter || 
            catch.location === locationFilter;
        
        // Price filter
        let matchesPrice = true;
        if (priceFilter) {
            const [min, max] = priceFilter.split('-').map(p => parseFloat(p));
            if (max) {
                matchesPrice = catch.price >= min && catch.price <= max;
            } else {
                matchesPrice = catch.price >= min;
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
        // No sorting selected, just apply current filters
        applyFilters();
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

// Initialize upload form
function initializeUploadForm() {
    const submitButton = document.getElementById('submitCatch');
    submitButton.addEventListener('click', handleCatchUpload);
    
    // Set today's date as default
    document.getElementById('catchDate').value = new Date().toISOString().split('T')[0];
}

// Handle catch upload
async function handleCatchUpload() {
    const form = document.getElementById('uploadCatchForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        // Show loading state
        const submitButton = document.getElementById('submitCatch');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Uploading...';
        submitButton.disabled = true;
        
        // Create catch object
        const newCatch = {
            species: document.getElementById('species').value,
            weight: parseFloat(document.getElementById('weight').value),
            length: parseFloat(document.getElementById('length').value),
            price: parseFloat(document.getElementById('price').value),
            location: document.getElementById('location').value,
            catchDate: document.getElementById('catchDate').value,
            fisherName: document.getElementById('fisherName').value,
            contactEmail: document.getElementById('contactEmail').value,
            description: document.getElementById('description').value,
            imageUrl: null, // Will be handled by file upload
            status: 'fresh',
            verified: false
        };
        
        // Try to upload to real API first
        try {
            const response = await fetch('/api/SeaTrue/catches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCatch)
            });
            
            if (response.ok) {
                const uploadedCatch = await response.json();
                allCatches.unshift(uploadedCatch);
                filteredCatches = [...allCatches];
            } else {
                throw new Error('API upload failed');
            }
        } catch (apiError) {
            console.warn('API upload failed, using local storage:', apiError);
            // Fallback to local storage
            newCatch.id = allCatches.length + 1;
            allCatches.unshift(newCatch);
            filteredCatches = [...allCatches];
        }
        
        // Reset form and close modal
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('uploadCatchModal')).hide();
        
        // Refresh display
        displayCatches(filteredCatches);
        
        // Show success message
        showSuccessMessage('Catch uploaded successfully!');
        
    } catch (error) {
        console.error('Error uploading catch:', error);
        showErrorMessage('Failed to upload catch. Please try again.');
    } finally {
        // Reset button
        const submitButton = document.getElementById('submitCatch');
        submitButton.innerHTML = '<i class="bi bi-check-circle me-2"></i>Upload Catch';
        submitButton.disabled = false;
    }
}

// Initialize modals
function initializeModals() {
    // Catch details modal
    const catchDetailsModal = document.getElementById('catchDetailsModal');
    const contactFisherBtn = document.getElementById('contactFisher');
    
    contactFisherBtn.addEventListener('click', function() {
        if (currentCatchId) {
            contactFisher(currentCatchId);
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
                ${catchData.imageUrl ? 
                    `<img src="${catchData.imageUrl}" alt="${catchData.species}" class="img-fluid rounded">` :
                    `<div class="catch-image-placeholder">
                        <i class="bi bi-fish"></i>
                    </div>`
                }
            </div>
            <div class="col-md-6">
                <h4 class="text-primary">${catchData.species}</h4>
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Weight:</strong> ${catchData.weight} lbs
                    </div>
                    <div class="col-6">
                        <strong>Length:</strong> ${catchData.length} inches
                    </div>
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
                <div class="mb-3">
                    <strong>Catch Date:</strong> ${formatDate(catchData.catchDate)}
                </div>
                <div class="mb-3">
                    <strong>Fisher:</strong> ${catchData.fisherName}
                </div>
                <div class="mb-3">
                    <strong>Contact:</strong> ${catchData.contactEmail}
                </div>
                <div class="mb-3">
                    <strong>Description:</strong><br>
                    ${catchData.description}
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('catchDetailsModal'));
    modal.show();
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

// API integration class for future backend connection
class SeaTrueAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }
    
    async getCatches() {
        try {
            const response = await fetch(`${this.baseURL}/catches`);
            if (!response.ok) throw new Error('Failed to fetch catches');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    async uploadCatch(catchData) {
        try {
            const response = await fetch(`${this.baseURL}/catches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(catchData)
            });
            if (!response.ok) throw new Error('Failed to upload catch');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    async contactFisher(catchId, message) {
        try {
            const response = await fetch(`${this.baseURL}/catches/${catchId}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });
            if (!response.ok) throw new Error('Failed to send message');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}

// Initialize API instance for future use
const seaTrueAPI = new SeaTrueAPI();

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SeaTrueAPI, displayCatches, applyFilters };
}
