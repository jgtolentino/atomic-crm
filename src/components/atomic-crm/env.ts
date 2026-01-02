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
