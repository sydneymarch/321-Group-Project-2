// SeaTrue Marketplace JavaScript - Advanced Filter System
// Handles catch display, advanced filtering with sliders and checkboxes, and API interactions

document.addEventListener('DOMContentLoaded', function() {
    initializeMarketplace();
});

// Global variables
let allCatches = [];
let filteredCatches = [];
let currentCatchId = null;
const MARKETPLACE_API_URL = 'http://localhost:5142/api/SeaTrue';

// Filter state
let filterState = {
    searchTerm: '',
    minPrice: 0,
    maxPrice: 500,
    selectedSpecies: new Set(),
    selectedLocations: new Set(),
    selectedConditions: new Set(),
    selectedVerification: new Set(),
    selectedConservation: new Set(),
    sortBy: ''
};

// Initialize marketplace
async function initializeMarketplace() {
    try {
        showLoadingState();
        
        // Load all data in parallel
        await Promise.all([
            loadCatches(),
            loadSpeciesOptions(),
            loadLocationOptions()
        ]);
        
        // Initialize price range based on actual data
        initializePriceRange();
        
        // Initialize filter handlers
        initializeFilterHandlers();
        
        // Initialize modals
        initializeModals();
        
        // Display initial results
        hideLoadingState();
        applyAllFilters();
        
    } catch (error) {
        console.error('Error initializing marketplace:', error);
        showErrorState('Failed to load catches. Please refresh the page.');
    }
}

