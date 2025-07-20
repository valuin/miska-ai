import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getIntegrationBySlug,
  saveUpdatedCredentials,
  updateUserIntegration,
} from "@/lib/db/queries/integration.model";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user_id = session.user.id;
  const code = req.nextUrl.searchParams.get("code");
  const scope = req.nextUrl.searchParams.get("q");
  const redirect_uri = process.env.GOOGLE_INTEGRATION_REDIRECT_URI;
  const client_id = process.env.GOOGLE_INTEGRATION_CLIENT_ID;
  const client_secret = process.env.GOOGLE_INTEGRATION_CLIENT_SECRET;
  const final_redirect_url = process.env.INTEGRATION_REDIRECT_URL;

  if (
    !code ||
    !scope ||
    !redirect_uri ||
    !client_id ||
    !client_secret ||
    !final_redirect_url
  ) {
    return Response.json(
      { error: "Missing environment variables" },
      { status: 500 },
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code || "",
      client_id,
      client_secret,
      redirect_uri: `${redirect_uri}?q=${scope}`,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  const integration = await getIntegrationBySlug(scope);
  if (!integration) {
    return Response.json({ error: "Integration not found" }, { status: 404 });
  }

  if (Object.keys(tokens).some((key) => key.includes("error"))) {
    return Response.redirect(
      `${final_redirect_url}?error=Failed to get tokens`,
    );
  }

  const user_integration = await updateUserIntegration(
    user_id,
    integration.id,
    { enabled: true, authenticated: true },
  );

  const googleTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  };

  await saveUpdatedCredentials(user_integration.id, googleTokens);
  return Response.redirect(final_redirect_url);
}
