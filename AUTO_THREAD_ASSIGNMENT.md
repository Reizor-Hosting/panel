# Automatic CPU Thread Assignment

This feature automatically detects free CPU threads on nodes and pins servers to those threads when they are created.

## Overview

When a server is created (via API or UI), if no CPU thread pinning is specified, the system will:

1. Query the Wings daemon to get the total number of CPU threads available on the node
2. Check which threads are already assigned to other servers on that node
3. Calculate which threads are free
4. Automatically assign free threads to the new server based on its CPU allocation

## Configuration

The feature is controlled via an environment variable in your `.env` file:

```env
PTERODACTYL_AUTO_ASSIGN_THREADS=true
```

Set to `true` to enable automatic thread assignment (default), or `false` to disable it.

## How Thread Assignment Works

### Thread Count Calculation

The number of threads assigned is based on the server's CPU percentage allocation:

- CPU percentage is divided by 100 to determine thread count
- Minimum of 1 thread is assigned
- Example: 200% CPU = 2 threads, 350% CPU = 4 threads

### Thread Selection

Threads are selected from the pool of free threads on the node:

1. System queries all servers on the node to see which threads are already assigned
2. Free threads are calculated: `Total Threads - Assigned Threads`
3. The system assigns the requested number of threads (or all available if fewer than needed)

### Manual Override

You can still manually specify thread pinning when creating a server:

- **UI**: Fill in the "CPU Pinning" field in the server creation form
- **API**: Include the `threads` parameter in your server creation request

When threads are manually specified, auto-assignment is skipped.

## API Endpoints

### View Thread Allocation on a Node

**Admin Route:**
```
GET /admin/nodes/view/{node_id}/thread-allocation
```

**Application API:**
```
GET /api/application/nodes/{node_id}/thread-allocation
```

**Response:**
```json
{
  "node_id": 1,
  "node_name": "Node 1",
  "threads": {
    "total": 8,
    "assigned": [0, 1, 4, 5],
    "free": [2, 3, 6, 7],
    "assigned_count": 4,
    "free_count": 4
  }
}
```

## Thread String Format

CPU thread pinning uses the standard format:

- Single thread: `0`
- Multiple threads: `0,1,3,4`
- Range: `0-3` (equivalent to `0,1,2,3`)
- Mixed: `0-1,3,5-7` (equivalent to `0,1,3,5,6,7`)

## Behavior Details

### When Auto-Assignment Occurs

Auto-assignment happens when:
- Feature is enabled via config
- No `threads` value is provided in the request
- A valid `node_id` is present

### When Auto-Assignment is Skipped

Auto-assignment is skipped when:
- Feature is disabled via config
- `threads` value is manually provided
- Unable to connect to Wings daemon
- Node has no free threads available
- Error occurs during thread detection

If auto-assignment is skipped for any reason, the server is still created without thread pinning (allowing it to use any CPU thread).

## Logging

The system logs important events:

- **Warning**: Unable to get CPU thread count from node
- **Warning**: No free CPU threads available on node
- **Error**: Failed to assign CPU threads (with exception message)

Check your panel logs for these messages if you're troubleshooting thread assignment issues.

## Requirements

- Wings daemon version that supports system information API v2
- Active connection between Panel and Wings
- Servers must have thread information populated in the database

## Example Usage

### Creating a Server with Auto-Assignment (API)

```bash
curl -X POST "https://panel.example.com/api/application/servers" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Server",
    "user": 1,
    "egg": 1,
    "docker_image": "ghcr.io/pterodactyl/yolks:java_17",
    "startup": "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar",
    "environment": {},
    "limits": {
      "memory": 1024,
      "swap": 0,
      "disk": 5120,
      "io": 500,
      "cpu": 200
    },
    "feature_limits": {
      "databases": 1,
      "allocations": 1,
      "backups": 2
    },
    "allocation": {
      "default": 1
    }
  }'
```

In this example:
- CPU is set to 200% (2 threads)
- No `threads` field is provided
- System will automatically assign 2 free threads (e.g., `"0,1"`)

### Creating a Server with Manual Thread Assignment (API)

```bash
curl -X POST "https://panel.example.com/api/application/servers" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Server",
    "user": 1,
    "egg": 1,
    "docker_image": "ghcr.io/pterodactyl/yolks:java_17",
    "startup": "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar",
    "environment": {},
    "limits": {
      "memory": 1024,
      "swap": 0,
      "disk": 5120,
      "io": 500,
      "cpu": 200,
      "threads": "2,3"
    },
    "feature_limits": {
      "databases": 1,
      "allocations": 1,
      "backups": 2
    },
    "allocation": {
      "default": 1
    }
  }'
```

In this example:
- CPU is set to 200%
- `threads` is manually set to `"2,3"`
- Auto-assignment is skipped

## Benefits

1. **Automatic Load Balancing**: Distributes CPU load across all available threads
2. **Prevents Thread Contention**: Reduces multiple servers competing for the same threads
3. **Improved Performance**: Better CPU cache utilization and reduced context switching
4. **Ease of Use**: No manual thread calculation required

## Limitations

1. Requires Wings daemon connectivity
2. Does not consider CPU load when assigning threads (only checks if threads are assigned)
3. Does not automatically rebalance threads when servers are deleted
4. Thread assignment is permanent until manually changed

## Troubleshooting

### Threads Not Being Assigned

1. Check config: `PTERODACTYL_AUTO_ASSIGN_THREADS=true`
2. Verify Wings daemon is accessible
3. Check panel logs for error messages
4. Test the thread allocation API endpoint

### All Threads Show as Assigned

1. Check if servers have been deleted but threads weren't freed
2. Use the thread allocation API to verify actual usage
3. Consider manually updating thread assignments on existing servers

### Server Creation Fails

Auto-assignment failure will not cause server creation to fail. The server will be created without thread pinning. Check logs for the underlying issue.

