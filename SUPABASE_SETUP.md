# Supabase setup

The site needs a configured Supabase project to share listings between different
people and devices. Set it up as follows:

1. Create a project at [supabase.com](https://supabase.com/) and wait for it to finish provisioning.
2. In the Supabase SQL Editor, run the contents of `supabase-schema.sql`.
   If the opportunities table was already created, run it again to add the optional
   WhatsApp, Instagram, email, and phone fields used by the contact buttons.
3. In the project API settings, copy the Project URL and the **anon/public** key into
   `adwuma-config.js` — use `supabaseUrl` and `supabaseAnonKey` respectively.
4. In Authentication URL settings, set the Site URL to your deployed website URL and
   add that URL to the allowed redirect URLs.
5. Serve the site over HTTP(S) (for example, with your static-site host); opening the
   HTML files directly with `file://` is not a supported deployment.
6. Create accounts through the site's Sign Up form. If email confirmation is enabled,
   users must confirm their email before they can log in.
7. For Google sign-in, enable Google under Supabase **Authentication → Providers**,
   then add the Supabase callback URL shown there to the Google OAuth client's
   **Authorized redirect URIs**. Add your local development and deployed site URLs
   to Supabase's allowed redirect URLs. Use the hosted URL or `localhost`; Google
   sign-in does not work when opening the site with `file://`.

The anon/public key is intended for browser use. Never put a Supabase `service_role`
key in this site. Row Level Security allows everyone to read listings while only
authenticated users can publish them.

The current profile, saved-opportunity, and activity features still use browser-local
storage; only account sign-in and public opportunity listings are shared by this
integration. Contact details entered on listings are public.
