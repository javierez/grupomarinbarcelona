-- Account 141: hide homepage "Sobre Nosotros" section and move the social-family
-- (Instagram) section to the bottom, above Contacto.
UPDATE website_config
SET features_props = (
  (features_props::jsonb)
  || jsonb_build_object(
       'sections',
       COALESCE(features_props::jsonb -> 'sections', '{}'::jsonb)
         || jsonb_build_object('socialFamilyPosition', 'bottom', 'about', false)
     )
)::text,
updated_at = now()
WHERE account_id = 141;
