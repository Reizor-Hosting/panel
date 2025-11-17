<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class CpuThreadAssignmentService
{
    /**
     * CpuThreadAssignmentService constructor.
     */
    public function __construct(
        private DaemonConfigurationRepository $daemonConfigRepository
    ) {
    }

    /**
     * Automatically assigns free CPU threads to a server based on what's available
     * on the node and what's already assigned to other servers.
     *
     * @return string|null The thread assignment string (e.g., "0,1,2") or null if unable to assign
     */
    public function assignFreeThreads(int $nodeId, int $threadsNeeded = 1): ?string
    {
        try {
            $node = Node::findOrFail($nodeId);
            
            // Get total CPU threads from the node via Wings daemon
            $totalThreads = $this->getTotalCpuThreads($node);
            
            if ($totalThreads === null || $totalThreads <= 0) {
                Log::warning("Unable to get CPU thread count from node {$node->id}");
                return null;
            }

            // Get all threads that are currently assigned to servers on this node
            $assignedThreads = $this->getAssignedThreadsOnNode($nodeId);
            
            // Calculate free threads
            $freeThreads = $this->calculateFreeThreads($totalThreads, $assignedThreads);
            
            if (empty($freeThreads)) {
                Log::warning("No free CPU threads available on node {$node->id}");
                return null;
            }

            // Select the requested number of threads (or all available if less than needed)
            $threadsToAssign = array_slice($freeThreads, 0, min($threadsNeeded, count($freeThreads)));
            
            return implode(',', $threadsToAssign);
        } catch (\Exception $e) {
            Log::error("Failed to assign CPU threads: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get the total number of CPU threads available on a node from Wings.
     *
     * @return int|null
     */
    private function getTotalCpuThreads(Node $node): ?int
    {
        try {
            $systemInfo = $this->daemonConfigRepository->setNode($node)->getSystemInformation(2);
            return $systemInfo['system']['cpu_threads'] ?? null;
        } catch (DaemonConnectionException $e) {
            Log::warning("Failed to get system information from node {$node->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Parse thread assignments from all servers on a node and return an array
     * of thread numbers that are currently in use.
     *
     * @return array
     */
    private function getAssignedThreadsOnNode(int $nodeId): array
    {
        $servers = Server::where('node_id', $nodeId)
            ->whereNotNull('threads')
            ->pluck('threads');

        $assignedThreads = [];

        foreach ($servers as $threadString) {
            $threads = $this->parseThreadString($threadString);
            $assignedThreads = array_merge($assignedThreads, $threads);
        }

        return array_unique($assignedThreads);
    }

    /**
     * Parse a thread string (e.g., "0,1,3-5") into an array of individual thread numbers.
     *
     * @param string $threadString
     * @return array
     */
    private function parseThreadString(string $threadString): array
    {
        $threads = [];
        $parts = explode(',', $threadString);

        foreach ($parts as $part) {
            $part = trim($part);
            
            if (strpos($part, '-') !== false) {
                // Handle range (e.g., "3-5")
                [$start, $end] = explode('-', $part, 2);
                $start = (int) trim($start);
                $end = (int) trim($end);
                
                for ($i = $start; $i <= $end; $i++) {
                    $threads[] = $i;
                }
            } else {
                // Handle single thread
                $threads[] = (int) $part;
            }
        }

        return $threads;
    }

    /**
     * Calculate which threads are free based on total threads and assigned threads.
     *
     * @param int $totalThreads
     * @param array $assignedThreads
     * @return array
     */
    private function calculateFreeThreads(int $totalThreads, array $assignedThreads): array
    {
        $allThreads = range(0, $totalThreads - 1);
        return array_values(array_diff($allThreads, $assignedThreads));
    }

    /**
     * Get information about thread usage on a node.
     *
     * @param int $nodeId
     * @return array ['total' => int, 'assigned' => array, 'free' => array]
     */
    public function getNodeThreadUsage(int $nodeId): array
    {
        try {
            $node = Node::findOrFail($nodeId);
            $totalThreads = $this->getTotalCpuThreads($node);
            
            if ($totalThreads === null) {
                return [
                    'total' => 0,
                    'assigned' => [],
                    'free' => [],
                ];
            }

            $assignedThreads = $this->getAssignedThreadsOnNode($nodeId);
            $freeThreads = $this->calculateFreeThreads($totalThreads, $assignedThreads);

            return [
                'total' => $totalThreads,
                'assigned' => $assignedThreads,
                'free' => $freeThreads,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to get node thread usage: " . $e->getMessage());
            return [
                'total' => 0,
                'assigned' => [],
                'free' => [],
            ];
        }
    }
}