// Load catches from API
async function loadCatches() {
    try {
        const response = await fetch(`${MARKETPLACE_API_URL}/catches`);
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

// Load species options dynamically
async function loadSpeciesOptions() {
    try {
        const response = await fetch(`${MARKETPLACE_API_URL}/species`);
        if (response.ok) {
            const species = await response.json();
            const container = document.getElementById('speciesCheckboxes');
            
            species.forEach((sp, index) => {
                const checkboxId = `species-${index}`;
                const div = document.createElement('div');
                div.className = 'form-check mb-2';
                div.innerHTML = `
                    <input class="form-check-input species-checkbox" type="checkbox" id="${checkboxId}" value="${sp}">
                    <label class="form-check-label" for="${checkboxId}">${sp}</label>
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error loading species:', error);
    }
}

// Load location options dynamically
async function loadLocationOptions() {
    try {
        const response = await fetch(`${MARKETPLACE_API_URL}/locations`);
        if (response.ok) {
            const locations = await response.json();
            const container = document.getElementById('locationCheckboxes');
            
            locations.forEach((loc, index) => {
                const checkboxId = `location-${index}`;
                const div = document.createElement('div');
                div.className = 'form-check mb-2';
                div.innerHTML = `
                    <input class="form-check-input location-checkbox" type="checkbox" id="${checkboxId}" value="${loc}">
                    <label class="form-check-label" for="${checkboxId}">${loc}</label>
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

// Initialize price range sliders based on actual data
function initializePriceRange() {
    if (allCatches.length === 0) {
        // Set default values if no catches loaded yet
        setDefaultPriceRange();
        return;
    }
    
    // Calculate total prices, filtering out invalid values
    const prices = allCatches
        .map(c => {
            const price = c.price || 0;
            const weight = c.weight || 0;
            return price * weight;
        })
        .filter(price => !isNaN(price) && price > 0);
    
    if (prices.length === 0) {
        setDefaultPriceRange();
        return;
    }
    
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));
    
    // Update slider ranges
    const minSlider = document.getElementById('minPriceSlider');
    const maxSlider = document.getElementById('maxPriceSlider');
    const minInput = document.getElementById('minPriceInput');
    const maxInput = document.getElementById('maxPriceInput');
    
    minSlider.min = minPrice;
    minSlider.max = maxPrice;
    minSlider.value = minPrice;
    
    maxSlider.min = minPrice;
    maxSlider.max = maxPrice;
    maxSlider.value = maxPrice;
    
    minInput.value = minPrice;
    minInput.min = minPrice;
    minInput.max = maxPrice;
    
    maxInput.value = maxPrice;
    maxInput.min = minPrice;
    maxInput.max = maxPrice;
    
    // Update filter state
    filterState.minPrice = minPrice;
    filterState.maxPrice = maxPrice;
}

// Set default price range when no data available
function setDefaultPriceRange() {
    const defaultMin = 0;
    const defaultMax = 500;
    
    const minSlider = document.getElementById('minPriceSlider');
    const maxSlider = document.getElementById('maxPriceSlider');
    const minInput = document.getElementById('minPriceInput');
    const maxInput = document.getElementById('maxPriceInput');
    
    minSlider.min = defaultMin;
    minSlider.max = defaultMax;
    minSlider.value = defaultMin;
    
    maxSlider.min = defaultMin;
    maxSlider.max = defaultMax;
    maxSlider.value = defaultMax;
    
    minInput.value = defaultMin;
    minInput.min = defaultMin;
    minInput.max = defaultMax;
    
    maxInput.value = defaultMax;
    maxInput.min = defaultMin;
    maxInput.max = defaultMax;
    
    filterState.minPrice = defaultMin;
    filterState.maxPrice = defaultMax;
}

// Initialize all filter handlers
function initializeFilterHandlers() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(() => {
        filterState.searchTerm = searchInput.value.toLowerCase();
        applyAllFilters();
    }, 300));
    
    // Price sliders
    const minSlider = document.getElementById('minPriceSlider');
    const maxSlider = document.getElementById('maxPriceSlider');
    const minInput = document.getElementById('minPriceInput');
    const maxInput = document.getElementById('maxPriceInput');
    
    minSlider.addEventListener('input', () => {
        filterState.minPrice = parseInt(minSlider.value);
        if (filterState.minPrice > filterState.maxPrice) {
            filterState.minPrice = filterState.maxPrice;
            minSlider.value = filterState.minPrice;
        }
        minInput.value = filterState.minPrice;
        applyAllFilters();
    });
    
    maxSlider.addEventListener('input', () => {
        filterState.maxPrice = parseInt(maxSlider.value);
        if (filterState.maxPrice < filterState.minPrice) {
            filterState.maxPrice = filterState.minPrice;
            maxSlider.value = filterState.maxPrice;
        }
        maxInput.value = filterState.maxPrice;
        applyAllFilters();
    });
    
    minInput.addEventListener('change', () => {
        filterState.minPrice = parseInt(minInput.value);
        minSlider.value = filterState.minPrice;
        applyAllFilters();
    });
    
    maxInput.addEventListener('change', () => {
        filterState.maxPrice = parseInt(maxInput.value);
        maxSlider.value = filterState.maxPrice;
        applyAllFilters();
    });
    
    // Sort dropdown
    document.getElementById('sortBy').addEventListener('change', (e) => {
        filterState.sortBy = e.target.value;
        applyAllFilters();
    });
    
    // Species checkboxes (delegated)
    document.getElementById('speciesCheckboxes').addEventListener('change', (e) => {
        if (e.target.classList.contains('species-checkbox')) {
            if (e.target.checked) {
                filterState.selectedSpecies.add(e.target.value);
            } else {
                filterState.selectedSpecies.delete(e.target.value);
            }
            applyAllFilters();
        }
    });
    
    // Location checkboxes (delegated)
    document.getElementById('locationCheckboxes').addEventListener('change', (e) => {
        if (e.target.classList.contains('location-checkbox')) {
            if (e.target.checked) {
                filterState.selectedLocations.add(e.target.value);
            } else {
                filterState.selectedLocations.delete(e.target.value);
            }
            applyAllFilters();
        }
    });
    
    // Condition checkboxes
    ['conditionFresh', 'conditionFrozen', 'conditionLive'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    filterState.selectedConditions.add(checkbox.value);
                } else {
                    filterState.selectedConditions.delete(checkbox.value);
                }
                applyAllFilters();
            });
        }
    });
    
    // Verification checkboxes
    ['aiVerified', 'adminVerified'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    filterState.selectedVerification.add(checkbox.value);
                } else {
                    filterState.selectedVerification.delete(checkbox.value);
                }
                applyAllFilters();
            });
        }
    });
    
    // Conservation status checkboxes
    ['conservationLC', 'conservationNT', 'conservationVU', 'conservationEN'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    filterState.selectedConservation.add(checkbox.value);
                } else {
                    filterState.selectedConservation.delete(checkbox.value);
                }
                applyAllFilters();
            });
        }
    });
    
    // Clear filters buttons
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    document.getElementById('clearFiltersSidebar').addEventListener('click', clearAllFilters);
    
    // Toggle filters
    document.getElementById('toggleFilters').addEventListener('click', toggleFilterSidebar);
    
    // Close filters button
    document.getElementById('closeFilters').addEventListener('click', () => {
        const sidebar = document.getElementById('filterSidebar');
        const overlay = document.getElementById('filterOverlay');
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    });
}

