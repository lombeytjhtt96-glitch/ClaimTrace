<?php

namespace App\Providers;

use App\Services\ZeroPhiMasker;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Blade Directives untuk Zero-PHI Masking (UU PDP No. 27/2022)
        Blade::directive('maskPhi', function ($expression) {
            return "<?php echo \App\Services\ZeroPhiMasker::mask({$expression}); ?>";
        });

        Blade::directive('maskNik', function ($expression) {
            return "<?php echo \App\Services\ZeroPhiMasker::maskNik({$expression}); ?>";
        });

        Blade::directive('maskCard', function ($expression) {
            return "<?php echo \App\Services\ZeroPhiMasker::maskBpjsCard({$expression}); ?>";
        });

        Blade::directive('pseudonymize', function ($expression) {
            return "<?php echo \App\Services\ZeroPhiMasker::maskName({$expression}); ?>";
        });

        // 2. Gate RBAC C03.04 (Mendukung verifikasi sesi tanpa Eloquent Auth wajib)
        Gate::define('adjudicate-claim', function ($user = null) {
            $sessionUser = session('user');
            if (!$sessionUser) {
                return false;
            }
            $roles = array_map('strtoupper', (array) ($sessionUser['allowedRoles'] ?? []));
            $roleName = strtoupper((string) ($sessionUser['role'] ?? ''));

            return in_array('ADJUDICATE', $roles, true)
                || in_array('ADMIN', $roles, true)
                || str_contains($roleName, 'VERIFIKATOR')
                || str_contains($roleName, 'ADMIN');
        });

        Gate::define('admin-policy', function ($user = null) {
            $sessionUser = session('user');
            if (!$sessionUser) {
                return false;
            }
            $roles = array_map('strtoupper', (array) ($sessionUser['allowedRoles'] ?? []));
            $roleName = strtoupper((string) ($sessionUser['role'] ?? ''));

            return in_array('ADMIN', $roles, true)
                || str_contains($roleName, 'ADMIN');
        });

        Gate::define('read-claims', function ($user = null) {
            $sessionUser = session('user');
            if (!$sessionUser) {
                return false;
            }
            $roles = array_map('strtoupper', (array) ($sessionUser['allowedRoles'] ?? []));

            return in_array('READ', $roles, true)
                || in_array('ADJUDICATE', $roles, true)
                || in_array('ADMIN', $roles, true)
                || !empty($roles);
        });

        Gate::define('view-claims', function ($user = null) {
            $sessionUser = session('user');
            if (!$sessionUser) {
                return false;
            }
            $roles = array_map('strtoupper', (array) ($sessionUser['allowedRoles'] ?? []));

            return !empty($roles) || !empty($sessionUser['role']);
        });
    }
}
