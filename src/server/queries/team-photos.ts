import { db } from "../db";
import { users } from "~/server/db/schema";
import { inArray } from "drizzle-orm";
import type { AboutProps } from "../../lib/data";

type TeamMember = NonNullable<AboutProps["team"]>[number];

/**
 * Fill each team member's avatar from their linked vesta user's profile image
 * (`users.image`) when `userId` is set and no explicit `photo` override exists.
 * An explicit `photo` always wins. Members without a userId are untouched, so
 * the CRM user photo is the single source of truth for linked members.
 *
 * Lives outside about.ts so the static-site query transformer (which hardcodes
 * getAboutProps and strips its DB imports) leaves this runtime helper intact.
 */
export async function resolveTeamPhotos(
  team: TeamMember[] | undefined,
): Promise<TeamMember[] | undefined> {
  if (!team?.length) return team;
  const ids = [
    ...new Set(team.map((m) => m.userId).filter((id): id is string => !!id)),
  ];
  if (ids.length === 0) return team;
  try {
    const rows = await db
      .select({ id: users.id, image: users.image })
      .from(users)
      .where(inArray(users.id, ids));
    const imageById = new Map(rows.map((r) => [r.id, r.image]));
    return team.map((m) => {
      if (m.photo || !m.userId) return m;
      const image = imageById.get(m.userId);
      return image ? { ...m, photo: image } : m;
    });
  } catch (error) {
    console.error("Error resolving team photos:", error);
    return team;
  }
}
