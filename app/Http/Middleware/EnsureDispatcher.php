<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDispatcher
{
    /**
     * Allow only dispatcher/admin users into the web dashboard. Drivers (and
     * any user without a dispatch role) are sent to the "download the app" page
     * instead — the web dashboard is not for them.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['admin', 'dispatcher'])) {
            return redirect()->route('driver.app');
        }

        return $next($request);
    }
}
