// SeaTrue Admin Dashboard JavaScript

const API_BASE_URL = 'http://localhost:5142/api';

// Chart instances
let fisherStatusChart = null;
let catchesTimeChart = null;
let speciesConfidenceChart = null;

// Current fisher ID for modal actions
let currentFisherId = null;

// Helper function for authenticated fetch requests
async function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation
    setupNavigation();
    
    // Load dashboard data
    refreshDashboard();
    
    // Setup modal event listeners
    setupModals();
});

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.dataset.section;
            showSection(sectionId);
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
        section.classList.add('active');
        
        // Load data for the section
        switch(sectionId) {
            case 'dashboard':
                refreshDashboard();
                break;
            case 'fishers':
                loadFishers();
                break;
            case 'catches':
                loadCatches();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'reports':
                loadReportsData();
                break;
            case 'audit':
                loadAuditLog();
                break;
        }
    }
}

// ============================================
// DASHBOARD
// ============================================

async function refreshDashboard() {
    try {
        // Load metrics
        await loadDashboardMetrics();
        
        // Load charts
        await loadFisherStatusChart();
        await loadCatchesTimeChart();
        await loadSpeciesConfidenceChart();
        
        // Load recent activity
        await loadRecentActivity();
        
        // Load notifications
        await loadNotifications();
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

async function loadDashboardMetrics() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/dashboard/metrics`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        document.getElementById('certifiedFishersCount').textContent = data.certifiedFishers;
        document.getElementById('verifiedCatchesCount').textContent = data.verifiedCatches;
        document.getElementById('flaggedCatchesCount').textContent = data.flaggedCatches;
        document.getElementById('avgTrustScoreDisplay').textContent = `${data.avgTrustScore.toFixed(1)}%`;
    } catch (error) {
        console.error('Error loading dashboard metrics:', error);
    }
}

async function loadFisherStatusChart() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/analytics/fisher-status`);
        if (!response.ok) return;
        const data = await response.json();
        
        const ctx = document.getElementById('fisherStatusChart');
        
        // Destroy existing chart if it exists
        if (fisherStatusChart) {
            fisherStatusChart.destroy();
        }
        
        fisherStatusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(d => d.status),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: [
                        '#10b981', // Certified - green
                        '#f59e0b', // Pending - yellow
                        '#0077b6', // PreVerified - blue
                        '#ef4444', // Revoked - red
                        '#6c757d'  // Suspended - gray
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading fisher status chart:', error);
    }
}

async function loadCatchesTimeChart() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/analytics/catches-over-time?days=30`);
        if (!response.ok) return;
        const data = await response.json();
        
        const ctx = document.getElementById('catchesTimeChart');
        
        if (catchesTimeChart) {
            catchesTimeChart.destroy();
        }
        
        catchesTimeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [{
                    label: 'Catches',
                    data: data.map(d => d.count),
                    borderColor: '#0077b6',
                    backgroundColor: 'rgba(0, 119, 182, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading catches time chart:', error);
    }
}

async function loadSpeciesConfidenceChart() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/analytics/species-confidence`);
        const data = await response.json();
        
        const ctx = document.getElementById('speciesConfidenceChart');
        
        if (speciesConfidenceChart) {
            speciesConfidenceChart.destroy();
        }
        
        speciesConfidenceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.species),
                datasets: [{
                    label: 'Average AI Confidence Score',
                    data: data.map(d => d.avgConfidence),
                    backgroundColor: '#023e8a',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading species confidence chart:', error);
    }
}

async function loadRecentActivity() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/audit-log?limit=10`);
        const data = await response.json();
        
        const container = document.getElementById('recentActivity');
        
        if (data.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent activity</p>';
            return;
        }
        
        container.innerHTML = data.map(log => `
            <div class="activity-item">
                <div class="timestamp">${formatDateTime(log.verifiedAt)}</div>
                <div class="action">${log.verificationType} - ${log.entityType} #${log.entityId}</div>
                <div class="text-muted small">${log.verificationNotes || 'No notes'}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// ============================================
// FISHERS MANAGEMENT
// ============================================

