import { auth } from "@/app/(auth)/auth";
import {
  type UserIntegration,
  getUserIntegrations,
  setupUserIntegrations,
} from "@/lib/db/queries/integration.model";

export type UserIntegrationResponse = {
  integrations: UserIntegration[];
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userIntegrations: UserIntegration[] = await getUserIntegrations(
    session.user.id,
  );

  if (userIntegrations.length === 0) {
    userIntegrations = await setupUserIntegrations(session.user.id);
  }

  return Response.json({ integrations: userIntegrations }, { status: 200 });
}
