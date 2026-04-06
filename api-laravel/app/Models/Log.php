<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Log extends Model
{
    protected $table = 'logs';

    protected $fillable = [
        'event_id',
        'user_id',
        'todo_id',
        'action',
        'message',
        'request_id',
        'subject_email',
        'metadata',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'todo_id' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
