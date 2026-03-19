using KernelFlow.Orchestrator.Models; // Seedha namespace use karo
using System.Collections.Generic;
using System.Linq;

namespace KernelFlow.Orchestrator.DSA;

public class KernelQueue
{
    // Ab yahan direct 'KernelTask' use karo bina kisi alias ke
    private readonly LinkedList<KernelTask> _queue = new();
    private readonly List<KernelTask> _processing = new();
    private readonly List<KernelTask> _completed = new();
    private readonly object _lock = new();

    public void Enqueue(KernelTask task)
    {
        lock (_lock)
        {
            task.Status = KernelFlow.Orchestrator.Models.TaskStatus.Waiting;
            _queue.AddLast(task);
        }
    }

    public KernelTask? Dequeue()
    {
        lock (_lock)
        {
            if (_queue.Count == 0) return null;
            var task = _queue.First!.Value;
            _queue.RemoveFirst();
            task.Status = KernelFlow.Orchestrator.Models.TaskStatus.Processing;
            task.ProcessingStartedAt = DateTime.UtcNow;
            _processing.Add(task);
            return task;
        }
    }

    public KernelTask? Peek()
    {
        lock (_lock) { return _queue.First?.Value; }
    }

    public void CompleteTask(string taskId)
    {
        lock (_lock)
        {
            var task = _processing.FirstOrDefault(t => t.TaskId == taskId);
            if (task == null) return;
            task.Status = KernelFlow.Orchestrator.Models.TaskStatus.Completed;
            task.CompletedAt = DateTime.UtcNow;
            _processing.Remove(task);
            _completed.Insert(0, task);
        }
    }

    public void FailTask(string taskId)
    {
        lock (_lock)
        {
            var task = _processing.FirstOrDefault(t => t.TaskId == taskId);
            if (task == null) return;
            task.Status = KernelFlow.Orchestrator.Models.TaskStatus.Failed;
            task.CompletedAt = DateTime.UtcNow;
            _processing.Remove(task);
            _completed.Insert(0, task);
        }
    }


    public bool IsEmpty         => _queue.Count == 0;
    public int  WaitingCount    => _queue.Count;
    public int  ProcessingCount => _processing.Count;
    public int  CompletedCount  => _completed.Count;

    public IReadOnlyList<KernelTask> GetWaiting()    => _queue.ToList().AsReadOnly();
    public IReadOnlyList<KernelTask> GetProcessing() => _processing.AsReadOnly();
    public IReadOnlyList<KernelTask> GetCompleted()  => _completed.AsReadOnly();

    public QueueSnapshot GetSnapshot() => new()
    {
        Waiting       = GetWaiting(),
        Processing    = GetProcessing(),
        Completed     = GetCompleted(),
        TotalEnqueued = WaitingCount + ProcessingCount + CompletedCount
    };
    public void ClearCompleted()
{
    lock (_lock) { _completed.Clear(); }
}
}