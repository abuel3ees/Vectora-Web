<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Http\Requests\AssertionRequest;
use Laragear\WebAuthn\Http\Requests\AttestedRequest;
use Laragear\WebAuthn\Http\Requests\AttestationRequest;

class WebAuthnConfirmController extends Controller
{
    /**
     * Returns the challenge options for registering a new fingerprint credential.
     */
    public function registerOptions(AttestationRequest $request): Responsable
    {
        return $request->fastRegistration()->toCreate();
    }

    /**
     * Saves the new credential to the database.
     */
    public function register(AttestedRequest $request): Response
    {
        $request->save();

        return response()->noContent();
    }

    /**
     * Returns whether the authenticated user has any registered credentials.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'registered' => auth()->user()->webAuthnCredentials()->exists(),
        ]);
    }

    /**
     * Returns the assertion challenge for the authenticated user.
     */
    public function confirmOptions(AssertionRequest $request): Responsable
    {
        return $request->toVerify(['email' => $request->user()->email]);
    }

    /**
     * Verifies the assertion belongs to the authenticated user.
     * Does not alter the session guard state (just confirms identity).
     */
    public function confirm(AssertedRequest $request): JsonResponse
    {
        $currentId = $request->user()->id;

        $verified = $request->login(
            callbacks: [fn ($user) => $user->id === $currentId]
        );

        return response()->json(['ok' => $verified !== null], $verified ? 200 : 422);
    }
}
