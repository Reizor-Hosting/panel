<?php

namespace Pterodactyl\Http\Controllers\Admin\Nodes;

use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Servers\CpuThreadAssignmentService;

class NodeThreadAllocationController extends Controller
{
    /**
     * NodeThreadAllocationController constructor.
     */
    public function __construct(
        private CpuThreadAssignmentService $cpuThreadAssignmentService
    ) {
    }

    /**
     * Returns CPU thread allocation information for a specific node.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function __invoke(Request $request, Node $node): JsonResponse
    {
        $threadUsage = $this->cpuThreadAssignmentService->getNodeThreadUsage($node->id);
        
        return new JsonResponse([
            'node_id' => $node->id,
            'node_name' => $node->name,
            'threads' => [
                'total' => $threadUsage['total'],
                'assigned' => $threadUsage['assigned'],
                'free' => $threadUsage['free'],
                'assigned_count' => count($threadUsage['assigned']),
                'free_count' => count($threadUsage['free']),
            ],
        ]);
    }
}

