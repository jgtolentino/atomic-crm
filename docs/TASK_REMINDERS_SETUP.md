# Task Reminders Setup Guide

Complete setup guide for the automated task reminder system in Atomic CRM.

## Features

✅ **Create Tasks** - Already active!
- Create tasks from dashboard or contact pages
- Set task type, due date, description, and contact
- Tasks automatically organized by timeline (Overdue, Today, Tomorrow, This Week, Later)

🔔 **Automated Reminders** - New feature!
- Email notifications for upcoming tasks
- Customizable reminder timing (1 hour to 1 week before due date)
- Per-task reminder settings
- User-level reminder preferences
- Audit log of all sent reminders

## Database Setup

### Step 1: Apply Migrations

```bash
# Apply the task reminder migrations
psql "$POSTGRES_URL" < supabase/migrations/20260103_task_reminders.sql

# Verify tables were created
psql "$POSTGRES_URL" -c "\d crm.tasks"
psql "$POSTGRES_URL" -c "\dt crm.reminder*"
```

**What this creates:**
- ✅ New columns on `crm.tasks`: `reminder_enabled`, `reminder_sent_at`, `reminder_hours_before`
- ✅ Table `crm.reminder_preferences` - User reminder settings
- ✅ Table `crm.task_reminder_log` - Audit trail
- ✅ View `crm.tasks_pending_reminders` - Tasks needing emails
- ✅ Function `crm.mark_reminder_sent()` - Mark reminders as sent
- ✅ RLS policies for security

### Step 2: Enable pg_cron (Supabase Dashboard)

1. Go to **Supabase Dashboard → SQL Editor**
2. Run this command:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
```

3. Then apply the cron job migration:

```bash
psql "$POSTGRES_URL" < supabase/migrations/20260103_task_reminders_cron.sql
```

**What this does:**
- ✅ Schedules hourly check for tasks needing reminders
- ✅ Automatically calls the Edge Function to send emails

## Edge Function Setup

### Step 3: Deploy Edge Function

```bash
# Deploy the task-reminders function
supabase functions deploy task-reminders

# Verify deployment
supabase functions list
```

### Step 4: Set Environment Variables

```bash
# Set required environment variables for the Edge Function
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set FROM_EMAIL=noreply@yourcrm.com
supabase secrets set APP_URL=https://your-atomic-crm.vercel.app

# Verify secrets
supabase secrets list
```

**Required Secrets:**
- `RESEND_API_KEY` - Get from https://resend.com (free tier available)
- `FROM_EMAIL` - Email address for sending reminders
- `APP_URL` - Your deployed frontend URL
- `SUPABASE_URL` - Auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set by Supabase

### Step 5: Manual Test

Test the reminder system manually:

```bash
# Call the Edge Function directly
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://spdtwktxdalcfigzeqrz.supabase.co/functions/v1/task-reminders"
```

Expected response:
```json
{
  "message": "Reminder processing complete",
  "total": 2,
  "sent": 2,
  "failed": 0,
  "results": [...]
}
```

## Frontend Updates

### Step 6: Deploy Frontend Changes

The following files have been updated:

1. **`src/components/atomic-crm/tasks/AddTask.tsx`**
   - ✅ Added reminder toggle and timing selector
   - ✅ Default: Enabled, 24 hours before

2. **`src/components/atomic-crm/settings/ReminderSettings.tsx`** (NEW)
   - ✅ User reminder preferences UI
   - ✅ Email notification toggle
   - ✅ Default reminder timing

Deploy to Vercel:

```bash
# Deploy to production
vercel --prod --yes
```

## Configuration

### User Preferences

Users can configure reminders in **Settings** page:

1. **Email Reminders** - Toggle on/off
2. **Default Reminder Time** - 1 hour to 1 week before due date
3. Settings persist across all new tasks

### Per-Task Configuration

When creating a task:

1. **Send reminder email** - Toggle (default: ON)
2. **Remind me** - Select timing (default: user's preference or 24 hours)

## Email Template

Reminder emails include:

- 📋 Task details (type, description, due date)
- 👤 Contact and company information
- ⏰ Time until due date
- 🔗 Direct link to task
- ⚙️ Link to manage notification preferences

## Testing

### Create Test Task

1. Go to Dashboard
2. Click "+" icon next to "Upcoming Tasks"
3. Fill in:
   - Description: "Test reminder"
   - Contact: (select any)
   - Due Date: Tomorrow
   - Type: Email
   - Reminder: 1 hour before ✓
4. Click Save

### Verify Reminder Queue

```sql
-- Check tasks pending reminders
SELECT * FROM crm.tasks_pending_reminders;
```

### Trigger Immediate Send

```bash
# Manually trigger the Edge Function
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/functions/v1/task-reminders"
```

### Check Logs

```sql
-- View reminder log
SELECT * FROM crm.task_reminder_log
ORDER BY created_at DESC
LIMIT 10;