// Apply all filters
function applyAllFilters() {
    filteredCatches = allCatches.filter(catchItem => {
        // Search filter
        const matchesSearch = !filterState.searchTerm || 
            (catchItem.species || '').toLowerCase().includes(filterState.searchTerm) ||
            (catchItem.location || '').toLowerCase().includes(filterState.searchTerm) ||
            (catchItem.fisherName || '').toLowerCase().includes(filterState.searchTerm) ||
            (catchItem.scientificName || '').toLowerCase().includes(filterState.searchTerm);
        
        // Price filter
        const totalPrice = (catchItem.price || 0) * (catchItem.weight || 0);
        const matchesPrice = totalPrice >= filterState.minPrice && totalPrice <= filterState.maxPrice;
        
        // Species filter
        const matchesSpecies = filterState.selectedSpecies.size === 0 || 
            filterState.selectedSpecies.has(catchItem.species);
        
        // Location filter
        const matchesLocation = filterState.selectedLocations.size === 0 || 
            filterState.selectedLocations.has(catchItem.location);
        
        // Condition filter
        const matchesCondition = filterState.selectedConditions.size === 0 || 
            filterState.selectedConditions.has(catchItem.status);
        
        // Verification filter
        const matchesVerification = filterState.selectedVerification.size === 0 || 
            (filterState.selectedVerification.has('ai') && catchItem.isAIVerified) ||
            (filterState.selectedVerification.has('admin') && catchItem.isAdminVerified);
        
        // Conservation status filter
        const matchesConservation = filterState.selectedConservation.size === 0 || 
            filterState.selectedConservation.has(catchItem.iucnRedListStatus);
        
        return matchesSearch && matchesPrice && matchesSpecies && matchesLocation && 
               matchesCondition && matchesVerification && matchesConservation;
    });
    
    // Apply sorting
    if (filterState.sortBy) {
        applySorting();
    }
    
    // Update UI
    updateResultsCount();
    updateActiveFilters();
    updateClearButtonVisibility();
    displayCatches(filteredCatches);
}

// Apply sorting to filtered catches
function applySorting() {
    const [field, direction] = filterState.sortBy.split('-');
    const isDescending = direction === 'desc';
    
    filteredCatches.sort((a, b) => {
        let comparison = 0;
        
        switch (field) {
            case 'weight':
                comparison = (a.weight || 0) - (b.weight || 0);
                break;
            case 'date':
                comparison = new Date(a.catchDate) - new Date(b.catchDate);
                break;
            case 'price':
                comparison = ((a.price || 0) * (a.weight || 0)) - ((b.price || 0) * (b.weight || 0));
                break;
            default:
                return 0;
        }
        
        return isDescending ? -comparison : comparison;
    });
}

// Update results count
function updateResultsCount() {
    document.getElementById('resultsCount').textContent = filteredCatches.length;
}

// Update active filters display
function updateActiveFilters() {
    const container = document.getElementById('activeFilterBadges');
    const activeFiltersDiv = document.getElementById('activeFilters');
    container.innerHTML = '';
    
    let hasFilters = false;
    
    // Add filter badges
    filterState.selectedSpecies.forEach(species => {
        container.appendChild(createFilterBadge('Species', species, () => {
            filterState.selectedSpecies.delete(species);
            document.querySelector(`input[value="${species}"].species-checkbox`).checked = false;
            applyAllFilters();
        }));
        hasFilters = true;
    });
    
    filterState.selectedLocations.forEach(location => {
        container.appendChild(createFilterBadge('Location', location, () => {
            filterState.selectedLocations.delete(location);
            document.querySelector(`input[value="${location}"].location-checkbox`).checked = false;
            applyAllFilters();
        }));
        hasFilters = true;
    });
    
    filterState.selectedConditions.forEach(condition => {
        container.appendChild(createFilterBadge('Condition', condition, () => {
            filterState.selectedConditions.delete(condition);
            document.getElementById(`condition${condition}`).checked = false;
            applyAllFilters();
        }));
        hasFilters = true;
    });
    
    activeFiltersDiv.style.display = hasFilters ? 'block' : 'none';
}

// Create filter badge
function createFilterBadge(label, value, onClick) {
    const badge = document.createElement('span');
    badge.className = 'badge filter-badge';
    badge.innerHTML = `${label}: ${value} <i class="bi bi-x"></i>`;
    badge.onclick = onClick;
    return badge;
}

