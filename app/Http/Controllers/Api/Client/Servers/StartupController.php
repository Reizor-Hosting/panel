<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Support\Facades\URL;
use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Servers\StartupCommandService;
use Pterodactyl\Repositories\Eloquent\ServerVariableRepository;
use Pterodactyl\Transformers\Api\Client\EggVariableTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\GetStartupRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\UpdateStartupVariableRequest;

class StartupController extends ClientApiController
{
    /**
     * StartupController constructor.
     */
    public function __construct(
        private StartupCommandService $startupCommandService,
        private ServerVariableRepository $repository
    ) {
        parent::__construct();
    }

    /**
     * Returns the startup information for the server including all the variables.
     */
    public function index(GetStartupRequest $request, Server $server): array
    {
        $startup = $this->startupCommandService->handle($server);

        return $this->fractal->collection(
            $server->variables()->where('user_viewable', true)->get()
        )
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'startup_command' => $startup,
                'docker_images' => $server->egg->docker_images,
                'raw_startup_command' => $server->startup,
            ])
            ->toArray();
    }

    /**
     * Updates a single variable for a server.
     *
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(UpdateStartupVariableRequest $request, Server $server): array
    {
        /** @var \Pterodactyl\Models\EggVariable $variable */
        $variable = $server->variables()->where('env_variable', $request->input('key'))->first();
        $original = $variable->server_value;

        if (is_null($variable) || !$variable->user_viewable) {
            throw new BadRequestHttpException('The environment variable you are trying to edit does not exist.');
        } elseif (!$variable->user_editable) {
            throw new BadRequestHttpException('The environment variable you are trying to edit is read-only.');
        }

        // Revalidate the variable value using the egg variable specific validation rules for it.
        $this->validate($request, ['value' => $variable->rules]);

        $value = $request->input('value') ?? '';

        // Auto-proxy GitHub artifact URLs for GTNH
        if ($variable->env_variable === 'PACK_LINK' && 
            str_contains($value, 'api.github.com') && 
            str_contains($value, '/artifacts/')) {
            // Convert GitHub artifact URL to use panel proxy with signed URL (valid for 24 hours)
            // Force URL generation to use APP_URL (for Docker container access in local dev)
            $appUrl = config('app.url');
            $scheme = parse_url($appUrl, PHP_URL_SCHEME);
            
            // Temporarily override the URL generator to use our APP_URL and scheme
            URL::forceRootUrl($appUrl);
            URL::forceScheme($scheme);
            
            $value = URL::temporarySignedRoute(
                'api:client:servers.gtnh.artifact-proxy',
                now()->addHours(24),
                [
                    'server' => $server->uuid,
                    'url' => $value,
                ]
            );
            
            // Reset URL generator to HTTPS if APP_URL was HTTPS
            URL::forceRootUrl(null);
            if (str_starts_with(config('app.url'), 'https://')) {
                URL::forceScheme('https');
            }
        }

        $this->repository->updateOrCreate([
            'server_id' => $server->id,
            'variable_id' => $variable->id,
        ], [
            'variable_value' => $value,
        ]);

        $variable = $variable->refresh();
        $variable->server_value = $value;

        $startup = $this->startupCommandService->handle($server);

        if ($original !== $value) {
            Activity::event('server:startup.edit')
                ->subject($variable)
                ->property([
                    'variable' => $variable->env_variable,
                    'old' => $original,
                    'new' => $value,
                ])
                ->log();
        }

        return $this->fractal->item($variable)
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'startup_command' => $startup,
                'raw_startup_command' => $server->startup,
            ])
            ->toArray();
    }
}
