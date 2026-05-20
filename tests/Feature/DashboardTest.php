<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    foreach (['admin', 'dispatcher', 'driver'] as $role) {
        Role::findOrCreate($role);
    }
});

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('dispatchers can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('dispatcher');
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('admins can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('drivers are redirected to the app download page', function () {
    $user = User::factory()->create();
    $user->assignRole('driver');
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('driver.app'));
});

test('users without a dispatch role cannot reach the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('driver.app'));
});
