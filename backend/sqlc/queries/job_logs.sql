-- name: AddNewJobLog :exec
INSERT INTO job_logs (
    job_id, account_id, type, status, queue, params
) VALUES (
    @job_id, @account_id, @type, @status, @queue, @params
);

-- name: UpdateJobLogStart :exec
UPDATE job_logs SET 
status = 'processing', started_at = @started_at 
WHERE job_id = @job_id;

-- name: UpdateJobLogRetryCount :exec
UPDATE job_logs SET
status = 'retrying', retries = @retries
WHERE job_id = @job_id;

-- name: UpdateJobLogFinish :exec
UPDATE job_logs SET
status = 'succeeded', finished_at = @finished_at
WHERE job_id = @job_id;

-- name: UpdateJobLogFailed :exec
UPDATE job_logs SET
status = 'failed', error = @error
WHERE job_id = @job_id;