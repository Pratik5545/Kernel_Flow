using Microsoft.AspNetCore.SignalR;
using KernelFlow.Orchestrator.DSA;

namespace KernelFlow.Orchestrator.Hubs;

public class TaskHub : Hub
{
    private readonly KernelQueue _queue;

    public TaskHub(KernelQueue queue)
    {
        _queue = queue;
    }

    // Called when a React client connects — send current state immediately
    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("QueueSnapshot", _queue.GetSnapshot());
        await base.OnConnectedAsync();
    }

    // Client can request a fresh snapshot at any time
    public async Task RequestSnapshot()
    {
        await Clients.Caller.SendAsync("QueueSnapshot", _queue.GetSnapshot());
    }
}