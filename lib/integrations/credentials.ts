import {
  type drive_v3,
  type gmail_v1,
  type docs_v1,
  type sheets_v4,
  type slides_v1,
  type calendar_v3,
  google,
} from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

const createGoogleOAuthIntegration = (factory: (auth: any) => any) => ({
  type: 'oauth2',
  required: ['access_token', 'refresh_token', 'expires_at'],
  async refresh(creds: Record<string, string>) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_INTEGRATION_CLIENT_ID,
      process.env.GOOGLE_INTEGRATION_CLIENT_SECRET,
      process.env.GOOGLE_INTEGRATION_REDIRECT_URI,
    );
    oauth2.setCredentials({ refresh_token: creds.refresh_token });
    const { credentials } = await oauth2.refreshAccessToken();
    return {
      access_token: credentials.access_token,
      expires_at: new Date(credentials.expiry_date || 0).toISOString(),
    };
  },
  instantiate(creds: Record<string, string>) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: creds.access_token });
    return factory(auth);
  },
});

export const IntegrationCredentialSchema = {
  google_gmail: createGoogleOAuthIntegration((auth: OAuth2Client) =>
    google.gmail({ version: 'v1', auth }),
  ),
  google_drive: createGoogleOAuthIntegration((auth: OAuth2Client) =>
    google.drive({ version: 'v3', auth }),
  ),
  google_docs: createGoogleOAuthIntegration((auth: OAuth2Client) =>
    google.docs({ version: 'v1', auth }),
  ),
  google_sheets: createGoogleOAuthIntegration((auth: OAuth2Client) =>
    google.sheets({ version: 'v4', auth }),
  ),
  google_slides: createGoogleOAuthIntegration((auth: OAuth2Client) =>
    google.slides({ version: 'v1', auth }),
  ),
  google_calendar: createGoogleOAuthIntegration((auth: OAuth2Client) =>
    google.calendar({ version: 'v3', auth }),
  ),
} as const;

export type GoogleSlug = keyof typeof IntegrationCredentialSchema;

export type IntegrationClientMap = {
  google_gmail: gmail_v1.Gmail;
  google_drive: drive_v3.Drive;
  google_docs: docs_v1.Docs;
  google_sheets: sheets_v4.Sheets;
  google_slides: slides_v1.Slides;
  google_calendar: calendar_v3.Calendar;
};
