# Cyath

Cyath is a studio workspace for visual feedback and client approval on websites, images, and PDFs.

## Local development and verification

Install dependencies with `npm ci` and run `npm run dev`. Configure Supabase Auth and apply the review migration before creating reviews. Generate MCP keys in **Settings → API Keys** for accounts with an active Pro entitlement. Follow the [MCP setup](mcp/README.md) to connect your editor.

`npm run test:mcp` builds the app and runs the actual MCP executable against local Next.js routes and an isolated Supabase API fixture. It covers all four MCP tools, authorization, concurrent pins, save failures, and approval. The fixture uses synthetic credentials and does not require a production account.

## Deploying the review and auth changes

1. Back up existing canvases from Supabase and any public Blob or local storage used by the previous release. Verify studio ownership of each canvas using trusted account records because the previous endpoints accepted client-supplied owner fields.
2. Apply `supabase/migrations/20261121000000_review_access.sql` to the same Supabase project used by Auth. The migration preserves legacy records and closes their public database policies. Import each verified canvas into `review_canvases` before switching traffic. Use its existing `share_id`, the verified studio account's `owner_id`, and a `project` JSON object matching `Project` in `src/types/index.ts`. Preserve pin IDs and numbers. Check that the imported links work before retiring public legacy storage. Set the server-only `SUPABASE_SERVICE_ROLE_KEY`. The server can use `SUPABASE_URL` and `SUPABASE_ANON_KEY` when it needs an explicit runtime endpoint. Configure email confirmation and suitable SMTP in Supabase. If the old admin signup fallback was reachable, review Auth logs and reset affected credentials and sessions before inviting clients.
3. Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_PREVIEW_ORIGIN` at build time. Use a dedicated HTTPS preview origin with no app cookies, ideally under a separate registrable domain. Route only `/api/proxy` to Cyath on that origin. Preview fetches use a hostname allowlist. Keep the default managed staging domains or set `CYATH_PREVIEW_HOSTS` to a comma-separated list of trusted hosts. Add wildcards only for managed domains you trust. Enforce public-only preview egress at your hosting boundary. Until configured, production live previews display a recovery option. Images, PDFs, and general notes remain available.
4. Configure the payment provider before setting `CYATH_CHECKOUT_MONTHLY_URL`, `CYATH_CHECKOUT_ANNUAL_URL`, and `CYATH_BILLING_PORTAL_URL`. Use provider-verified billing events or verified manual provisioning to set `review_entitlements.active_until` for the paying studio account. Keep checkout links unset until payment, account matching, renewal, and cancellation have been verified. The app does not grant Pro when someone clicks an upgrade button.
5. To enable issue status callbacks, set `CYATH_INTEGRATION_OWNER_ID` to the verified studio account ID. Configure `GITHUB_WEBHOOK_SECRET` and `CYATH_GITHUB_REPOSITORY` for GitHub, or `LINEAR_WEBHOOK_SECRET` and `CYATH_LINEAR_ORGANIZATION_ID` for Linear. Exports may contain review identifiers, so use a destination authorized to see the review. Recipients of the regular review link can comment. Only a separate, expiring approval link can approve.

Deploy the app and verify a complete owner-to-guest-to-approval flow on the staging deployment before promoting it.
