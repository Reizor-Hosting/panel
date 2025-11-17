<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nodes;

use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Services\Servers\CpuThreadAssignmentService;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class NodeThreadAllocationController extends ApplicationApiController
{
    /**
     * NodeThreadAllocationController constructor.
     */
    public function __construct(
        private CpuThreadAssignmentService $cpuThreadAssignmentService
    ) {
        parent::__construct();
    }

    /**
     * Returns CPU thread allocation information for a specific node.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function __invoke(Node $node): JsonResponse
    {
        $threadUsage = $this->cpuThreadAssignmentService->getNodeThreadUsage($node->id);
        
        return new JsonResponse([
            'object' => 'node_thread_allocation',
            'attributes' => [
                'node_id' => $node->id,
                'node_uuid' => $node->uuid,
                'threads' => [
                    'total' => $threadUsage['total'],
                    'assigned' => $threadUsage['assigned'],
                    'free' => $threadUsage['free'],
                    'assigned_count' => count($threadUsage['assigned']),
                    'free_count' => count($threadUsage['free']),
                ],
            ],
        ]);
    }
}

