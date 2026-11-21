import {
  SocialFamilyView,
  type SocialFamilySectionProps,
} from "~/components/social-family-view";

export { SocialFamilyView };
import type { SocialLink } from "~/components/ui/social-links";
import {
  ACCOUNT_129_SOCIAL_LINKS,
  isAccount129,
} from "~/lib/account-overrides/129";
import { getAboutProps } from "~/server/queries/about";
import { getSocialLinks } from "~/server/queries/social";
import { getFeaturesProps } from "~/server/queries/website-config";

/**
 * Las redes de «Sé uno más de la familia» y si sale cuando
 * `features.sections.socialFamily` no lo dice. Una sola vez para la portada y
 * la vista previa del CRM: la vista previa no sabía de la 129.
 */
export async function familiaSocial(accountId?: bigint): Promise<{
  links: SocialLink[];
  porDefecto: boolean;
}> {
  // 129: hardcoded links, immune to DB edits.
  if (isAccount129(accountId)) {
    return { links: ACCOUNT_129_SOCIAL_LINKS, porDefecto: true };
  }
  const [links, about] = await Promise.all([
    getSocialLinks(accountId),
    getAboutProps(accountId),
  ]);
  return { links, porDefecto: !!about?.showSocialFamilySection };
}

/**
 * Server shell: resolves the one piece of config the view needs, then hands
 * off. Split from the view so the CRM live preview can re-render the section
 * from client state as the agency edits its links — an async component can't
 * be a child of a client component, a sync one can.
 *
 * `accountId` matters here: under `/preview/*` this renders an account that
 * isn't the deployment's own, and an unscoped `getFeaturesProps()` would read
 * the wrong agency's header style.
 */
export async function SocialFamilySection({
  accountId,
  ...props
}: SocialFamilySectionProps & { accountId?: bigint }) {
  const minimal = (await getFeaturesProps(accountId)).headerStyle === "minimal";
  return <SocialFamilyView {...props} minimal={minimal} />;
}
