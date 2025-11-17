<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Repositories\Eloquent\ServerRepository;

class ChangeNestEggService
{
    /**
     * ChangeNestEggService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private DaemonFileRepository $fileRepository,
        private DaemonServerRepository $daemonServerRepository,
        private ServerRepository $serverRepository
    ) {
    }

    /**
     * Change the nest and egg for a server, delete all files, and reinstall.
     *
     * @throws \Throwable
     */
    public function handle(Server $server, int $nestId, int $eggId): Server
    {
        return $this->connection->transaction(function () use ($server, $nestId, $eggId) {
            // List all files in the root directory
            $this->fileRepository->setServer($server);
            try {
                $files = $this->fileRepository->getDirectory('/');

                // Extract file names from the directory listing
                $fileNames = array_map(function ($file) {
                    return is_array($file) ? ($file['name'] ?? $file) : $file;
                }, $files);

                // Delete all files if there are any
                if (!empty($fileNames)) {
                    $this->fileRepository->deleteFiles('/', $fileNames);
                }
            } catch (\Exception $e) {
                // If we can't list or delete files, continue anyway
                // The reinstall will handle cleaning up
            }

            // Delete old server variables since they belong to the old egg
            $this->connection->table('server_variables')
                ->where('server_id', $server->id)
                ->delete();

            // Get the new egg to retrieve its default startup command and image
            $newEgg = Egg::findOrFail($eggId);

            // Get the default docker image (first one in the list)
            $defaultImage = array_values($newEgg->docker_images)[0] ?? $newEgg->docker_image;

            // Update nest_id, egg_id, startup command, and docker image
            $this->serverRepository->update($server->id, [
                'nest_id' => $nestId,
                'egg_id' => $eggId,
                'startup' => $newEgg->startup,
                'image' => $defaultImage,
            ]);

            // Refresh the server model to get updated data
            $server->refresh();

            // Set status to installing and trigger reinstallation
            $server->fill(['status' => Server::STATUS_INSTALLING])->save();

            $this->daemonServerRepository->setServer($server)->reinstall();

            return $server->refresh();
        });
    }
}

