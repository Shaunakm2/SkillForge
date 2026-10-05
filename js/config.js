/* Skillforge LMS — connection settings.
 * Leave SUPABASE_URL empty to run the app in the browser with sample data (no backend).
 * Fill both values to use Supabase (see SETUP-SUPABASE.md). The anon key is public by design:
 * Row Level Security in the database decides what each signed-in person can read and write.
 */
window.SKILLFORGE_CONFIG = {
  SUPABASE_URL: '',          // e.g. 'https://abcdefghijkl.supabase.co'
  SUPABASE_ANON_KEY: '',     // Project Settings > API > anon public key
  ORG_ID: 'northwind',       // one Supabase project can hold several organisations
  STORAGE_BUCKET: 'lms-files',
};
