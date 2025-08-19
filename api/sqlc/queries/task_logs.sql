-- name: AddNewTaskLog :exec
INSERT INTO task_logs (
    task_id, account_id, type, status, queue, params
) VALUES (
    @task_id, @account_id, @type, @status, @queue, @params
);

-- name: UpdateTaskLogStart :exec
UPDATE task_logs SET 
status = 'processing', started_at = @started_at 
WHERE task_id = @task_id;

-- name: UpdateTaskLogRetryCount :exec
UPDATE task_logs SET
status = 'retrying', retries = @retries
WHERE task_id = @task_id;

-- name: UpdateTaskLogFinish :exec
UPDATE task_logs SET
status = 'succeeded', finished_at = @finished_at
WHERE task_id = @task_id;

-- name: UpdateTaskLogFailed :exec
UPDATE task_logs SET
status = 'failed', error = @error
WHERE task_id = @task_id;
