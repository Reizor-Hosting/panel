@extends('layouts.admin')

@section('title')
    GTNH Management
@endsection

@section('content-header')
    <h1>GTNH Management<small>Manage GregTech: New Horizons version cache.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">GTNH</li>
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
                        GTNH versions (stable, beta, experimental, and daily) are cached for 1 hour to reduce API calls to GitHub and downloads.gtnewhorizons.com.
                        Use the button below to manually clear the cache and force a refresh of version data.
                    </p>
                    
                    @if(Cache::has('gtnh.versions.stable') || Cache::has('gtnh.versions.beta') || Cache::has('gtnh.versions.experimental') || Cache::has('gtnh.versions.daily'))
                        <div class="alert alert-info">
                            <strong>Cache Status:</strong> Version data is currently cached.
                            <ul class="mb-0 mt-2">
                                @if(Cache::has('gtnh.versions.stable'))
                                    <li>Stable versions: Cached</li>
                                @endif
                                @if(Cache::has('gtnh.versions.beta'))
                                    <li>Beta versions: Cached</li>
                                @endif
                                @if(Cache::has('gtnh.versions.experimental'))
                                    <li>Experimental builds: Cached</li>
                                @endif
                                @if(Cache::has('gtnh.versions.daily'))
                                    <li>Daily builds: Cached</li>
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
                    <form action="{{ route('admin.gtnh.clear-cache') }}" method="POST">
                        {!! csrf_field() !!}
                        <button type="submit" class="btn btn-sm btn-danger">
                            <i class="fa fa-refresh"></i> Clear Version Cache
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

