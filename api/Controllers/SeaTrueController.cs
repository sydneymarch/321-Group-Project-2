using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace MyApp.Namespace
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeaTrueController : ControllerBase
    {
        // In-memory storage for demonstration (replace with database in production)
        private static List<Catch> _catches = new List<Catch>
        {
            new Catch
            {
                Id = 1,
                Species = "Salmon",
                Weight = 12.5,
                Length = 28,
                Price = 8.50,
                Location = "Alaska",
                CatchDate = "2024-01-15",
                FisherName = "John Smith",
                ContactEmail = "john@example.com",
                Description = "Fresh Atlantic salmon caught in pristine Alaskan waters. Sustainably fished using traditional methods.",
                Status = "fresh",
                Verified = true
            },
            new Catch
            {
                Id = 2,
                Species = "Tuna",
                Weight = 45.2,
                Length = 36,
                Price = 12.00,
                Location = "California",
                CatchDate = "2024-01-14",
                FisherName = "Maria Garcia",
                ContactEmail = "maria@example.com",
                Description = "Premium yellowfin tuna, caught fresh this morning. Perfect for sushi or sashimi.",
                Status = "fresh",
                Verified = true
            },
            new Catch
            {
                Id = 3,
                Species = "Cod",
                Weight = 8.7,
                Length = 24,
                Price = 6.75,
                Location = "Maine",
                CatchDate = "2024-01-13",
                FisherName = "Bob Wilson",
                ContactEmail = "bob@example.com",
                Description = "Atlantic cod caught using sustainable fishing practices. Great for fish and chips or baking.",
                Status = "frozen",
                Verified = false
            },
            new Catch
            {
                Id = 4,
                Species = "Halibut",
                Weight = 22.3,
                Length = 32,
                Price = 15.25,
                Location = "Alaska",
                CatchDate = "2024-01-12",
                FisherName = "Sarah Johnson",
                ContactEmail = "sarah@example.com",
                Description = "Large Pacific halibut, perfect for restaurants. Caught using longline fishing method.",
                Status = "fresh",
                Verified = true
            },
            new Catch
            {
                Id = 5,
                Species = "Snapper",
                Weight = 6.8,
                Length = 20,
                Price = 9.50,
                Location = "Florida",
                CatchDate = "2024-01-11",
                FisherName = "Carlos Rodriguez",
                ContactEmail = "carlos@example.com",
                Description = "Red snapper caught in the Gulf of Mexico. Fresh and ready for cooking.",
                Status = "fresh",
                Verified = true
            },
            new Catch
            {
                Id = 6,
                Species = "Salmon",
                Weight = 15.2,
                Length = 30,
                Price = 9.25,
                Location = "Washington",
                CatchDate = "2024-01-10",
                FisherName = "Mike Chen",
                ContactEmail = "mike@example.com",
                Description = "Pacific salmon from Washington waters. Fresh catch from this morning.",
                Status = "fresh",
                Verified = true
            },
            new Catch
            {
                Id = 7,
                Species = "Lobster",
                Weight = 2.1,
                Length = 12,
                Price = 18.50,
                Location = "Maine",
                CatchDate = "2024-01-09",
                FisherName = "Lisa Anderson",
                ContactEmail = "lisa@example.com",
                Description = "Fresh Maine lobster, perfect for restaurants. Caught this morning.",
                Status = "fresh",
                Verified = true
            },
            new Catch
            {
                Id = 8,
                Species = "Crab",
                Weight = 3.5,
                Length = 8,
                Price = 14.75,
                Location = "Oregon",
                CatchDate = "2024-01-08",
                FisherName = "David Kim",
                ContactEmail = "david@example.com",
                Description = "Dungeness crab from Oregon coast. Fresh and ready for cooking.",
                Status = "fresh",
                Verified = false
            },
            new Catch
            {
                Id = 9,
                Species = "Tuna",
                Weight = 38.7,
                Length = 34,
                Price = 11.50,
                Location = "Hawaii",
                CatchDate = "2024-01-07",
                FisherName = "Keoni Nakamura",
                ContactEmail = "keoni@example.com",
                Description = "Bigeye tuna from Hawaiian waters. Premium quality for sushi.",
                Status = "fresh",
                Verified = true
            },
            new Catch
            {
                Id = 10,
                Species = "Shrimp",
                Weight = 1.2,
                Length = 6,
                Price = 22.00,
                Location = "Louisiana",
                CatchDate = "2024-01-06",
                FisherName = "Pierre LeBlanc",
                ContactEmail = "pierre@example.com",
                Description = "Fresh Gulf shrimp from Louisiana. Perfect for seafood dishes.",
                Status = "fresh",
                Verified = true
            }
        };

        // GET: api/SeaTrue/catches
        [HttpGet("catches")]
        public ActionResult<IEnumerable<Catch>> GetCatches()
        {
            return Ok(_catches.OrderByDescending(c => c.CatchDate));
        }

        // GET: api/SeaTrue/catches/{id}
        [HttpGet("catches/{id}")]
        public ActionResult<Catch> GetCatch(int id)
        {
            var catchItem = _catches.FirstOrDefault(c => c.Id == id);
            if (catchItem == null)
            {
                return NotFound();
            }
            return Ok(catchItem);
        }

        // POST: api/SeaTrue/catches
        [HttpPost("catches")]
        public ActionResult<Catch> CreateCatch([FromBody] CreateCatchRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var newCatch = new Catch
            {
                Id = _catches.Count > 0 ? _catches.Max(c => c.Id) + 1 : 1,
                Species = request.Species,
                Weight = request.Weight,
                Length = request.Length,
                Price = request.Price,
                Location = request.Location,
                CatchDate = request.CatchDate,
                FisherName = request.FisherName,
                ContactEmail = request.ContactEmail,
                Description = request.Description,
                Status = "fresh",
                Verified = false
            };

            _catches.Add(newCatch);
            return CreatedAtAction(nameof(GetCatch), new { id = newCatch.Id }, newCatch);
        }

        // PUT: api/SeaTrue/catches/{id}
        [HttpPut("catches/{id}")]
        public IActionResult UpdateCatch(int id, [FromBody] UpdateCatchRequest request)
        {
            var catchItem = _catches.FirstOrDefault(c => c.Id == id);
            if (catchItem == null)
            {
                return NotFound();
            }

            catchItem.Species = request.Species;
            catchItem.Weight = request.Weight;
            catchItem.Length = request.Length;
            catchItem.Price = request.Price;
            catchItem.Location = request.Location;
            catchItem.CatchDate = request.CatchDate;
            catchItem.FisherName = request.FisherName;
            catchItem.ContactEmail = request.ContactEmail;
            catchItem.Description = request.Description;
            catchItem.Status = request.Status;

            return NoContent();
        }

        // DELETE: api/SeaTrue/catches/{id}
        [HttpDelete("catches/{id}")]
        public IActionResult DeleteCatch(int id)
        {
            var catchItem = _catches.FirstOrDefault(c => c.Id == id);
            if (catchItem == null)
            {
                return NotFound();
            }

            _catches.Remove(catchItem);
            return NoContent();
        }

        // POST: api/SeaTrue/catches/{id}/contact
        [HttpPost("catches/{id}/contact")]
        public IActionResult ContactFisher(int id, [FromBody] ContactRequest request)
        {
            var catchItem = _catches.FirstOrDefault(c => c.Id == id);
            if (catchItem == null)
            {
                return NotFound();
            }

            // In a real application, this would send an email or notification
            // For now, we'll just return success
            return Ok(new { message = "Contact request sent successfully" });
        }

        // GET: api/SeaTrue/stats
        [HttpGet("stats")]
        public ActionResult<object> GetStats()
        {
            var stats = new
            {
                TotalCatches = _catches.Count,
                VerifiedCatches = _catches.Count(c => c.Verified),
                ActiveFishers = _catches.Select(c => c.FisherName).Distinct().Count(),
                TotalValue = _catches.Sum(c => c.Weight * c.Price)
            };

            return Ok(stats);
        }
    }

    // Data models
    public class Catch
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
    }

    public class CreateCatchRequest
    {
        public string Species { get; set; } = string.Empty;
        public double Weight { get; set; }
        public double Length { get; set; }
        public double Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public string CatchDate { get; set; } = string.Empty;
        public string FisherName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateCatchRequest
    {
        public string Species { get; set; } = string.Empty;
        public double Weight { get; set; }
        public double Length { get; set; }
        public double Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public string CatchDate { get; set; } = string.Empty;
        public string FisherName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class ContactRequest
    {
        public string Message { get; set; } = string.Empty;
        public string BuyerName { get; set; } = string.Empty;
        public string BuyerEmail { get; set; } = string.Empty;
    }
}
