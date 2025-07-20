import { drizzle } from "drizzle-orm/postgres-js";
import { integrations } from "../schema";
import * as schema from "../schema";
import postgres from "postgres";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema: { ...schema } });

async function seedIntegrations() {
  await db
    .insert(integrations)
    .values([
      {
        name: "Vault Search",
        slug: "vault_search",
        requires_auth: false,
        description: "Search through your uploaded documents",
        icon: "vault.svg",
      },
      {
        name: "Internet Search",
        slug: "internet_search",
        requires_auth: false,
        icon: "search.svg",
        description: "Search the internet for accurate, up-to-date information",
      },
      {
        name: "WhatsApp",
        slug: "whatsapp",
        auth_type: "sms",
        requires_auth: true,
        icon: "whatsapp.svg",
        description: "Send and receive messages on WhatsApp",
      },
      {
        name: "Google Drive",
        slug: "google_drive",
        auth_type: "oauth2",
        requires_auth: true,
        icon: "drive.svg",
        description: "Integration with Google Drive - view and edit your files",
      },
    ])
    .onConflictDoNothing();
}

seedIntegrations()
  .then(() => {
    console.log("✅ Seeded integrations");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
