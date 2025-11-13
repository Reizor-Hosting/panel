<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Settings;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ChangeNestEggRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'nest_id' => 'required|integer|exists:nests,id',
            'egg_id' => 'required|integer|exists:eggs,id',
        ];
    }
}

