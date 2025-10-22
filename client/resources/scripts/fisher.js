// Fisher Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the fisher dashboard
    initializeFisherDashboard();
});

function initializeFisherDashboard() {
    // Set current date and time
    setCurrentDateTime();
    
    // Initialize photo upload
    initializePhotoUpload();
    
    // Initialize location services
    initializeLocationServices();
    
    // Initialize species autocomplete
    initializeSpeciesAutocomplete();
    
    // Initialize size validation
    initializeSizeValidation();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize AI verification simulation
    initializeAIVerification();
    
    // Initialize form submission
    initializeFormSubmission();
}

// Set current date and time
function setCurrentDateTime() {
    const now = new Date();
    const dateInput = document.getElementById('catch-date');
    const timeInput = document.getElementById('catch-time');
    
    if (dateInput) {
        dateInput.value = now.toISOString().split('T')[0];
    }
    
    if (timeInput) {
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
        timeInput.value = timeString;
    }
}

// Photo Upload Functionality
function initializePhotoUpload() {
    const photoInput = document.getElementById('catch-photo');
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photoPreview = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');
    const removePhotoBtn = document.getElementById('remove-photo');
    const uploadPlaceholder = photoUploadArea.querySelector('.upload-placeholder');

    if (!photoInput || !photoUploadArea) return;

    // Handle file selection
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (validateImageFile(file)) {
                displayImagePreview(file);
            } else {
                showNotification('Please select a valid image file (PNG, JPG, JPEG) under 10MB.', 'error');
            }
        }
    });

    // Handle drag and drop
    photoUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        photoUploadArea.style.borderColor = '#2980b9';
        photoUploadArea.style.background = '#e8f4f8';
    });

    photoUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        photoUploadArea.style.borderColor = '#3498db';
        photoUploadArea.style.background = '#f8f9fa';
    });

    photoUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        photoUploadArea.style.borderColor = '#3498db';
        photoUploadArea.style.background = '#f8f9fa';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (validateImageFile(file)) {
                photoInput.files = files;
                displayImagePreview(file);
            } else {
                showNotification('Please select a valid image file (PNG, JPG, JPEG) under 10MB.', 'error');
            }
        }
    });

    // Handle remove photo
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
            removeImagePreview();
        });
    }
}

function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
        return false;
    }
    
    if (file.size > maxSize) {
        return false;
    }
    
    return true;
}

function displayImagePreview(file) {
    const photoPreview = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    
    if (photoPreview && previewImage) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            photoPreview.style.display = 'block';
            if (uploadPlaceholder) {
                uploadPlaceholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
}

function removeImagePreview() {
    const photoInput = document.getElementById('catch-photo');
    const photoPreview = document.getElementById('photo-preview');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    
    if (photoInput) {
        photoInput.value = '';
    }
    
    if (photoPreview) {
        photoPreview.style.display = 'none';
    }
    
    if (uploadPlaceholder) {
        uploadPlaceholder.style.display = 'flex';
    }
}

// Location Services
function initializeLocationServices() {
    const getCurrentLocationBtn = document.getElementById('get-current-location');
    
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                getCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
                getCurrentLocationBtn.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    async function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        document.getElementById('latitude').value = lat.toFixed(6);
                        document.getElementById('longitude').value = lng.toFixed(6);
                        
                        // Reverse geocode to get city/location name (works globally)
                        try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
                                headers: { 'User-Agent': 'SeaTrue App' }
                            });
                            const data = await response.json();
                            
                            // Extract location components (works for any country)
                            const addr = data.address;
                            const city = addr.city || addr.town || addr.village || addr.municipality || '';
                            const region = addr.state || addr.province || addr.county || addr.region || '';
                            const country = addr.country || '';
                            
                            // Build location string based on available components
                            let locationName;
                            if (city && region && country !== 'United States') {
                                locationName = `${city}, ${region}, ${country}`;
                            } else if (city && region) {
                                locationName = `${city}, ${region}`;
                            } else if (city && country) {
                                locationName = `${city}, ${country}`;
                            } else if (region && country) {
                                locationName = `${region}, ${country}`;
                            } else if (city || region || country) {
                                locationName = city || region || country;
                            } else {
                                locationName = `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°W`;
                            }
                            
                            // Update landing port field if it exists
                            const landingPortField = document.getElementById('landing-port');
                            if (landingPortField) {
                                landingPortField.value = locationName;
                            }
                            
                            // Update location display
                            const locationDisplay = document.getElementById('location-display');
                            if (locationDisplay) {
                                locationDisplay.textContent = locationName;
                            }
                            
                            showNotification(`Location captured: ${locationName}`, 'success');
                        } catch (error) {
                            console.error('Error reverse geocoding:', error);
                            showNotification('Location captured successfully!', 'success');
                        }
                        
                        getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                        getCurrentLocationBtn.disabled = false;
                    },
                    function(error) {
                        console.error('Error getting location:', error);
                        getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                        getCurrentLocationBtn.disabled = false;
                        
                        let errorMessage = 'Unable to get your location. ';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage += 'Please allow location access.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage += 'Location information is unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage += 'Location request timed out.';
                                break;
                        }
                        showNotification(errorMessage, 'error');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            } else {
                showNotification('Geolocation is not supported by this browser.', 'error');
            }
        });
    }
}

