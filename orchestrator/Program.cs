using System.Text.Json.Serialization;
using KernelFlow.Orchestrator.DSA;
using KernelFlow.Orchestrator.Hubs;
using KernelFlow.Orchestrator.Services;

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Configure JSON serializer for case-insensitive enum parsing
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// No global:: needed — Swashbuckle handles OpenApiInfo internally
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "KernelFlow Orchestrator API", Version = "v1" });
});
builder.Services.AddSingleton<KernelQueue>();
builder.Services.AddScoped<OrchestratorService>();
builder.Services.AddHttpClient();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("KernelFlowPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5500",
            "http://localhost:5173",
            "https://kernel-flow-nu.vercel.app"
        )
            .WithMethods("GET", "POST", "DELETE", "OPTIONS")
            .WithHeaders("Content-Type")
            .AllowCredentials();
    });
});

var app = builder.Build();

// Security: Only expose Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "KernelFlow API V1");
    });
}

// Security: Add security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    await next();
});

app.UseCors("KernelFlowPolicy");
app.UseAuthorization();
app.MapControllers();
app.MapHub<TaskHub>("/hubs/tasks");

app.Run();