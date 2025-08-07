import { drizzle } from 'drizzle-orm/postgres-js';
import { integrations } from '../schema';
import * as schema from '../schema';
import postgres from 'postgres';

const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema: { ...schema } });

export const GOOGLE_SLUGS = {
  drive: 'google_drive' as const,
  sheets: 'google_sheets' as const,
  docs: 'google_docs' as const,
  slides: 'google_slides' as const,
  calendar: 'google_calendar' as const,
  gmail: 'google_gmail' as const,
};

export type GoogleSlug = (typeof GOOGLE_SLUGS)[keyof typeof GOOGLE_SLUGS];

async function seedIntegrations() {
  await db
    .insert(integrations)
    .values([
      {
        name: 'Vault Search',
        slug: 'vault_search',
        requires_auth: false,
        description: 'Search through your uploaded documents',
        icon: 'vault.svg',
      },
      {
        name: 'Internet Search',
        slug: 'internet_search',
        requires_auth: false,
        icon: 'search.svg',
        description: 'Search the internet for accurate, up-to-date information',
      },
      {
        name: 'WhatsApp',
        slug: 'whatsapp',
        auth_type: 'sms',
        requires_auth: true,
        icon: 'whatsapp.svg',
        description: 'Send and receive messages on WhatsApp',
      },
      {
        name: 'Google Drive',
        slug: GOOGLE_SLUGS.drive,
        auth_type: 'oauth2',
        requires_auth: true,
        icon: 'drive.svg',
        description: 'View and search your Google Drive files',
        redirect_url: `/api/integrations/google/login?scope=${GOOGLE_SLUGS.drive}`,
      },
      {
        name: 'Google Docs',
        slug: GOOGLE_SLUGS.docs,
        auth_type: 'oauth2',
        requires_auth: true,
        icon: 'docs.svg',
        description: 'Search, edit, and create Google Docs',
        redirect_url: `/api/integrations/google/login?scope=${GOOGLE_SLUGS.docs}`,
      },
      {
        name: 'Google Sheets',
        slug: GOOGLE_SLUGS.sheets,
        auth_type: 'oauth2',
        requires_auth: true,
        icon: 'sheets.svg',
        description: 'Search, edit, and create Google Sheets',
        redirect_url: `/api/integrations/google/login?scope=${GOOGLE_SLUGS.sheets}`,
      },
      {
        name: 'Google Slides',
        slug: GOOGLE_SLUGS.slides,
        auth_type: 'oauth2',
        requires_auth: true,
        icon: 'slides.svg',
        description: 'Search, edit, and create Google Slides',
        redirect_url: `/api/integrations/google/login?scope=${GOOGLE_SLUGS.slides}`,
      },
      {
        name: 'Google Calendar',
        slug: GOOGLE_SLUGS.calendar,
        auth_type: 'oauth2',
        requires_auth: true,
        icon: 'calendar.svg',
        description: 'Manage your Google Calendar',
        redirect_url: `/api/integrations/google/login?scope=${GOOGLE_SLUGS.calendar}`,
      },
      {
        name: 'Google Gmail',
        slug: GOOGLE_SLUGS.gmail,
        auth_type: 'oauth2',
        requires_auth: true,
        icon: 'gmail.svg',
        description: 'Search and send emails with your Gmail',
        redirect_url: `/api/integrations/google/login?scope=${GOOGLE_SLUGS.gmail}`,
      },
    ])
    .onConflictDoNothing();
}

seedIntegrations()
  .then(() => {})
  .catch((err) => {
    process.exit(1);
  });
