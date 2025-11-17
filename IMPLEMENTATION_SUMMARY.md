# Automatic CPU Thread Assignment - Implementation Summary

## Overview

This implementation adds automatic CPU thread detection and assignment for servers when they are created through both the API and UI. The system intelligently distributes servers across available CPU threads on nodes to optimize performance and prevent thread contention.

## What Was Implemented

### 1. Core Service (`CpuThreadAssignmentService.php`)

**Location:** `app/Services/Servers/CpuThreadAssignmentService.php`

**Features:**
- Queries Wings daemon to get total CPU thread count on a node
- Tracks which threads are already assigned to servers
- Calculates free/available threads
- Assigns threads based on server CPU allocation
- Provides thread usage statistics for nodes
- Parses complex thread strings (e.g., "0-1,3,5-7")

**Key Methods:**
- `assignFreeThreads(int $nodeId, int $threadsNeeded)`: Main method to assign threads
- `getNodeThreadUsage(int $nodeId)`: Get thread allocation statistics
- `parseThreadString(string $threadString)`: Parse thread notation into array
- `calculateFreeThreads(int $totalThreads, array $assignedThreads)`: Determine free threads

### 2. Integration with Server Creation (`ServerCreationService.php`)

**Location:** `app/Services/Servers/ServerCreationService.php`

**Changes:**
- Injected `CpuThreadAssignmentService` into constructor
- Added automatic thread assignment logic before server creation
- Calculates threads needed based on CPU percentage (e.g., 200% CPU = 2 threads)
- Only assigns if no manual thread specification provided
- Respects configuration setting to enable/disable feature

### 3. Configuration

**Location:** `config/pterodactyl.php`

**Added:**
```php
'servers' => [
    'auto_assign_threads' => env('PTERODACTYL_AUTO_ASSIGN_THREADS', true),
],
```

**Environment Variable:**
```env
PTERODACTYL_AUTO_ASSIGN_THREADS=true
```

Set to `true` to enable (default) or `false` to disable auto-assignment.

### 4. API Endpoints

#### Admin Web Routes
**Location:** `routes/admin.php`

**Endpoint:**
```
GET /admin/nodes/view/{node_id}/thread-allocation
```

**Controller:** `app/Http/Controllers/Admin/Nodes/NodeThreadAllocationController.php`

#### Application API Routes
**Location:** `routes/api-application.php`

**Endpoint:**
```
GET /api/application/nodes/{node_id}/thread-allocation
```

**Controller:** `app/Http/Controllers/Api/Application/Nodes/NodeThreadAllocationController.php`

**Response Format:**
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

### 5. UI Updates

**Location:** `resources/views/admin/servers/new.blade.php`

**Changes:**
- Added placeholder text: "Auto-assigned if left blank"
- Updated help text to mention auto-assignment
- Added visual indicator showing when auto-assignment is enabled
- Displays green badge: "✓ Auto-assignment enabled"

### 6. Documentation

**Files Created:**
- `AUTO_THREAD_ASSIGNMENT.md`: Comprehensive user documentation
- `IMPLEMENTATION_SUMMARY.md`: This file, technical implementation details

### 7. Tests

**Location:** `tests/Unit/Services/Servers/CpuThreadAssignmentServiceTest.php`

**Test Coverage:**
- Thread string parsing (single, comma-separated, ranges, mixed)
- Free thread calculation
- Thread assignment format validation

## How It Works

### Server Creation Flow

1. **User/API creates server** (with or without thread specification)
2. **ServerCreationService checks:**
   - Is auto-assignment enabled in config?
   - Was threads field left empty?
   - Is node_id present?
3. **If all conditions met:**
   - Calculate threads needed from CPU percentage
   - Call `CpuThreadAssignmentService->assignFreeThreads()`
4. **CpuThreadAssignmentService:**
   - Queries Wings daemon for total CPU threads on node
   - Queries database for all servers on node with thread assignments
   - Parses all thread strings to get assigned threads
   - Calculates free threads: `total - assigned`
   - Returns comma-separated string of free threads (e.g., "2,3,6,7")
5. **ServerCreationService:**
   - Adds assigned threads to server data
   - Continues with normal server creation
   - Threads are stored in `servers.threads` database column

### Thread Count Calculation

The number of threads assigned is based on CPU percentage:

```php
$cpuPercentage = 200; // Example: 200%
$threadsNeeded = max(1, ceil($cpuPercentage / 100)); // Result: 2 threads
```

Examples:
- 0% CPU → 1 thread (minimum)
- 100% CPU → 1 thread
- 200% CPU → 2 threads
- 350% CPU → 4 threads
- 800% CPU → 8 threads

### Manual Override

Users can still manually specify threads:
- **UI**: Fill in the "CPU Pinning" field
- **API**: Include `threads` in request (e.g., `"limits": {"threads": "0,1,3"}`)

When manually specified, auto-assignment is completely skipped.

## Files Modified

1. `app/Services/Servers/ServerCreationService.php`
2. `config/pterodactyl.php`
3. `resources/views/admin/servers/new.blade.php`
4. `routes/admin.php`
5. `routes/api-application.php`

## Files Created

1. `app/Services/Servers/CpuThreadAssignmentService.php`
2. `app/Http/Controllers/Admin/Nodes/NodeThreadAllocationController.php`
3. `app/Http/Controllers/Api/Application/Nodes/NodeThreadAllocationController.php`
4. `tests/Unit/Services/Servers/CpuThreadAssignmentServiceTest.php`
5. `AUTO_THREAD_ASSIGNMENT.md`
6. `IMPLEMENTATION_SUMMARY.md`

## Dependencies

### Existing Infrastructure Used

