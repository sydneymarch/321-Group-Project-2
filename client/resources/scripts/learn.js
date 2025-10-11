// Learn Page JavaScript
const API_BASE = 'http://localhost:5142/api/species';

// DOM elements
const searchInput = document.getElementById('speciesSearch');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.querySelector('.loading-spinner');
const messageContainer = document.getElementById('messageContainer');
const speciesResults = document.getElementById('speciesResults');

// Event listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function quickSearch(speciesName) {
    searchInput.value = speciesName;
    performSearch();
}

async function performSearch() {
    const speciesName = searchInput.value.trim();
    if (!speciesName) {
        showMessage('Please enter a species name to search.', 'error');
        return;
    }
    
    setLoading(true);
    clearMessages();
    hideResults();
    
    try {
        const response = await fetch(`${API_BASE}/full-lookup/${encodeURIComponent(speciesName)}`);
        const data = await response.json();
        
        if (response.ok) {
            displaySpeciesData(data);
            showMessage('Species information retrieved successfully!', 'success');
        } else {
            showMessage(data.message || 'Species not found. Please try a different name.', 'error');
        }
    } catch (error) {
        showMessage('Error connecting to species database. Please try again.', 'error');
        console.error('Search error:', error);
    } finally {
        setLoading(false);
    }
}

function displaySpeciesData(data) {
    console.log('Full API response:', data); // Debug log
    
    // Update species information
    document.getElementById('speciesName').textContent = data.commonName || 'Unknown';
    document.getElementById('speciesScientific').textContent = data.scientificName || 'Scientific name not available';
    
    // Extract IUCN data - handle both nested and direct structure
    let iucnData = data.iucnData || data;
    
    // Update conservation information with proper fallbacks (PascalCase from API)
    const conservationStatus = iucnData.ConservationStatus || 'Unknown';
    const categoryCode = iucnData.CategoryCode || 'DD';
    const populationTrend = iucnData.PopulationTrend || 'Unknown';
    const yearAssessed = iucnData.YearAssessed || 'N/A';
    const dataSource = iucnData.Source || 'IUCN Red List API';
    
    // Extract additional context from IUCN data
    const rationale = iucnData.Rationale || '';
    const population = iucnData.Population || '';
    const threats = iucnData.Threats || '';
    
    console.log('Extracted data:', { conservationStatus, categoryCode, populationTrend, yearAssessed }); // Debug log
    
    document.getElementById('conservationStatus').textContent = conservationStatus;
    
    // Enhanced population trend with context
    const populationTrendDisplay = getPopulationTrendWithContext(populationTrend, population, rationale);
    document.getElementById('populationTrend').textContent = populationTrendDisplay;
    
    document.getElementById('yearAssessed').textContent = yearAssessed;
    document.getElementById('dataSource').textContent = dataSource;
    
    // Update conservation badge
    const badge = document.getElementById('conservationBadge');
    badge.textContent = conservationStatus;
    badge.className = `conservation-badge conservation-${categoryCode.toLowerCase()}`;
    
    // Update conservation details with enhanced information
    const details = document.getElementById('conservationDetails');
    details.textContent = getEnhancedConservationDescription(conservationStatus, categoryCode, population, threats, rationale);
    
    showResults();
}

function getConservationDescription(status, code) {
    const descriptions = {
        'LC': 'Least Concern - Species is widespread and abundant.',
        'NT': 'Near Threatened - Species is close to qualifying for threatened status.',
        'VU': 'Vulnerable - Species faces a high risk of extinction in the wild.',
        'EN': 'Endangered - Species faces a very high risk of extinction in the wild.',
        'CR': 'Critically Endangered - Species faces an extremely high risk of extinction.',
        'DD': 'Data Deficient - Insufficient information to assess extinction risk.'
    };
    return descriptions[code] || `Conservation status: ${status}`;
}

function getEnhancedConservationDescription(status, code, populationData, threatsData, rationale) {
    let description = getConservationDescription(status, code);
    
    // Add population context if available
    if (populationData) {
        const populationText = populationData.toLowerCase();
        
        // Extract key population information
        if (populationText.includes('increasing') || populationText.includes('increase')) {
            description += ' Population is showing signs of recovery.';
        } else if (populationText.includes('decreasing') || populationText.includes('decline')) {
            description += ' Population is in decline.';
        } else if (populationText.includes('stable')) {
            description += ' Population appears stable.';
        }
        
        // Add specific context for Atlantic Cod
        if (populationText.includes('atlantic cod') || populationText.includes('gadus morhua')) {
            if (populationText.includes('northeastern atlantic') && populationText.includes('increasing')) {
                description += ' Recent increases in Northeast Atlantic stocks show positive signs.';
            }
        }
    }
    
    // Add threat context if available
    if (threatsData) {
        const threatsText = threatsData.toLowerCase();
        if (threatsText.includes('over-exploitation') || threatsText.includes('overfishing')) {
            description += ' Primary threat is overfishing.';
        }
    }
    
    return description;
}

function getPopulationTrendWithContext(trend, populationData, rationale) {
    // If we have a specific trend, use it
    if (trend && trend !== 'Unknown') {
        return trend;
    }
    
    // Extract trend information from population data
    if (populationData) {
        const populationText = populationData.toLowerCase();
        
        // Look for trend indicators in the population text
        if (populationText.includes('increasing') || populationText.includes('increase') || populationText.includes('rising')) {
            return 'Increasing';
        }
        if (populationText.includes('decreasing') || populationText.includes('decline') || populationText.includes('decreased')) {
            return 'Decreasing';
        }
        if (populationText.includes('stable') || populationText.includes('relatively stable')) {
            return 'Stable';
        }
        if (populationText.includes('fluctuating') || populationText.includes('fluctuates')) {
            return 'Fluctuating';
        }
    }
    
    // Extract trend information from rationale
    if (rationale) {
        const rationaleText = rationale.toLowerCase();
        
        if (rationaleText.includes('increasing') || rationaleText.includes('increase') || rationaleText.includes('rising')) {
            return 'Increasing';
        }
        if (rationaleText.includes('decreasing') || rationaleText.includes('decline') || rationaleText.includes('decreased')) {
            return 'Decreasing';
        }
        if (rationaleText.includes('stable') || rationaleText.includes('relatively stable')) {
            return 'Stable';
        }
        if (rationaleText.includes('fluctuating') || rationaleText.includes('fluctuates')) {
            return 'Fluctuating';
        }
    }
    
    // If no trend can be determined, provide a more informative message
    return 'Trend not quantified';
}

function setLoading(loading) {
    loadingSpinner.style.display = loading ? 'inline-block' : 'none';
    searchBtn.disabled = loading;
    searchInput.disabled = loading;
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    messageContainer.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

function clearMessages() {
    messageContainer.innerHTML = '';
}

function showResults() {
    speciesResults.classList.remove('d-none');
    speciesResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    speciesResults.classList.add('d-none');
}
