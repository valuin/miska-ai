import {
  getValidCredentials,
  saveUpdatedCredentials,
} from "../db/queries/integration.model";
import {
  IntegrationCredentialSchema,
  type GoogleSlug,
  type IntegrationClientMap,
} from "./credentials";

export async function getIntegrationClient<Slug extends GoogleSlug>(
  slug: Slug,
  userIntegrationId: string,
): Promise<IntegrationClientMap[Slug]> {
  const schema = IntegrationCredentialSchema[slug];
  const creds = await getValidCredentials(userIntegrationId);

  for (const key of schema.required) {
    if (!creds[key]) {
      throw new Error(`Missing required credential: ${key}`);
    }
  }

  if (schema.type === "oauth2") {
    const expiresAt = new Date(creds.expires_at);
    if (expiresAt < new Date() && schema.refresh) {
      const updated = await schema.refresh(creds as Record<string, string>);
      await saveUpdatedCredentials(
        userIntegrationId,
        updated as Record<string, string>,
      );
      Object.assign(creds, updated);
    }
  }

  // ← instantiate is now strongly typed!
  return schema.instantiate(creds as Record<string, string>);
}
