# GTNH Version Switcher Setup

This document explains how to set up the GitHub token required for downloading experimental and daily builds from GitHub Actions.

## GitHub Token Setup

The GTNH version switcher can download experimental and daily builds from GitHub Actions. These builds require authentication to download.

### Creating a GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Pterodactyl GTNH Artifact Download")
4. Set expiration as needed (or "No expiration" for convenience)
5. Select the following permission:
   - `repo` (or just `public_repo` if the repository is public)
6. Click "Generate token"
7. Copy the token immediately (you won't be able to see it again!)

### Configuring the Panel

Add the following to your `.env` file:

```env
GITHUB_TOKEN=ghp_your_token_here
```

Replace `ghp_your_token_here` with your actual GitHub token.

After adding the token, clear the config cache:

```bash
php artisan config:clear
```

### Local Development Setup

If you're running the panel in a local development environment (e.g., `pterodactyl.test`), Wings containers need to be able to reach your panel. The simplest solution is to use an IP address instead of a hostname.

#### For Linux Development

1. Find your Docker gateway IP:
```bash
ip addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
# Output example: 172.17.0.1
```

2. Temporarily change your `APP_URL` in `.env` to use this IP:
```env
# Temporarily for testing GTNH version switcher
APP_URL=http://172.17.0.1
# Or if you're using a custom port (e.g., Laravel Herd):
APP_URL=http://172.17.0.1:8080
```

3. Make sure your web server is listening on `0.0.0.0` (all interfaces), not just `127.0.0.1`:
   - **Laravel Herd**: Already listens on all interfaces
   - **Laravel Valet**: May need configuration changes
   - **nginx/Apache**: Check your virtual host configuration

4. Clear the config cache:
```bash
php artisan config:clear
```

5. Remember to change `APP_URL` back to your normal development domain after testing!

#### For Docker Desktop (Mac/Windows)

Docker Desktop provides a special hostname that resolves to your host:

```env
APP_URL=http://host.docker.internal
# Or with a port:
APP_URL=http://host.docker.internal:8080
```

Then run:
```bash
php artisan config:clear
```

#### Note for Production

In production, your `APP_URL` will be a publicly accessible domain (e.g., `https://panel.example.com`), so Wings containers can reach it without any special configuration.

## How It Works

- **Stable and Beta versions**: Downloaded directly from `downloads.gtnewhorizons.com` (no authentication needed)
- **Experimental and Daily builds**: Automatically proxied through the panel with GitHub authentication
- **Caching**: Version lists are cached for 1 hour to reduce API calls. Admins can manually clear the cache from `/admin/gtnh`
  - When a GitHub artifact URL is set as the `PACK_LINK` variable, the backend automatically converts it to use the panel's proxy endpoint
  - The proxy URL uses `APP_URL` from your `.env`, so Wings can always reach it (even in local development)
  - The panel downloads the artifact from GitHub using the configured token and streams it to Wings

## Troubleshooting

### "GitHub token not configured" Error

If you see this error, make sure:
1. The `GITHUB_TOKEN` is set in your `.env` file
2. You've run `php artisan config:clear` after adding it
3. The token is valid and hasn't expired

### "Failed to download artifact" Error

This could mean:
1. The token doesn't have the correct permissions
2. The token has expired
3. The artifact no longer exists or has been deleted by GitHub

