using KernelFlow.Orchestrator.Models;
using KernelFlow.Orchestrator.Services;
using Microsoft.AspNetCore.Mvc;

namespace KernelFlow.Orchestrator.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly OrchestratorService _orchestratorService;

    public TasksController(OrchestratorService orchestratorService)
    {
        _orchestratorService = orchestratorService;
    }

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitTask([FromBody] TaskSubmitRequest request)
    {
        if (request == null)
            return BadRequest(new { error = "Request body is required" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Task name is required" });

        if (request.Priority < 1 || request.Priority > 5)
            return BadRequest(new { error = "Priority must be between 1 and 5" });

        if (request.Complexity < 0.1f || request.Complexity > 10.0f)
            return BadRequest(new { error = "Complexity must be between 0.1 and 10.0" });

        var task = await _orchestratorService.SubmitTaskAsync(request);
        return CreatedAtAction(nameof(GetQueueStatus), new { taskId = task.TaskId }, task);
    }

    [HttpGet("queue-status")]
    public IActionResult GetQueueStatus()
    {
        var snapshot = _orchestratorService.GetSnapshot();
        return Ok(snapshot);
    }
   [HttpDelete("clear-completed")]
public IActionResult ClearCompleted()
{
    _orchestratorService.ClearCompleted();
    return Ok(new { message = "Cleared" });
}
}