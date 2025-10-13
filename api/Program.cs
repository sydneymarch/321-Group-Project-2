var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddHttpClient();

// Add session support
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.None;
    options.Cookie.Name = ".SeaTrue.Session";
});

builder.Services.AddCors(options => { 
    options.AddPolicy("OpenPolicy", builder => { 
        builder.WithOrigins(
                   "http://127.0.0.1:5500", 
                   "http://localhost:5500",
                   "http://127.0.0.1:5142",
                   "http://localhost:5142"
               )
               .AllowAnyMethod() 
               .AllowAnyHeader()
               .AllowCredentials(); 
    }); 
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("OpenPolicy");

app.UseSession();

app.UseAuthorization();

app.MapControllers();

app.Run();
