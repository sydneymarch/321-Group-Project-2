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
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        document.getElementById('latitude').value = lat.toFixed(6);
                        document.getElementById('longitude').value = lng.toFixed(6);
                        
                        getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                        getCurrentLocationBtn.disabled = false;
                        
                        showNotification('Location captured successfully!', 'success');
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

function confirmUpload() {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Close modal
    closeModal();
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(function() {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Show success message
        showNotification('Catch uploaded successfully! Your listing is now live on the marketplace.', 'success');
        
        // Reset form
        document.getElementById('catch-form').reset();
        removeImagePreview();
        setCurrentDateTime();
        
    }, 2000);
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
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
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
