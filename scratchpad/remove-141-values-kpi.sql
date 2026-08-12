-- Account 141 /nosotros: remove the "Valores Fundamentales" section and the KPI.
UPDATE website_config
SET about_props = (
  (about_props::jsonb)
  || jsonb_build_object('values', '[]'::jsonb, 'showKPI', false)
)::text,
updated_at = now()
WHERE account_id = 141;