async function loadFishers() {
    const status = document.getElementById('fisherStatusFilter')?.value || '';
    const search = document.getElementById('fisherSearch')?.value || '';
    
    try {
        let url = `${API_BASE_URL}/Admin/fishers?`;
        if (status) url += `status=${status}&`;
        if (search) url += `search=${search}&`;
        
        const response = await fetch(url);
        const fishers = await response.json();
        
        const tbody = document.getElementById('fishersTableBody');
        
        if (fishers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No fishers found</td></tr>';
            return;
        }
        
        tbody.innerHTML = fishers.map(fisher => `
            <tr>
                <td>${fisher.fullName}</td>
                <td>${fisher.email}</td>
                <td>${formatLicenseExpiry(fisher.licenseExpiry)}</td>
                <td><span class="badge badge-${fisher.certificationStatus.toLowerCase()}">${fisher.certificationStatus}</span></td>
                <td>${formatTrustScore(fisher.trustScore)}</td>
                <td>${fisher.homePort || 'N/A'}</td>
                <td>
                    ${fisher.certificationStatus === 'Pending' || fisher.certificationStatus === 'PreVerified' ? 
                        `<button class="btn btn-sm btn-approve" onclick="approveFisher(${fisher.fisherId})">
                            <i class="bi bi-check-circle"></i> Approve
                        </button>` : ''}
                    ${fisher.certificationStatus === 'Certified' ? 
                        `<button class="btn btn-sm btn-revoke" onclick="openRevokeModal(${fisher.fisherId})">
                            <i class="bi bi-x-circle"></i> Revoke
                        </button>` : ''}
                    <button class="btn btn-sm btn-outline-primary" onclick="viewFisherDetails(${fisher.fisherId})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading fishers:', error);
        showError('Failed to load fishers');
    }
}

async function approveFisher(fisherId) {
    if (!confirm('Are you sure you want to approve this fisher?')) {
        return;
    }
    
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/fishers/${fisherId}/approve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showSuccess('Fisher approved successfully');
            loadFishers();
            refreshDashboard();
        } else {
            showError('Failed to approve fisher');
        }
    } catch (error) {
        console.error('Error approving fisher:', error);
        showError('Failed to approve fisher');
    }
}

function openRevokeModal(fisherId) {
    currentFisherId = fisherId;
    const modal = new bootstrap.Modal(document.getElementById('revokeModal'));
    modal.show();
}

async function revokeFisher() {
    const reason = document.getElementById('revokeReason').value;
    
    if (!reason.trim()) {
        alert('Please provide a reason for revocation');
        return;
    }
    
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/fishers/${currentFisherId}/revoke`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            showSuccess('Fisher certification revoked');
            bootstrap.Modal.getInstance(document.getElementById('revokeModal')).hide();
            document.getElementById('revokeReason').value = '';
            loadFishers();
            refreshDashboard();
        } else {
            showError('Failed to revoke fisher');
        }
    } catch (error) {
        console.error('Error revoking fisher:', error);
        showError('Failed to revoke fisher');
    }
}

