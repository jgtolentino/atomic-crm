import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // If there is at least 1 auth user, setup is complete
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;

    const setupRequired = (data?.users?.length ?? 0) === 0;

    return new Response(JSON.stringify({ setupRequired }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ setupRequired: false, error: String(e) }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  }
});
