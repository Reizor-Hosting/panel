<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Nests;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Transformers\Api\Client\EggTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;

class EggController extends ClientApiController
{
    /**
     * Return all eggs that exist for a given nest.
     */
    public function index(Nest $nest): array
    {
        $nest->loadMissing('eggs');

        return $this->fractal->collection($nest->eggs)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    /**
     * Return a single egg that exists on the specified nest.
     */
    public function view(Nest $nest, Egg $egg): array
    {
        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }
}

