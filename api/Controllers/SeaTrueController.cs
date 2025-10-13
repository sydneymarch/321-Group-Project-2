using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeaTrueController : ControllerBase
    {
        private readonly string _connectionString = "Data Source=database.db";
        private readonly HttpClient _httpClient;
        private readonly string _iucnApiKey = "BjYSL4qAQ7NSjGijL24Ghqo7pGunsKQQX7zY";
        private readonly string _iucnBaseUrl = "https://api.iucnredlist.org/api/v4";

        public SeaTrueController(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("Authorization", _iucnApiKey);
        }

        // GET: api/SeaTrue/catches
        [HttpGet("catches")]
        public async Task<ActionResult<IEnumerable<CatchResponse>>> GetCatches()
        {
            var catches = new List<CatchResponse>();

            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        c.CatchID,
                        s.CommonName as Species,
                        c.WeightKG,
                        c.AverageSizeCM,
                        c.PricePerKG,
                        COALESCE(c.LandingPort, fp.City || ', ' || fp.State, fp.State, 'Unknown') as Location,
                        c.CatchDate,
                        u.FirstName || ' ' || u.LastName as FisherName,
                        u.Email as ContactEmail,
                        c.FishCondition as Status,
                        c.IsAIVerified,
                        c.IsAdminVerified,
                        c.IsAvailable,
                        c.StorageMethod,
                        c.AIConfidenceScore,
                        c.LandingPort,
                        s.ScientificName,
                        s.ConservationStatus,
                        cp.PhotoURL,
                        cp.ThumbnailURL
                    FROM CatchRecord c
                    INNER JOIN FisherProfile fp ON c.FisherID = fp.FisherID
                    INNER JOIN User u ON fp.UserID = u.UserID
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    LEFT JOIN CatchPhoto cp ON c.CatchID = cp.CatchID
                    WHERE c.IsAvailable = 1
                    AND fp.CertificationStatus IN ('Certified', 'PreVerified')
                    ORDER BY c.CatchDate DESC
                ", connection);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        // Convert weight from KG to lbs (1 kg = 2.20462 lbs)
                        var weightLbs = reader.GetDouble(2) * 2.20462;
                        // Convert size from CM to inches (1 cm = 0.393701 inches)
                        var lengthInches = reader.IsDBNull(3) ? 0 : reader.GetDouble(3) * 0.393701;
                        // Convert price from per KG to per lb
                        var pricePerLb = reader.IsDBNull(4) ? 0 : reader.GetDouble(4) / 2.20462;

                        catches.Add(new CatchResponse
                        {
                            Id = reader.GetInt32(0),
                            Species = reader.GetString(1),
                            Weight = Math.Round(weightLbs, 2),
                            Length = Math.Round(lengthInches, 2),
                            Price = Math.Round(pricePerLb, 2),
                            Location = reader.IsDBNull(5) ? "Unknown" : reader.GetString(5),
                            CatchDate = reader.GetString(6),
                            FisherName = reader.GetString(7),
                            ContactEmail = reader.GetString(8),
                            Status = reader.IsDBNull(9) ? "fresh" : reader.GetString(9).ToLower(),
                            Verified = reader.GetBoolean(10) || reader.GetBoolean(11),
                            StorageMethod = reader.IsDBNull(13) ? "" : reader.GetString(13),
                            AIConfidenceScore = reader.IsDBNull(14) ? 0 : reader.GetDouble(14),
                            LandingPort = reader.IsDBNull(15) ? "" : reader.GetString(15),
                            ScientificName = reader.IsDBNull(16) ? "" : reader.GetString(16),
                            ConservationStatus = reader.IsDBNull(17) ? "" : reader.GetString(17),
                            ImageUrl = reader.IsDBNull(18) ? "" : reader.GetString(18),
                            ThumbnailUrl = reader.IsDBNull(19) ? "" : reader.GetString(19),
                            Description = $"{reader.GetString(1)} caught at {(reader.IsDBNull(15) ? "sea" : reader.GetString(15))}. Conservation Status: {(reader.IsDBNull(17) ? "Unknown" : reader.GetString(17))}. {(reader.IsDBNull(13) ? "" : "Storage: " + reader.GetString(13) + ".")}"
                        });
                    }
                }
            }

            return Ok(catches);
        }

        // GET: api/SeaTrue/catches/{id}
        [HttpGet("catches/{id}")]
        public async Task<ActionResult<CatchResponse>> GetCatch(int id)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        c.CatchID,
                        s.CommonName as Species,
                        c.WeightKG,
                        c.AverageSizeCM,
                        c.PricePerKG,
                        COALESCE(c.LandingPort, fp.City || ', ' || fp.State, fp.State, 'Unknown') as Location,
                        c.CatchDate,
                        u.FirstName || ' ' || u.LastName as FisherName,
                        u.Email as ContactEmail,
                        c.FishCondition as Status,
                        c.IsAIVerified,
                        c.IsAdminVerified,
                        c.IsAvailable,
                        c.StorageMethod,
                        c.AIConfidenceScore,
                        c.LandingPort,
                        s.ScientificName,
                        s.ConservationStatus,
                        cp.PhotoURL,
                        cp.ThumbnailURL
                    FROM CatchRecord c
                    INNER JOIN FisherProfile fp ON c.FisherID = fp.FisherID
                    INNER JOIN User u ON fp.UserID = u.UserID
                    INNER JOIN Species s ON c.SpeciesID = s.SpeciesID
                    LEFT JOIN CatchPhoto cp ON c.CatchID = cp.CatchID
                    WHERE c.CatchID = @id
                ", connection);

                command.Parameters.AddWithValue("@id", id);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        var weightLbs = reader.GetDouble(2) * 2.20462;
                        var lengthInches = reader.IsDBNull(3) ? 0 : reader.GetDouble(3) * 0.393701;
                        var pricePerLb = reader.IsDBNull(4) ? 0 : reader.GetDouble(4) / 2.20462;

                        var catchResponse = new CatchResponse
                        {
                            Id = reader.GetInt32(0),
                            Species = reader.GetString(1),
                            Weight = Math.Round(weightLbs, 2),
                            Length = Math.Round(lengthInches, 2),
                            Price = Math.Round(pricePerLb, 2),
                            Location = reader.IsDBNull(5) ? "Unknown" : reader.GetString(5),
                            CatchDate = reader.GetString(6),
                            FisherName = reader.GetString(7),
                            ContactEmail = reader.GetString(8),
                            Status = reader.IsDBNull(9) ? "fresh" : reader.GetString(9).ToLower(),
                            Verified = reader.GetBoolean(10) || reader.GetBoolean(11),
                            StorageMethod = reader.IsDBNull(13) ? "" : reader.GetString(13),
                            AIConfidenceScore = reader.IsDBNull(14) ? 0 : reader.GetDouble(14),
                            LandingPort = reader.IsDBNull(15) ? "" : reader.GetString(15),
                            ScientificName = reader.IsDBNull(16) ? "" : reader.GetString(16),
                            ConservationStatus = reader.IsDBNull(17) ? "" : reader.GetString(17),
                            ImageUrl = reader.IsDBNull(18) ? "" : reader.GetString(18),
                            ThumbnailUrl = reader.IsDBNull(19) ? "" : reader.GetString(19),
                            Description = $"{reader.GetString(1)} caught at {(reader.IsDBNull(15) ? "sea" : reader.GetString(15))}. Conservation Status: {(reader.IsDBNull(17) ? "Unknown" : reader.GetString(17))}. {(reader.IsDBNull(13) ? "" : "Storage: " + reader.GetString(13) + ".")}"
                        };

                        return Ok(catchResponse);
                    }
                }
            }

            return NotFound();
        }

        // GET: api/SeaTrue/species
        [HttpGet("species")]
        public async Task<ActionResult<IEnumerable<string>>> GetSpecies()
        {
            var species = new List<string>();

            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT DISTINCT s.CommonName
                    FROM Species s
                    INNER JOIN CatchRecord c ON s.SpeciesID = c.SpeciesID
                    WHERE c.IsAvailable = 1
                    ORDER BY s.CommonName
                ", connection);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        species.Add(reader.GetString(0));
                    }
                }
            }

            return Ok(species);
        }

        // GET: api/SeaTrue/species/all - Get all species with size data
        [HttpGet("species/all")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllSpecies()
        {
            var species = new List<object>();

            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT SpeciesID, CommonName, ScientificName, ConservationStatus, MinLength, MaxLength, AvgWeight
                    FROM Species
                    ORDER BY CommonName
                ", connection);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        species.Add(new
                        {
                            speciesId = reader.GetInt32(0),
                            commonName = reader.GetString(1),
                            scientificName = reader.IsDBNull(2) ? null : reader.GetString(2),
                            conservationStatus = reader.IsDBNull(3) ? "Not Assessed" : reader.GetString(3),
                            minLength = reader.IsDBNull(4) ? null : (double?)reader.GetDouble(4),
                            maxLength = reader.IsDBNull(5) ? null : (double?)reader.GetDouble(5),
                            avgWeight = reader.IsDBNull(6) ? null : (double?)reader.GetDouble(6)
                        });
                    }
                }
            }

            return Ok(species);
        }

        // POST: api/SeaTrue/species/add - Add new species from GBIF
        [HttpPost("species/add")]
        public async Task<IActionResult> AddSpecies([FromBody] AddSpeciesRequest request)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                // Check if species already exists
                var checkCmd = new SqliteCommand(@"
                    SELECT COUNT(*) FROM Species 
                    WHERE LOWER(CommonName) = LOWER(@commonName) OR LOWER(ScientificName) = LOWER(@scientificName)
                ", connection);
                checkCmd.Parameters.AddWithValue("@commonName", request.CommonName);
                checkCmd.Parameters.AddWithValue("@scientificName", request.ScientificName ?? (object)DBNull.Value);
                
                var exists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync()) > 0;
                
                if (exists)
                {
                    return Ok(new { message = "Species already exists in database" });
                }

                // Try to get IUCN status from backend (no CORS issues)
                string iucnStatus = "Not Assessed";
                if (!string.IsNullOrEmpty(request.ScientificName))
                {
                    iucnStatus = await GetIUCNStatusFromBackend(request.ScientificName);
                }

                // Insert new species
                var insertCmd = new SqliteCommand(@"
                    INSERT INTO Species (CommonName, ScientificName, ConservationStatus, IUCNRedListStatus, MinLength, MaxLength, AvgWeight)
                    VALUES (@commonName, @scientificName, @conservationStatus, @iucnStatus, @minLength, @maxLength, @avgWeight)
                ", connection);
                
                insertCmd.Parameters.AddWithValue("@commonName", request.CommonName);
                insertCmd.Parameters.AddWithValue("@scientificName", request.ScientificName ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("@conservationStatus", iucnStatus);
                insertCmd.Parameters.AddWithValue("@iucnStatus", iucnStatus);
                insertCmd.Parameters.AddWithValue("@minLength", request.MinLength ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("@maxLength", request.MaxLength ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("@avgWeight", request.AvgWeight ?? (object)DBNull.Value);
                
                await insertCmd.ExecuteNonQueryAsync();
                
                return Ok(new { message = "Species added successfully", conservationStatus = iucnStatus });
            }
        }

        private async Task<string> GetIUCNStatusFromBackend(string scientificName)
        {
            try
            {
                var nameParts = scientificName.Trim().Split(' ');
                if (nameParts.Length < 2) return "Not Assessed";

                var genusName = nameParts[0];
                var speciesName = nameParts[1];

                var response = await _httpClient.GetAsync($"{_iucnBaseUrl}/taxa/scientific_name?genus_name={genusName}&species_name={speciesName}");
                
                if (!response.IsSuccessStatusCode) return "Not Assessed";

                var content = await response.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<JsonElement>(content);

                if (data.ValueKind == JsonValueKind.Array && data.GetArrayLength() > 0)
                {
                    var firstResult = data[0];
                    if (firstResult.TryGetProperty("assessment_id", out var assessmentId))
                    {
                        var detailResponse = await _httpClient.GetAsync($"{_iucnBaseUrl}/assessment/{assessmentId.GetString()}");
                        if (detailResponse.IsSuccessStatusCode)
                        {
                            var detailContent = await detailResponse.Content.ReadAsStringAsync();
                            var detailData = JsonSerializer.Deserialize<JsonElement>(detailContent);
                            
                            if (detailData.TryGetProperty("red_list_category", out var category))
                            {
                                if (category.TryGetProperty("code", out var code))
                                {
                                    return code.GetString() ?? "Not Assessed";
                                }
                            }
                        }
                    }
                }

                return "Not Assessed";
            }
            catch
            {
                return "Not Assessed";
            }
        }

        // GET: api/SeaTrue/locations
        [HttpGet("locations")]
        public async Task<ActionResult<IEnumerable<string>>> GetLocations()
        {
            var locations = new List<string>();

            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT DISTINCT fp.State
                    FROM FisherProfile fp
                    INNER JOIN CatchRecord c ON fp.FisherID = c.FisherID
                    WHERE c.IsAvailable = 1 AND fp.State IS NOT NULL AND fp.State != ''
                    ORDER BY fp.State
                ", connection);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        locations.Add(reader.GetString(0));
                    }
                }
            }

            return Ok(locations);
        }

        // POST: api/SeaTrue/catches/{id}/claim
        [HttpPost("catches/{id}/claim")]
        public async Task<IActionResult> ClaimPurchase(int id, [FromBody] ClaimPurchaseRequest request)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "Please login as a buyer to claim purchases" });
            }

            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                // Get buyer ID from user session
                var buyerCmd = new SqliteCommand(@"
                    SELECT BuyerID FROM BuyerProfile WHERE UserID = @userId
                ", connection);
                buyerCmd.Parameters.AddWithValue("@userId", userId.Value);
                
                var buyerIdObj = await buyerCmd.ExecuteScalarAsync();
                if (buyerIdObj == null)
                {
                    return BadRequest(new { message = "User is not a buyer" });
                }

                int buyerId = Convert.ToInt32(buyerIdObj);

                // Start transaction
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Check if catch is still available
                        var checkCommand = new SqliteCommand(@"
                            SELECT IsAvailable, FisherID, WeightKG, PricePerKG, LandingPort
                            FROM CatchRecord
                            WHERE CatchID = @id
                        ", connection, transaction);
                        checkCommand.Parameters.AddWithValue("@id", id);

                        bool isAvailable;
                        int fisherID;
                        double weightKG;
                        double pricePerKG;
                        string? landingPort;

                        using (var reader = await checkCommand.ExecuteReaderAsync())
                        {
                            if (!await reader.ReadAsync())
                            {
                                return NotFound(new { message = "Catch not found" });
                            }

                            isAvailable = reader.GetBoolean(0);
                            fisherID = reader.GetInt32(1);
                            weightKG = reader.GetDouble(2);
                            pricePerKG = reader.IsDBNull(3) ? 0 : reader.GetDouble(3);
                            landingPort = reader.IsDBNull(4) ? null : reader.GetString(4);
                        }

                        if (!isAvailable)
                        {
                            return BadRequest(new { message = "This catch is no longer available" });
                        }

                        // Create order record
                        var orderCmd = new SqliteCommand(@"
                            INSERT INTO ""Order"" (
                                CatchID, BuyerID, FisherID, OrderDate, QuantityKG, PricePerKG,
                                OrderStatus, DeliveryAddress, ExpectedDeliveryDate
                            ) VALUES (
                                @catchId, @buyerId, @fisherId, CURRENT_TIMESTAMP, @quantityKg, @pricePerKg,
                                'Pending', @deliveryAddress, DATE('now', '+3 days')
                            );
                            SELECT last_insert_rowid();
                        ", connection, transaction);

                        orderCmd.Parameters.AddWithValue("@catchId", id);
                        orderCmd.Parameters.AddWithValue("@buyerId", buyerId);
                        orderCmd.Parameters.AddWithValue("@fisherId", fisherID);
                        orderCmd.Parameters.AddWithValue("@quantityKg", weightKG);
                        orderCmd.Parameters.AddWithValue("@pricePerKg", pricePerKG);
                        orderCmd.Parameters.AddWithValue("@deliveryAddress", landingPort ?? "To be determined");

                        var orderId = Convert.ToInt32(await orderCmd.ExecuteScalarAsync());

                        // Mark catch as unavailable
                        var updateCommand = new SqliteCommand(@"
                            UPDATE CatchRecord
                            SET IsAvailable = 0
                            WHERE CatchID = @id
                        ", connection, transaction);
                        updateCommand.Parameters.AddWithValue("@id", id);
                        await updateCommand.ExecuteNonQueryAsync();

                        transaction.Commit();

                        return Ok(new
                        {
                            message = "Purchase claimed successfully!",
                            orderId = orderId,
                            catchId = id,
                            quantityKg = Math.Round(weightKG, 2),
                            pricePerKg = Math.Round(pricePerKG, 2),
                            totalPrice = Math.Round(weightKG * pricePerKG, 2),
                            expectedDelivery = DateTime.Now.AddDays(3).ToString("yyyy-MM-dd")
                        });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { message = "Error processing claim", error = ex.Message });
                    }
                }
            }
        }

        // POST: api/SeaTrue/catches/{id}/contact
        [HttpPost("catches/{id}/contact")]
        public IActionResult ContactFisher(int id, [FromBody] ContactRequest request)
        {
            // In a real application, this would send an email or notification
            // For now, we'll just return success
            return Ok(new { message = "Contact request sent successfully" });
        }

        // GET: api/SeaTrue/stats
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetStats()
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                var command = new SqliteCommand(@"
                    SELECT 
                        COUNT(*) as TotalCatches,
                        SUM(CASE WHEN IsAIVerified = 1 OR IsAdminVerified = 1 THEN 1 ELSE 0 END) as VerifiedCatches,
                        COUNT(DISTINCT FisherID) as ActiveFishers,
                        SUM(WeightKG * PricePerKG) as TotalValue
                    FROM CatchRecord
                    WHERE IsAvailable = 1
                ", connection);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        var stats = new
                        {
                            TotalCatches = reader.GetInt32(0),
                            VerifiedCatches = reader.GetInt32(1),
                            ActiveFishers = reader.GetInt32(2),
                            TotalValue = reader.IsDBNull(3) ? 0 : Math.Round(reader.GetDouble(3), 2)
                        };

                        return Ok(stats);
                    }
                }
            }

            return Ok(new { TotalCatches = 0, VerifiedCatches = 0, ActiveFishers = 0, TotalValue = 0 });
        }

        // POST: api/SeaTrue/catches/submit
        [HttpPost("catches/submit")]
        public async Task<IActionResult> SubmitCatch([FromBody] SubmitCatchRequest request)
        {
            // Get fisher ID from session
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                // Get fisher profile
                var fisherCmd = new SqliteCommand(@"
                    SELECT FisherID FROM FisherProfile WHERE UserID = @userId
                ", connection);
                fisherCmd.Parameters.AddWithValue("@userId", userId.Value);
                
                var fisherIdObj = await fisherCmd.ExecuteScalarAsync();
                if (fisherIdObj == null)
                {
                    return BadRequest(new { message = "User is not a fisher" });
                }

                int fisherId = Convert.ToInt32(fisherIdObj);

                // Get species ID
                var speciesCmd = new SqliteCommand(@"
                    SELECT SpeciesID FROM Species WHERE CommonName = @speciesName
                ", connection);
                speciesCmd.Parameters.AddWithValue("@speciesName", request.Species);
                
                var speciesIdObj = await speciesCmd.ExecuteScalarAsync();
                if (speciesIdObj == null)
                {
                    return BadRequest(new { message = "Invalid species" });
                }

                int speciesId = Convert.ToInt32(speciesIdObj);

                // Calculate AI confidence score (simplified)
                double aiConfidence = CalculateAIConfidence(request);

                // Generate QR code
                string qrCode = $"ST-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Insert catch record
                        var insertCmd = new SqliteCommand(@"
                            INSERT INTO CatchRecord (
                                FisherID, SpeciesID, CatchDate, CatchTime, CatchLatitude, CatchLongitude,
                                WeightKG, AverageSizeCM, Quantity, FishCondition, StorageMethod,
                                AIConfidenceScore, IsAvailable, PricePerKG, LandingPort, QRCode,
                                DepthMeters, CreatedAt
                            ) VALUES (
                                @fisherId, @speciesId, @catchDate, @catchTime, @latitude, @longitude,
                                @weight, @length, @quantity, @condition, @storageMethod,
                                @aiConfidence, 1, @pricePerKg, @landingPort, @qrCode,
                                @depth, CURRENT_TIMESTAMP
                            );
                            SELECT last_insert_rowid();
                        ", connection, transaction);

                        // Convert lbs to kg (1 lb = 0.453592 kg)
                        double weightKg = request.Weight * 0.453592;
                        // Convert inches to cm (1 inch = 2.54 cm)
                        double lengthCm = request.Length * 2.54;

                        insertCmd.Parameters.AddWithValue("@fisherId", fisherId);
                        insertCmd.Parameters.AddWithValue("@speciesId", speciesId);
                        insertCmd.Parameters.AddWithValue("@catchDate", request.CatchDate);
                        insertCmd.Parameters.AddWithValue("@catchTime", request.CatchTime ?? (object)DBNull.Value);
                        insertCmd.Parameters.AddWithValue("@latitude", request.Latitude);
                        insertCmd.Parameters.AddWithValue("@longitude", request.Longitude);
                        insertCmd.Parameters.AddWithValue("@weight", weightKg);
                        insertCmd.Parameters.AddWithValue("@length", lengthCm);
                        insertCmd.Parameters.AddWithValue("@quantity", request.Quantity ?? 1);
                        insertCmd.Parameters.AddWithValue("@condition", request.Condition ?? "Fresh");
                        insertCmd.Parameters.AddWithValue("@storageMethod", request.StorageMethod ?? "Ice");
                        insertCmd.Parameters.AddWithValue("@aiConfidence", aiConfidence);
                        insertCmd.Parameters.AddWithValue("@pricePerKg", request.PricePerKg ?? (object)DBNull.Value);
                        insertCmd.Parameters.AddWithValue("@landingPort", request.LandingPort ?? (object)DBNull.Value);
                        insertCmd.Parameters.AddWithValue("@qrCode", qrCode);
                        insertCmd.Parameters.AddWithValue("@depth", request.WaterDepth ?? (object)DBNull.Value);

                        var catchId = Convert.ToInt32(await insertCmd.ExecuteScalarAsync());

                        // Handle photo if provided (base64 encoded)
                        if (!string.IsNullOrEmpty(request.PhotoBase64))
                        {
                            var photoCmd = new SqliteCommand(@"
                                INSERT INTO CatchPhoto (CatchID, PhotoURL, UploadedAt)
                                VALUES (@catchId, @photoUrl, CURRENT_TIMESTAMP)
                            ", connection, transaction);

                            // Store base64 directly for now (in production, use blob storage)
                            // Base64 data URLs can be used directly in <img> tags
                            photoCmd.Parameters.AddWithValue("@catchId", catchId);
                            photoCmd.Parameters.AddWithValue("@photoUrl", request.PhotoBase64);
                            await photoCmd.ExecuteNonQueryAsync();
                        }

                        transaction.Commit();

                        return Ok(new
                        {
                            message = "Catch submitted successfully",
                            catchId = catchId,
                            qrCode = qrCode,
                            aiConfidence = Math.Round(aiConfidence, 2),
                            isVerified = aiConfidence >= 90.0,
                            isAvailable = true
                        });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { message = "Error submitting catch", error = ex.Message });
                    }
                }
            }
        }

        private double CalculateAIConfidence(SubmitCatchRequest request)
        {
            double score = 75.0; // Base score

            // Add points for complete data
            if (request.Length > 0) score += 5;
            if (request.Weight > 0) score += 5;
            if (!string.IsNullOrEmpty(request.PhotoBase64)) score += 10;
            if (!string.IsNullOrEmpty(request.FishingMethod)) score += 3;
            if (request.WaterDepth.HasValue) score += 2;

            // Validate coordinates
            if (request.Latitude >= -90 && request.Latitude <= 90 && 
                request.Longitude >= -180 && request.Longitude <= 180)
            {
                score += 5;
            }

            return Math.Min(100, score);
        }
    }

    // Data models
    public class CatchResponse
    {
        public int Id { get; set; }
        public string Species { get; set; } = string.Empty;
        public double Weight { get; set; }
        public double Length { get; set; }
        public double Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public string CatchDate { get; set; } = string.Empty;
        public string FisherName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "fresh";
        public bool Verified { get; set; }
        public string StorageMethod { get; set; } = string.Empty;
        public double AIConfidenceScore { get; set; }
        public string LandingPort { get; set; } = string.Empty;
        public string ScientificName { get; set; } = string.Empty;
        public string ConservationStatus { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
    }

    public class ClaimPurchaseRequest
    {
        public string BuyerEmail { get; set; } = string.Empty;
        public string BuyerName { get; set; } = string.Empty;
    }

    public class ContactRequest
    {
        public string Message { get; set; } = string.Empty;
    }

    public class SubmitCatchRequest
    {
        public string Species { get; set; } = string.Empty;
        public double Weight { get; set; } // in lbs
        public double Length { get; set; } // in inches
        public string CatchDate { get; set; } = string.Empty;
        public string? CatchTime { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? FishingMethod { get; set; }
        public double? WaterDepth { get; set; }
        public string? Condition { get; set; }
        public string? StorageMethod { get; set; }
        public int? Quantity { get; set; }
        public double? PricePerKg { get; set; }
        public string? LandingPort { get; set; }
        public string? PhotoBase64 { get; set; }
    }

    public class AddSpeciesRequest
    {
        public string CommonName { get; set; } = string.Empty;
        public string? ScientificName { get; set; }
        public string? ConservationStatus { get; set; }
        public double? MinLength { get; set; } // in inches
        public double? MaxLength { get; set; } // in inches
        public double? AvgWeight { get; set; } // in lbs
    }
}
