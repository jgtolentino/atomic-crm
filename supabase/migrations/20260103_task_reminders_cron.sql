-- Set up pg_cron for automated task reminders
-- Runs every hour to check for tasks needing reminders

-- Enable pg_cron extension (requires superuser - run via Supabase Dashboard SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule task reminder job (runs every hour)
SELECT cron.schedule(
  'send-task-reminders',           -- job name
  '0 * * * *',                      -- cron schedule: every hour at :00
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/task-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify cron job was created
SELECT * FROM cron.job WHERE jobname = 'send-task-reminders';

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for automated task reminder emails';