// Species autocomplete with GBIF API validation
let speciesData = [];
let selectedSpeciesInfo = null;

async function initializeSpeciesAutocomplete() {
    const speciesInput = document.getElementById('species');
    const dropdown = document.getElementById('species-autocomplete');
    
    if (!speciesInput || !dropdown) return;
    
    // Load database species
    await loadDatabaseSpecies();
    
    let debounceTimer;
    
    speciesInput.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }
        
        debounceTimer = setTimeout(() => searchSpecies(query), 300);
    });
    
    // Prevent form submission on Enter key in species field
    speciesInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            
            // If dropdown has results, select the first one
            const firstResult = dropdown.querySelector('.autocomplete-item:not(.search-gbif-btn)');
            if (firstResult && dropdown.style.display !== 'none') {
                firstResult.click();
            }
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!speciesInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

async function loadDatabaseSpecies() {
    try {
        const response = await fetch('http://localhost:5142/api/SeaTrue/species/all');
        if (response.ok) {
            const dbSpecies = await response.json();
            speciesData = dbSpecies.map(sp => ({
                name: sp.commonName,
                scientific: sp.scientificName || '',
                source: 'database',
                conservationStatus: sp.conservationStatus || 'Not Assessed',
                minLength: sp.minLength || null,
                maxLength: sp.maxLength || null,
                avgWeight: sp.avgWeight || null
            }));
        }
    } catch (error) {
        console.error('Error loading database species:', error);
    }
}

