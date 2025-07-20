import { authCredentials, integrations, userIntegrations } from "../schema";
import { db } from "./db";
import { encrypt, decrypt } from "@/lib/encryption";
import { eq } from "drizzle-orm";

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
  redirect_url: string | null;
};

export async function getIntegrations() {
  return await db.select().from(integrations);
}

export async function getIntegrationBySlug(slug: string) {
  const integration = await db
    .select()
    .from(integrations)
    .where(eq(integrations.slug, slug))
    .limit(1);

  return integration[0];
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
      redirect_url: integrations.redirect_url,
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
        enabled: userIntegration.enabled,
        authenticated: userIntegration.authenticated,
        redirect_url: integration.redirect_url,
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

export async function updateUserIntegration(
  user_id: string,
  integration_id: string,
  data: Partial<UserIntegration>,
) {
  const user_integration = await db
    .insert(userIntegrations)
    .values({
      user_id,
      integration_id,
      ...data,
    })
    .onConflictDoUpdate({
      target: [userIntegrations.user_id, userIntegrations.integration_id],
      set: { ...data },
    })
    .returning()
    .then((res) => res[0]);

  return user_integration;
}

export async function getValidCredentials(userIntegrationId: string) {
  const rows = await db
    .select()
    .from(authCredentials)
    .where(eq(authCredentials.user_integration_id, userIntegrationId));

  const now = new Date();
  const credentials: Record<string, string> = {};

  for (const row of rows) {
    if (row.expires_at && row.expires_at < now) continue;
    credentials[row.key] = decrypt(row.value_encrypted);
  }

  return credentials;
}

export async function saveUpdatedCredentials(
  userIntegrationId: string,
  updated: Record<string, string>,
) {
  const values = Object.entries(updated).map(([key, value]) => ({
    user_integration_id: userIntegrationId,
    key,
    value_encrypted: encrypt(String(value)),
    expires_at: key === "expires_at" ? new Date(value) : null,
  }));

  for (const v of values) {
    await db
      .insert(authCredentials)
      .values(v)
      .onConflictDoUpdate({
        target: [authCredentials.user_integration_id, authCredentials.key],
        set: {
          value_encrypted: v.value_encrypted,
          expires_at: v.expires_at,
        },
      });
  }
}
