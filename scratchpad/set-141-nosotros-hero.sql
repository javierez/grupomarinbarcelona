UPDATE website_config
SET about_props = (
  (about_props::jsonb)
  || jsonb_build_object(
       'nosotrosHeroImage',
       'https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/nosotros/nosotros-hero.jpg'
     )
)::text,
updated_at = now()
WHERE account_id = 141;
