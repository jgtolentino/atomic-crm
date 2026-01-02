import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@atomiccrm.com";
const APP_URL = Deno.env.get("APP_URL") || "https://atomic-crm-pink.vercel.app";

interface Task {
  id: number;
  contact_id: number;
  type: string;
  text: string;
  due_date: string;
  sales_id: number;
  reminder_hours_before: number;
  sales_email: string;
  sales_name: string;
  contact_name: string;
  company_name: string;
  hours_until_due: number;
}

serve(async (req) => {
  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: "crm" },
    });

    // Get all tasks pending reminders
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from("tasks_pending_reminders")
      .select("*");

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return new Response(JSON.stringify({ error: tasksError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send", count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${tasks.length} tasks needing reminders`);

    // Send reminders
    const results = await Promise.all(
      tasks.map(async (task: Task) => {
        try {
          await sendTaskReminder(task, supabaseAdmin);
          return { task_id: task.id, status: "sent", email: task.sales_email };
        } catch (error) {
          console.error(`Failed to send reminder for task ${task.id}:`, error);
          // Mark as failed in log
          await supabaseAdmin.rpc("mark_reminder_sent", {
            p_task_id: task.id,
            p_recipient_email: task.sales_email,
            p_status: "failed",
            p_error_message: error.message,
          });
          return { task_id: task.id, status: "failed", error: error.message };
        }
      })
    );

    const successCount = results.filter((r) => r.status === "sent").length;
    const failureCount = results.filter((r) => r.status === "failed").length;

    return new Response(
      JSON.stringify({
        message: "Reminder processing complete",
        total: tasks.length,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function sendTaskReminder(task: Task, supabaseAdmin: any) {
  const dueDate = new Date(task.due_date);
  const dueDateFormatted = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const hoursRounded = Math.round(task.hours_until_due);
  const timeUntil =
    hoursRounded < 24
      ? `${hoursRounded} hour${hoursRounded !== 1 ? "s" : ""}`
      : `${Math.round(hoursRounded / 24)} day${Math.round(hoursRounded / 24) !== 1 ? "s" : ""}`;

  const taskUrl = `${APP_URL}/contacts/${task.contact_id}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="margin-top: 0; color: #1a1a1a;">📋 Task Reminder</h2>
    <p style="font-size: 16px; margin-bottom: 8px;">Hi ${task.sales_name},</p>
    <p style="font-size: 16px;">You have a task due in <strong>${timeUntil}</strong>:</p>
  </div>

  <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <span style="background-color: #f0f0f0; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500;">${task.type}</span>
    </div>

    <h3 style="margin-top: 0; margin-bottom: 12px; color: #1a1a1a;">${task.text}</h3>

    <div style="margin-bottom: 8px;">
      <span style="color: #666; font-size: 14px;">Contact:</span>
      <strong style="margin-left: 8px;">${task.contact_name}</strong>
    </div>

    ${
      task.company_name
        ? `
    <div style="margin-bottom: 8px;">
      <span style="color: #666; font-size: 14px;">Company:</span>
      <strong style="margin-left: 8px;">${task.company_name}</strong>
    </div>
    `
        : ""
    }

    <div style="margin-bottom: 16px;">
      <span style="color: #666; font-size: 14px;">Due:</span>
      <strong style="margin-left: 8px; color: #d32f2f;">${dueDateFormatted}</strong>
    </div>

    <a href="${taskUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin-top: 8px;">View Task</a>
  </div>

  <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; padding-top: 16px;">
    <p>This is an automated reminder from Atomic CRM</p>
    <p style="margin-top: 8px;">
      <a href="${APP_URL}/settings" style="color: #2563eb; text-decoration: none;">Manage Notification Preferences</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  // Send email via Resend
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: task.sales_email,
      subject: `⏰ Task due ${timeUntil}: ${task.text.substring(0, 50)}${
        task.text.length > 50 ? "..." : ""
      }`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
  }

  // Mark reminder as sent
  await supabaseAdmin.rpc("mark_reminder_sent", {
    p_task_id: task.id,
    p_recipient_email: task.sales_email,
    p_status: "sent",
    p_error_message: null,
  });

  console.log(`✅ Reminder sent for task ${task.id} to ${task.sales_email}`);
}