async function searchSpecies(query) {
    const dropdown = document.getElementById('species-autocomplete');
    dropdown.innerHTML = '<div class="autocomplete-item loading">Searching...</div>';
    dropdown.style.display = 'block';
    
    // Search local database first (ONLY common names)
    const localMatches = speciesData.filter(sp => 
        sp.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    // Display database results with option to search GBIF
    displayAutocompleteResults(localMatches, query, false);
}

async function searchGBIFByCommonName(query) {
    try {
        // Search GBIF for fish species using vernacular (common) names
        const response = await fetch(`https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&rank=SPECIES&class=Actinopterygii&limit=20`);
        const data = await response.json();
        
        console.log('GBIF search for:', query, '- Found:', data.results?.length || 0, 'raw results');
        
        if (!data.results || data.results.length === 0) {
            console.log('No GBIF results for query:', query);
            return [];
        }
        
        // Filter to ONLY fish (multiple fish classes accepted)
        const fishOnly = data.results.filter(result => {
            // Check for fish classes: Actinopterygii (ray-finned) or Teleostei (bony fish subclass)
            // Note: GBIF sometimes truncates class names, so check if it STARTS WITH these
            const fishClass = result.class || result.clazz || '';
            const isFishClass = 
                fishClass === 'Actinopterygii' || 
                fishClass === 'Teleostei' ||
                fishClass.startsWith('Actinopteri') ||  // Truncated Actinopterygii
                fishClass.startsWith('Teleost');         // Truncated Teleostei
            
            // Check kingdom is Animalia or Metazoa (both mean animals)
            const kingdom = result.kingdom || '';
            const isAnimal = 
                kingdom === 'Animalia' || 
                kingdom === 'Metazoa' ||   // Also valid animal kingdom
                kingdom === '';             // Unknown is OK
            
            // Exclude obvious non-animals
            const isNotAnimal = 
                kingdom === 'Plantae' ||     // Plants
                kingdom === 'Viridiplantae' || // Green plants
                kingdom === 'Fungi' ||       // Fungi
                kingdom.includes('virus') || // Viruses
                kingdom.includes('bacteria'); // Bacteria
            
            // Must be fish class AND animal (or unknown) AND not explicitly non-animal
            const isFish = isFishClass && isAnimal && !isNotAnimal;
            
            if (!isFish) {
                console.log('❌ Filtering out non-fish:', result.scientificName, 'Class:', fishClass, 'Kingdom:', kingdom);
            } else {
                console.log('✅ Keeping fish:', result.scientificName, 'Class:', fishClass, 'Kingdom:', kingdom);
            }
            
            return isFish;
        });
        
        console.log('Filtered to fish only:', fishOnly.length, 'results');
        
        if (fishOnly.length === 0) {
            console.log('No fish species found for query:', query);
            return [];
        }
        
        // Filter and process results to find best common name matches (fish only!)
        const results = await Promise.all(fishOnly.map(async (result) => {
            // Get vernacular (common) names for this species
            const canonicalName = result.canonicalName || result.scientificName;
            const vernacularName = await getCommonNameFromGBIF(result.key, query, canonicalName);
            
            // Skip if no common name found (very rare now with fallback)
            if (!vernacularName) {
                console.log('Skipping species - no name available:', result);
                return null;
            }
            
            // Note: IUCN status causes CORS errors from browser
            // We'll skip it for now - backend can add it when species is submitted
            const iucnStatus = 'Not Assessed'; // Skip IUCN lookup from browser
            
            // Get size data from GBIF (currently returns null, but structure is ready)
            const sizeData = await getSizeDataFromGBIF(result.scientificName);
            
            return {
                name: vernacularName,
                scientific: result.scientificName,
                source: 'gbif',
                gbifKey: result.key,
                conservationStatus: iucnStatus,
                minLength: sizeData.minLength,
                maxLength: sizeData.maxLength,
                avgWeight: sizeData.avgWeight
            };
        }));
        
        // Filter out nulls and return unique common names
        const validResults = results.filter(r => r !== null);
        console.log('Valid results after filtering:', validResults.length);
        
        const uniqueNames = new Map();
        validResults.forEach(r => {
            if (!uniqueNames.has(r.name.toLowerCase())) {
                uniqueNames.set(r.name.toLowerCase(), r);
                console.log('Adding species to results:', r.name);
            }
        });
        
        const finalResults = Array.from(uniqueNames.values()).slice(0, 5);
        console.log('Final species results:', finalResults.map(r => r.name).join(', '));
        return finalResults;
    } catch (error) {
        console.error('Error searching GBIF:', error);
        return [];
    }
}

async function getCommonNameFromGBIF(speciesKey, searchQuery, canonicalName) {
    try {
        const response = await fetch(`https://api.gbif.org/v1/species/${speciesKey}/vernacularNames`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Prioritize English names that match the search query
            const englishNames = data.results.filter(v => v.language === 'eng' || v.language === 'en');
            
            // Find best match to search query
            const queryLower = searchQuery.toLowerCase();
            const exactMatch = englishNames.find(v => v.vernacularName.toLowerCase() === queryLower);
            if (exactMatch) {
                console.log('Found exact match vernacular name:', exactMatch.vernacularName);
                return exactMatch.vernacularName;
            }
            
            const startsWith = englishNames.find(v => v.vernacularName.toLowerCase().startsWith(queryLower));
            if (startsWith) {
                console.log('Found starts-with match vernacular name:', startsWith.vernacularName);
                return startsWith.vernacularName;
            }
            
            const contains = englishNames.find(v => v.vernacularName.toLowerCase().includes(queryLower));
            if (contains) {
                console.log('Found contains match vernacular name:', contains.vernacularName);
                return contains.vernacularName;
            }
            
            // Fallback to first English name or any name
            if (englishNames.length > 0) {
                console.log('Using first English vernacular name:', englishNames[0].vernacularName);
                return englishNames[0].vernacularName;
            }
            if (data.results.length > 0) {
                console.log('Using first available vernacular name:', data.results[0].vernacularName);
                return data.results[0].vernacularName;
            }
        }
        
        // If no vernacular names found, use the canonical/scientific name
        // Convert to title case for better display
        if (canonicalName) {
            // Extract genus and species, convert to Title Case
            const parts = canonicalName.split(' ');
            if (parts.length >= 2) {
                const name = parts.slice(0, 2).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
                console.log('Using canonical name as common name:', name);
                return name;
            }
            const name = canonicalName.charAt(0).toUpperCase() + canonicalName.slice(1).toLowerCase();
            console.log('Using simplified canonical name:', name);
            return name;
        }
        
        console.log('No name available for species key:', speciesKey);
        return null;
    } catch (error) {
        console.log('Error getting vernacular names for species:', speciesKey, '- using canonical name:', canonicalName);
        // Fallback to canonical name even on error
        if (canonicalName) {
            const parts = canonicalName.split(' ');
            if (parts.length >= 2) {
                return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
            }
            return canonicalName;
        }
        return null;
    }
}

async function getIUCNStatus(scientificName) {
    try {
        // Parse scientific name into genus and species for IUCN API v4
        const nameParts = scientificName.trim().split(' ');
        if (nameParts.length < 2) {
            console.log('Invalid scientific name format for IUCN:', scientificName);
            return 'Not Assessed';
        }
        
        const genusName = nameParts[0];
        const speciesName = nameParts[1];
        
        // IUCN API v4 with proper authentication
        const iucnApiKey = 'BjYSL4qAQ7NSjGijL24Ghqo7pGunsKQQX7zY';
        const response = await fetch(
            `https://api.iucnredlist.org/api/v4/taxa/scientific_name?genus_name=${genusName}&species_name=${speciesName}`,
            {
                headers: {
                    'Authorization': iucnApiKey
                }
            }
        );
        
        if (!response.ok) {
            console.log('IUCN API returned error for:', scientificName, '- Status:', response.status);
            return 'Not Assessed';
        }
        
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].assessment_id) {
            const assessmentId = data[0].assessment_id;
            
            // Get detailed assessment data
            const detailResponse = await fetch(
                `https://api.iucnredlist.org/api/v4/assessment/${assessmentId}`,
                {
                    headers: {
                        'Authorization': iucnApiKey
                    }
                }
            );
            
            if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                const category = detailData.red_list_category?.code || 'Not Assessed';
                console.log('✅ IUCN status found for', scientificName, ':', category);
                return category;
            }
        }
        
        console.log('No IUCN assessment found for:', scientificName);
        return 'Not Assessed';
    } catch (error) {
        console.log('IUCN lookup error for:', scientificName, error.message);
        return 'Not Assessed';
    }
}

