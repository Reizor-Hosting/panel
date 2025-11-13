<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use League\Fractal\Resource\Collection;
use League\Fractal\Resource\NullResource;

class NestTransformer extends BaseClientTransformer
{
    /**
     * Relationships that can be loaded onto this transformation.
     */
    protected array $availableIncludes = [
        'eggs',
    ];

    /**
     * Return the resource name for the JSONAPI output.
     */
    public function getResourceName(): string
    {
        return Nest::RESOURCE_NAME;
    }

    public function transform(Nest $nest): array
    {
        return [
            'id' => $nest->id,
            'uuid' => $nest->uuid,
            'name' => $nest->name,
            'description' => $nest->description,
        ];
    }

    /**
     * Include the Eggs relationship on the given Nest model transformation.
     *
     * @throws \Pterodactyl\Exceptions\Transformer\InvalidTransformerLevelException
     */
    public function includeEggs(Nest $model): Collection|NullResource
    {
        $model->loadMissing('eggs');

        return $this->collection($model->getRelation('eggs'), $this->makeTransformer(EggTransformer::class), Egg::RESOURCE_NAME);
    }
}

