// Environment variable validation and exports
// Ensures Supabase configuration is valid before app initialization

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Hard fail if environment variables are missing or invalid
if (!SUPABASE_URL || !/^https?:\/\//.test(SUPABASE_URL)) {
  throw new Error(
    `Invalid VITE_SUPABASE_URL: "${SUPABASE_URL}". ` +
    `Expected a valid HTTP/HTTPS URL. ` +
    `Check Vercel environment variables or local .env file.`
  );
}

// Prevent common mistake: using Postgres connection string instead of HTTP API URL
if (SUPABASE_URL.startsWith('postgres://') || SUPABASE_URL.includes(':6543') || SUPABASE_URL.includes('pooler')) {
  throw new Error(
    `VITE_SUPABASE_URL is set to a Postgres connection string: "${SUPABASE_URL}". ` +
    `Frontend needs the HTTP API URL like: https://spdtwktxdalcfigzeqrz.supabase.co ` +
    `(Put Postgres connection strings in DATABASE_URL without VITE_ prefix for server-side use only)`
  );
}

// Enforce Supabase domain for additional safety
if (!SUPABASE_URL.includes('.supabase.co')) {
  throw new Error(
    `VITE_SUPABASE_URL must be a Supabase URL (*.supabase.co): "${SUPABASE_URL}"`
  );
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    `Missing VITE_SUPABASE_ANON_KEY. ` +
    `Check Vercel environment variables or local .env file.`
  );
}

// Log successful initialization (development only)
if (import.meta.env.DEV) {
  console.log('✅ Supabase environment variables validated:', {
    url: SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY,
  });
}
