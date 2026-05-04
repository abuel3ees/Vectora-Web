<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('mobile theme page is displayed with the saved theme', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.mobile-theme'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/mobile-theme')
            ->where('themeKey', 'vectora')
            ->has('themes')
        );
});

test('mobile theme selection is saved and exposed to the driver app', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('settings.mobile-theme'))
        ->patch(route('settings.mobile-theme'), [
            'theme_key' => 'ocean-abyss',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('settings.mobile-theme'));

    $this->assertDatabaseHas('app_settings', [
        'key' => 'mobile_theme_key',
        'value' => 'ocean-abyss',
    ]);

    $this->get('/api/driver/public-config')
        ->assertOk()
        ->assertJsonPath('theme_key', 'ocean-abyss')
        ->assertJsonPath('theme_experience.mapStyle', 'satellite')
        ->assertJsonPath('theme_experience.navigation', 'floating-dock');
});

test('invalid mobile theme selections are rejected', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('settings.mobile-theme'))
        ->patch(route('settings.mobile-theme'), [
            'theme_key' => 'does-not-exist',
        ])
        ->assertSessionHasErrors('theme_key')
        ->assertRedirect(route('settings.mobile-theme'));

    $this->assertDatabaseHas('app_settings', [
        'key' => 'mobile_theme_key',
        'value' => 'vectora',
    ]);
});
