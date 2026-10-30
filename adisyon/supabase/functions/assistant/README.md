# Gus Asistan (Edge Function)

The app works without this function: it falls back to a local ranking (budget, rating, popularity and
keyword hints in reviews). Deploying it turns the assistant into a Claude-powered one.

1. Install the Supabase CLI and log in: `supabase login`
2. Link the project: `supabase link --project-ref <your-project-ref>`
3. Set the secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
4. Deploy: `supabase functions deploy assistant`

The web client calls `<NEXT_PUBLIC_SUPABASE_URL>/functions/v1/assistant` with the anon key.
Never put the Anthropic key in the web app or in GitHub Pages secrets: those are public in the built site.
