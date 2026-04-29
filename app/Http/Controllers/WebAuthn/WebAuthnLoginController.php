<?php

namespace App\Http\Controllers\WebAuthn;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Http\Requests\AssertionRequest;

use function response;

class WebAuthnLoginController
{
    /**
     * Returns the challenge to assertion.
     */
    public function options(AssertionRequest $request): Responsable
    {
        return $request->secureLogin()->toVerify($request->validate(['email' => 'required|email|string']));
    }

    /**
     * Log the user in.
     */
    public function login(AssertedRequest $request): JsonResponse
    {
        if ($request->login()) {
            return response()->json([
                'ok' => true,
                'redirect' => redirect()->intended(route('dashboard'))->getTargetUrl(),
            ]);
        }

        return response()->json(['ok' => false], 422);
    }
}
