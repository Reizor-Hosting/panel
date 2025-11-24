<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class GetCosmicFrontiersVersionsRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SETTINGS_REINSTALL;
    }

    public function rules(): array
    {
        return [
            'type' => 'sometimes|string|in:stable,nightly',
        ];
    }
}