async function viewFisherDetails(fisherId) {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/fishers/${fisherId}/details`);
        const data = await response.json();
        
        if (!response.ok) {
            showError('Failed to load fisher details');
            return;
        }
        
        const fisher = data.fisher;
        const stats = data.statistics;
        
        // Build the detailed view
        const content = `
            <div class="fisher-details">
                <!-- Header with Status -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h4>${fisher.firstName} ${fisher.lastName}</h4>
                        <p class="text-muted mb-1">
                            <i class="bi bi-envelope"></i> ${fisher.email}
                        </p>
                        ${fisher.phoneNumber ? `<p class="text-muted mb-1"><i class="bi bi-telephone"></i> ${fisher.phoneNumber}</p>` : ''}
                    </div>
                    <div class="col-md-4 text-end">
                        <span class="badge badge-${fisher.certificationStatus.toLowerCase()} fs-6">${fisher.certificationStatus}</span>
                        <div class="mt-2">${formatTrustScore(fisher.trustScore)}</div>
                    </div>
                </div>

                <!-- Tabs -->
                <ul class="nav nav-tabs mb-3" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#profile-tab">Profile</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#licenses-tab">Licenses</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#catches-tab">Recent Catches</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#trust-tab">Trust Score</a>
                    </li>
                    ${data.vessels.length > 0 ? '<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vessels-tab">Vessels</a></li>' : ''}
                </ul>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Profile Tab -->
                    <div class="tab-pane fade show active" id="profile-tab">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary">Personal Information</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>Country:</strong></td><td>${fisher.country || 'N/A'}</td></tr>
                                    <tr><td><strong>City:</strong></td><td>${fisher.city || 'N/A'}, ${fisher.state || ''}</td></tr>
                                    <tr><td><strong>Address:</strong></td><td>${fisher.address || 'N/A'}</td></tr>
                                    <tr><td><strong>National ID:</strong></td><td>${fisher.nationalId || 'N/A'}</td></tr>
                                    <tr><td><strong>Date of Birth:</strong></td><td>${fisher.dateOfBirth ? formatDate(fisher.dateOfBirth) : 'N/A'}</td></tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Fishing Information</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>Home Port:</strong></td><td>${fisher.homePort || 'N/A'}</td></tr>
                                    <tr><td><strong>Experience:</strong></td><td>${fisher.yearsOfExperience || 'N/A'} years</td></tr>
                                    <tr><td><strong>Primary Method:</strong></td><td>${fisher.primaryFishingMethod || 'N/A'}</td></tr>
                                    <tr><td><strong>Demo Catches:</strong></td><td>${fisher.demoCatchesLogged}</td></tr>
                                    <tr><td><strong>Certified At:</strong></td><td>${fisher.certifiedAt ? formatDateTime(fisher.certifiedAt) : 'Not certified'}</td></tr>
                                </table>
                            </div>
                        </div>

                        <!-- Statistics -->
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6 class="text-primary">Statistics</h6>
                                <div class="row text-center">
                                    <div class="col-3">
                                        <div class="metric-small">
                                            <h5>${stats.totalCatches}</h5>
                                            <small>Total Catches</small>
                                        </div>
                                    </div>
                                    <div class="col-3">
                                        <div class="metric-small">
                                            <h5>${stats.totalWeightKg.toFixed(1)} kg</h5>
                                            <small>Total Weight</small>
                                        </div>
                                    </div>
                                    <div class="col-3">
                                        <div class="metric-small">
                                            <h5>${stats.verifiedCatches}</h5>
                                            <small>Verified</small>
                                        </div>
                                    </div>
                                    <div class="col-3">
                                        <div class="metric-small">
                                            <h5>${stats.avgConfidence.toFixed(1)}%</h5>
                                            <small>Avg AI Score</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${fisher.suspensionReason ? `
                        <div class="alert alert-warning mt-3">
                            <strong>Suspension Reason:</strong> ${fisher.suspensionReason}
                        </div>
                        ` : ''}
                    </div>

                    <!-- Licenses Tab -->
                    <div class="tab-pane fade" id="licenses-tab">
                        ${data.licenses.length === 0 ? '<p class="text-muted">No licenses on file</p>' : `
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>License Number</th>
                                        <th>Type</th>
                                        <th>Issuing Authority</th>
                                        <th>Issue Date</th>
                                        <th>Expiry Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.licenses.map(lic => `
                                        <tr>
                                            <td>${lic.licenseNumber}</td>
                                            <td>${lic.licenseType}</td>
                                            <td>${lic.issuingAuthority}<br><small class="text-muted">${lic.issuingCountry}</small></td>
                                            <td>${formatDate(lic.issueDate)}</td>
                                            <td>${formatLicenseExpiry(lic.expiryDate)}</td>
                                            <td>${lic.isVerified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-warning">Pending</span>'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        `}
                    </div>

                    <!-- Recent Catches Tab -->
                    <div class="tab-pane fade" id="catches-tab">
                        ${data.recentCatches.length === 0 ? '<p class="text-muted">No catches recorded</p>' : `
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Species</th>
                                        <th>Weight</th>
                                        <th>Price/kg</th>
                                        <th>AI Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.recentCatches.map(c => `
                                        <tr>
                                            <td>${formatDate(c.catchDate)}</td>
                                            <td>${c.species}</td>
                                            <td>${c.weightKg.toFixed(2)} kg</td>
                                            <td>$${c.pricePerKg.toFixed(2)}</td>
                                            <td>
                                                ${c.aiConfidenceScore.toFixed(1)}%
                                                <div class="confidence-bar" style="width: 50px; display: inline-block; margin-left: 5px;">
                                                    <div class="confidence-bar-fill ${getConfidenceClass(c.aiConfidenceScore)}" 
                                                         style="width: ${c.aiConfidenceScore}%"></div>
                                                </div>
                                            </td>
                                            <td>
                                                ${c.isAdminVerified ? 
                                                    '<span class="badge bg-success">Verified</span>' : 
                                                    c.isAIVerified ? 
                                                        '<span class="badge bg-info">AI Verified</span>' : 
                                                        '<span class="badge bg-warning">Pending</span>'
                                                }
                                                ${c.isAvailable ? '<span class="badge bg-primary ms-1">Available</span>' : ''}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        `}
                    </div>

                    <!-- Trust Score Tab -->
                    <div class="tab-pane fade" id="trust-tab">
                        <div class="mb-3">
                            <h6 class="text-primary">Current Trust Score</h6>
                            <div class="d-flex align-items-center">
                                <div class="fs-1 fw-bold text-primary me-3">${fisher.trustScore.toFixed(1)}</div>
                                <div>
                                    <div>Last updated: ${fisher.lastTrustScoreUpdate ? formatDateTime(fisher.lastTrustScoreUpdate) : 'Never'}</div>
                                    <div class="progress" style="width: 200px; height: 10px;">
                                        <div class="progress-bar ${fisher.trustScore >= 80 ? 'bg-success' : fisher.trustScore >= 60 ? 'bg-warning' : 'bg-danger'}" 
                                             style="width: ${fisher.trustScore}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${data.trustScoreHistory.length === 0 ? '<p class="text-muted">No trust score history</p>' : `
                        <h6 class="text-primary mt-4">Trust Score History</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Previous</th>
                                        <th>New Score</th>
                                        <th>Change</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.trustScoreHistory.map(h => {
                                        const change = h.previousScore ? (h.newScore - h.previousScore).toFixed(1) : 'N/A';
                                        return `
                                        <tr>
                                            <td>${formatDateTime(h.changedAt)}</td>
                                            <td>${h.previousScore ? h.previousScore.toFixed(1) : 'N/A'}</td>
                                            <td>${h.newScore.toFixed(1)}</td>
                                            <td>
                                                ${h.previousScore ? 
                                                    `<span class="${h.newScore > h.previousScore ? 'text-success' : 'text-danger'}">
                                                        ${h.newScore > h.previousScore ? '+' : ''}${change}
                                                    </span>` : 
                                                    'Initial'
                                                }
                                            </td>
                                            <td>${h.changeReason}</td>
                                        </tr>
                                    `}).join('')}
                                </tbody>
                            </table>
                        </div>
                        `}
                    </div>

                    <!-- Vessels Tab -->
                    ${data.vessels.length > 0 ? `
                    <div class="tab-pane fade" id="vessels-tab">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Vessel Name</th>
                                        <th>Registration</th>
                                        <th>Type</th>
                                        <th>Length</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.vessels.map(v => `
                                        <tr>
                                            <td>${v.vesselName}</td>
                                            <td>${v.registrationNumber}</td>
                                            <td>${v.vesselType || 'N/A'}</td>
                                            <td>${v.lengthMeters ? v.lengthMeters.toFixed(1) + 'm' : 'N/A'}</td>
                                            <td>${v.isActive ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('fisherDetailContent').innerHTML = content;
        const modal = new bootstrap.Modal(document.getElementById('fisherDetailModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading fisher details:', error);
        showError('Failed to load fisher details');
    }
}

// ============================================
// CATCHES MANAGEMENT
// ============================================

async function loadCatches() {
    const filterType = document.getElementById('catchFilterType')?.value || '';
    
    try {
        let url = `${API_BASE_URL}/Admin/catches?`;
        
        if (filterType === 'flagged') {
            url += 'flagged=true';
        } else if (filterType === 'unverified') {
            url += 'verified=false';
        } else if (filterType === 'verified') {
            url += 'verified=true';
        }
        
        const response = await fetch(url);
        const catches = await response.json();
        
        const tbody = document.getElementById('catchesTableBody');
        
        if (catches.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No catches found</td></tr>';
            return;
        }
        
        tbody.innerHTML = catches.map(c => `
            <tr onclick="viewCatchDetails(${c.catchId})" style="cursor: pointer;">
                <td>#${c.catchId}</td>
                <td>${c.species}</td>
                <td>${c.weightKg.toFixed(2)}</td>
                <td>${c.fisherName}</td>
                <td>${formatDate(c.catchDate)}</td>
                <td>
                    <div>${c.aiConfidenceScore.toFixed(1)}%</div>
                    <div class="confidence-bar">
                        <div class="confidence-bar-fill ${getConfidenceClass(c.aiConfidenceScore)}" 
                             style="width: ${c.aiConfidenceScore}%"></div>
                    </div>
                </td>
                <td>
                    ${c.isAdminVerified ? 
                        '<span class="verification-status verified"><i class="bi bi-check-circle-fill"></i> Verified</span>' :
                        c.aiConfidenceScore < 90 ?
                            '<span class="verification-status flagged"><i class="bi bi-flag-fill"></i> Flagged</span>' :
                            '<span class="verification-status pending"><i class="bi bi-clock-fill"></i> Pending</span>'
                    }
                </td>
                <td onclick="event.stopPropagation();">
                    ${!c.isAdminVerified ? 
                        `<button class="btn btn-sm btn-verify" onclick="verifyCatch(${c.catchId})">
                            <i class="bi bi-check-circle"></i> Verify
                        </button>` : 
                        '<span class="text-muted">Verified</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading catches:', error);
        showError('Failed to load catches');
    }
}

async function verifyCatch(catchId) {
    if (!confirm('Verify this catch record?')) {
        return;
    }
    
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/catches/${catchId}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes: 'Admin manual verification' })
        });
        
        if (response.ok) {
            showSuccess('Catch verified successfully');
            loadCatches();
            refreshDashboard();
        } else {
            showError('Failed to verify catch');
        }
    } catch (error) {
        console.error('Error verifying catch:', error);
        showError('Failed to verify catch');
    }
}

