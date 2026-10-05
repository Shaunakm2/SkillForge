/* Loads the Supabase client from this site (vendor/supabase.js, pinned version — see scripts/vendor-supabase.sh)
 * only when js/config.js is filled in. No third-party script host is used, so the Content-Security-Policy can
 * allow scripts from this site only. */
(function () {
  var c = window.SKILLFORGE_CONFIG || {};
  if (c.SUPABASE_URL && c.SUPABASE_ANON_KEY) document.write('<script src="vendor/supabase.js"><\/script>');
})();
