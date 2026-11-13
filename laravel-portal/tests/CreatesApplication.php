<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

trait CreatesApplication
{
    /**
     * Creates the application.
     */
    public function createApplication(): Application
    {
        $app = require __DIR__ . '/../bootstrap/app.php';

        if ($app instanceof Application && $app->bound(Kernel::class)) {
            $app->make(Kernel::class)->bootstrap();
        } elseif (method_exists($app, 'make')) {
            try {
                $app->make(Kernel::class)->bootstrap();
            } catch (\Throwable $e) {
                // Handled for Laravel 11 bootstrap pipeline
            }
        }

        return $app;
    }
}
