import {
  SocialFamilyView,
  type SocialFamilySectionProps,
} from "~/components/social-family-view";

export { SocialFamilyView };
import { getFeaturesProps } from "~/server/queries/website-config";

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
