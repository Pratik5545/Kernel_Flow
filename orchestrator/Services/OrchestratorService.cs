using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using KernelFlow.Orchestrator.DSA;
using KernelFlow.Orchestrator.Hubs;
using KernelFlow.Orchestrator.Models;

namespace KernelFlow.Orchestrator.Services;

public class OrchestratorService
{
    private readonly KernelQueue _queue;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IHubContext<TaskHub> _hubContext;
    private readonly ILogger<OrchestratorService> _logger;
    private readonly IConfiguration _config;

    public OrchestratorService(
        KernelQueue queue,
        IHttpClientFactory httpClientFactory,
        IHubContext<TaskHub> hubContext,
        ILogger<OrchestratorService> logger,
        IConfiguration config)
    {
        _queue = queue;
        _httpClientFactory = httpClientFactory;
        _hubContext = hubContext;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// Enqueues a new task, calls AI for prediction, then simulates processing.
    /// </summary>
    public async Task<KernelTask> SubmitTaskAsync(TaskSubmitRequest request)
    {
        // 1. Create task and enqueue (DSA: FIFO Queue)
        var task = new KernelTask
        {
            Name = request.Name,
            Type = request.Type,
            Priority = request.Priority,
            Complexity = request.Complexity,
        };

        _queue.Enqueue(task);
        _logger.LogInformation("Task {Id} enqueued. Queue depth: {Count}", task.TaskId, _queue.WaitingCount);

        // 2. Broadcast updated queue to all React clients via SignalR
        await BroadcastSnapshot();

        // 3. Call Python AI service for time prediction (fire and update)
        _ = Task.Run(async () => await ProcessTaskAsync(task));

        return task;
    }

    private async Task ProcessTaskAsync(KernelTask task)
    {
        try
        {
            await Task.Delay(4000);
            // Step A: Get AI prediction
            var prediction = await GetAiPredictionAsync(task);
            if (prediction != null)
            {
                task.EstimatedTimeSeconds = prediction.estimated_time_seconds;
                task.ConfidenceScore = prediction.confidence_score;
                task.ComplexityLabel = prediction.complexity_label;
            }
            else
            {
                // Fallback heuristic if AI service is down
                task.EstimatedTimeSeconds = FallbackEstimate(task.Type, task.Priority, task.Complexity);
                task.ComplexityLabel = "Estimated (fallback)";
            }

            await BroadcastSnapshot();

            // Step B: Dequeue and start processing (simulate work)
            var processing = _queue.Dequeue();
            if (processing == null) return;

            await BroadcastSnapshot();

            // Step C: Simulate actual task execution
            var executionMs = (int)((task.EstimatedTimeSeconds ?? 5.0) * 1000);
            executionMs = Math.Clamp(executionMs, 2000, 20000); // 2s min, 20s max for demo
            await Task.Delay(executionMs);

            // Step D: Mark complete
            _queue.CompleteTask(task.TaskId);
            _logger.LogInformation("Task {Id} completed in {Ms}ms", task.TaskId, executionMs);
            await BroadcastSnapshot();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Task {Id} failed during processing", task.TaskId);
            _queue.FailTask(task.TaskId);
            await BroadcastSnapshot();
        }
    }

    private async Task<AiPredictionResponse?> GetAiPredictionAsync(KernelTask task)
    {
        try
        {
            var aiServiceUrl = _config["AiService:BaseUrl"] ?? "http://localhost:8000";
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);

            var body = new AiPredictionRequest
            {
                task_id   = task.TaskId,
                task_type = task.Type.ToString(),
                priority  = task.Priority,
                complexity = task.Complexity
            };

            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{aiServiceUrl}/predict", content);

            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<AiPredictionResponse>(responseJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogWarning("AI service unavailable: {Msg}", ex.Message);
            return null;
        }
    }

    private static double FallbackEstimate(TaskType type, int priority, float complexity)
    {
        double baseTime = type switch
        {
            TaskType.CPU     => 15.0,
            TaskType.IO      => 8.0,
            TaskType.MEMORY  => 12.0,
            TaskType.NETWORK => 6.0,
            TaskType.GPU     => 25.0,
            _ => 10.0
        };
        return Math.Round(baseTime * complexity * 0.3 * (1.0 - (priority - 1) * 0.05), 2);
    }

    public QueueSnapshot GetSnapshot() => _queue.GetSnapshot();
    public async Task ClearCompleted()
    {
        _queue.ClearCompleted();
        await BroadcastSnapshot();
    }

    private async Task BroadcastSnapshot()
    {
        var snapshot = _queue.GetSnapshot();
        await _hubContext.Clients.All.SendAsync("QueueSnapshot", snapshot);
    }

}