async function getSizeDataFromGBIF(scientificName) {
    // GBIF doesn't provide comprehensive size/weight data in their main API
    // Instead, we'll use estimated sizes based on fish family or return null
    // Species will still be added, just without size validation
    
    try {
        // Get species info from GBIF to check family/order
        const response = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`);
        const data = await response.json();
        
        if (data && data.family) {
            // Could add family-based size estimates here if needed
            // For now, return null and let users enter any size
            console.log('Species found in GBIF:', data.scientificName, 'Family:', data.family);
        }
    } catch (error) {
        console.log('GBIF species lookup failed for:', scientificName);
    }
    
    // Return null for size data - species will be added without size constraints
    // This is actually better for flexibility
    return { minLength: null, maxLength: null, avgWeight: null };
}

function displayAutocompleteResults(results, query, isGbifResults = false) {
    const dropdown = document.getElementById('species-autocomplete');
    
    // Build results HTML
    let html = '';
    
    if (results.length === 0 && !isGbifResults) {
        // No database results - show message and search GBIF option
        html = `
            <div class="autocomplete-no-results">No species in database matching "${query}"</div>
            <div class="autocomplete-item search-gbif-btn" data-action="search-gbif">
                <i class="fas fa-globe"></i>
                <span class="species-name">Search GBIF global database for "${query}"</span>
            </div>
        `;
    } else {
        // Show results
        html = results.map((sp, index) => {
            // Build size info if available
            let sizeInfo = '';
            if (sp.maxLength && sp.avgWeight) {
                sizeInfo = ` • Max: ${Math.round(sp.maxLength)}" / ${Math.round(sp.avgWeight)} lbs`;
            } else if (sp.maxLength) {
                sizeInfo = ` • Max: ${Math.round(sp.maxLength)}"`;
            } else if (sp.avgWeight) {
                sizeInfo = ` • Avg: ${Math.round(sp.avgWeight)} lbs`;
            }
            
            const conservationBadge = sp.conservationStatus && sp.conservationStatus !== 'Not Assessed' ? 
                `<span class="conservation-badge ${sp.conservationStatus.toLowerCase().replace(' ', '-')}">${sp.conservationStatus}</span>` : '';
            
            return `
                <div class="autocomplete-item" data-index="${index}">
                    <span class="species-name">${sp.name}</span>
                    ${sizeInfo ? `<span class="species-info">${sizeInfo}</span>` : ''}
                    <div style="display: flex; gap: 5px; margin-top: 4px;">
                        <span class="species-source ${sp.source}">${sp.source === 'database' ? '✓ In Database' : 'Will be added'}</span>
                        ${conservationBadge}
                    </div>
                </div>
            `;
        }).join('');
        
        // Add "Search GBIF" button at bottom if not already showing GBIF results
        if (!isGbifResults) {
            html += `
                <div class="autocomplete-item search-gbif-btn" data-action="search-gbif">
                    <i class="fas fa-globe"></i>
                    <span class="species-name">Search GBIF for more "${query}" species</span>
                </div>
            `;
        }
    }
    
    dropdown.innerHTML = html;
    dropdown.style.display = 'block'; // Always ensure dropdown is visible
    
    // Add click handlers for results
    dropdown.querySelectorAll('.autocomplete-item:not(.search-gbif-btn)').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectSpecies(results[index]);
        });
    });
    
    // Add click handler for GBIF search button
    const gbifBtn = dropdown.querySelector('.search-gbif-btn');
    if (gbifBtn) {
        gbifBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            dropdown.innerHTML = '<div class="autocomplete-item loading">Searching GBIF global database...</div>';
            dropdown.style.display = 'block'; // Ensure dropdown stays visible
            
            const gbifResults = await searchGBIFByCommonName(query);
            displayAutocompleteResults(gbifResults, query, true);
        });
    }
}

async function selectSpecies(species) {
    try {
        const speciesInput = document.getElementById('species');
        const dropdown = document.getElementById('species-autocomplete');
        
        console.log('Selecting species:', species.name);
        
        // Set the input value
        speciesInput.value = species.name;
        selectedSpeciesInfo = species;
        dropdown.style.display = 'none';
        
        // If from GBIF, add to database (but don't reload - just update source)
        if (species.source === 'gbif') {
            console.log('Species from GBIF, adding to database...');
            const addResult = await addSpeciesToDatabase(species);
            if (addResult) {
                // Update species to mark it as now in database
                selectedSpeciesInfo.source = 'database';
                
                // Re-confirm the input value is still set (defensive)
                if (speciesInput.value !== species.name) {
                    speciesInput.value = species.name;
                }
                
                console.log('✅ Species auto-selected after adding to database:', species.name);
            } else {
                console.log('❌ Failed to add species to database');
            }
        }
        
        // Trigger size validation
        validateSize();
        
        console.log('Species selection complete, input value:', speciesInput.value);
    } catch (error) {
        console.error('Error in selectSpecies:', error);
    }
}

