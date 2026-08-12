-- Account 139 (Domus Aurea Capital): hide the exact location of every listing on
-- the public website. Sets visibility_mode = 3 (Zone) so the property-detail
-- title and address render as "<Tipo> en <Municipio>, <Barrio>" instead of the
-- exact street + number.
--
--   visibility_mode: 1 = Exact (calle + número) | 2 = Street (calle) | 3 = Zone
--
-- fc_location_visibility (Fotocasa portal publishing) is intentionally NOT
-- changed — this migration only affects how the website renders the location.
-- Safe to re-run: the WHERE clause skips rows already set to 3.

UPDATE listings
   SET visibility_mode = 3,
       updated_at = now()
 WHERE account_id = 139
   AND visibility_mode IS DISTINCT FROM 3;
