<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRbacPrivilege
{
    /**
     * Role privilege hierarchy weights.
     * C03.04: ADMIN (4) > ADJUDICATE (3) > READ (2) > VIEW (1)
     */
    protected const HIERARCHY = [
        'ADMIN' => 4,
        'ADJUDICATE' => 3,
        'READ' => 2,
        'VIEW' => 1,
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$privileges): Response
    {
        // 1. Session check - Fail-closed if session user is absent
        if (! session()->has('user')) {
            if ($request->isMethod('GET') && ! $request->expectsJson() && ! $request->is('api/*')) {
                return redirect()->guest(route('login'));
            }
            abort(403, 'Akses Ditolak: Hak Akses Tidak Memenuhi C03.04 Fail-Closed');
        }

        $user = session('user');

        // 2. Token expiration check
        if (isset($user['token_expires_at']) && $user['token_expires_at'] < time()) {
            session()->forget('user');
            abort(403, 'Akses Ditolak: Hak Akses Tidak Memenuhi C03.04 Fail-Closed (Sesi Kedaluwarsa)');
        }

        // 3. User allowed roles array from session (request input is strictly ignored)
        $allowedRoles = (array) ($user['allowedRoles'] ?? []);
        $roleName = (string) ($user['role'] ?? '');

        // If user has null or empty roles, fail-closed
        if (empty($allowedRoles) && empty($roleName)) {
            abort(403, 'Akses Ditolak: Hak Akses Tidak Memenuhi C03.04 Fail-Closed');
        }

        // Normalize roles to uppercase
        $userUpperRoles = array_map('strtoupper', $allowedRoles);

        // Derive weights from allowedRoles and role string
        $maxUserWeight = 0;
        foreach ($userUpperRoles as $r) {
            $w = self::HIERARCHY[$r] ?? 0;
            if ($w > $maxUserWeight) {
                $maxUserWeight = $w;
            }
        }

        // Additional role-title inference if allowedRoles was minimal
        $roleUpper = strtoupper($roleName);
        if (preg_match('/\b(ADMIN|ADMINISTRATOR)\b/i', $roleUpper)) {
            $maxUserWeight = max($maxUserWeight, 4);
            $userUpperRoles[] = 'ADMIN';
            $userUpperRoles[] = 'ADJUDICATE';
            $userUpperRoles[] = 'READ';
            $userUpperRoles[] = 'VIEW';
        } elseif (preg_match('/\bVERIFIKATOR\b/i', $roleUpper)) {
            $maxUserWeight = max($maxUserWeight, 3);
            $userUpperRoles[] = 'ADJUDICATE';
            $userUpperRoles[] = 'READ';
            $userUpperRoles[] = 'VIEW';
        } elseif (preg_match('/\b(ANALIS|AUDITOR)\b/i', $roleUpper)) {
            $maxUserWeight = max($maxUserWeight, 2);
            $userUpperRoles[] = 'READ';
            $userUpperRoles[] = 'VIEW';
        }

        if ($maxUserWeight === 0 && empty($userUpperRoles)) {
            abort(403, 'Akses Ditolak: Hak Akses Tidak Memenuhi C03.04 Fail-Closed');
        }

        // If no specific privilege parameter is provided to middleware, default to VIEW
        $requiredPrivileges = empty($privileges) ? ['VIEW'] : $privileges;

        // 4. Validate privilege against hierarchy and direct assignment
        $authorized = false;
        foreach ($requiredPrivileges as $required) {
            $requiredUpper = strtoupper(trim($required));

            // Direct role match
            if (in_array($requiredUpper, $userUpperRoles, true)) {
                $authorized = true;
                break;
            }

            // Hierarchy numeric check
            $requiredWeight = self::HIERARCHY[$requiredUpper] ?? 999;
            if ($maxUserWeight >= $requiredWeight) {
                $authorized = true;
                break;
            }
        }

        if (! $authorized) {
            abort(403, 'Akses Ditolak: Hak Akses Tidak Memenuhi C03.04 Fail-Closed');
        }

        return $next($request);
    }
}