// Check if any filters are active
function hasActiveFilters() {
    return filterState.searchTerm !== '' ||
           filterState.selectedSpecies.size > 0 ||
           filterState.selectedLocations.size > 0 ||
           filterState.selectedConditions.size > 0 ||
           filterState.selectedVerification.size > 0 ||
           filterState.selectedConservation.size > 0 ||
           filterState.sortBy !== '';
}

// Update clear button visibility
function updateClearButtonVisibility() {
    const clearBtn = document.getElementById('clearFilters');
    const clearSidebarContainer = document.getElementById('clearFiltersSidebarContainer');
    const display = hasActiveFilters() ? 'inline-block' : 'none';
    const blockDisplay = hasActiveFilters() ? 'block' : 'none';
    clearBtn.style.display = display;
    clearSidebarContainer.style.display = blockDisplay;
}

// Clear all filters
function clearAllFilters() {
    // Reset filter state
    filterState.searchTerm = '';
    filterState.selectedSpecies.clear();
    filterState.selectedLocations.clear();
    filterState.selectedConditions.clear();
    filterState.selectedVerification.clear();
    filterState.selectedConservation.clear();
    filterState.sortBy = '';
    
    // Reset UI elements
    document.getElementById('searchInput').value = '';
    document.getElementById('sortBy').value = '';
    
    // Uncheck all checkboxes
    document.querySelectorAll('.form-check-input').forEach(cb => cb.checked = false);
    
    // Reset price range
    initializePriceRange();
    
    // Reapply filters
    applyAllFilters();
}

// Toggle filter sidebar
function toggleFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    const overlay = document.getElementById('filterOverlay');
    const isShowing = sidebar.classList.contains('show');
    
    if (isShowing) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    } else {
        sidebar.classList.add('show');
        overlay.classList.add('show');
    }
    
    // Close sidebar when clicking overlay
    overlay.onclick = () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    };
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
function createCatchCard(catchItem) {
    const totalPrice = ((catchItem.price || 0) * (catchItem.weight || 0)).toFixed(2);
    const conservationStyle = getConservationBadgeClass(catchItem.conservationStatus || 'DD');
    
    return `
        <div class="col-lg-4 col-md-6">
            <div class="catch-card" data-catch-id="${catchItem.id}">
                ${catchItem.imageUrl ? 
                    `<img src="${catchItem.imageUrl}" alt="${catchItem.species}" class="catch-image">` :
                    `<div class="catch-image-placeholder"><i class="bi bi-fish"></i></div>`
                }
                <div class="catch-info">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="catch-species mb-0">${catchItem.species}</h5>
                        <span class="badge" style="${conservationStyle}">${catchItem.conservationStatus || 'DD'}</span>
                    </div>
                    <p class="text-muted small mb-2"><em>${catchItem.scientificName || 'Unknown'}</em></p>
                    
                    <div class="catch-details mb-3">
                        <div class="catch-detail">
                            <i class="bi bi-arrow-down-up"></i>
                            <span>${(catchItem.weight || 0).toFixed(1)} lbs</span>
                        </div>
                        <div class="catch-detail">
                            <i class="bi bi-geo-alt-fill"></i>
                            <span>${catchItem.location || 'Unknown'}</span>
                        </div>
                        <div class="catch-detail">
                            <i class="bi bi-calendar3"></i>
                            <span>${new Date(catchItem.catchDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="catch-price">$${totalPrice}</div>
                        <div>
                            ${(catchItem.isAIVerified || catchItem.isAdminVerified) ? '<i class="bi bi-shield-check text-success" title="Verified"></i>' : ''}
                        </div>
                    </div>
                    
                    <button class="btn btn-primary w-100">
                        <i class="bi bi-eye me-2"></i>View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Get conservation badge class
function getConservationBadgeClass(status) {
    const styles = {
        'LC': 'background-color: #28a745; color: white;',
        'NT': 'background-color: #ffc107; color: #212529;',
        'VU': 'background-color: #fd7e14; color: white;',
        'EN': 'background-color: #dc3545; color: white;',
        'CR': 'background-color: #6f42c1; color: white;',
        'DD': 'background-color: #6c757d; color: white;'
    };
    return styles[status] || 'background-color: #6c757d; color: white;';
}

// Show catch details modal
async function showCatchDetails(catchId) {
    try {
        const response = await fetch(`${MARKETPLACE_API_URL}/catches/${catchId}`);
            if (response.ok) {
            const catchData = await response.json();
            currentCatchId = catchId;
            displayCatchDetailsModal(catchData);
        }
    } catch (error) {
        console.error('Error loading catch details:', error);
    }
}

// Display catch details in modal
function displayCatchDetailsModal(catchData) {
    const totalPrice = ((catchData.price || 0) * (catchData.weight || 0)).toFixed(2);
    const modal = document.getElementById('catchDetailsContent');
    
    modal.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                ${catchData.imageUrl ? 
                    `<img src="${catchData.imageUrl}" alt="${catchData.species}" class="img-fluid rounded mb-3">` :
                    `<div class="catch-image-placeholder mb-3"><i class="bi bi-fish"></i></div>`
                }
            </div>
            <div class="col-md-6">
                <h3 class="text-primary">${catchData.species}</h3>
                <p class="text-muted"><em>${catchData.scientificName || 'Unknown'}</em></p>
                <h4 class="text-success mb-3">$${totalPrice}</h4>
                
                <table class="table table-sm">
                    <tr>
                        <th>Weight:</th>
                        <td>${(catchData.weight || 0).toFixed(1)} lbs</td>
                    </tr>
                    ${catchData.length ? `
                        <tr>
                            <th>Size:</th>
                            <td>${catchData.length.toFixed(1)} inches</td>
                        </tr>
                    ` : ''}
                    <tr>
                        <th>Location:</th>
                        <td>${catchData.location || 'Unknown'}</td>
                    </tr>
                    <tr>
                        <th>Catch Date:</th>
                        <td>${new Date(catchData.catchDate).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <th>Condition:</th>
                        <td>${catchData.status || 'Fresh'}</td>
                    </tr>
                    <tr>
                        <th>Fisher:</th>
                        <td>${catchData.fisherName}</td>
                    </tr>
                    <tr>
                        <th>Conservation:</th>
                        <td><span class="badge" style="${getConservationBadgeClass(catchData.conservationStatus)}">${catchData.conservationStatus || 'Unknown'}</span></td>
                    </tr>
                </table>
                
                <div class="mt-3">
                    ${(catchData.isAIVerified || catchData.isAdminVerified) ? '<span class="badge bg-success"><i class="bi bi-shield-check"></i> Verified</span>' : ''}
                </div>
                
                ${catchData.description ? `
                    <div class="mt-3">
                        <h6>Description:</h6>
                        <p>${catchData.description}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    const modal2 = new bootstrap.Modal(document.getElementById('catchDetailsModal'));
    modal2.show();
}