async function viewCatchDetails(catchId) {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/catches/${catchId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch catch details');
        }
        
        const catch_ = await response.json();

        const content = `
            <div class="catch-detail-container">
                <!-- Header -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h3>${catch_.speciesName}</h3>
                        <p class="text-muted"><em>${catch_.scientificName || 'N/A'}</em></p>
                    </div>
                    <div class="col-md-4 text-end">
                        ${catch_.isAdminVerified ? 
                            '<span class="badge bg-success fs-6"><i class="bi bi-check-circle-fill"></i> Admin Verified</span>' :
                            catch_.aiConfidenceScore >= 90 ?
                                '<span class="badge bg-info fs-6"><i class="bi bi-robot"></i> AI Verified</span>' :
                                '<span class="badge bg-warning fs-6"><i class="bi bi-flag-fill"></i> Flagged</span>'
                        }
                    </div>
                </div>

                <!-- Photos Section -->
                ${catch_.photos && catch_.photos.length > 0 ? `
                    <div class="row mb-4">
                        <div class="col-12">
                            <h5 class="border-bottom pb-2 mb-3">Catch Photos</h5>
                            <div class="catch-photos-gallery">
                                ${catch_.photos.map(photo => `
                                    <div class="catch-photo-item">
                                        <img src="${photo.photoUrl}" alt="${catch_.speciesName}" class="img-fluid rounded" loading="lazy">
                                        ${photo.caption ? `<p class="text-muted small mt-1">${photo.caption}</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="row">
                    <!-- Left Column -->
                    <div class="col-md-6">
                        <h5 class="border-bottom pb-2 mb-3">Catch Information</h5>
                        <table class="table table-sm">
                            <tr>
                                <td class="fw-bold">Catch ID:</td>
                                <td>#${catch_.catchId}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Weight:</td>
                                <td>${catch_.weightKg.toFixed(2)} kg</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Date:</td>
                                <td>${formatDate(catch_.catchDate)}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Location:</td>
                                <td>${catch_.catchLatitude.toFixed(4)}°N, ${catch_.catchLongitude.toFixed(4)}°E</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Landing Port:</td>
                                <td>${catch_.landingPort || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Condition:</td>
                                <td>${catch_.fishCondition || 'Fresh'}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Storage:</td>
                                <td>${catch_.storageMethod || 'Ice'}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Right Column -->
                    <div class="col-md-6">
                        <h5 class="border-bottom pb-2 mb-3">Fisher & Verification</h5>
                        <table class="table table-sm">
                            <tr>
                                <td class="fw-bold">Fisher:</td>
                                <td>${catch_.fisherName || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Fisher Status:</td>
                                <td><span class="badge bg-success">Certified</span></td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Home Port:</td>
                                <td>${catch_.homePort || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">AI Confidence:</td>
                                <td>
                                    <div>${catch_.aiConfidenceScore.toFixed(1)}%</div>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar ${catch_.aiConfidenceScore >= 90 ? 'bg-success' : catch_.aiConfidenceScore >= 70 ? 'bg-warning' : 'bg-danger'}" 
                                             role="progressbar" 
                                             style="width: ${catch_.aiConfidenceScore}%"
                                             aria-valuenow="${catch_.aiConfidenceScore}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="fw-bold">Admin Verified:</td>
                                <td>${catch_.isAdminVerified ? 
                                    '<span class="text-success"><i class="bi bi-check-circle-fill"></i> Yes</span>' : 
                                    '<span class="text-warning"><i class="bi bi-clock-fill"></i> Pending</span>'}
                                </td>
                            </tr>
                            ${catch_.isAdminVerified && catch_.verifiedBy ? `
                                <tr>
                                    <td class="fw-bold">Verified By:</td>
                                    <td>Admin #${catch_.verifiedBy}</td>
                                </tr>
                            ` : ''}
                        </table>
                    </div>
                </div>

                <!-- Marketplace Info -->
                ${catch_.isAvailable ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <h5 class="border-bottom pb-2 mb-3">Marketplace</h5>
                            <table class="table table-sm">
                                <tr>
                                    <td class="fw-bold">Status:</td>
                                    <td><span class="badge bg-success"><i class="bi bi-check-circle"></i> Available</span></td>
                                </tr>
                                <tr>
                                    <td class="fw-bold">Price per kg:</td>
                                    <td class="fs-5 text-success fw-bold">$${catch_.pricePerKg.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td class="fw-bold">Total Value:</td>
                                    <td class="fs-5 text-primary fw-bold">$${(catch_.pricePerKg * catch_.weightKg).toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                ` : ''}

                <!-- QR Code -->
                ${catch_.qrCode ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <h5 class="border-bottom pb-2 mb-3">Traceability</h5>
                            <p><strong>QR Code:</strong> <code>${catch_.qrCode}</code></p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('catchDetailContent').innerHTML = content;
        
        // Show verify button if not verified
        const verifyBtn = document.getElementById('verifyCatchBtn');
        if (!catch_.isAdminVerified) {
            verifyBtn.style.display = 'inline-block';
            verifyBtn.onclick = () => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('catchDetailModal'));
                modal.hide();
                verifyCatch(catchId);
            };
        } else {
            verifyBtn.style.display = 'none';
        }
        
        const modal = new bootstrap.Modal(document.getElementById('catchDetailModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading catch details:', error);
        showError('Failed to load catch details');
    }
}

// ============================================
// ORDERS MANAGEMENT
// ============================================

async function loadOrders() {
    const status = document.getElementById('orderStatusFilter')?.value || '';
    
    try {
        let url = `${API_BASE_URL}/Admin/orders?`;
        if (status) url += `status=${status}`;
        
        const response = await fetch(url);
        const orders = await response.json();
        
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.orderId}</td>
                <td>${formatDate(order.orderDate)}</td>
                <td>${order.species}</td>
                <td>${order.fisherName}</td>
                <td>${order.buyerName}</td>
                <td>${order.quantityKg.toFixed(2)} kg</td>
                <td>$${order.totalPrice.toFixed(2)}</td>
                <td><span class="badge bg-${getOrderStatusColor(order.orderStatus)}">${order.orderStatus}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Failed to load orders');
    }
}

// ============================================
// REPORTS & EXPORTS
// ============================================

async function loadReportsData() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/dashboard/metrics`);
        const data = await response.json();
        
        document.getElementById('totalFishersMetric').textContent = data.totalFishers;
        document.getElementById('totalCatchesMetric').textContent = data.totalCatches;
        document.getElementById('totalOrdersMetric').textContent = data.totalOrders;
        
        const verificationRate = data.totalCatches > 0 
            ? ((data.verifiedCatches / data.totalCatches) * 100).toFixed(1)
            : 0;
        document.getElementById('verificationRateMetric').textContent = `${verificationRate}%`;
    } catch (error) {
        console.error('Error loading reports data:', error);
    }
}

async function exportData(type, format) {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/export/${type}?format=${format}`);
        
        if (format === 'csv') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
        
        showSuccess(`${type} data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Error exporting data:', error);
        showError('Failed to export data');
    }
}

// ============================================
// AUDIT LOG
// ============================================

async function loadAuditLog() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/audit-log?limit=50`);
        const logs = await response.json();
        
        const tbody = document.getElementById('auditLogTableBody');
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No audit logs found</td></tr>';
            return;
        }
        
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${formatDateTime(log.verifiedAt)}</td>
                <td>${log.verificationType}</td>
                <td>${log.entityType} #${log.entityId}</td>
                <td><span class="badge bg-${log.verificationStatus === 'Passed' ? 'success' : 'danger'}">${log.verificationStatus}</span></td>
                <td>${log.adminName || 'System'}</td>
                <td>${log.verificationNotes || '-'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading audit log:', error);
        showError('Failed to load audit log');
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

async function loadNotifications() {
    try {
        const response = await authFetch(`${API_BASE_URL}/Admin/notifications/expiring-licenses?days=30`);
        const licenses = await response.json();
        
        const count = licenses.length;
        document.getElementById('notificationCount').textContent = count;
        
        const dropdown = document.getElementById('notificationsList');
        
        if (licenses.length === 0) {
            dropdown.innerHTML = '<li><a class="dropdown-item" href="#">No notifications</a></li>';
            return;
        }
        
        dropdown.innerHTML = licenses.map(license => `
            <li>
                <a class="dropdown-item" href="#fishers" onclick="showSection('fishers')">
                    <strong>${license.fisherName}</strong><br>
                    <small>License expires in ${license.daysUntilExpiry} days</small>
                </a>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// ============================================
// MODAL SETUP
// ============================================

function setupModals() {
    const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');
    if (confirmRevokeBtn) {
        confirmRevokeBtn.addEventListener('click', revokeFisher);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatLicenseExpiry(dateString) {
    if (!dateString) return '<span class="text-muted">No license</span>';
    
    const expiry = new Date(dateString);
    const now = new Date();
    const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
        return `<span class="expiry-warning">Expired ${formatDate(dateString)}</span>`;
    } else if (daysUntil <= 30) {
        return `<span class="expiry-soon">${formatDate(dateString)} (${daysUntil}d)</span>`;
    }
    
    return formatDate(dateString);
}

function formatTrustScore(score) {
    if (!score || score === 0) return '<span class="text-muted">N/A</span>';
    
    let className = 'low';
    if (score >= 80) className = 'high';
    else if (score >= 60) className = 'medium';
    
    return `<span class="trust-score ${className}">${score.toFixed(0)}</span>`;
}

function getConfidenceClass(score) {
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
}

function getOrderStatusColor(status) {
    const colors = {
        'Pending': 'warning',
        'Confirmed': 'info',
        'InTransit': 'primary',
        'Delivered': 'success',
        'Cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function showSuccess(message) {
    // Simple alert for now - could be replaced with a toast notification
    alert(message);
}

function showError(message) {
    alert('Error: ' + message);
}

