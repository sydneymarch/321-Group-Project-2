using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpeciesController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly string _iucnApiKey = "BjYSL4qAQ7NSjGijL24Ghqo7pGunsKQQX7zY";
        private readonly string _iucnBaseUrl = "https://api.iucnredlist.org/api/v4";

        public SpeciesController(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("Authorization", _iucnApiKey);
        }

        [HttpGet("common-to-scientific/{commonName}")]
        public async Task<IActionResult> ConvertCommonToScientific(string commonName)
        {
            try
            {
                // Use GBIF API to search for species by common name
                var gbifUrl = $"https://api.gbif.org/v1/species/search?q={Uri.EscapeDataString(commonName)}&limit=50";
                
                var response = await _httpClient.GetAsync(gbifUrl);
                
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode(500, new { 
                        message = "Error querying GBIF API",
                        error = $"HTTP {response.StatusCode}: {response.ReasonPhrase}",
                        commonName = commonName
                    });
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var gbifData = JsonSerializer.Deserialize<JsonElement>(jsonContent);

                // Check if we have results
                if (!gbifData.TryGetProperty("results", out var results) || results.GetArrayLength() == 0)
                {
                    return NotFound(new { 
                        message = $"Common name '{commonName}' not found in GBIF database. Please try a different name or use the scientific name directly.",
                        commonName = commonName,
                        suggestion = "Try: Atlantic Cod, Yellowfin Tuna, Red Snapper, Mahi-Mahi, Salmon, etc."
                    });
                }

                // Look for the best match - prefer species level results
                foreach (var result in results.EnumerateArray())
                {
                    // Check if this is a species-level result with a canonical name
                    if (result.TryGetProperty("rank", out var resultRank) && 
                        resultRank.GetString() == "SPECIES" &&
                        result.TryGetProperty("taxonomicStatus", out var status) &&
                        status.GetString() == "ACCEPTED" &&
                        result.TryGetProperty("canonicalName", out var canonicalName) &&
                        !string.IsNullOrEmpty(canonicalName.GetString()))
                    {
                        var scientificName = canonicalName.GetString();
                        var fullScientificName = result.GetProperty("scientificName").GetString();
                        
                        return Ok(new
                        {
                            CommonName = commonName,
                            ScientificName = scientificName,
                            FullScientificName = fullScientificName,
                            Source = "GBIF API",
                            Message = "Successfully converted common name to scientific name using GBIF",
                            GbifKey = result.TryGetProperty("key", out var resultKey) ? resultKey.GetInt32() : (int?)null
                        });
                    }
                }

                // If no species-level result found, return the first result with a canonical name
                foreach (var result in results.EnumerateArray())
                {
                    if (result.TryGetProperty("canonicalName", out var canonicalName) && 
                        !string.IsNullOrEmpty(canonicalName.GetString()))
                    {
                        var firstScientificName = canonicalName.GetString();
                        var firstFullScientificName = result.GetProperty("scientificName").GetString();
                        
                        return Ok(new
                        {
                            CommonName = commonName,
                            ScientificName = firstScientificName,
                            FullScientificName = firstFullScientificName,
                            Source = "GBIF API",
                            Message = "Found match in GBIF (may not be species-level)",
                            GbifKey = result.TryGetProperty("key", out var firstKey) ? firstKey.GetInt32() : (int?)null,
                            Rank = result.TryGetProperty("rank", out var firstRank) ? firstRank.GetString() : "Unknown"
                        });
                    }
                }

                // If no results with canonical names found
                return NotFound(new { 
                    message = $"No valid scientific names found for '{commonName}' in GBIF database.",
                    commonName = commonName,
                    suggestion = "Try: Atlantic Cod, Yellowfin Tuna, Red Snapper, Mahi-Mahi, Salmon, etc."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error converting common name to scientific name",
                    error = ex.Message,
                    commonName = commonName
                });
            }
        }

        [HttpGet("full-lookup/{commonName}")]
        public async Task<IActionResult> FullLookupFromCommonName(string commonName)
        {
            try
            {
                // Step 1: Convert common name to scientific name using internal lookup
                var commonToScientificResult = await ConvertCommonToScientific(commonName);
                
                if (commonToScientificResult is not OkObjectResult okResult)
                {
                    return commonToScientificResult;
                }

                var conversionData = okResult.Value;
                var jsonElement = JsonSerializer.SerializeToElement(conversionData);
                var scientificName = jsonElement.GetProperty("ScientificName").GetString();

                // Step 2: Get IUCN conservation data using scientific name
                var iucnResult = await LookupSpecies(scientificName);
                
                if (iucnResult is OkObjectResult iucnOkResult)
                {
                    var iucnData = iucnOkResult.Value;
                    var iucnJsonElement = JsonSerializer.SerializeToElement(iucnData);
                    
                    // Combine both results
                    var combinedResult = new
                    {
                        CommonName = commonName,
                        ScientificName = scientificName,
                        FishBaseSource = "GBIF API",
                        IUCNData = iucnJsonElement,
                        Message = "Successfully retrieved conservation data from common name"
                    };

                    return Ok(combinedResult);
                }
                else
                {
                    // Return the internal lookup conversion even if IUCN lookup fails
                    return Ok(new
                    {
                        CommonName = commonName,
                        ScientificName = scientificName,
                        FishBaseSource = "GBIF API",
                        IUCNData = (object)null,
                        Message = "Successfully converted to scientific name, but IUCN data not available"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error in full lookup process",
                    error = ex.Message,
                    commonName = commonName
                });
            }
        }

        [HttpGet("lookup/{scientificName}")]
        public async Task<IActionResult> LookupSpecies(string scientificName)
        {
            try
            {
                // Parse scientific name into genus and species
                var nameParts = scientificName.Trim().Split(' ');
                if (nameParts.Length < 2)
                {
                    return BadRequest(new { 
                        message = "Scientific name must include both genus and species (e.g., 'Gadus morhua')",
                        scientificName = scientificName
                    });
                }

                var genusName = nameParts[0];
                var speciesName = nameParts[1];

                // Step 1: Get assessment ID from IUCN API v4 using correct format
                var taxaResponse = await _httpClient.GetAsync($"{_iucnBaseUrl}/taxa/scientific_name?genus_name={genusName}&species_name={speciesName}");
                
                if (!taxaResponse.IsSuccessStatusCode)
                {
                    return NotFound(new { 
                        message = $"Species '{scientificName}' not found in IUCN database", 
                        statusCode = taxaResponse.StatusCode.ToString(),
                        scientificName = scientificName,
                        genusName = genusName,
                        speciesName = speciesName
                    });
                }

                var taxaContent = await taxaResponse.Content.ReadAsStringAsync();
                JsonElement taxaData;
                try
                {
                    taxaData = JsonSerializer.Deserialize<JsonElement>(taxaContent);
                }
                catch (JsonException ex)
                {
                    return BadRequest(new { 
                        message = "Error parsing IUCN API response",
                        error = ex.Message,
                        scientificName = scientificName,
                        responseContent = taxaContent
                    });
                }

                // The IUCN API returns a single object with assessments array
                if (taxaData.ValueKind != JsonValueKind.Object)
                {
                    return BadRequest(new { 
                        message = "Unexpected response format from IUCN API",
                        scientificName = scientificName,
                        responseType = taxaData.ValueKind.ToString()
                    });
                }

                // Extract assessment ID from the assessments array
                if (!taxaData.TryGetProperty("assessments", out var assessmentsElement) || 
                    assessmentsElement.ValueKind != JsonValueKind.Array || 
                    assessmentsElement.GetArrayLength() == 0)
                {
                    return BadRequest(new { 
                        message = "No assessments found in IUCN response",
                        scientificName = scientificName
                    });
                }

                // Get the latest assessment (first in array)
                var latestAssessment = assessmentsElement[0];
                if (!latestAssessment.TryGetProperty("assessment_id", out var assessmentIdElement))
                {
                    return BadRequest(new { 
                        message = "Assessment ID not found in IUCN response",
                        scientificName = scientificName
                    });
                }

                var assessmentId = assessmentIdElement.GetInt32();

                // Step 2: Get detailed assessment data using assessment ID
                var assessmentResponse = await _httpClient.GetAsync($"{_iucnBaseUrl}/assessment/{assessmentId}");
                
                if (!assessmentResponse.IsSuccessStatusCode)
                {
                    return NotFound(new { 
                        message = $"Assessment data not found for ID: {assessmentId}",
                        assessmentId = assessmentId,
                        statusCode = assessmentResponse.StatusCode.ToString(),
                        scientificName = scientificName
                    });
                }

                var assessmentContent = await assessmentResponse.Content.ReadAsStringAsync();
                var assessmentData = JsonSerializer.Deserialize<JsonElement>(assessmentContent);

                // Extract conservation status from red_list_category
                var redListCategory = assessmentData.TryGetProperty("red_list_category", out var categoryElement) ? categoryElement : default;
                var conservationStatus = "Unknown";
                var categoryCode = "Unknown";
                
                if (redListCategory.ValueKind == JsonValueKind.Object)
                {
                    if (redListCategory.TryGetProperty("description", out var desc) && 
                        desc.ValueKind == JsonValueKind.Object &&
                        desc.TryGetProperty("en", out var descEn))
                    {
                        conservationStatus = descEn.GetString() ?? "Unknown";
                    }
                    
                    if (redListCategory.TryGetProperty("code", out var code))
                    {
                        categoryCode = code.GetString() ?? "Unknown";
                    }
                }

                // Extract other fields
                var populationTrend = assessmentData.TryGetProperty("population_trend", out var trend) && trend.ValueKind == JsonValueKind.String ? trend.GetString() : "Unknown";
                var yearAssessed = assessmentData.TryGetProperty("year_published", out var year) && year.ValueKind == JsonValueKind.String ? year.GetString() : null;
                var assessmentDate = assessmentData.TryGetProperty("assessment_date", out var date) && date.ValueKind == JsonValueKind.String ? date.GetString() : null;

                // Extract documentation fields
                var documentation = assessmentData.TryGetProperty("documentation", out var docElement) ? docElement : default;
                var rationale = "Unknown";
                var geographicRange = "Unknown";
                var population = "Unknown";
                var threats = "Unknown";
                var conservationActions = "Unknown";

                if (documentation.ValueKind == JsonValueKind.Object)
                {
                    rationale = documentation.TryGetProperty("rationale", out var rat) && rat.ValueKind == JsonValueKind.String ? rat.GetString() : "Unknown";
                    geographicRange = documentation.TryGetProperty("range", out var range) && range.ValueKind == JsonValueKind.String ? range.GetString() : "Unknown";
                    population = documentation.TryGetProperty("population", out var pop) && pop.ValueKind == JsonValueKind.String ? pop.GetString() : "Unknown";
                    threats = documentation.TryGetProperty("threats", out var thr) && thr.ValueKind == JsonValueKind.String ? thr.GetString() : "Unknown";
                    conservationActions = documentation.TryGetProperty("measures", out var measures) && measures.ValueKind == JsonValueKind.String ? measures.GetString() : "Unknown";
                }

                var citation = assessmentData.TryGetProperty("citation", out var cit) && cit.ValueKind == JsonValueKind.String ? cit.GetString() : null;

                var result = new
                {
                    ScientificName = scientificName,
                    AssessmentId = assessmentId,
                    ConservationStatus = conservationStatus,
                    CategoryCode = categoryCode,
                    PopulationTrend = populationTrend,
                    YearAssessed = yearAssessed,
                    AssessmentDate = assessmentDate,
                    Rationale = rationale,
                    GeographicRange = geographicRange,
                    Population = population,
                    Threats = threats,
                    ConservationActions = conservationActions,
                    Citation = citation,
                    Source = "IUCN Red List API v4"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error querying IUCN API",
                    error = ex.Message,
                    scientificName = scientificName
                });
            }
        }


        [HttpPost("update-database/{speciesId}")]
        public async Task<IActionResult> UpdateSpeciesInDatabase(int speciesId, [FromBody] string scientificName)
        {
            try
            {
                // Get IUCN data
                var iucnResult = await LookupSpecies(scientificName);
                if (iucnResult is not OkObjectResult okResult)
                {
                    return iucnResult;
                }

                var iucnData = okResult.Value;
                var jsonElement = JsonSerializer.SerializeToElement(iucnData);

                // Update database with IUCN data
                // Note: You'll need to implement the database update logic here
                // This is a placeholder for the database update
                var updateResult = new
                {
                    SpeciesId = speciesId,
                    ScientificName = scientificName,
                    UpdatedConservationStatus = jsonElement.GetProperty("ConservationStatus").GetString(),
                    UpdatedAt = DateTime.UtcNow,
                    IUCNData = iucnData,
                    Message = "Database update would be implemented here with actual SQLite connection"
                };

                return Ok(updateResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating species in database: {ex.Message}");
            }
        }

        [HttpGet("test-api")]
        public async Task<IActionResult> TestIUCNAPI()
        {
            try
            {
                // Test the IUCN API with a known species
                var testSpecies = "Thunnus albacares";
                var result = await LookupSpecies(testSpecies);
                
                return Ok(new
                {
                    Message = "IUCN API Test",
                    TestSpecies = testSpecies,
                    Result = result,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error testing IUCN API: {ex.Message}");
            }
        }

        [HttpPost("update-species-in-database")]
        public async Task<IActionResult> UpdateSpeciesInDatabase([FromBody] string commonName)
        {
            try
            {
                // Step 1: Get scientific name from GBIF
                var gbifResult = await ConvertCommonToScientific(commonName);
                if (gbifResult is not OkObjectResult gbifOkResult)
                {
                    return gbifResult;
                }

                var gbifData = gbifOkResult.Value;
                var gbifJsonElement = JsonSerializer.SerializeToElement(gbifData);
                var scientificName = gbifJsonElement.GetProperty("ScientificName").GetString();

                // Step 2: Get IUCN conservation data
                var iucnResult = await LookupSpecies(scientificName);
                if (iucnResult is not OkObjectResult iucnOkResult)
                {
                    return StatusCode(500, new { 
                        message = "Could not get IUCN data for species update",
                        commonName = commonName,
                        scientificName = scientificName
                    });
                }

                var iucnData = iucnOkResult.Value;
                var iucnJsonElement = JsonSerializer.SerializeToElement(iucnData);

                // Step 3: Update database with real data
                var connectionString = "Data Source=database.db";
                using var connection = new Microsoft.Data.Sqlite.SqliteConnection(connectionString);
                await connection.OpenAsync();

                // Check if species already exists
                var checkCommand = new Microsoft.Data.Sqlite.SqliteCommand(
                    "SELECT SpeciesID FROM Species WHERE CommonName = @commonName OR ScientificName = @scientificName", 
                    connection);
                checkCommand.Parameters.AddWithValue("@commonName", commonName);
                checkCommand.Parameters.AddWithValue("@scientificName", scientificName);
                
                var existingId = await checkCommand.ExecuteScalarAsync();

                if (existingId != null)
                {
                    // Update existing species
                    var updateCommand = new Microsoft.Data.Sqlite.SqliteCommand(@"
                        UPDATE Species SET 
                            CommonName = @commonName,
                            ScientificName = @scientificName,
                            ConservationStatus = @conservationStatus,
                            IUCNRedListStatus = @iucnStatus
                        WHERE SpeciesID = @speciesId", connection);
                    
                    updateCommand.Parameters.AddWithValue("@commonName", commonName);
                    updateCommand.Parameters.AddWithValue("@scientificName", scientificName);
                    updateCommand.Parameters.AddWithValue("@conservationStatus", iucnJsonElement.GetProperty("ConservationStatus").GetString());
                    updateCommand.Parameters.AddWithValue("@iucnStatus", iucnJsonElement.GetProperty("CategoryCode").GetString());
                    updateCommand.Parameters.AddWithValue("@speciesId", existingId);
                    
                    await updateCommand.ExecuteNonQueryAsync();
                    
                    return Ok(new
                    {
                        message = "Species updated successfully in database",
                        commonName = commonName,
                        scientificName = scientificName,
                        conservationStatus = iucnJsonElement.GetProperty("ConservationStatus").GetString(),
                        action = "Updated"
                    });
                }
                else
                {
                    // Insert new species
                    var insertCommand = new Microsoft.Data.Sqlite.SqliteCommand(@"
                        INSERT INTO Species (CommonName, ScientificName, ConservationStatus, IUCNRedListStatus, CreatedAt)
                        VALUES (@commonName, @scientificName, @conservationStatus, @iucnStatus, CURRENT_TIMESTAMP)", connection);
                    
                    insertCommand.Parameters.AddWithValue("@commonName", commonName);
                    insertCommand.Parameters.AddWithValue("@scientificName", scientificName);
                    insertCommand.Parameters.AddWithValue("@conservationStatus", iucnJsonElement.GetProperty("ConservationStatus").GetString());
                    insertCommand.Parameters.AddWithValue("@iucnStatus", iucnJsonElement.GetProperty("CategoryCode").GetString());
                    
                    await insertCommand.ExecuteNonQueryAsync();
                    
                    return Ok(new
                    {
                        message = "Species added successfully to database",
                        commonName = commonName,
                        scientificName = scientificName,
                        conservationStatus = iucnJsonElement.GetProperty("ConservationStatus").GetString(),
                        action = "Inserted"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error updating species in database",
                    error = ex.Message,
                    commonName = commonName
                });
            }
        }

        [HttpPost("batch-update-species")]
        public async Task<IActionResult> BatchUpdateSpecies([FromBody] string[] commonNames)
        {
            try
            {
                var results = new List<object>();
                
                foreach (var commonName in commonNames)
                {
                    try
                    {
                        var result = await UpdateSpeciesInDatabase(commonName);
                        if (result is OkObjectResult okResult)
                        {
                            results.Add(okResult.Value);
                        }
                        else
                        {
                            results.Add(new { 
                                commonName = commonName, 
                                error = "Failed to update",
                                details = result
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        results.Add(new { 
                            commonName = commonName, 
                            error = ex.Message
                        });
                    }
                }
                
                return Ok(new
                {
                    message = $"Batch update completed for {commonNames.Length} species",
                    results = results,
                    totalProcessed = commonNames.Length,
                    successful = results.Count(r => r.GetType().GetProperty("error") == null)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error in batch update",
                    error = ex.Message
                });
            }
        }

        [HttpGet("batch-update")]
        public async Task<IActionResult> BatchUpdateAllSpecies()
        {
            try
            {
                // Get all species from database
                var connectionString = "Data Source=database.db";
                using var connection = new SqliteConnection(connectionString);
                await connection.OpenAsync();

                var selectCommand = new SqliteCommand("SELECT CommonName FROM Species", connection);
                using var reader = await selectCommand.ExecuteReaderAsync();
                
                var commonNames = new List<string>();
                while (await reader.ReadAsync())
                {
                    commonNames.Add(reader.GetString(0)); // CommonName is first column
                }

                // Update each species with real API data
                var results = new List<object>();
                foreach (var commonName in commonNames)
                {
                    try
                    {
                        var result = await UpdateSpeciesInDatabase(commonName);
                        if (result is OkObjectResult okResult)
                        {
                            results.Add(okResult.Value);
                        }
                        else
                        {
                            results.Add(new { 
                                commonName = commonName, 
                                error = "Failed to update",
                                details = result
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        results.Add(new { 
                            commonName = commonName, 
                            error = ex.Message
                        });
                    }
                }

                return Ok(new
                {
                    message = $"Batch update completed for {commonNames.Count} species",
                    results = results,
                    totalProcessed = commonNames.Count,
                    successful = results.Count(r => r.GetType().GetProperty("error") == null)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error in batch update",
                    error = ex.Message
                });
            }
        }

        [HttpGet("get-all-species")]
        public async Task<IActionResult> GetAllSpecies()
        {
            try
            {
                var connectionString = "Data Source=database.db";
                using var connection = new SqliteConnection(connectionString);
                await connection.OpenAsync();

                var selectCommand = new SqliteCommand(@"
                    SELECT SpeciesID, CommonName, ScientificName, ConservationStatus, IUCNRedListStatus, CreatedAt
                    FROM Species 
                    ORDER BY CommonName", connection);
                
                using var reader = await selectCommand.ExecuteReaderAsync();
                var species = new List<object>();
                
                while (await reader.ReadAsync())
                {
                    species.Add(new
                    {
                        SpeciesID = reader.GetInt32(0), // SpeciesID
                        CommonName = reader.GetString(1), // CommonName
                        ScientificName = reader.GetString(2), // ScientificName
                        ConservationStatus = reader.IsDBNull(3) ? null : reader.GetString(3), // ConservationStatus
                        IUCNRedListStatus = reader.IsDBNull(4) ? null : reader.GetString(4), // IUCNRedListStatus
                        CreatedAt = reader.IsDBNull(5) ? null : reader.GetString(5) // CreatedAt
                    });
                }

                return Ok(new
                {
                    message = $"Found {species.Count} species in database",
                    species = species,
                    totalCount = species.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error retrieving species from database",
                    error = ex.Message
                });
            }
        }
    }
}
