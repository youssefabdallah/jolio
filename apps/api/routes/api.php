<?php

use Illuminate\Support\Facades\Route;
use Src\Config\Presentation\Http\Controllers\DeleteSourceController;
use Src\Config\Presentation\Http\Controllers\ListSourcesController;
use Src\Config\Presentation\Http\Controllers\ShowSourceController;
use Src\Config\Presentation\Http\Controllers\StoreSourceController;
use Src\Config\Presentation\Http\Controllers\UpdateSourceController;
use Src\Identity\Presentation\Http\Controllers\LoginController;
use Src\Identity\Presentation\Http\Controllers\LogoutController;
use Src\Identity\Presentation\Http\Controllers\MeController;
use Src\Identity\Presentation\Http\Controllers\OAuthCallbackController;
use Src\Identity\Presentation\Http\Controllers\OAuthRedirectController;
use Src\Identity\Presentation\Http\Controllers\RegisterController;
use Src\Profile\Presentation\Http\Controllers\ShowProfileController;
use Src\Profile\Presentation\Http\Controllers\UpdateProfileController;

Route::get('/user', MeController::class)->middleware('auth:sanctum');

Route::get('/profile', ShowProfileController::class)
    ->middleware(['auth:sanctum', 'throttle:60,1'])
    ->name('profile.show');

Route::put('/profile', UpdateProfileController::class)
    ->middleware(['auth:sanctum', 'throttle:60,1'])
    ->name('profile.update');

Route::prefix('v1/sources')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/', ListSourcesController::class)->name('sources.index');
    Route::post('/', StoreSourceController::class)->name('sources.store');
    Route::get('/{source}', ShowSourceController::class)->name('sources.show');
    Route::put('/{source}', UpdateSourceController::class)->name('sources.update');
    Route::delete('/{source}', DeleteSourceController::class)->name('sources.destroy');
});

Route::prefix('v1/auth')->middleware('throttle:60,1,auth-v1')->group(function (): void {
    Route::post('/register', RegisterController::class)
        ->middleware('throttle:10,1,auth-register')
        ->name('auth.register');

    Route::post('/login', LoginController::class)
        ->middleware('throttle:5,1,auth-login')
        ->name('auth.login');

    Route::post('/logout', LogoutController::class)
        ->middleware('auth:sanctum')
        ->name('auth.logout');

    Route::get('/{provider}/redirect', OAuthRedirectController::class)->name('auth.redirect');
    Route::get('/{provider}/callback', OAuthCallbackController::class)->name('auth.callback');
});
