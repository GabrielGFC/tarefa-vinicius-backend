<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TodoController extends Controller
{
    public function index(): JsonResponse
    {
        $todos = Todo::query()->orderBy('id')->get();

        return response()->json(['data' => $todos], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'min:1', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $todo = Todo::query()->create([
            'title' => trim($validated['title']),
            'description' => trim($validated['description'] ?? ''),
            'completed' => false,
        ]);

        return response()->json(['data' => $todo], 201);
    }

    public function toggle(int $id): JsonResponse
    {
        $todo = Todo::query()->find($id);
        if (! $todo) {
            return response()->json(['message' => 'Todo not found'], 404);
        }

        $todo->completed = ! $todo->completed;
        $todo->save();

        return response()->json(['data' => $todo], 200);
    }

    public function destroy(int $id): Response|JsonResponse
    {
        $todo = Todo::query()->find($id);
        if (! $todo) {
            return response()->json(['message' => 'Todo not found'], 404);
        }

        $todo->delete();

        return response()->noContent();
    }

    public function stats(): JsonResponse
    {
        $total = Todo::query()->count();
        $completed = Todo::query()->where('completed', true)->count();
        $pending = $total - $completed;

        return response()->json([
            'total' => $total,
            'completed' => $completed,
            'pending' => $pending,
        ], 200);
    }
}
