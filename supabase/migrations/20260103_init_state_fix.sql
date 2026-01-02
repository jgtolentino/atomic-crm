-- Fix init_state view to ensure it's accessible via REST API
-- This view determines if the app is initialized (has at least one sales user)

-- Drop and recreate the view to ensure it's in the public schema with correct permissions
drop view if exists public.init_state;

create view public.init_state
  with (security_invoker=off)
  as
select count(id) as is_initialized
from (
  select id
  from public.sales
  limit 1
) as sub;

-- Grant access to anon and authenticated roles for REST API access
grant select on public.init_state to anon, authenticated;

-- Add comment for documentation
comment on view public.init_state is 'Returns 1 if the CRM has been initialized (has at least one sales user), 0 otherwise';
