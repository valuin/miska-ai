import { eq } from "drizzle-orm";
import { integrations, userIntegrations } from "../schema";
import { db } from "./db";

const DEFAULT_ENABLED_INTEGRATIONS = ["vault_search", "internet_search"];

export type UserIntegration = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  requires_auth: boolean;
  authenticated: boolean;
  enabled: boolean;
};

export async function getIntegrations() {
  return await db.select().from(integrations);
}

export async function getIntegrationBySlug(slug: string) {
  return await db
    .select()
    .from(integrations)
    .where(eq(integrations.slug, slug))
    .limit(1);
}

export async function getUserIntegrations(
  user_id: string,
): Promise<UserIntegration[]> {
  return await db
    .select({
      id: integrations.id,
      name: integrations.name,
      slug: integrations.slug,
      icon: integrations.icon,
      description: integrations.description,
      requires_auth: integrations.requires_auth,
      enabled: userIntegrations.enabled,
      authenticated: userIntegrations.authenticated,
    })
    .from(integrations)
    .innerJoin(
      userIntegrations,
      eq(integrations.id, userIntegrations.integration_id),
    )
    .where(eq(userIntegrations.user_id, user_id));
}

export async function setupUserIntegrations(
  user_id: string,
): Promise<UserIntegration[]> {
  const integrations = await getIntegrations();
  const returned = await db
    .insert(userIntegrations)
    .values(
      integrations.map((integration) => ({
        user_id,
        integration_id: integration.id,
        enabled: DEFAULT_ENABLED_INTEGRATIONS.includes(integration.slug),
      })),
    )
    .returning();

  return returned
    .map((userIntegration) => {
      const integration = integrations.find(
        (i) => i.id === userIntegration.integration_id,
      );
      if (!integration) return;

      return {
        id: userIntegration.id,
        name: integration.name,
        slug: integration.slug,
        icon: integration.icon,
        description: integration.description,
        requires_auth: integration.requires_auth,
        authenticated: userIntegration.authenticated,
        enabled: userIntegration.enabled,
      };
    })
    .filter(Boolean) as UserIntegration[];
}

export async function toggleIntegration(id: string, enabled: boolean) {
  return await db
    .update(userIntegrations)
    .set({ enabled })
    .where(eq(userIntegrations.integration_id, id));
}
