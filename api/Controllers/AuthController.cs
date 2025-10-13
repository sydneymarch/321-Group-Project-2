using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using System.Security.Cryptography;
using System.Text;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly string _connectionString = "Data Source=database.db";

    // Simple password hashing (in future, use proper hashing with bcrypt or Argon2)
    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    // Signup endpoint
    [HttpPost("signup")]
    public IActionResult Signup([FromBody] SignupRequest request)
    {
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            // Check if email already exists
            var checkEmailCmd = connection.CreateCommand();
            checkEmailCmd.CommandText = "SELECT COUNT(*) FROM User WHERE Email = @email";
            checkEmailCmd.Parameters.AddWithValue("@email", request.Email);
            var emailExists = Convert.ToInt32(checkEmailCmd.ExecuteScalar()) > 0;

            if (emailExists)
            {
                return BadRequest(new { message = "Email already exists" });
            }

            // Hash the password
            var passwordHash = HashPassword(request.Password);

            // Insert user
            var insertUserCmd = connection.CreateCommand();
            insertUserCmd.CommandText = @"
                INSERT INTO User (Email, PasswordHash, Role, FirstName, LastName, PhoneNumber, LastLoginAt)
                VALUES (@email, @passwordHash, @role, @firstName, @lastName, @phoneNumber, @lastLoginAt);
                SELECT last_insert_rowid();
            ";
            insertUserCmd.Parameters.AddWithValue("@email", request.Email);
            insertUserCmd.Parameters.AddWithValue("@passwordHash", passwordHash);
            insertUserCmd.Parameters.AddWithValue("@role", request.Role);
            insertUserCmd.Parameters.AddWithValue("@firstName", request.FirstName);
            insertUserCmd.Parameters.AddWithValue("@lastName", request.LastName);
            insertUserCmd.Parameters.AddWithValue("@phoneNumber", request.PhoneNumber ?? (object)DBNull.Value);
            insertUserCmd.Parameters.AddWithValue("@lastLoginAt", DateTime.UtcNow);

            var userId = Convert.ToInt32(insertUserCmd.ExecuteScalar());

            // Create role-specific profile
            if (request.Role == "Fisher")
            {
                CreateFisherProfile(connection, userId, request.FisherDetails);
            }
            else if (request.Role == "Buyer")
            {
                CreateBuyerProfile(connection, userId, request.BuyerDetails);
            }

            // Create session token (simple implementation - in production use JWT)
            var sessionToken = Guid.NewGuid().ToString();
            HttpContext.Session.SetString("SessionToken", sessionToken);
            HttpContext.Session.SetInt32("UserId", userId);
            HttpContext.Session.SetString("UserRole", request.Role);

            return Ok(new
            {
                message = "Signup successful",
                userId = userId,
                email = request.Email,
                role = request.Role,
                firstName = request.FirstName,
                lastName = request.LastName,
                phoneNumber = request.PhoneNumber,
                sessionToken = sessionToken
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    private void CreateFisherProfile(SqliteConnection connection, int userId, FisherDetails? details)
    {
        if (details == null) return;

        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO FisherProfile (
                UserID, NationalID, DateOfBirth, Address, City, State, Country, PostalCode,
                YearsOfExperience, PrimaryFishingMethod, HomePort, CertificationStatus
            )
            VALUES (
                @userId, @nationalId, @dateOfBirth, @address, @city, @state, @country, @postalCode,
                @yearsOfExperience, @primaryFishingMethod, @homePort, 'Pending'
            );
            SELECT last_insert_rowid();
        ";
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@nationalId", details.NationalID ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@dateOfBirth", details.DateOfBirth ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@address", details.Address ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@city", details.City ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@state", details.State ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@country", details.Country ?? "USA");
        cmd.Parameters.AddWithValue("@postalCode", details.PostalCode ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@yearsOfExperience", details.YearsOfExperience ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@primaryFishingMethod", details.PrimaryFishingMethod ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@homePort", details.HomePort ?? (object)DBNull.Value);

        var fisherId = Convert.ToInt32(cmd.ExecuteScalar());

        // Create license if provided
        if (details.LicenseDetails != null)
        {
            CreateLicense(connection, fisherId, details.LicenseDetails);
        }
    }

    private void CreateLicense(SqliteConnection connection, int fisherId, LicenseDetails license)
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO License (
                FisherID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry,
                IssueDate, ExpiryDate, IsVerified
            )
            VALUES (
                @fisherId, @licenseNumber, @licenseType, @issuingAuthority, @issuingCountry,
                @issueDate, @expiryDate, 0
            )
        ";
        cmd.Parameters.AddWithValue("@fisherId", fisherId);
        cmd.Parameters.AddWithValue("@licenseNumber", license.LicenseNumber);
        cmd.Parameters.AddWithValue("@licenseType", license.LicenseType);
        cmd.Parameters.AddWithValue("@issuingAuthority", license.IssuingAuthority ?? "");
        cmd.Parameters.AddWithValue("@issuingCountry", license.IssuingCountry ?? "USA");
        cmd.Parameters.AddWithValue("@issueDate", license.IssueDate ?? DateTime.UtcNow);
        cmd.Parameters.AddWithValue("@expiryDate", license.ExpiryDate ?? DateTime.UtcNow.AddYears(1));

        cmd.ExecuteNonQuery();
    }

    private void CreateBuyerProfile(SqliteConnection connection, int userId, BuyerDetails? details)
    {
        if (details == null)
        {
            // Create minimal buyer profile
            var minimalCmd = connection.CreateCommand();
            minimalCmd.CommandText = @"
                INSERT INTO BuyerProfile (UserID, BuyerType)
                VALUES (@userId, 'Individual')
            ";
            minimalCmd.Parameters.AddWithValue("@userId", userId);
            minimalCmd.ExecuteNonQuery();
            return;
        }

        // Create organization if provided
        int? organizationId = null;
        if (details.OrganizationDetails != null)
        {
            organizationId = CreateOrganization(connection, details.OrganizationDetails);
        }

        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO BuyerProfile (
                UserID, OrganizationID, BuyerType, DateOfBirth, PreferredDeliveryAddress
            )
            VALUES (
                @userId, @organizationId, @buyerType, @dateOfBirth, @preferredDeliveryAddress
            )
        ";
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@organizationId", organizationId ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@buyerType", details.BuyerType ?? "Individual");
        cmd.Parameters.AddWithValue("@dateOfBirth", details.DateOfBirth ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@preferredDeliveryAddress", details.PreferredDeliveryAddress ?? (object)DBNull.Value);

        cmd.ExecuteNonQuery();
    }

    private int CreateOrganization(SqliteConnection connection, OrganizationDetails org)
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO Organization (
                OrganizationName, OrganizationType, RegistrationNumber, TaxID,
                Address, City, State, Country, PostalCode, PhoneNumber, Email
            )
            VALUES (
                @name, @type, @registrationNumber, @taxId,
                @address, @city, @state, @country, @postalCode, @phone, @email
            );
            SELECT last_insert_rowid();
        ";
        cmd.Parameters.AddWithValue("@name", org.OrganizationName);
        cmd.Parameters.AddWithValue("@type", org.OrganizationType ?? "");
        cmd.Parameters.AddWithValue("@registrationNumber", org.RegistrationNumber ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@taxId", org.TaxID ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@address", org.Address ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@city", org.City ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@state", org.State ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@country", org.Country ?? "USA");
        cmd.Parameters.AddWithValue("@postalCode", org.PostalCode ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@phone", org.PhoneNumber ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@email", org.Email ?? (object)DBNull.Value);

        return Convert.ToInt32(cmd.ExecuteScalar());
    }

    // Login endpoint
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            var passwordHash = HashPassword(request.Password);

            var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT UserID, Email, Role, FirstName, LastName, PhoneNumber, IsActive
                FROM User
                WHERE Email = @email AND PasswordHash = @passwordHash
            ";
            cmd.Parameters.AddWithValue("@email", request.Email);
            cmd.Parameters.AddWithValue("@passwordHash", passwordHash);

            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                if (!reader.GetBoolean(6)) // IsActive
                {
                    return Unauthorized(new { message = "Account is inactive" });
                }

                var userId = reader.GetInt32(0);
                var email = reader.GetString(1);
                var role = reader.GetString(2);
                var firstName = reader.GetString(3);
                var lastName = reader.GetString(4);
                var phoneNumber = reader.IsDBNull(5) ? null : reader.GetString(5);

                reader.Close();

                // Update last login
                var updateCmd = connection.CreateCommand();
                updateCmd.CommandText = "UPDATE User SET LastLoginAt = @now WHERE UserID = @userId";
                updateCmd.Parameters.AddWithValue("@now", DateTime.UtcNow);
                updateCmd.Parameters.AddWithValue("@userId", userId);
                updateCmd.ExecuteNonQuery();

                // Create session
                var sessionToken = Guid.NewGuid().ToString();
                HttpContext.Session.SetString("SessionToken", sessionToken);
                HttpContext.Session.SetInt32("UserId", userId);
                HttpContext.Session.SetString("UserRole", role);

                return Ok(new
                {
                    message = "Login successful",
                    userId = userId,
                    email = email,
                    role = role,
                    firstName = firstName,
                    lastName = lastName,
                    phoneNumber = phoneNumber,
                    sessionToken = sessionToken
                });
            }
            else
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    // Logout endpoint
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Ok(new { message = "Logout successful" });
    }

    // Get current user endpoint
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        if (userId == null)
        {
            return Unauthorized(new { message = "Not authenticated" });
        }

        try
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT UserID, Email, Role, FirstName, LastName, PhoneNumber, CreatedAt, LastLoginAt
                FROM User
                WHERE UserID = @userId AND IsActive = 1
            ";
            cmd.Parameters.AddWithValue("@userId", userId.Value);

            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                var role = reader.GetString(2);
                var userProfile = new
                {
                    userId = reader.GetInt32(0),
                    email = reader.GetString(1),
                    role = role,
                    firstName = reader.GetString(3),
                    lastName = reader.GetString(4),
                    phoneNumber = reader.IsDBNull(5) ? null : reader.GetString(5),
                    createdAt = reader.GetDateTime(6),
                    lastLoginAt = reader.IsDBNull(7) ? (DateTime?)null : reader.GetDateTime(7)
                };

                reader.Close();

                // Get role-specific data
                object? roleProfile = null;
                if (role == "Fisher")
                {
                    roleProfile = GetFisherProfile(connection, userId.Value);
                }
                else if (role == "Buyer")
                {
                    roleProfile = GetBuyerProfile(connection, userId.Value);
                }

                return Ok(new
                {
                    user = userProfile,
                    profile = roleProfile
                });
            }
            else
            {
                HttpContext.Session.Clear();
                return Unauthorized(new { message = "User not found or inactive" });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    private object? GetFisherProfile(SqliteConnection connection, int userId)
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            SELECT fp.FisherID, fp.NationalID, fp.DateOfBirth, fp.Address, fp.City, fp.State,
                   fp.Country, fp.PostalCode, fp.YearsOfExperience, fp.PrimaryFishingMethod,
                   fp.HomePort, fp.CertificationStatus, fp.TrustScore
            FROM FisherProfile fp
            WHERE fp.UserID = @userId
        ";
        cmd.Parameters.AddWithValue("@userId", userId);

        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            var fisherId = reader.GetInt32(0);
            var profile = new
            {
                fisherId = fisherId,
                nationalId = reader.IsDBNull(1) ? null : reader.GetString(1),
                dateOfBirth = reader.IsDBNull(2) ? null : reader.GetString(2),
                address = reader.IsDBNull(3) ? null : reader.GetString(3),
                city = reader.IsDBNull(4) ? null : reader.GetString(4),
                state = reader.IsDBNull(5) ? null : reader.GetString(5),
                country = reader.IsDBNull(6) ? null : reader.GetString(6),
                postalCode = reader.IsDBNull(7) ? null : reader.GetString(7),
                yearsOfExperience = reader.IsDBNull(8) ? (int?)null : reader.GetInt32(8),
                primaryFishingMethod = reader.IsDBNull(9) ? null : reader.GetString(9),
                homePort = reader.IsDBNull(10) ? null : reader.GetString(10),
                certificationStatus = reader.GetString(11),
                trustScore = reader.GetDecimal(12)
            };

            reader.Close();

            // Get licenses
            var licenseCmd = connection.CreateCommand();
            licenseCmd.CommandText = @"
                SELECT LicenseID, LicenseNumber, LicenseType, IssuingAuthority, IssuingCountry,
                       IssueDate, ExpiryDate, IsVerified
                FROM License
                WHERE FisherID = @fisherId
            ";
            licenseCmd.Parameters.AddWithValue("@fisherId", fisherId);

            var licenses = new List<object>();
            using var licenseReader = licenseCmd.ExecuteReader();
            while (licenseReader.Read())
            {
                licenses.Add(new
                {
                    licenseId = licenseReader.GetInt32(0),
                    licenseNumber = licenseReader.GetString(1),
                    licenseType = licenseReader.GetString(2),
                    issuingAuthority = licenseReader.GetString(3),
                    issuingCountry = licenseReader.GetString(4),
                    issueDate = licenseReader.GetString(5),
                    expiryDate = licenseReader.GetString(6),
                    isVerified = licenseReader.GetBoolean(7)
                });
            }

            return new { fisher = profile, licenses = licenses };
        }

        return null;
    }

    private object? GetBuyerProfile(SqliteConnection connection, int userId)
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            SELECT bp.BuyerID, bp.OrganizationID, bp.BuyerType, bp.DateOfBirth,
                   bp.PreferredDeliveryAddress, bp.IsVerified,
                   o.OrganizationName, o.OrganizationType, o.RegistrationNumber, o.TaxID
            FROM BuyerProfile bp
            LEFT JOIN Organization o ON bp.OrganizationID = o.OrganizationID
            WHERE bp.UserID = @userId
        ";
        cmd.Parameters.AddWithValue("@userId", userId);

        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            return new
            {
                buyerId = reader.GetInt32(0),
                organizationId = reader.IsDBNull(1) ? (int?)null : reader.GetInt32(1),
                buyerType = reader.IsDBNull(2) ? "Individual" : reader.GetString(2),
                dateOfBirth = reader.IsDBNull(3) ? null : reader.GetString(3),
                preferredDeliveryAddress = reader.IsDBNull(4) ? null : reader.GetString(4),
                isVerified = reader.GetBoolean(5),
                organization = reader.IsDBNull(6) ? null : new
                {
                    name = reader.GetString(6),
                    type = reader.IsDBNull(7) ? null : reader.GetString(7),
                    registrationNumber = reader.IsDBNull(8) ? null : reader.GetString(8),
                    taxId = reader.IsDBNull(9) ? null : reader.GetString(9)
                }
            };
        }

        return null;
    }
}

// Request/Response Models
public class SignupRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? PhoneNumber { get; set; }
    public FisherDetails? FisherDetails { get; set; }
    public BuyerDetails? BuyerDetails { get; set; }
}

public class FisherDetails
{
    public string? NationalID { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? PrimaryFishingMethod { get; set; }
    public string? HomePort { get; set; }
    public LicenseDetails? LicenseDetails { get; set; }
}

public class LicenseDetails
{
    public string LicenseNumber { get; set; } = "";
    public string LicenseType { get; set; } = "";
    public string? IssuingAuthority { get; set; }
    public string? IssuingCountry { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class BuyerDetails
{
    public string? BuyerType { get; set; }
    public string? DateOfBirth { get; set; }
    public string? PreferredDeliveryAddress { get; set; }
    public OrganizationDetails? OrganizationDetails { get; set; }
}

public class OrganizationDetails
{
    public string OrganizationName { get; set; } = "";
    public string? OrganizationType { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? TaxID { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