-- Check if reminder was marked as sent
SELECT id, text, due_date, reminder_sent_at
FROM crm.tasks
WHERE reminder_enabled = true
ORDER BY id DESC
LIMIT 10;
```

## Monitoring

### Cron Job Status

```sql
-- Check pg_cron status
SELECT * FROM cron.job WHERE jobname = 'send-task-reminders';

-- View recent cron runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-task-reminders')
ORDER BY start_time DESC
LIMIT 10;
```

### Reminder Analytics

```sql
-- Count sent vs pending reminders today
SELECT
  CASE
    WHEN reminder_sent_at IS NOT NULL THEN 'sent'
    WHEN reminder_enabled = true THEN 'pending'
    ELSE 'disabled'
  END as status,
  COUNT(*) as count
FROM crm.tasks
WHERE due_date >= CURRENT_DATE
  AND done_date IS NULL
GROUP BY status;
```

## Troubleshooting

### No Reminders Being Sent

1. **Check cron job:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'send-task-reminders';
   ```

2. **Check pending reminders:**
   ```sql
   SELECT * FROM crm.tasks_pending_reminders;
   ```

3. **Check Edge Function logs:**
   ```bash
   supabase functions logs task-reminders
   ```

### Email Not Received

1. **Check reminder log:**
   ```sql
   SELECT * FROM crm.task_reminder_log
   WHERE task_id = <TASK_ID>;
   ```

2. **Verify Resend API key:**
   ```bash
   supabase secrets list
   ```

3. **Check spam folder** - Add `FROM_EMAIL` to contacts

### Reminder Sent Multiple Times

Check `reminder_sent_at` column:

```sql
UPDATE crm.tasks
SET reminder_sent_at = NULL
WHERE id = <TASK_ID>;
-- Only reset if you want to resend
```

## Cost Optimization

**Free Tiers:**
- **Resend**: 100 emails/day, 3,000 emails/month
- **Supabase**: pg_cron included in free tier
- **Edge Functions**: 500K executions/month

**Estimated Usage:**
- 10 tasks/day with reminders = 10 emails/day = 300 emails/month
- Well within free tier limits

## Security

✅ **Row-Level Security (RLS)**
- Users can only see their own reminder preferences
- Users can only see reminder logs for their tasks
- Edge Function uses service role for system operations

✅ **Email Privacy**
- Only sales rep receives reminder for their tasks
- No contact email addresses exposed
- Reminder emails sent from system address

## Next Steps

1. ✅ Apply database migrations
2. ✅ Enable pg_cron
3. ✅ Deploy Edge Function
4. ✅ Set environment variables
5. ✅ Deploy frontend changes
6. ✅ Create test task
7. ✅ Verify email received
8. ✅ Monitor logs for 24 hours

## Support

For issues:
1. Check Supabase Dashboard → Logs
2. Check Edge Function logs: `supabase functions logs task-reminders`
3. Review `crm.task_reminder_log` table
4. Verify environment variables are set correctly

---

**Last Updated**: 2026-01-03
**Version**: 1.0.0
