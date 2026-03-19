using System;
using System.Collections.Generic;

namespace KernelFlow.Orchestrator.Models;

public enum TaskType { CPU, IO, MEMORY, NETWORK, GPU }
public enum TaskStatus { Waiting, Processing, Completed, Failed }

// 1. Main Task Model
public class KernelTask
{
    public string TaskId { get; set; } = Guid.NewGuid().ToString("N")[..8].ToUpper();
    public string Name { get; set; } = string.Empty;
    public TaskType Type { get; set; }
    public int Priority { get; set; } 
    public float Complexity { get; set; } 
    public TaskStatus Status { get; set; } = TaskStatus.Waiting;
    public double? EstimatedTimeSeconds { get; set; }
    public float? ConfidenceScore { get; set; }
    public string? ComplexityLabel { get; set; }
    public DateTime EnqueuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessingStartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

// 2. Queue Snapshot (Jo error de raha tha)
public class QueueSnapshot
{
    public IReadOnlyList<KernelTask> Waiting { get; set; } = new List<KernelTask>();
    public IReadOnlyList<KernelTask> Processing { get; set; } = new List<KernelTask>();
    public IReadOnlyList<KernelTask> Completed { get; set; } = new List<KernelTask>();
    public int TotalEnqueued { get; set; }
}

// 3. Request from Frontend (Check spelling: Name, Type, Priority, Complexity)
public class TaskSubmitRequest
{
    public string Name { get; set; } = string.Empty;
    public TaskType Type { get; set; }
    public int Priority { get; set; }
    public float Complexity { get; set; } = 1.0f;
}

// 4. Request to Python AI (Keep names lowercase to match your Service code)
public class AiPredictionRequest
{
    public string task_id { get; set; } = string.Empty;
    public string task_type { get; set; } = string.Empty;
    public int priority { get; set; }
    public float complexity { get; set; }
}

// 5. Response from Python AI
public class AiPredictionResponse
{
    public string task_id { get; set; } = string.Empty;
    public double estimated_time_seconds { get; set; }
    public float confidence_score { get; set; }
    public string complexity_label { get; set; } = string.Empty;
    public string model_version { get; set; } = string.Empty;
}