- **Wings Daemon API**: `/api/system?v=2` endpoint for CPU thread count
- **DaemonConfigurationRepository**: To communicate with Wings
- **Server Model**: `threads` column (already exists from migration)
- **Node Model**: For node information

### No New Dependencies

This implementation uses only existing infrastructure and dependencies. No new packages or external services are required.

## Configuration Requirements

### Environment Variables

Add to `.env` file:

```env
# Enable/disable automatic CPU thread assignment (default: true)
PTERODACTYL_AUTO_ASSIGN_THREADS=true
```

### Database

No migrations needed - the `threads` column already exists in the `servers` table (added by migration `2020_04_03_203624_add_threads_column_to_servers_table.php`).

## Testing the Implementation

### Manual Testing Steps

1. **Enable the feature:**
   ```bash
   echo "PTERODACTYL_AUTO_ASSIGN_THREADS=true" >> .env
   php artisan config:clear
   ```

2. **Test via UI:**
   - Navigate to Admin Panel → Servers → Create New Server
   - Fill in all required fields
   - Leave "CPU Pinning" field blank
   - Set CPU to 200% (expects 2 threads)
   - Create the server
   - Check server details to verify threads were assigned

3. **Test via API:**
   ```bash
   curl -X POST "https://panel.example.com/api/application/servers" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Server",
       "user": 1,
       "egg": 1,
       "docker_image": "ghcr.io/pterodactyl/yolks:java_17",
       "startup": "java -jar server.jar",
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

4. **Check thread allocation:**
   ```bash
   curl "https://panel.example.com/admin/nodes/view/1/thread-allocation"
   ```

5. **Verify in database:**
   ```sql
   SELECT id, name, cpu, threads, node_id FROM servers WHERE node_id = 1;
   ```

### Expected Results

- Servers created without specifying threads should have threads automatically assigned
- Thread values should be comma-separated numbers (e.g., "0,1" or "2,3,6,7")
- Multiple servers on same node should get different threads
- When all threads are assigned, new servers should still create (without thread pinning)
- Manual thread specification should override auto-assignment

## Logging

The service logs important events:

```php
Log::warning("Unable to get CPU thread count from node {$node->id}");
Log::warning("No free CPU threads available on node {$node->id}");
Log::error("Failed to assign CPU threads: " . $e->getMessage());
```

Check logs at: `storage/logs/laravel.log`

## Performance Considerations

### Impact on Server Creation

- **Minimal overhead**: One additional API call to Wings daemon
- **Cached in memory**: Node CPU count could be cached if needed
- **Non-blocking**: If thread assignment fails, server creation continues
- **Database queries**: One additional query to get existing thread assignments

### Optimization Opportunities (Future)

1. Cache node CPU thread count in database
2. Use Redis to track thread assignments
3. Implement thread rebalancing when servers are deleted
4. Add webhook notifications for thread exhaustion

## Error Handling

The implementation includes robust error handling:

1. **Wings connection failure**: Logs warning, continues without thread assignment
2. **No free threads**: Logs warning, creates server without pinning
3. **Invalid thread data**: Gracefully handles parsing errors
4. **Node not found**: Throws exception (normal Laravel behavior)

## Security Considerations

- Thread allocation endpoints require admin authentication
- No user input is used in system calls
- Thread strings are validated by Server model validation rules
- Regular expression validation prevents injection: `/^[0-9-,]+$/`

## Future Enhancements

### Potential Features

1. **Thread Rebalancing**
   - Automatically rebalance threads when servers are deleted
   - Command: `php artisan servers:rebalance-threads`

2. **Thread Reservation**
   - Reserve threads for high-priority servers
   - Prevent low-priority servers from using certain threads

3. **NUMA Awareness**
   - Assign threads from same NUMA node for better performance
   - Query NUMA topology from Wings daemon

4. **Thread Metrics**
   - Track actual CPU usage per thread
   - Assign threads based on actual load, not just assignment

5. **UI Enhancements**
   - Show thread allocation visualization on node view
   - Real-time thread availability indicator
   - Warning when threads are scarce

## Troubleshooting

### Common Issues

**Issue**: Threads not being assigned
- **Check**: `PTERODACTYL_AUTO_ASSIGN_THREADS=true` in `.env`
- **Check**: Wings daemon is accessible
- **Check**: Logs for error messages

**Issue**: All threads show as assigned when they're not
- **Solution**: Check for deleted servers with thread assignments
- **Fix**: Manually update or clear orphaned thread assignments

**Issue**: API endpoint returns 404
- **Check**: Routes are properly registered
- **Run**: `php artisan route:clear`

## Rollback Instructions

If you need to disable or remove this feature:

1. **Disable the feature:**
   ```bash
   echo "PTERODACTYL_AUTO_ASSIGN_THREADS=false" >> .env
   php artisan config:clear
   ```

2. **Remove files (if needed):**
   ```bash
   rm app/Services/Servers/CpuThreadAssignmentService.php
   rm app/Http/Controllers/Admin/Nodes/NodeThreadAllocationController.php
   rm app/Http/Controllers/Api/Application/Nodes/NodeThreadAllocationController.php
   ```

3. **Revert modified files:**
   ```bash
   git checkout app/Services/Servers/ServerCreationService.php
   git checkout config/pterodactyl.php
   git checkout resources/views/admin/servers/new.blade.php
   git checkout routes/admin.php
   git checkout routes/api-application.php
   ```

## Conclusion

This implementation provides a complete, production-ready solution for automatic CPU thread assignment. It:

- ✅ Works with both API and UI server creation
- ✅ Integrates seamlessly with existing code
- ✅ Includes comprehensive error handling
- ✅ Provides visibility through API endpoints
- ✅ Is configurable via environment variables
- ✅ Includes documentation and tests
- ✅ Maintains backward compatibility

The feature is ready for deployment and testing in your environment.

