@extends('layouts.admin')

@section('title')
    Cosmic Frontiers Management
@endsection

@section('content-header')
    <h1>Cosmic Frontiers Management<small>Manage Cosmic Frontiers version cache.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Cosmic Frontiers</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Version Cache Management</h3>
                </div>
                <div class="box-body">
                    <p class="text-muted">
                        Cosmic Frontiers versions (stable and nightly builds) are cached for 1 hour to reduce API calls to GitHub.
                        Use the button below to manually clear the cache and force a refresh of version data from the 
                        <a href="https://github.com/Frontiers-PackForge/CosmicFrontiers/releases" target="_blank" rel="noopener noreferrer">
                            Cosmic Frontiers releases page
                        </a>.
                    </p>
                    
                    @if(Cache::has('cosmic_frontiers.versions.stable') || Cache::has('cosmic_frontiers.versions.nightly'))
                        <div class="alert alert-info">
                            <strong>Cache Status:</strong> Version data is currently cached.
                            <ul class="mb-0 mt-2">
                                @if(Cache::has('cosmic_frontiers.versions.stable'))
                                    <li>Stable releases: Cached</li>
                                @endif
                                @if(Cache::has('cosmic_frontiers.versions.nightly'))
                                    <li>Nightly builds (pre-releases): Cached</li>
                                @endif
                            </ul>
                        </div>
                    @else
                        <div class="alert alert-warning">
                            <strong>Cache Status:</strong> No version data is currently cached. Versions will be fetched on next request.
                        </div>
                    @endif
                </div>
                <div class="box-footer">
                    <form action="{{ route('admin.cosmic-frontiers.clear-cache') }}" method="POST">
                        {!! csrf_field() !!}
                        <button type="submit" class="btn btn-sm btn-danger">
                            <i class="fa fa-refresh"></i> Clear Version Cache
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">About Cosmic Frontiers</h3>
                </div>
                <div class="box-body">
                    <p>
                        Cosmic Frontiers is a Minecraft modpack that integrates with the panel's version switcher.
                        Servers using the Cosmic Frontiers egg can easily switch between stable releases and nightly builds
                        directly from their server settings page.
                    </p>
                    
                    <h4>Version Types</h4>
                    <ul>
                        <li><strong>Stable:</strong> Official releases from the repository</li>
                        <li><strong>Nightly:</strong> Pre-release builds for testing new features</li>
                    </ul>
                    
                    <h4>Useful Links</h4>
                    <ul>
                        <li>
                            <a href="https://github.com/Frontiers-PackForge/CosmicFrontiers" target="_blank" rel="noopener noreferrer">
                                GitHub Repository
                            </a>
                        </li>
                        <li>
                            <a href="https://github.com/Frontiers-PackForge/CosmicFrontiers/releases" target="_blank" rel="noopener noreferrer">
                                Releases Page
                            </a>
                        </li>
                        <li>
                            <a href="https://raw.githubusercontent.com/Frontiers-PackForge/CosmicFrontiers/main-1.20.1-Forge/server-mods-config.json" target="_blank" rel="noopener noreferrer">
                                Server Mods Blacklist Config
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
@endsection

