// SeaTrue Homepage JavaScript
// Dynamic stats fetching and scroll animations

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeStats();
    initializeScrollAnimations();
    initializeSmoothScrolling();
});

// Hero Section - Dynamic Stats
async function initializeStats() {
    try {
        // Fetch stats from API (placeholder for now)
        const stats = await fetchStats();
        
        // Animate hero stats
        animateCounter('verifiedCatches', stats.verifiedCatches, 2000);
        animateCounter('activeFishers', stats.activeFishers, 2500);
        animateCounter('fairTradeValue', stats.fairTradeValue, 3000, '$');
        
        // Update impact banner stats
        updateImpactStats(stats);
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to default values
        setDefaultStats();
    }
}

// Mock API call - replace with actual API endpoint later
async function fetchStats() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data - replace with actual API call to /api/stats
    return {
        verifiedCatches: 12842,
        activeFishers: 156,
        fairTradeValue: 187000,
        impactCatches: 12842,
        impactPayments: 187000,
        impactRegions: 18
    };
    
    // Future API call will look like:
    // const response = await fetch('/api/stats');
    // return await response.json();
}

// Animate counter numbers
function animateCounter(elementId, targetValue, duration, prefix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const increment = targetValue / (duration / 16); // 60fps
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        
        // Format number with commas
        const formattedValue = Math.floor(currentValue).toLocaleString();
        element.textContent = prefix + formattedValue;
    }, 16);
}

// Update impact banner stats
function updateImpactStats(stats) {
    const impactCatches = document.getElementById('impactCatches');
    const impactPayments = document.getElementById('impactPayments');
    const impactRegions = document.getElementById('impactRegions');
    
    if (impactCatches) impactCatches.textContent = stats.impactCatches.toLocaleString();
    if (impactPayments) impactPayments.textContent = '$' + stats.impactPayments.toLocaleString();
    if (impactRegions) impactRegions.textContent = stats.impactRegions;
}

// Set default stats if API fails
function setDefaultStats() {
    animateCounter('verifiedCatches', 0, 1000);
    animateCounter('activeFishers', 0, 1000);
    animateCounter('fairTradeValue', 0, 1000, '$');
    
    updateImpactStats({
        impactCatches: 0,
        impactPayments: 0,
        impactRegions: 0
    });
}

// Problem Section - Scroll Animations
function initializeScrollAnimations() {
    // Create intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
    
    // Add scroll-triggered animations to existing elements
    const cardElements = document.querySelectorAll('.card, .stat-card, .feature-icon');
    cardElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// Testimonial Section - Smooth scrolling and navigation
function initializeSmoothScrolling() {
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for sticky navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar background change on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
}

// Impact Banner - Real-time updates (placeholder)
function updateImpactBanner() {
    // This would connect to real-time data updates
    // For now, just ensure the banner is visible and animated
    const impactSection = document.getElementById('impact');
    if (impactSection) {
        impactSection.classList.add('animate__animated', 'animate__fadeInUp');
    }
}

// Utility functions for future API integration
class SeaTrueAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }
    
    async getStats() {
        try {
            const response = await fetch(`${this.baseURL}/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    async getVerifiedCatches() {
        try {
            const response = await fetch(`${this.baseURL}/catches`);
            if (!response.ok) throw new Error('Failed to fetch catches');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    async getActiveFishers() {
        try {
            const response = await fetch(`${this.baseURL}/fishers`);
            if (!response.ok) throw new Error('Failed to fetch fishers');
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
    module.exports = { SeaTrueAPI, animateCounter };
}
