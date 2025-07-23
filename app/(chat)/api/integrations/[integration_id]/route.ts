import { auth } from '@/app/(auth)/auth';
import { toggleIntegration } from '@/lib/db/queries/integration.model';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ integration_id: string }> },
) {
  const { integration_id } = await params;
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { enabled } = await request.json();
  await toggleIntegration(integration_id, enabled);
  return Response.json({ success: true, enabled }, { status: 200 });
}
