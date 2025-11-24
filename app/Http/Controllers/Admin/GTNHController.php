<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Http\Controllers\Controller;

class GTNHController extends Controller
{
    /**
     * Display the GTNH management page.
     */
    public function index(): View
    {
        return view('admin.gtnh.index');
    }

    /**
     * Clear the GTNH version cache.
     */
    public function clearCache(): RedirectResponse
    {
        Cache::forget('gtnh.versions.stable');
        Cache::forget('gtnh.versions.beta');
        Cache::forget('gtnh.versions.experimental');
        Cache::forget('gtnh.versions.daily');

        return redirect()->route('admin.gtnh')->with('success', 'GTNH version cache cleared successfully. New versions will be fetched on next request.');
    }
}