async function addSpeciesToDatabase(species) {
    try {
        console.log('Adding species to database:', {
            name: species.name,
            scientific: species.scientific,
            conservation: species.conservationStatus
        });
        
        const response = await fetch('http://localhost:5142/api/SeaTrue/species/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                commonName: species.name,
                scientificName: species.scientific,
                conservationStatus: species.conservationStatus || 'Not Assessed',
                minLength: species.minLength,
                maxLength: species.maxLength,
                avgWeight: species.avgWeight
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Use conservation status from backend (fetched via IUCN API without CORS)
            const actualStatus = result.conservationStatus || species.conservationStatus || 'Not Assessed';
            const statusBadge = actualStatus && actualStatus !== 'Not Assessed' 
                ? ` (${actualStatus})` 
                : '';
            
            console.log('✅ Species added successfully:', species.name, statusBadge);
            showNotification(`${species.name} added to database${statusBadge}`, 'success');
            
            // Add to local cache immediately with actual IUCN status from backend
            speciesData.push({
                name: species.name,
                scientific: species.scientific || '',
                source: 'database',
                conservationStatus: actualStatus,
                minLength: species.minLength || null,
                maxLength: species.maxLength || null,
                avgWeight: species.avgWeight || null
            });
            
            // Update selectedSpeciesInfo if it's the same species
            if (selectedSpeciesInfo && selectedSpeciesInfo.name === species.name) {
                selectedSpeciesInfo.conservationStatus = actualStatus;
            }
            
            return true; // Success
        } else {
            const error = await response.json();
            console.error('Failed to add species:', error);
            return false;
        }
    } catch (error) {
        console.error('Error adding species to database:', error);
        return false;
    }
}

// Size validation
function initializeSizeValidation() {
    const lengthInput = document.getElementById('length');
    const weightInput = document.getElementById('weight');
    
    if (lengthInput && weightInput) {
        lengthInput.addEventListener('input', validateSize);
        weightInput.addEventListener('input', validateSize);
    }
}

function validateSize() {
    const lengthInput = document.getElementById('length');
    const weightInput = document.getElementById('weight');
    const warning = document.getElementById('size-warning');
    const warningText = document.getElementById('size-warning-text');
    
    // Hide warning if no species selected or no inputs
    if (!selectedSpeciesInfo || !lengthInput.value || !weightInput.value) {
        warning.classList.remove('show');
        return;
    }
    
    const length = parseFloat(lengthInput.value);
    const weight = parseFloat(weightInput.value);
    const species = selectedSpeciesInfo;
    
    // If no size data available for this species, skip validation
    if (!species.maxLength && !species.avgWeight) {
        warning.classList.remove('show');
        return;
    }
    
    let warnings = [];
    
    // Check length if max length is available
    if (species.maxLength && length > species.maxLength * 1.5) {
        warnings.push(`Length (${length}") significantly exceeds typical maximum for ${species.name} (~${Math.round(species.maxLength)}")`);
    }
    
    // Check weight if both avg weight and max length are available
    if (species.avgWeight && species.maxLength && length > 0) {
        const expectedWeight = species.avgWeight * Math.pow(length / species.maxLength, 3);
        if (weight > expectedWeight * 2) {
            warnings.push(`Weight (${weight} lbs) seems high for this length`);
        }
    }
    
    if (warnings.length > 0) {
        warningText.textContent = 'Unusual size detected: ' + warnings.join('. ') + '. Please verify your measurements.';
        warning.classList.add('show');
    } else {
        warning.classList.remove('show');
    }
}

// Form Validation
function initializeFormValidation() {
    const form = document.getElementById('catch-form');
    
    if (form) {
        // Real-time validation
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', function() {
                validateField(this);
            });
            
            field.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
        
        // Number field validation
        const numberFields = form.querySelectorAll('input[type="number"]');
        numberFields.forEach(field => {
            field.addEventListener('input', function() {
                // Special handling for coordinates
                if (this.id === 'latitude') {
                    const value = parseFloat(this.value);
                    if (value < -90 || value > 90) {
                        this.style.borderColor = '#e74c3c';
                        showNotification('Latitude must be between -90 and 90 degrees', 'error');
                    } else {
                        this.style.borderColor = '#e1e8ed';
                    }
                } else if (this.id === 'longitude') {
                    const value = parseFloat(this.value);
                    if (value < -180 || value > 180) {
                        this.style.borderColor = '#e74c3c';
                        showNotification('Longitude must be between -180 and 180 degrees', 'error');
                    } else {
                        this.style.borderColor = '#e1e8ed';
                    }
                } else if (this.value < 0 && this.id !== 'latitude' && this.id !== 'longitude') {
                    // Only prevent negative values for non-coordinate fields
                    this.value = 0;
                }
            });
        });
    }
}

