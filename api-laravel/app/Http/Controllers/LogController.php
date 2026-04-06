<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = Log::query()
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $logs,
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => ['required', 'string', 'max:191'],
            'user_id' => ['nullable', 'integer', 'min:1'],
            'todo_id' => ['nullable', 'integer', 'min:1'],
            'action' => [
                'required',
                'string',
                Rule::in([
                    'todo_created',
                    'todo_toggled',
                    'todo_deleted',
                    'login_failed',
                    'access_denied',
                ]),
            ],
            'message' => ['required', 'string', 'max:255'],
            'request_id' => ['required', 'string', 'max:191'],
            'subject_email' => ['nullable', 'email', 'max:191'],
            'metadata' => ['nullable', 'array'],
        ]);

        $log = Log::query()->firstOrCreate(
            [
                'event_id' => $validated['event_id'],
            ],
            [
                'user_id' => $validated['user_id'] ?? null,
                'todo_id' => $validated['todo_id'] ?? null,
                'action' => $validated['action'],
                'message' => $validated['message'],
                'request_id' => $validated['request_id'],
                'subject_email' => $validated['subject_email'] ?? null,
                'metadata' => $validated['metadata'] ?? null,
            ],
        );

        return response()->json([
            'data' => $log,
        ], $log->wasRecentlyCreated ? 201 : 200);
    }
}
