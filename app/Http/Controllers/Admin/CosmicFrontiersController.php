<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Http\Controllers\Controller;

class CosmicFrontiersController extends Controller
{
    /**
     * Display the Cosmic Frontiers management page.
     */
    public function index(): View
    {
        return view('admin.cosmic-frontiers.index');
    }

    /**
     * Clear the Cosmic Frontiers version cache.
     */
    public function clearCache(): RedirectResponse
    {
        Cache::forget('cosmic_frontiers.versions.stable');
        Cache::forget('cosmic_frontiers.versions.nightly');

        return redirect()->route('admin.cosmic-frontiers')->with('success', 'Cosmic Frontiers version cache cleared successfully. New versions will be fetched on next request.');
    }
}