function validateField(field) {
    const value = field.value.trim();
    const isValid = value !== '';
    
    if (isValid) {
        field.classList.remove('error');
        field.style.borderColor = '#e1e8ed';
    } else {
        field.classList.add('error');
        field.style.borderColor = '#e74c3c';
    }
    
    return isValid;
}

function validateForm() {
    const form = document.getElementById('catch-form');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validate photo upload
    const photoInput = document.getElementById('catch-photo');
    if (photoInput && !photoInput.files[0]) {
        showNotification('Please upload a photo of your catch.', 'error');
        isValid = false;
    }
    
    return isValid;
}

// AI Verification Modal
function initializeAIVerification() {
    // Initialize modal event listeners
    initializeModalEvents();
}

// Modal Event Handlers
function initializeModalEvents() {
    const modal = document.getElementById('ai-verification-modal');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-upload');
    const confirmBtn = document.getElementById('confirm-upload');
    
    // Close modal events
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmUpload);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
}

function showModal() {
    const modal = document.getElementById('ai-verification-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        updateModalContent();
    }
}

function closeModal() {
    const modal = document.getElementById('ai-verification-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function updateModalContent() {
    // Calculate AI verification scores based on form data
    const scores = calculateAIScores();
    
    // Update credibility score
    const credibilityElement = document.getElementById('modal-credibility-score');
    if (credibilityElement) {
        credibilityElement.textContent = scores.credibility + '%';
    }
    
    // Update overall rating
    updateStarRating('modal-star-rating', scores.overall);
    const ratingText = document.getElementById('modal-rating-text');
    if (ratingText) {
        ratingText.textContent = scores.overall + '/5 Stars';
    }
    
    // Update breakdown ratings
    updateStarRating('species-stars', scores.species);
    updateStarRating('method-stars', scores.method);
    updateStarRating('data-stars', scores.data);
    updateStarRating('photo-stars', scores.photo);
    
    // Update verification items
    updateVerificationItems(scores);
    
    // Update marketplace status
    updateMarketplaceStatus(scores);
}

function calculateAIScores() {
    const form = document.getElementById('catch-form');
    const formData = new FormData(form);
    
    // Get form values
    const species = formData.get('species') || '';
    const length = parseFloat(formData.get('length')) || 0;
    const weight = parseFloat(formData.get('weight')) || 0;
    const lat = parseFloat(formData.get('latitude')) || 0;
    const lng = parseFloat(formData.get('longitude')) || 0;
    const fishingMethod = formData.get('fishing-method') || '';
    const waterTemp = parseFloat(formData.get('water-temperature')) || 0;
    const waterDepth = parseFloat(formData.get('water-depth')) || 0;
    const weather = formData.get('weather-conditions') || '';
    const condition = formData.get('catch-condition') || '';
    const notes = formData.get('notes') || '';
    const hasPhoto = document.getElementById('catch-photo').files.length > 0;
    
    // Calculate individual scores (1-5 stars)
    const speciesScore = calculateSpeciesScore(species);
    const methodScore = calculateMethodScore(fishingMethod);
    const dataScore = calculateDataScore(length, weight, lat, lng, waterTemp, waterDepth, weather, condition, notes);
    const photoScore = calculatePhotoScore(hasPhoto);
    
    // Calculate overall score
    const overall = Math.round((speciesScore + methodScore + dataScore + photoScore) / 4);
    
    // Calculate credibility score (75-95%)
    const credibility = Math.min(95, Math.max(75, 75 + (overall - 3) * 5));
    
    return {
        species: speciesScore,
        method: methodScore,
        data: dataScore,
        photo: photoScore,
        overall: overall,
        credibility: Math.round(credibility)
    };
}

function calculateSpeciesScore(species) {
    if (!species) return 1;
    
    const sustainableSpecies = ['atlantic-cod', 'atlantic-salmon', 'halibut', 'red-snapper', 'grouper', 'mahi-mahi'];
    const overfishedSpecies = ['bluefin-tuna', 'swordfish'];
    
    if (sustainableSpecies.includes(species)) return 5;
    if (overfishedSpecies.includes(species)) return 2;
    return 4; // Other species
}

function calculateMethodScore(method) {
    if (!method) return 1;
    
    const sustainableMethods = ['line-fishing', 'trolling', 'spearfishing'];
    const moderateMethods = ['trap-fishing'];
    const lessSustainableMethods = ['net-fishing'];
    
    if (sustainableMethods.includes(method)) return 5;
    if (moderateMethods.includes(method)) return 4;
    if (lessSustainableMethods.includes(method)) return 3;
    return 3; // Other
}

function calculateDataScore(length, weight, lat, lng, waterTemp, waterDepth, weather, condition, notes) {
    let score = 1;
    
    // Basic data (2 points)
    if (length > 0 && weight > 0) score += 1;
    if (lat !== 0 && lng !== 0) score += 1;
    
    // Additional data (2 points)
    if (waterTemp > 0) score += 0.5;
    if (waterDepth > 0) score += 0.5;
    if (weather) score += 0.5;
    if (condition) score += 0.5;
    
    // Notes (1 point)
    if (notes && notes.length > 10) score += 1;
    
    return Math.min(5, Math.round(score));
}

function calculatePhotoScore(hasPhoto) {
    return hasPhoto ? 4 : 1;
}

function updateStarRating(elementId, rating) {
    const stars = document.querySelectorAll(`#${elementId} i`);
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
}

function updateVerificationItems(scores) {
    const itemsContainer = document.getElementById('modal-verification-items');
    if (!itemsContainer) return;
    
    const items = [
        {
            icon: scores.species >= 4 ? 'fas fa-check' : scores.species >= 3 ? 'fas fa-exclamation-triangle' : 'fas fa-times',
            text: scores.species >= 4 ? 'Species sustainability verified' : scores.species >= 3 ? 'Species sustainability needs review' : 'Species sustainability concerns',
            class: scores.species >= 4 ? 'text-success' : scores.species >= 3 ? 'text-warning' : 'text-error'
        },
        {
            icon: scores.method >= 4 ? 'fas fa-check' : scores.method >= 3 ? 'fas fa-exclamation-triangle' : 'fas fa-times',
            text: scores.method >= 4 ? 'Fishing method is sustainable' : scores.method >= 3 ? 'Fishing method is acceptable' : 'Fishing method needs improvement',
            class: scores.method >= 4 ? 'text-success' : scores.method >= 3 ? 'text-warning' : 'text-error'
        },
        {
            icon: scores.data >= 4 ? 'fas fa-check' : scores.data >= 3 ? 'fas fa-exclamation-triangle' : 'fas fa-times',
            text: scores.data >= 4 ? 'Data completeness excellent' : scores.data >= 3 ? 'Data completeness good' : 'Data completeness needs improvement',
            class: scores.data >= 4 ? 'text-success' : scores.data >= 3 ? 'text-warning' : 'text-error'
        },
        {
            icon: scores.photo >= 4 ? 'fas fa-check' : scores.photo >= 3 ? 'fas fa-exclamation-triangle' : 'fas fa-times',
            text: scores.photo >= 4 ? 'Photo quality verified' : scores.photo >= 3 ? 'Photo quality acceptable' : 'Photo required for verification',
            class: scores.photo >= 4 ? 'text-success' : scores.photo >= 3 ? 'text-warning' : 'text-error'
        }
    ];
    
    itemsContainer.innerHTML = items.map(item => `
        <div class="verification-item">
            <i class="${item.icon} ${item.class}"></i>
            <span>${item.text}</span>
        </div>
    `).join('');
}

function updateMarketplaceStatus(scores) {
    const statusElement = document.getElementById('marketplace-status');
    const descriptionElement = document.getElementById('status-description');
    
    if (scores.overall >= 4) {
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i><span>Ready for Marketplace</span>';
        statusElement.className = 'status-indicator';
        descriptionElement.textContent = 'Your catch meets all marketplace requirements and is ready to be listed for buyers.';
    } else if (scores.overall >= 3) {
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Conditional Approval</span>';
        statusElement.className = 'status-indicator warning';
        descriptionElement.textContent = 'Your catch can be listed but may need additional verification or documentation.';
    } else {
        statusElement.innerHTML = '<i class="fas fa-times-circle"></i><span>Needs Improvement</span>';
        statusElement.className = 'status-indicator error';
        descriptionElement.textContent = 'Your catch needs additional information or improvements before it can be listed.';
    }
}

function updateVerificationDetails() {
    const species = document.getElementById('species').value;
    const length = parseFloat(document.getElementById('length').value) || 0;
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const fishingMethod = document.getElementById('fishing-method').value;
    
    // Simulate verification results
    const verificationItems = document.querySelectorAll('.verification-item');
    
    if (verificationItems.length >= 5) {
        // Species verification
        verificationItems[0].innerHTML = species ? 
            '<i class="fas fa-check text-success"></i><span>Species identification verified</span>' :
            '<i class="fas fa-exclamation-triangle text-warning"></i><span>Species identification pending</span>';
        
        // Size verification
        const sizeValid = length > 0 && weight > 0 && length < 100 && weight < 500;
        verificationItems[1].innerHTML = sizeValid ?
            '<i class="fas fa-check text-success"></i><span>Size measurements within normal range</span>' :
            '<i class="fas fa-exclamation-triangle text-warning"></i><span>Size measurements need verification</span>';
        
        // Location verification
        const lat = document.getElementById('latitude').value;
        const lng = document.getElementById('longitude').value;
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const locationValid = lat && lng && !isNaN(latNum) && !isNaN(lngNum) && 
                             latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
        verificationItems[2].innerHTML = locationValid ?
            '<i class="fas fa-check text-success"></i><span>Location coordinates validated</span>' :
            '<i class="fas fa-exclamation-triangle text-warning"></i><span>Location coordinates pending</span>';
        
        // Photo verification (simulated)
        const hasPhoto = document.getElementById('catch-photo').files.length > 0;
        verificationItems[3].innerHTML = hasPhoto ?
            '<i class="fas fa-check text-success"></i><span>Photo quality verified</span>' :
            '<i class="fas fa-exclamation-triangle text-warning"></i><span>Photo quality could be improved</span>';
        
        // Fishing method verification
        const sustainableMethods = ['line-fishing', 'trolling', 'spearfishing'];
        const methodValid = sustainableMethods.includes(fishingMethod);
        verificationItems[4].innerHTML = methodValid ?
            '<i class="fas fa-check text-success"></i><span>Fishing method aligns with sustainability practices</span>' :
            '<i class="fas fa-exclamation-triangle text-warning"></i><span>Fishing method needs sustainability review</span>';
    }
}

// Form Submission
function initializeFormSubmission() {
    const form = document.getElementById('catch-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                submitCatch();
            }
        });
    }
}