// Initialize modals
function initializeModals() {
    const claimBtn = document.getElementById('claimPurchase');
    const contactBtn = document.getElementById('contactFisher');
    
    if (claimBtn) {
        claimBtn.addEventListener('click', handleClaimPurchase);
    }
    
    if (contactBtn) {
        contactBtn.addEventListener('click', handleContactFisher);
    }
}

// Handle claim purchase
async function handleClaimPurchase() {
    if (!currentCatchId) return;
    
    try {
        const response = await fetch(`${MARKETPLACE_API_URL}/catches/${currentCatchId}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ BuyerID: 1 }) // Hardcoded for demo
        });
        
        if (response.ok) {
            alert('Purchase claimed successfully! The fisher has been notified.');
            bootstrap.Modal.getInstance(document.getElementById('catchDetailsModal')).hide();
            await loadCatches();
            applyAllFilters();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to claim purchase');
        }
    } catch (error) {
        console.error('Error claiming purchase:', error);
        alert('Failed to claim purchase. Please try again.');
    }
}

// Handle contact fisher
function handleContactFisher() {
    alert('Contact fisher functionality coming soon!');
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show/hide loading state
function showLoadingState() {
    document.getElementById('loadingState').classList.remove('d-none');
    document.getElementById('catchesGrid').innerHTML = '';
}

function hideLoadingState() {
    document.getElementById('loadingState').classList.add('d-none');
}

// Show/hide no results state
function showNoResultsState() {
    document.getElementById('noResultsState').classList.remove('d-none');
    document.getElementById('catchesGrid').innerHTML = '';
}

function hideNoResultsState() {
    document.getElementById('noResultsState').classList.add('d-none');
}

// Show error state
function showErrorState(message) {
    const grid = document.getElementById('catchesGrid');
    grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
            <h4 class="mt-3 text-danger">Error</h4>
            <p class="text-muted">${message}</p>
        </div>
    `;
    hideLoadingState();
}
