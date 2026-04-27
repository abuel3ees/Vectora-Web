<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppSettingsController extends Controller
{
    public function developer(): Response
    {
        return Inertia::render('settings/developer', [
            'testDriverQuickLogin' => AppSetting::get('test_driver_quick_login', 'false') === 'true',
        ]);
    }

    public function updateDeveloper(Request $request)
    {
        AppSetting::set(
            'test_driver_quick_login',
            $request->boolean('test_driver_quick_login') ? 'true' : 'false',
        );

        return back();
    }

    public function publicConfig(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'features' => [
                'test_driver_quick_login' => AppSetting::get('test_driver_quick_login', 'false') === 'true',
            ],
        ]);
    }
}
