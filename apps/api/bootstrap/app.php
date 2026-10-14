<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Src\Shared\Domain\Exceptions\DomainException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Uniform API error shape for every Domain violation, rendered once
        // and centrally: { error: { code, message, details? } }.
        $exceptions->render(function (DomainException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $error = [
                'code' => $exception->errorCode->value,
                'message' => __($exception->translationKey, $exception->context),
            ];

            return response()->json(['error' => $error], $exception->errorCode->httpStatus());
        });

        // Rate-limit lockouts speak the same envelope, translated, with the
        // framework's Retry-After hint passed through.
        $exceptions->render(function (ThrottleRequestsException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'error' => [
                    'code' => 'TOO_MANY_ATTEMPTS',
                    'message' => __('http.too_many_attempts'),
                ],
            ], 429, $exception->getHeaders());
        });
    })->create();
