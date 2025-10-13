using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using System.Text;
using System.Text.Json;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly string _connectionString = "Data Source=database.db";

        // ============================================
        // DASHBOARD METRICS (HLR-2, LLR-2)
        // ============================================
        
        [HttpGet("dashboard/metrics")]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        (SELECT COUNT(*) FROM FisherProfile WHERE CertificationStatus = 'Certified') as CertifiedFishers,
                        (SELECT COUNT(*) FROM FisherProfile WHERE CertificationStatus = 'Pending') as PendingFishers,
                        (SELECT COUNT(*) FROM FisherProfile WHERE CertificationStatus = 'PreVerified') as PreVerifiedFishers,
                        (SELECT COUNT(*) FROM CatchRecord WHERE IsAIVerified = 1 OR IsAdminVerified = 1) as VerifiedCatches,
                        (SELECT COUNT(*) FROM CatchRecord WHERE AIConfidenceScore < 90 AND IsAdminVerified = 0) as FlaggedCatches,
                        (SELECT COUNT(*) FROM CatchRecord WHERE IsAdminVerified = 0) as PendingVerifications,
                        (SELECT ROUND(AVG(TrustScore), 2) FROM FisherProfile WHERE TrustScore > 0) as AvgTrustScore,
                        (SELECT COUNT(*) FROM FisherProfile) as TotalFishers,
                        (SELECT COUNT(*) FROM CatchRecord) as TotalCatches,
                        (SELECT COUNT(*) FROM 'Order') as TotalOrders
                ", connection);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return Ok(new
                    {
                        certifiedFishers = reader.GetInt32(0),
                        pendingFishers = reader.GetInt32(1),
                        preVerifiedFishers = reader.GetInt32(2),
                        verifiedCatches = reader.GetInt32(3),
                        flaggedCatches = reader.GetInt32(4),
                        pendingVerifications = reader.GetInt32(5),
                        avgTrustScore = reader.IsDBNull(6) ? 0 : reader.GetDouble(6),
                        totalFishers = reader.GetInt32(7),
                        totalCatches = reader.GetInt32(8),
                        totalOrders = reader.GetInt32(9)
                    });
                }

                return Ok(new { });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving dashboard metrics", error = ex.Message });
            }
        }

        // ============================================
        // FISHER MANAGEMENT (HLR-1, HLR-3, LLR-1, LLR-10)
        // ============================================

        [HttpGet("fishers")]
        public async Task<IActionResult> GetFishers([FromQuery] string? status = null, [FromQuery] string? search = null)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        fp.FisherID,
                        u.FirstName || ' ' || u.LastName as FullName,
                        u.Email,
                        fp.CertificationStatus,
                        fp.TrustScore,
                        fp.CreatedAt,
                        fp.CertifiedAt,
                        (SELECT ExpiryDate FROM License WHERE FisherID = fp.FisherID ORDER BY ExpiryDate DESC LIMIT 1) as LicenseExpiry,
                        (SELECT LicenseNumber FROM License WHERE FisherID = fp.FisherID ORDER BY ExpiryDate DESC LIMIT 1) as LicenseNumber,
                        fp.HomePort,
                        fp.Country
                    FROM FisherProfile fp
                    INNER JOIN User u ON fp.UserID = u.UserID
                    WHERE 1=1";

                if (!string.IsNullOrEmpty(status))
                {
                    query += " AND fp.CertificationStatus = @status";
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query += " AND (u.FirstName LIKE @search OR u.LastName LIKE @search OR u.Email LIKE @search)";
                }

                query += " GROUP BY fp.FisherID, u.FirstName, u.LastName, u.Email, fp.CertificationStatus, fp.TrustScore, fp.CreatedAt, fp.CertifiedAt, fp.HomePort, fp.Country";
                query += " ORDER BY fp.CreatedAt DESC";

                var command = new SqliteCommand(query, connection);
                if (!string.IsNullOrEmpty(status))
                {
                    command.Parameters.AddWithValue("@status", status);
                }
                if (!string.IsNullOrEmpty(search))
                {
                    command.Parameters.AddWithValue("@search", $"%{search}%");
                }

                var fishers = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    fishers.Add(new
                    {
                        fisherId = reader.GetInt32(0),
                        fullName = reader.GetString(1),
                        email = reader.GetString(2),
                        certificationStatus = reader.GetString(3),
                        trustScore = reader.IsDBNull(4) ? 0 : reader.GetDouble(4),
                        createdAt = reader.GetString(5),
                        certifiedAt = reader.IsDBNull(6) ? null : reader.GetString(6),
                        licenseExpiry = reader.IsDBNull(7) ? null : reader.GetString(7),
                        licenseNumber = reader.IsDBNull(8) ? null : reader.GetString(8),
                        homePort = reader.IsDBNull(9) ? null : reader.GetString(9),
                        country = reader.IsDBNull(10) ? null : reader.GetString(10)
                    });
                }

                return Ok(fishers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving fishers", error = ex.Message });
            }
        }

        [HttpPost("fishers/{fisherId}/approve")]
        public async Task<IActionResult> ApproveFisher(int fisherId)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();

                // Update fisher status
                var updateCommand = new SqliteCommand(@"
                    UPDATE FisherProfile 
                    SET CertificationStatus = 'Certified',
                        CertifiedAt = CURRENT_TIMESTAMP,
                        CertifiedBy = @adminId
                    WHERE FisherID = @fisherId
                ", connection, transaction);
                updateCommand.Parameters.AddWithValue("@fisherId", fisherId);
                updateCommand.Parameters.AddWithValue("@adminId", userId.Value);
                await updateCommand.ExecuteNonQueryAsync();

                // Log the action
                await LogAdminAction(connection, transaction, userId.Value, "ApproveFisher", fisherId, "Fisher approved and certified");

                transaction.Commit();

                return Ok(new { message = "Fisher approved successfully", fisherId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error approving fisher", error = ex.Message });
            }
        }

        [HttpPost("fishers/{fisherId}/revoke")]
        public async Task<IActionResult> RevokeFisher(int fisherId, [FromBody] RevokeRequest request)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();

                // Update fisher status
                var updateCommand = new SqliteCommand(@"
                    UPDATE FisherProfile 
                    SET CertificationStatus = 'Revoked',
                        SuspensionReason = @reason
                    WHERE FisherID = @fisherId
                ", connection, transaction);
                updateCommand.Parameters.AddWithValue("@fisherId", fisherId);
                updateCommand.Parameters.AddWithValue("@reason", request.Reason ?? "No reason provided");
                await updateCommand.ExecuteNonQueryAsync();

                // Log the action
                await LogAdminAction(connection, transaction, userId.Value, "RevokeFisher", fisherId, $"Fisher certification revoked: {request.Reason}");

                transaction.Commit();

                return Ok(new { message = "Fisher certification revoked", fisherId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error revoking fisher", error = ex.Message });
            }
        }

        [HttpGet("fishers/{fisherId}/details")]
        public async Task<IActionResult> GetFisherDetails(int fisherId)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                // Get basic fisher info
                var fisherCommand = new SqliteCommand(@"
                    SELECT 
                        fp.FisherID,
                        u.FirstName,
                        u.LastName,
                        u.Email,
                        u.PhoneNumber,
                        u.CreatedAt as UserCreatedAt,
                        u.LastLoginAt,
                        fp.NationalID,
                        fp.DateOfBirth,
                        fp.Address,
                        fp.City,
                        fp.State,
                        fp.Country,
                        fp.PostalCode,
                        fp.YearsOfExperience,
                        fp.PrimaryFishingMethod,
                        fp.HomePort,
                        fp.CertificationStatus,
                        fp.CertifiedAt,
                        fp.TrustScore,
                        fp.LastTrustScoreUpdate,
                        fp.DemoCatchesLogged,
                        fp.SuspensionReason,
                        fp.CreatedAt as ProfileCreatedAt
                    FROM FisherProfile fp
                    INNER JOIN User u ON fp.UserID = u.UserID
                    WHERE fp.FisherID = @fisherId
                ", connection);
                fisherCommand.Parameters.AddWithValue("@fisherId", fisherId);

                object? fisherInfo = null;
                using (var reader = await fisherCommand.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        fisherInfo = new
                        {
                            fisherId = reader.GetInt32(0),
                            firstName = reader.GetString(1),
                            lastName = reader.GetString(2),
                            email = reader.GetString(3),
                            phoneNumber = reader.IsDBNull(4) ? null : reader.GetString(4),
                            userCreatedAt = reader.GetString(5),
                            lastLoginAt = reader.IsDBNull(6) ? null : reader.GetString(6),
                            nationalId = reader.IsDBNull(7) ? null : reader.GetString(7),
                            dateOfBirth = reader.IsDBNull(8) ? null : reader.GetString(8),
                            address = reader.IsDBNull(9) ? null : reader.GetString(9),
                            city = reader.IsDBNull(10) ? null : reader.GetString(10),
                            state = reader.IsDBNull(11) ? null : reader.GetString(11),
                            country = reader.IsDBNull(12) ? null : reader.GetString(12),
                            postalCode = reader.IsDBNull(13) ? null : reader.GetString(13),
                            yearsOfExperience = reader.IsDBNull(14) ? null : (int?)reader.GetInt32(14),
                            primaryFishingMethod = reader.IsDBNull(15) ? null : reader.GetString(15),
                            homePort = reader.IsDBNull(16) ? null : reader.GetString(16),
                            certificationStatus = reader.GetString(17),
                            certifiedAt = reader.IsDBNull(18) ? null : reader.GetString(18),
                            trustScore = reader.IsDBNull(19) ? 0 : reader.GetDouble(19),
                            lastTrustScoreUpdate = reader.IsDBNull(20) ? null : reader.GetString(20),
                            demoCatchesLogged = reader.GetInt32(21),
                            suspensionReason = reader.IsDBNull(22) ? null : reader.GetString(22),
                            profileCreatedAt = reader.GetString(23)
                        };
                    }
                }

                if (fisherInfo == null)
                {
                    return NotFound(new { message = "Fisher not found" });
                }

                // Get licenses
                var licensesCommand = new SqliteCommand(@"
                    SELECT 
                        LicenseID,
                        LicenseNumber,
                        LicenseType,
                        IssuingAuthority,
                        IssuingCountry,
                        IssueDate,
                        ExpiryDate,
                        IsVerified,
                        DocumentURL
                    FROM License
                    WHERE FisherID = @fisherId
                    ORDER BY ExpiryDate DESC
                ", connection);
                licensesCommand.Parameters.AddWithValue("@fisherId", fisherId);

                var licenses = new List<object>();
                using (var reader = await licensesCommand.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        licenses.Add(new
                        {
                            licenseId = reader.GetInt32(0),
                            licenseNumber = reader.GetString(1),
                            licenseType = reader.GetString(2),
                            issuingAuthority = reader.GetString(3),
                            issuingCountry = reader.GetString(4),
                            issueDate = reader.GetString(5),
                            expiryDate = reader.GetString(6),
                            isVerified = reader.GetBoolean(7),
                            documentUrl = reader.IsDBNull(8) ? null : reader.GetString(8)
                        });
                    }
                }

                // Get recent catches
                var catchesCommand = new SqliteCommand(@"
                    SELECT 
                        c.CatchID,
                        s.CommonName,
                        c.WeightKG,
                        c.CatchDate,
                        c.AIConfidenceScore,
                        c.IsAIVerified,
                        c.IsAdminVerified,
                        c.PricePerKG,
                        c.IsAvailable
                    FROM CatchRecord c
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    WHERE c.FisherID = @fisherId
                    ORDER BY c.CatchDate DESC
                    LIMIT 10
                ", connection);
                catchesCommand.Parameters.AddWithValue("@fisherId", fisherId);

                var recentCatches = new List<object>();
                using (var reader = await catchesCommand.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        recentCatches.Add(new
                        {
                            catchId = reader.GetInt32(0),
                            species = reader.GetString(1),
                            weightKg = reader.GetDouble(2),
                            catchDate = reader.GetString(3),
                            aiConfidenceScore = reader.IsDBNull(4) ? 0 : reader.GetDouble(4),
                            isAIVerified = reader.GetBoolean(5),
                            isAdminVerified = reader.GetBoolean(6),
                            pricePerKg = reader.IsDBNull(7) ? 0 : reader.GetDouble(7),
                            isAvailable = reader.GetBoolean(8)
                        });
                    }
                }

                // Get trust score history
                var trustScoreCommand = new SqliteCommand(@"
                    SELECT 
                        PreviousScore,
                        NewScore,
                        ChangeReason,
                        ChangedAt
                    FROM TrustScoreHistory
                    WHERE FisherID = @fisherId
                    ORDER BY ChangedAt DESC
                    LIMIT 5
                ", connection);
                trustScoreCommand.Parameters.AddWithValue("@fisherId", fisherId);

                var trustScoreHistory = new List<object>();
                using (var reader = await trustScoreCommand.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        trustScoreHistory.Add(new
                        {
                            previousScore = reader.IsDBNull(0) ? null : (double?)reader.GetDouble(0),
                            newScore = reader.GetDouble(1),
                            changeReason = reader.GetString(2),
                            changedAt = reader.GetString(3)
                        });
                    }
                }

                // Get statistics
                var statsCommand = new SqliteCommand(@"
                    SELECT 
                        COUNT(*) as TotalCatches,
                        SUM(WeightKG) as TotalWeight,
                        COUNT(CASE WHEN IsAdminVerified = 1 THEN 1 END) as VerifiedCatches,
                        AVG(AIConfidenceScore) as AvgConfidence
                    FROM CatchRecord
                    WHERE FisherID = @fisherId
                ", connection);
                statsCommand.Parameters.AddWithValue("@fisherId", fisherId);

                object? statistics = null;
                using (var reader = await statsCommand.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        statistics = new
                        {
                            totalCatches = reader.GetInt32(0),
                            totalWeightKg = reader.IsDBNull(1) ? 0 : reader.GetDouble(1),
                            verifiedCatches = reader.GetInt32(2),
                            avgConfidence = reader.IsDBNull(3) ? 0 : reader.GetDouble(3)
                        };
                    }
                }

                // Get vessels
                var vesselsCommand = new SqliteCommand(@"
                    SELECT 
                        VesselID,
                        VesselName,
                        RegistrationNumber,
                        VesselType,
                        LengthMeters,
                        IsActive
                    FROM Vessel
                    WHERE OwnerFisherID = @fisherId
                ", connection);
                vesselsCommand.Parameters.AddWithValue("@fisherId", fisherId);

                var vessels = new List<object>();
                using (var reader = await vesselsCommand.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        vessels.Add(new
                        {
                            vesselId = reader.GetInt32(0),
                            vesselName = reader.GetString(1),
                            registrationNumber = reader.GetString(2),
                            vesselType = reader.IsDBNull(3) ? null : reader.GetString(3),
                            lengthMeters = reader.IsDBNull(4) ? null : (double?)reader.GetDouble(4),
                            isActive = reader.GetBoolean(5)
                        });
                    }
                }

                return Ok(new
                {
                    fisher = fisherInfo,
                    licenses = licenses,
                    recentCatches = recentCatches,
                    trustScoreHistory = trustScoreHistory,
                    statistics = statistics,
                    vessels = vessels
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving fisher details", error = ex.Message });
            }
        }

        // ============================================
        // CATCH MANAGEMENT (HLR-2, HLR-3, LLR-8)
        // ============================================

        [HttpGet("catches")]
        public async Task<IActionResult> GetCatches([FromQuery] bool? flagged = null, [FromQuery] bool? verified = null)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        c.CatchID,
                        s.CommonName as Species,
                        c.WeightKG,
                        c.PricePerKG,
                        c.CatchDate,
                        u.FirstName || ' ' || u.LastName as FisherName,
                        c.AIConfidenceScore,
                        c.IsAIVerified,
                        c.IsAdminVerified,
                        c.CatchLatitude,
                        c.CatchLongitude,
                        c.LandingPort,
                        fp.CertificationStatus
                    FROM CatchRecord c
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    INNER JOIN FisherProfile fp ON c.FisherID = fp.FisherID
                    INNER JOIN User u ON fp.UserID = u.UserID
                    WHERE 1=1";

                if (flagged.HasValue && flagged.Value)
                {
                    query += " AND c.AIConfidenceScore < 90 AND c.IsAdminVerified = 0";
                }

                if (verified.HasValue)
                {
                    query += verified.Value ? " AND (c.IsAIVerified = 1 OR c.IsAdminVerified = 1)" : " AND c.IsAdminVerified = 0";
                }

                query += " ORDER BY c.CatchDate DESC LIMIT 100";

                var command = new SqliteCommand(query, connection);

                var catches = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    catches.Add(new
                    {
                        catchId = reader.GetInt32(0),
                        species = reader.GetString(1),
                        weightKg = reader.GetDouble(2),
                        pricePerKg = reader.IsDBNull(3) ? 0 : reader.GetDouble(3),
                        catchDate = reader.GetString(4),
                        fisherName = reader.GetString(5),
                        aiConfidenceScore = reader.IsDBNull(6) ? 0 : reader.GetDouble(6),
                        isAIVerified = reader.GetBoolean(7),
                        isAdminVerified = reader.GetBoolean(8),
                        latitude = reader.GetDouble(9),
                        longitude = reader.GetDouble(10),
                        landingPort = reader.IsDBNull(11) ? null : reader.GetString(11),
                        fisherCertificationStatus = reader.GetString(12)
                    });
                }

                return Ok(catches);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving catches", error = ex.Message });
            }
        }

        [HttpGet("catches/{catchId}")]
        public async Task<IActionResult> GetCatchDetails(int catchId)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        c.CatchID,
                        s.CommonName as Species,
                        s.ScientificName,
                        c.WeightKG,
                        c.PricePerKG,
                        c.CatchDate,
                        u.FirstName || ' ' || u.LastName as FisherName,
                        fp.HomePort,
                        fp.CertificationStatus,
                        c.AIConfidenceScore,
                        c.IsAIVerified,
                        c.IsAdminVerified,
                        c.VerifiedBy,
                        c.CatchLatitude,
                        c.CatchLongitude,
                        c.LandingPort,
                        c.FishCondition,
                        c.StorageMethod,
                        c.IsAvailable,
                        c.QRCode
                    FROM CatchRecord c
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    INNER JOIN FisherProfile fp ON c.FisherID = fp.FisherID
                    INNER JOIN User u ON fp.UserID = u.UserID
                    WHERE c.CatchID = @catchId";

                var command = new SqliteCommand(query, connection);
                command.Parameters.AddWithValue("@catchId", catchId);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var catchDetails = new
                    {
                        catchId = reader.GetInt32(0),
                        speciesName = reader.GetString(1),
                        scientificName = reader.IsDBNull(2) ? null : reader.GetString(2),
                        weightKg = reader.GetDouble(3),
                        pricePerKg = reader.IsDBNull(4) ? 0 : reader.GetDouble(4),
                        catchDate = reader.GetString(5),
                        fisherName = reader.GetString(6),
                        homePort = reader.IsDBNull(7) ? null : reader.GetString(7),
                        fisherCertificationStatus = reader.GetString(8),
                        aiConfidenceScore = reader.IsDBNull(9) ? 0 : reader.GetDouble(9),
                        isAIVerified = reader.GetBoolean(10),
                        isAdminVerified = reader.GetBoolean(11),
                        verifiedBy = reader.IsDBNull(12) ? (int?)null : reader.GetInt32(12),
                        catchLatitude = reader.GetDouble(13),
                        catchLongitude = reader.GetDouble(14),
                        landingPort = reader.IsDBNull(15) ? null : reader.GetString(15),
                        fishCondition = reader.IsDBNull(16) ? null : reader.GetString(16),
                        storageMethod = reader.IsDBNull(17) ? null : reader.GetString(17),
                        isAvailable = reader.GetBoolean(18),
                        qrCode = reader.IsDBNull(19) ? null : reader.GetString(19),
                        photos = new List<object>()
                    };

                    // Get photos for this catch
                    var photoQuery = @"
                        SELECT PhotoURL, ThumbnailURL, Caption
                        FROM CatchPhoto
                        WHERE CatchID = @catchId
                        ORDER BY PhotoID";
                    
                    var photoCommand = new SqliteCommand(photoQuery, connection);
                    photoCommand.Parameters.AddWithValue("@catchId", catchId);
                    
                    using var photoReader = await photoCommand.ExecuteReaderAsync();
                    var photos = new List<object>();
                    while (await photoReader.ReadAsync())
                    {
                        photos.Add(new
                        {
                            photoUrl = photoReader.GetString(0),
                            thumbnailUrl = photoReader.IsDBNull(1) ? photoReader.GetString(0) : photoReader.GetString(1),
                            caption = photoReader.IsDBNull(2) ? null : photoReader.GetString(2)
                        });
                    }

                    return Ok(new
                    {
                        catchId = catchDetails.catchId,
                        speciesName = catchDetails.speciesName,
                        scientificName = catchDetails.scientificName,
                        weightKg = catchDetails.weightKg,
                        pricePerKg = catchDetails.pricePerKg,
                        catchDate = catchDetails.catchDate,
                        fisherName = catchDetails.fisherName,
                        homePort = catchDetails.homePort,
                        fisherCertificationStatus = catchDetails.fisherCertificationStatus,
                        aiConfidenceScore = catchDetails.aiConfidenceScore,
                        isAIVerified = catchDetails.isAIVerified,
                        isAdminVerified = catchDetails.isAdminVerified,
                        verifiedBy = catchDetails.verifiedBy,
                        catchLatitude = catchDetails.catchLatitude,
                        catchLongitude = catchDetails.catchLongitude,
                        landingPort = catchDetails.landingPort,
                        fishCondition = catchDetails.fishCondition,
                        storageMethod = catchDetails.storageMethod,
                        isAvailable = catchDetails.isAvailable,
                        qrCode = catchDetails.qrCode,
                        photos = photos
                    });
                }

                return NotFound(new { message = "Catch not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving catch details", error = ex.Message });
            }
        }

        [HttpPost("catches/{catchId}/verify")]
        public async Task<IActionResult> VerifyCatch(int catchId, [FromBody] VerifyCatchRequest request)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();

                // Update catch verification
                var updateCommand = new SqliteCommand(@"
                    UPDATE CatchRecord 
                    SET IsAdminVerified = 1,
                        VerifiedBy = @adminId,
                        VerifiedAt = CURRENT_TIMESTAMP,
                        VerificationNotes = @notes
                    WHERE CatchID = @catchId
                ", connection, transaction);
                updateCommand.Parameters.AddWithValue("@catchId", catchId);
                updateCommand.Parameters.AddWithValue("@adminId", userId.Value);
                updateCommand.Parameters.AddWithValue("@notes", request.Notes ?? "Admin verified");
                await updateCommand.ExecuteNonQueryAsync();

                // Log the action
                await LogAdminAction(connection, transaction, userId.Value, "VerifyCatch", catchId, "Catch manually verified by admin");

                transaction.Commit();

                return Ok(new { message = "Catch verified successfully", catchId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error verifying catch", error = ex.Message });
            }
        }

        // ============================================
        // ORDERS MANAGEMENT (HLR-3, LLR-3)
        // ============================================

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        o.OrderID,
                        o.OrderDate,
                        o.QuantityKG,
                        o.PricePerKG,
                        o.TotalPrice,
                        o.OrderStatus,
                        s.CommonName as Species,
                        uf.FirstName || ' ' || uf.LastName as FisherName,
                        ub.FirstName || ' ' || ub.LastName as BuyerName,
                        o.ExpectedDeliveryDate,
                        o.ActualDeliveryDate
                    FROM 'Order' o
                    INNER JOIN CatchRecord c ON o.CatchID = c.CatchID
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    INNER JOIN FisherProfile fp ON o.FisherID = fp.FisherID
                    INNER JOIN User uf ON fp.UserID = uf.UserID
                    INNER JOIN BuyerProfile bp ON o.BuyerID = bp.BuyerID
                    INNER JOIN User ub ON bp.UserID = ub.UserID
                    WHERE 1=1";

                if (!string.IsNullOrEmpty(status))
                {
                    query += " AND o.OrderStatus = @status";
                }

                query += " ORDER BY o.OrderDate DESC LIMIT 100";

                var command = new SqliteCommand(query, connection);
                if (!string.IsNullOrEmpty(status))
                {
                    command.Parameters.AddWithValue("@status", status);
                }

                var orders = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    orders.Add(new
                    {
                        orderId = reader.GetInt32(0),
                        orderDate = reader.GetString(1),
                        quantityKg = reader.GetDouble(2),
                        pricePerKg = reader.GetDouble(3),
                        totalPrice = reader.GetDouble(4),
                        orderStatus = reader.GetString(5),
                        species = reader.GetString(6),
                        fisherName = reader.GetString(7),
                        buyerName = reader.GetString(8),
                        expectedDeliveryDate = reader.IsDBNull(9) ? null : reader.GetString(9),
                        actualDeliveryDate = reader.IsDBNull(10) ? null : reader.GetString(10)
                    });
                }

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving orders", error = ex.Message });
            }
        }

        // ============================================
        // AUDIT LOG (HLR-4, LLR-4, LLR-9)
        // ============================================

        [HttpGet("audit-log")]
        public async Task<IActionResult> GetAuditLog([FromQuery] int limit = 50)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        vr.VerificationID,
                        vr.EntityType,
                        vr.EntityID,
                        vr.VerificationType,
                        vr.VerificationStatus,
                        vr.ConfidenceScore,
                        vr.VerifiedAt,
                        vr.VerificationNotes,
                        u.FirstName || ' ' || u.LastName as AdminName
                    FROM VerificationResult vr
                    LEFT JOIN User u ON vr.VerifiedBy = u.UserID
                    ORDER BY vr.VerifiedAt DESC
                    LIMIT @limit
                ", connection);
                command.Parameters.AddWithValue("@limit", limit);

                var logs = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    logs.Add(new
                    {
                        verificationId = reader.GetInt32(0),
                        entityType = reader.GetString(1),
                        entityId = reader.GetInt32(2),
                        verificationType = reader.GetString(3),
                        verificationStatus = reader.GetString(4),
                        confidenceScore = reader.IsDBNull(5) ? null : (double?)reader.GetDouble(5),
                        verifiedAt = reader.GetString(6),
                        verificationNotes = reader.IsDBNull(7) ? null : reader.GetString(7),
                        adminName = reader.IsDBNull(8) ? "System" : reader.GetString(8)
                    });
                }

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving audit log", error = ex.Message });
            }
        }

        // ============================================
        // DATA EXPORT (HLR-5, LLR-5)
        // ============================================

        [HttpGet("export/catches")]
        public async Task<IActionResult> ExportCatches([FromQuery] string format = "json")
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        c.CatchID,
                        s.CommonName,
                        s.ScientificName,
                        c.WeightKG,
                        c.PricePerKG,
                        c.CatchDate,
                        c.LandingPort,
                        u.FirstName || ' ' || u.LastName as FisherName,
                        fp.Country,
                        c.AIConfidenceScore,
                        c.IsAIVerified,
                        c.IsAdminVerified
                    FROM CatchRecord c
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    INNER JOIN FisherProfile fp ON c.FisherID = fp.FisherID
                    INNER JOIN User u ON fp.UserID = u.UserID
                    ORDER BY c.CatchDate DESC
                ", connection);

                var catches = new List<Dictionary<string, object>>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    catches.Add(new Dictionary<string, object>
                    {
                        ["CatchID"] = reader.GetInt32(0),
                        ["CommonName"] = reader.GetString(1),
                        ["ScientificName"] = reader.IsDBNull(2) ? "" : reader.GetString(2),
                        ["WeightKG"] = reader.GetDouble(3),
                        ["PricePerKG"] = reader.IsDBNull(4) ? 0 : reader.GetDouble(4),
                        ["CatchDate"] = reader.GetString(5),
                        ["LandingPort"] = reader.IsDBNull(6) ? "" : reader.GetString(6),
                        ["FisherName"] = reader.GetString(7),
                        ["Country"] = reader.IsDBNull(8) ? "" : reader.GetString(8),
                        ["AIConfidenceScore"] = reader.IsDBNull(9) ? 0 : reader.GetDouble(9),
                        ["IsAIVerified"] = reader.GetBoolean(10),
                        ["IsAdminVerified"] = reader.GetBoolean(11)
                    });
                }

                // Log export action
                var userId = HttpContext.Session.GetInt32("UserId");
                if (userId.HasValue)
                {
                    using var transaction = connection.BeginTransaction();
                    var logCommand = new SqliteCommand(@"
                        INSERT INTO SharedDataLog (DataType, RecipientType, IsAnonymized, DataFormat, SharedBy, Description)
                        VALUES ('Catch Data', 'Export', 0, @format, @userId, 'Admin exported catch data')
                    ", connection, transaction);
                    logCommand.Parameters.AddWithValue("@format", format.ToUpper());
                    logCommand.Parameters.AddWithValue("@userId", userId.Value);
                    await logCommand.ExecuteNonQueryAsync();
                    transaction.Commit();
                }

                if (format.ToLower() == "csv")
                {
                    var csv = new StringBuilder();
                    csv.AppendLine("CatchID,CommonName,ScientificName,WeightKG,PricePerKG,CatchDate,LandingPort,FisherName,Country,AIConfidenceScore,IsAIVerified,IsAdminVerified");
                    
                    foreach (var c in catches)
                    {
                        csv.AppendLine($"{c["CatchID"]},{c["CommonName"]},{c["ScientificName"]},{c["WeightKG"]},{c["PricePerKG"]},{c["CatchDate"]},{c["LandingPort"]},{c["FisherName"]},{c["Country"]},{c["AIConfidenceScore"]},{c["IsAIVerified"]},{c["IsAdminVerified"]}");
                    }
                    
                    return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"catches_export_{DateTime.UtcNow:yyyyMMdd}.csv");
                }

                return Ok(catches);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error exporting catches", error = ex.Message });
            }
        }

        [HttpGet("export/fishers")]
        public async Task<IActionResult> ExportFishers([FromQuery] string format = "json")
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        fp.FisherID,
                        u.FirstName || ' ' || u.LastName as FullName,
                        u.Email,
                        fp.CertificationStatus,
                        fp.TrustScore,
                        fp.Country,
                        fp.HomePort,
                        l.LicenseNumber,
                        l.ExpiryDate
                    FROM FisherProfile fp
                    INNER JOIN User u ON fp.UserID = u.UserID
                    LEFT JOIN License l ON fp.FisherID = l.FisherID
                ", connection);

                var fishers = new List<Dictionary<string, object>>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    fishers.Add(new Dictionary<string, object>
                    {
                        ["FisherID"] = reader.GetInt32(0),
                        ["FullName"] = reader.GetString(1),
                        ["Email"] = reader.GetString(2),
                        ["CertificationStatus"] = reader.GetString(3),
                        ["TrustScore"] = reader.IsDBNull(4) ? 0 : reader.GetDouble(4),
                        ["Country"] = reader.IsDBNull(5) ? "" : reader.GetString(5),
                        ["HomePort"] = reader.IsDBNull(6) ? "" : reader.GetString(6),
                        ["LicenseNumber"] = reader.IsDBNull(7) ? "" : reader.GetString(7),
                        ["LicenseExpiry"] = reader.IsDBNull(8) ? "" : reader.GetString(8)
                    });
                }

                // Log export
                var userId = HttpContext.Session.GetInt32("UserId");
                if (userId.HasValue)
                {
                    using var transaction = connection.BeginTransaction();
                    var logCommand = new SqliteCommand(@"
                        INSERT INTO SharedDataLog (DataType, RecipientType, IsAnonymized, DataFormat, SharedBy, Description)
                        VALUES ('Fisher Data', 'Export', 0, @format, @userId, 'Admin exported fisher data')
                    ", connection, transaction);
                    logCommand.Parameters.AddWithValue("@format", format.ToUpper());
                    logCommand.Parameters.AddWithValue("@userId", userId.Value);
                    await logCommand.ExecuteNonQueryAsync();
                    transaction.Commit();
                }

                if (format.ToLower() == "csv")
                {
                    var csv = new StringBuilder();
                    csv.AppendLine("FisherID,FullName,Email,CertificationStatus,TrustScore,Country,HomePort,LicenseNumber,LicenseExpiry");
                    
                    foreach (var f in fishers)
                    {
                        csv.AppendLine($"{f["FisherID"]},{f["FullName"]},{f["Email"]},{f["CertificationStatus"]},{f["TrustScore"]},{f["Country"]},{f["HomePort"]},{f["LicenseNumber"]},{f["LicenseExpiry"]}");
                    }
                    
                    return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"fishers_export_{DateTime.UtcNow:yyyyMMdd}.csv");
                }

                return Ok(fishers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error exporting fishers", error = ex.Message });
            }
        }

        // ============================================
        // CHARTS & ANALYTICS (HLR-7, LLR-7)
        // ============================================

        [HttpGet("analytics/fisher-status")]
        public async Task<IActionResult> GetFisherStatusDistribution()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT CertificationStatus, COUNT(*) as Count
                    FROM FisherProfile
                    GROUP BY CertificationStatus
                ", connection);

                var distribution = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    distribution.Add(new
                    {
                        status = reader.GetString(0),
                        count = reader.GetInt32(1)
                    });
                }

                return Ok(distribution);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving fisher status distribution", error = ex.Message });
            }
        }

        [HttpGet("analytics/catches-over-time")]
        public async Task<IActionResult> GetCatchesOverTime([FromQuery] int days = 30)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT DATE(CatchDate) as Date, COUNT(*) as Count
                    FROM CatchRecord
                    WHERE CatchDate >= DATE('now', '-' || @days || ' days')
                    GROUP BY DATE(CatchDate)
                    ORDER BY Date
                ", connection);
                command.Parameters.AddWithValue("@days", days);

                var timeSeries = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    timeSeries.Add(new
                    {
                        date = reader.GetString(0),
                        count = reader.GetInt32(1)
                    });
                }

                return Ok(timeSeries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving catch time series", error = ex.Message });
            }
        }

        [HttpGet("analytics/species-confidence")]
        public async Task<IActionResult> GetSpeciesConfidenceScores()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT s.CommonName, ROUND(AVG(c.AIConfidenceScore), 2) as AvgConfidence, COUNT(*) as Count
                    FROM CatchRecord c
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    GROUP BY s.CommonName
                    HAVING COUNT(*) > 0
                    ORDER BY AvgConfidence DESC
                    LIMIT 15
                ", connection);

                var speciesScores = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    speciesScores.Add(new
                    {
                        species = reader.GetString(0),
                        avgConfidence = reader.GetDouble(1),
                        count = reader.GetInt32(2)
                    });
                }

                return Ok(speciesScores);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving species confidence scores", error = ex.Message });
            }
        }

        // ============================================
        // NOTIFICATIONS (HLR-6, LLR-6)
        // ============================================

        [HttpGet("notifications/expiring-licenses")]
        public async Task<IActionResult> GetExpiringLicenses([FromQuery] int days = 30)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        l.LicenseID,
                        l.FisherID,
                        u.FirstName || ' ' || u.LastName as FisherName,
                        u.Email,
                        l.LicenseNumber,
                        l.ExpiryDate,
                        CAST(JULIANDAY(l.ExpiryDate) - JULIANDAY('now') AS INTEGER) as DaysUntilExpiry
                    FROM License l
                    INNER JOIN FisherProfile fp ON l.FisherID = fp.FisherID
                    INNER JOIN User u ON fp.UserID = u.UserID
                    WHERE l.ExpiryDate BETWEEN DATE('now') AND DATE('now', '+' || @days || ' days')
                    ORDER BY l.ExpiryDate
                ", connection);
                command.Parameters.AddWithValue("@days", days);

                var expiringLicenses = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    expiringLicenses.Add(new
                    {
                        licenseId = reader.GetInt32(0),
                        fisherId = reader.GetInt32(1),
                        fisherName = reader.GetString(2),
                        email = reader.GetString(3),
                        licenseNumber = reader.GetString(4),
                        expiryDate = reader.GetString(5),
                        daysUntilExpiry = reader.GetInt32(6)
                    });
                }

                return Ok(expiringLicenses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving expiring licenses", error = ex.Message });
            }
        }

        // ============================================
        // HELPER METHODS
        // ============================================

        private async Task LogAdminAction(SqliteConnection connection, SqliteTransaction transaction, int adminId, string action, int entityId, string notes)
        {
            var command = new SqliteCommand(@"
                INSERT INTO VerificationResult (EntityType, EntityID, VerificationType, VerificationStatus, VerifiedBy, VerificationNotes)
                VALUES (@entityType, @entityId, 'Manual', 'Passed', @adminId, @notes)
            ", connection, transaction);
            
            command.Parameters.AddWithValue("@entityType", action);
            command.Parameters.AddWithValue("@entityId", entityId);
            command.Parameters.AddWithValue("@adminId", adminId);
            command.Parameters.AddWithValue("@notes", notes);
            
            await command.ExecuteNonQueryAsync();
        }
    }

    // Request Models
    public class RevokeRequest
    {
        public string? Reason { get; set; }
    }

    public class VerifyCatchRequest
    {
        public string? Notes { get; set; }
    }
}

