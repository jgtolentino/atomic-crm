-- Fix FK constraints to allow user deletion from auth.users
-- When a user is deleted:
-- 1. The corresponding sales record is cascaded deleted
-- 2. References to sales in other tables are set to NULL (preserving data)

-- First, fix FK constraints from tables that reference sales
-- Change them to ON DELETE SET NULL to preserve data when a sales user is deleted

-- Fix companies.sales_id FK
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_sales_id_fkey;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_sales_id_fkey
  FOREIGN KEY (sales_id) REFERENCES public.sales(id)
  ON DELETE SET NULL;

-- Fix contacts.sales_id FK
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_sales_id_fkey;
ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_sales_id_fkey
  FOREIGN KEY (sales_id) REFERENCES public.sales(id)
  ON DELETE SET NULL;

-- Fix deals.sales_id FK
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_sales_id_fkey;
ALTER TABLE public.deals
  ADD CONSTRAINT deals_sales_id_fkey
  FOREIGN KEY (sales_id) REFERENCES public.sales(id)
  ON DELETE SET NULL;

-- Fix dealNotes.sales_id FK
ALTER TABLE public."dealNotes" DROP CONSTRAINT IF EXISTS "dealNotes_sales_id_fkey";
ALTER TABLE public."dealNotes"
  ADD CONSTRAINT "dealNotes_sales_id_fkey"
  FOREIGN KEY (sales_id) REFERENCES public.sales(id)
  ON DELETE SET NULL;

-- Note: contactNotes already has ON DELETE CASCADE which is fine

-- Finally, fix the main constraint: sales.user_id -> auth.users
-- Change to ON DELETE CASCADE so deleting auth user cascades to sales
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;
ALTER TABLE public.sales
  ADD CONSTRAINT sales_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;
