<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetGTNHVersionsRequest;

class GTNHVersionController extends ClientApiController
{
    /**
     * Fetch GTNH versions from downloads.gtnewhorizons.com or GitHub Actions.
     */
    public function index(GetGTNHVersionsRequest $request, Server $server): JsonResponse
    {
        $type = $request->query('type', 'stable');

        $versions = match ($type) {
            'stable' => $this->fetchStableVersions(),
            'beta' => $this->fetchBetaVersions(),
            'experimental' => $this->fetchExperimentalBuilds(),
            'daily' => $this->fetchDailyBuilds(),
            default => [],
        };

        return new JsonResponse($versions);
    }

    /**
     * Fetch stable versions from downloads.gtnewhorizons.com/ServerPacks/
     */
    private function fetchStableVersions(): array
    {
        return Cache::remember('gtnh.versions.stable', now()->addHour(), function () {
            try {
                $response = Http::timeout(10)->get('https://downloads.gtnewhorizons.com/ServerPacks/?raw');

                if (!$response->successful()) {
                    return [];
                }

                $lines = explode("\n", trim($response->body()));
                $versions = [];

                foreach ($lines as $line) {
                    $line = trim($line);
                    // Each line is a full URL to a file
                    if (!empty($line) && str_ends_with($line, '.zip')) {
                        $filename = basename($line);
                        $versions[] = [
                            'name' => str_replace('.zip', '', $filename),
                            'url' => $line,
                            'type' => 'stable',
                        ];
                    }
                }

                // Sort by name in descending order (newest first)
                usort($versions, fn($a, $b) => strcmp($b['name'], $a['name']));

                return $versions;
            } catch (\Exception $e) {
                \Log::error('Failed to fetch GTNH stable versions: ' . $e->getMessage());
                return [];
            }
        });
    }

    /**
     * Fetch beta versions from downloads.gtnewhorizons.com/ServerPacks/betas/
     */
    private function fetchBetaVersions(): array
    {
        return Cache::remember('gtnh.versions.beta', now()->addHour(), function () {
            try {
                $response = Http::timeout(10)->get('https://downloads.gtnewhorizons.com/ServerPacks/betas/?raw');

                if (!$response->successful()) {
                    return [];
                }

                $lines = explode("\n", trim($response->body()));
                $versions = [];

                foreach ($lines as $line) {
                    $line = trim($line);
                    // Each line is a full URL to a file
                    if (!empty($line) && str_ends_with($line, '.zip')) {
                        $filename = basename($line);
                        $versions[] = [
                            'name' => str_replace('.zip', '', $filename),
                            'url' => $line,
                            'type' => 'beta',
                        ];
                    }
                }

                // Sort by name in descending order (newest first)
                usort($versions, fn($a, $b) => strcmp($b['name'], $a['name']));

                return $versions;
            } catch (\Exception $e) {
                \Log::error('Failed to fetch GTNH beta versions: ' . $e->getMessage());
                return [];
            }
        });
    }

    /**
     * Fetch daily build artifacts from GitHub Actions
     */
    private function fetchDailyBuilds(): array
    {
        return Cache::remember('gtnh.versions.daily', now()->addHour(), function () {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['Accept' => 'application/vnd.github.v3+json'])
                    ->get('https://api.github.com/repos/GTNewHorizons/DreamAssemblerXXL/actions/workflows/daily-modpack-build.yml/runs', [
                        'status' => 'success',
                        'per_page' => 10,
                    ]);

                if (!$response->successful()) {
                    return [];
                }

                $data = $response->json();
                $versions = [];

                foreach ($data['workflow_runs'] ?? [] as $run) {
                    try {
                        $artifactsResponse = Http::timeout(10)
                            ->withHeaders(['Accept' => 'application/vnd.github.v3+json'])
                            ->get("https://api.github.com/repos/GTNewHorizons/DreamAssemblerXXL/actions/runs/{$run['id']}/artifacts");

                        if (!$artifactsResponse->successful()) {
                            continue;
                        }

                        $artifactsData = $artifactsResponse->json();

                        foreach ($artifactsData['artifacts'] ?? [] as $artifact) {
                            if (str_contains($artifact['name'], 'server-new-java')) {
                                $versions[] = [
                                    'name' => $artifact['name'] . ' (' . date('Y-m-d', strtotime($artifact['created_at'])) . ')',
                                    'url' => $artifact['archive_download_url'],
                                    'type' => 'daily',
                                    'date' => $artifact['created_at'],
                                    'size' => $artifact['size_in_bytes'],
                                ];
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::error("Failed to fetch artifacts for run {$run['id']}: " . $e->getMessage());
                    }
                }

                // Sort by date in descending order (newest first)
                usort($versions, fn($a, $b) => strcmp($b['date'], $a['date']));

                return $versions;
            } catch (\Exception $e) {
                \Log::error('Failed to fetch GTNH daily builds: ' . $e->getMessage());
                return [];
            }
        });
    }

    /**
     * Fetch experimental build artifacts from GitHub Actions
     */
    private function fetchExperimentalBuilds(): array
    {
        return Cache::remember('gtnh.versions.experimental', now()->addHour(), function () {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['Accept' => 'application/vnd.github.v3+json'])
                    ->get('https://api.github.com/repos/GTNewHorizons/DreamAssemblerXXL/actions/workflows/experimental-modpack-build.yml/runs', [
                        'status' => 'success',
                        'per_page' => 10,
                    ]);

                if (!$response->successful()) {
                    return [];
                }

                $data = $response->json();
                $versions = [];

                foreach ($data['workflow_runs'] ?? [] as $run) {
                    try {
                        $artifactsResponse = Http::timeout(10)
                            ->withHeaders(['Accept' => 'application/vnd.github.v3+json'])
                            ->get("https://api.github.com/repos/GTNewHorizons/DreamAssemblerXXL/actions/runs/{$run['id']}/artifacts");

                        if (!$artifactsResponse->successful()) {
                            continue;
                        }

                        $artifactsData = $artifactsResponse->json();

                        foreach ($artifactsData['artifacts'] ?? [] as $artifact) {
                            if (str_contains($artifact['name'], 'server-new-java')) {
                                $versions[] = [
                                    'name' => $artifact['name'] . ' (' . date('Y-m-d', strtotime($artifact['created_at'])) . ')',
                                    'url' => $artifact['archive_download_url'],
                                    'type' => 'experimental',
                                    'date' => $artifact['created_at'],
                                    'size' => $artifact['size_in_bytes'],
                                ];
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::error("Failed to fetch artifacts for run {$run['id']}: " . $e->getMessage());
                    }
                }

                // Sort by date in descending order (newest first)
                usort($versions, fn($a, $b) => strcmp($b['date'], $a['date']));

                return $versions;
            } catch (\Exception $e) {
                \Log::error('Failed to fetch GTNH experimental builds: ' . $e->getMessage());
                return [];
            }
        });
    }
}

