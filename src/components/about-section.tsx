import { env } from "~/env";
import { getAboutProps } from "../server/queries/about";
import { getFeaturesProps } from "~/server/queries/website-config";
import { isAccount139 } from "~/lib/account-overrides/139";
import { SobreNosotros } from "./about/sobre-nosotros";

export async function AboutSection({ accountId }: { accountId?: bigint } = {}) {
  const [aboutProps, features] = await Promise.all([
    getAboutProps(accountId),
    getFeaturesProps(accountId),
  ]);
  return (
    <SobreNosotros
      about={aboutProps}
      features={features}
      tight={isAccount139(accountId)}
      videoConocenos={(accountId?.toString() ?? env.NEXT_PUBLIC_ACCOUNT_ID) === "129"}
    />
  );
}