function submitCatch() {
    // Show AI verification modal instead of direct upload
    showModal();
}

async function confirmUpload() {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Close modal
    closeModal();
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    submitBtn.disabled = true;
    
    // Get form data
    const form = document.getElementById('catch-form');
    const formData = new FormData(form);
    
    // Get photo as base64 if available
    let photoBase64 = null;
    const photoInput = document.getElementById('catch-photo');
    if (photoInput.files[0]) {
        try {
            photoBase64 = await fileToBase64(photoInput.files[0]);
        } catch (error) {
            console.error('Error converting photo to base64:', error);
        }
    }
    
    // Build request object
    const catchData = {
        species: formData.get('species') || '',  // Autocomplete gives us the exact species name
        weight: parseFloat(formData.get('weight')) || 0,
        length: parseFloat(formData.get('length')) || 0,
        catchDate: formData.get('catch-date'),
        catchTime: formData.get('catch-time'),
        latitude: parseFloat(formData.get('latitude')) || 0,
        longitude: parseFloat(formData.get('longitude')) || 0,
        fishingMethod: formData.get('fishing-method'),
        waterDepth: parseFloat(formData.get('water-depth')) || null,
        condition: formData.get('catch-condition'),
        storageMethod: formData.get('storage-method'),
        quantity: parseInt(formData.get('quantity')) || 1,
        pricePerKg: parseFloat(formData.get('price-per-kg')) || 0,
        landingPort: formData.get('landing-port'),
        photoBase64: photoBase64
    };
    
    try {
        // Make API call to submit catch
        const response = await fetch('http://localhost:5142/api/SeaTrue/catches/submit', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(catchData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Show success message with details
            showNotification(
                `Catch uploaded successfully! QR Code: ${result.qrCode}. AI Confidence: ${result.aiConfidence}%. ${result.isVerified ? 'Auto-verified!' : 'Pending verification.'}`,
                'success'
            );
            
            // Reset form
            form.reset();
            removeImagePreview();
            setCurrentDateTime();
        } else {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Log detailed error for debugging
            console.error('API Error:', {
                status: response.status,
                statusText: response.statusText,
                message: result.message,
                error: result.error,
                catchData: catchData
            });
            
            // Show error message
            let errorMsg = result.message || 'Failed to upload catch. Please try again.';
            if (result.error) {
                errorMsg += ` (${result.error})`;
            }
            showNotification(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error submitting catch:', error);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Show error message
        showNotification('Network error. Please check your connection and try again.', 'error');
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper function to convert form species value to database name
function convertSpeciesValueToName(value) {
    if (!value) return '';
    
    // Map of form values to database names (must match exactly what's in Species table)
    const speciesMap = {
        'atlantic-cod': 'Atlantic Cod',
        'atlantic-salmon': 'Pacific Salmon', // Note: DB has Pacific Salmon, not Atlantic
        'bluefin-tuna': 'Yellowfin Tuna', // Using available tuna
        'yellowfin-tuna': 'Yellowfin Tuna',
        'halibut': 'Halibut',
        'red-snapper': 'Red Snapper',
        'grouper': 'Grouper',
        'mahi-mahi': 'Mahi-Mahi',
        'swordfish': 'Swordfish',
        'striped-bass': 'Striped Bass',
        'largemouth-bass': 'Largemouth Bass',
        'tuna': 'Yellowfin Tuna',
        'salmon': 'Pacific Salmon',
        'lobster': 'Lobster',
        'flounder': 'Flounder',
        'black-sea-bass': 'Black Sea Bass',
        'king-mackerel': 'King Mackerel',
        'sea-trout': 'Sea Trout',
        'rainbow-trout': 'Rainbow Trout',
        'northern-pike': 'Northern Pike'
    };
    
    // If value is in map, use it; otherwise try to capitalize it properly
    if (speciesMap[value]) {
        return speciesMap[value];
    }
    
    // Fallback: Convert kebab-case to Title Case (e.g., "black-sea-bass" -> "Black Sea Bass")
    return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

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

// Add CSS for notifications
const notificationStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
