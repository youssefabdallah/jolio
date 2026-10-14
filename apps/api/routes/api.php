<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Src\Identity\Presentation\Http\Controllers\LoginController;
use Src\Identity\Presentation\Http\Controllers\LogoutController;
use Src\Identity\Presentation\Http\Controllers\OAuthCallbackController;
use Src\Identity\Presentation\Http\Controllers\OAuthRedirectController;
use Src\Identity\Presentation\Http\Controllers\RegisterController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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
