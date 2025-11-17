<?php

namespace Pterodactyl\Tests\Unit\Services\Servers;

use Mockery as m;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Services\Servers\CpuThreadAssignmentService;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;

class CpuThreadAssignmentServiceTest extends TestCase
{
    private CpuThreadAssignmentService $service;
    private DaemonConfigurationRepository $daemonConfigRepository;

    /**
     * Setup tests.
     */
    public function setUp(): void
    {
        parent::setUp();

        $this->daemonConfigRepository = m::mock(DaemonConfigurationRepository::class);
        $this->service = new CpuThreadAssignmentService($this->daemonConfigRepository);
    }

    /**
     * Test that thread string parsing works correctly.
     */
    public function testParseThreadString()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('parseThreadString');
        $method->setAccessible(true);

        // Test single thread
        $result = $method->invoke($this->service, '0');
        $this->assertEquals([0], $result);

        // Test comma-separated threads
        $result = $method->invoke($this->service, '0,1,3');
        $this->assertEquals([0, 1, 3], $result);

        // Test range
        $result = $method->invoke($this->service, '0-3');
        $this->assertEquals([0, 1, 2, 3], $result);

        // Test mixed
        $result = $method->invoke($this->service, '0-1,3,5-7');
        $this->assertEquals([0, 1, 3, 5, 6, 7], $result);
    }

    /**
     * Test calculating free threads.
     */
    public function testCalculateFreeThreads()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculateFreeThreads');
        $method->setAccessible(true);

        // Test with 8 total threads and some assigned
        $result = $method->invoke($this->service, 8, [0, 1, 4, 5]);
        $this->assertEquals([2, 3, 6, 7], $result);

        // Test with no assigned threads
        $result = $method->invoke($this->service, 4, []);
        $this->assertEquals([0, 1, 2, 3], $result);

        // Test with all threads assigned
        $result = $method->invoke($this->service, 4, [0, 1, 2, 3]);
        $this->assertEquals([], $result);
    }

    /**
     * Test that thread assignment returns correct format.
     */
    public function testThreadAssignmentFormat()
    {
        $node = m::mock(Node::class);
        $node->id = 1;

        // Mock the daemon repository to return system info
        $this->daemonConfigRepository->shouldReceive('setNode')
            ->with($node)
            ->andReturnSelf();

        $this->daemonConfigRepository->shouldReceive('getSystemInformation')
            ->with(2)
            ->andReturn([
                'system' => [
                    'cpu_threads' => 8,
                ],
            ]);

        // Mock database query for servers
        // We'll assume no servers exist on this node for simplicity
        $this->app['db']->shouldReceive('table')->andReturnSelf();
        $this->app['db']->shouldReceive('where')->andReturnSelf();
        $this->app['db']->shouldReceive('whereNotNull')->andReturnSelf();
        $this->app['db']->shouldReceive('pluck')->andReturn(collect([]));

        Log::shouldReceive('warning')->never();
        Log::shouldReceive('error')->never();

        $result = $this->service->assignFreeThreads(1, 2);

        // Should return a comma-separated string of thread numbers
        $this->assertIsString($result);
        $this->assertMatchesRegularExpression('/^[0-9,]+$/', $result);
    }
}

