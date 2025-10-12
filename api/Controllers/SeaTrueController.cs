using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeaTrueController : ControllerBase
    {
        private readonly string _connectionString = "Data Source=database.db";

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
                        fp.State as Location,
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
                        fp.State as Location,
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
            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();

                // Start transaction
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Check if catch is still available
                        var checkCommand = new SqliteCommand(@"
                            SELECT IsAvailable, FisherID, WeightKG, PricePerKG
                            FROM CatchRecord
                            WHERE CatchID = @id
                        ", connection, transaction);
                        checkCommand.Parameters.AddWithValue("@id", id);

                        bool isAvailable;
                        int fisherID;
                        double weightKG;
                        double pricePerKG;

                        using (var reader = await checkCommand.ExecuteReaderAsync())
                        {
                            if (!await reader.ReadAsync())
                            {
                                return NotFound(new { message = "Catch not found" });
                            }

                            isAvailable = reader.GetBoolean(0);
                            fisherID = reader.GetInt32(1);
                            weightKG = reader.GetDouble(2);
                            pricePerKG = reader.GetDouble(3);
                        }

                        if (!isAvailable)
                        {
                            return BadRequest(new { message = "This catch is no longer available" });
                        }

                        // Mark catch as unavailable
                        var updateCommand = new SqliteCommand(@"
                            UPDATE CatchRecord
                            SET IsAvailable = 0
                            WHERE CatchID = @id
                        ", connection, transaction);
                        updateCommand.Parameters.AddWithValue("@id", id);
                        await updateCommand.ExecuteNonQueryAsync();

                        // Create order record (requires buyer ID - for now we'll skip this part)
                        // In a real app, you would get the buyer ID from authentication

                        transaction.Commit();

                        return Ok(new
                        {
                            message = "Purchase claimed successfully!",
                            catchId = id,
                            totalPrice = Math.Round(weightKG * pricePerKG, 2)
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
}
