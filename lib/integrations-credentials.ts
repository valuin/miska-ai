// lib/integrations/IntegrationCredentialSchema.ts

import { google } from "googleapis";

type CredentialsMap = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
};

export const IntegrationCredentialSchema = {
  google_suite: {
    type: "oauth2",
    required: ["access_token", "refresh_token", "expires_at"],
    async refresh(creds: CredentialsMap) {
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
    instantiate(
      creds: CredentialsMap,
      key: "drive" | "docs" | "sheets" | "slides" | "gmail" | "calendar",
    ) {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: creds.access_token });
      switch (key) {
        case "drive":
          return google.drive({ version: "v2", auth });
        case "docs":
          return google.gmail({ version: "v1", auth });
        case "sheets":
          return google.sheets({ version: "v4", auth });
        case "slides":
          return google.slides({ version: "v1", auth });
        case "gmail":
          return google.gmail({ version: "v1", auth });
        case "calendar":
          return google.calendar({ version: "v3", auth });
      }
    },
  },
};
