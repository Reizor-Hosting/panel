<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetGTNHArtifactRequest;

class GTNHArtifactProxyController extends ClientApiController
{
    /**
     * Proxy a GitHub Actions artifact download to bypass authentication requirements.
     * This allows Wings to download artifacts that normally require authentication.
     */
    public function download(GetGTNHArtifactRequest $request, Server $server): StreamedResponse
    {
        // Force the app URL for this request to prevent redirects
        // This is necessary when the request comes from Docker containers using internal IPs
        $request->server->set('HTTP_HOST', parse_url(config('app.url'), PHP_URL_HOST));
        
        $artifactUrl = $request->input('url');
        
        // Extract artifact ID from URL
        // Format: https://api.github.com/repos/GTNewHorizons/DreamAssemblerXXL/actions/artifacts/{id}/zip
        if (!preg_match('/\/artifacts\/(\d+)\/zip/', $artifactUrl, $matches)) {
            abort(400, 'Invalid artifact URL');
        }

        $artifactId = $matches[1];
        
        // Get GitHub token from config
        $githubToken = config('services.github.token');
        
        if (empty($githubToken)) {
            abort(500, 'GitHub token not configured. Please set GITHUB_TOKEN in your .env file.');
        }

        return new StreamedResponse(function () use ($artifactUrl, $githubToken) {
            $response = Http::withToken($githubToken)
                ->timeout(300)
                ->withOptions(['stream' => true])
                ->get($artifactUrl);

            if (!$response->successful()) {
                echo json_encode([
                    'error' => 'Failed to download artifact from GitHub',
                    'status' => $response->status(),
                ]);
                return;
            }

            // Stream the response body
            $body = $response->getBody();
            while (!$body->eof()) {
                echo $body->read(8192);
                flush();
            }
        }, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="gtnh-server-pack.zip"',
            'X-Accel-Buffering' => 'no',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}

