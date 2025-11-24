<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetCosmicFrontiersVersionsRequest;

class CosmicFrontiersVersionController extends ClientApiController
{
    /**
     * Fetch Cosmic Frontiers versions from GitHub Releases API.
     */
    public function index(GetCosmicFrontiersVersionsRequest $request, Server $server): JsonResponse
    {
        $type = $request->query('type', 'stable');

        $versions = match ($type) {
            'stable' => $this->fetchStableVersions(),
            'nightly' => $this->fetchNightlyVersions(),
            default => [],
        };

        return new JsonResponse($versions);
    }

    /**
     * Fetch stable (non-prerelease) versions from GitHub Releases
     */
    private function fetchStableVersions(): array
    {
        return Cache::remember('cosmic_frontiers.versions.stable', now()->addHour(), function () {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['Accept' => 'application/vnd.github.v3+json'])
                    ->get('https://api.github.com/repos/Frontiers-PackForge/CosmicFrontiers/releases', [
                        'per_page' => 50,
                    ]);

                if (!$response->successful()) {
                    return [];
                }

                $releases = $response->json();
                $versions = [];

                foreach ($releases as $release) {
                    // Only include non-prerelease versions as stable
                    if (!($release['prerelease'] ?? false) && !($release['draft'] ?? false)) {
                        // Find the main zip asset
                        $zipAsset = null;
                        foreach ($release['assets'] ?? [] as $asset) {
                            if (str_ends_with($asset['name'], '.zip')) {
                                $zipAsset = $asset;
                                break;
                            }
                        }

                        if ($zipAsset) {
                            $versions[] = [
                                'name' => $release['tag_name'] ?? $release['name'],
                                'url' => $zipAsset['browser_download_url'],
                                'type' => 'stable',
                                'date' => $release['published_at'] ?? $release['created_at'],
                                'size' => $zipAsset['size'] ?? null,
                            ];
                        }
                    }
                }

                // Already sorted by date from GitHub API (newest first)
                return $versions;
            } catch (\Exception $e) {
                \Log::error('Failed to fetch Cosmic Frontiers stable versions: ' . $e->getMessage());
                return [];
            }
        });
    }

    /**
     * Fetch nightly (prerelease) versions from GitHub Releases
     */
    private function fetchNightlyVersions(): array
    {
        return Cache::remember('cosmic_frontiers.versions.nightly', now()->addHour(), function () {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['Accept' => 'application/vnd.github.v3+json'])
                    ->get('https://api.github.com/repos/Frontiers-PackForge/CosmicFrontiers/releases', [
                        'per_page' => 50,
                    ]);

                if (!$response->successful()) {
                    return [];
                }

                $releases = $response->json();
                $versions = [];

                foreach ($releases as $release) {
                    // Only include prerelease versions as nightly
                    if (($release['prerelease'] ?? false) && !($release['draft'] ?? false)) {
                        // Find the main zip asset
                        $zipAsset = null;
                        foreach ($release['assets'] ?? [] as $asset) {
                            if (str_ends_with($asset['name'], '.zip')) {
                                $zipAsset = $asset;
                                break;
                            }
                        }

                        if ($zipAsset) {
                            $versions[] = [
                                'name' => $release['tag_name'] ?? $release['name'],
                                'url' => $zipAsset['browser_download_url'],
                                'type' => 'nightly',
                                'date' => $release['published_at'] ?? $release['created_at'],
                                'size' => $zipAsset['size'] ?? null,
                            ];
                        }
                    }
                }

                // Already sorted by date from GitHub API (newest first)
                return $versions;
            } catch (\Exception $e) {
                \Log::error('Failed to fetch Cosmic Frontiers nightly versions: ' . $e->getMessage());
                return [];
            }
        });
    }
}

