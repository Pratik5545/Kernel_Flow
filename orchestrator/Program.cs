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
        policy
            .WithOrigins(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:5173",
                "http://localhost:3000",
                "https://kernel-flow-dzli9k0ne-pratik5545s-projects.vercel.app"
                
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "KernelFlow API V1");
});

app.UseCors("KernelFlowPolicy");
app.UseAuthorization();
app.MapControllers();
app.MapHub<TaskHub>("/hubs/tasks");

app.Run();