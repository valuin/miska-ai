import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries/db';
import { workflow } from '@/lib/db/schema/ai/workflow.schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, props: { params: Promise<{ workflowId: string }> }) {
  const params = await props.params;
  try {
    const resolvedParams = Object.assign({}, params);
    const workflowId = resolvedParams.workflowId;

    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 });
    }

    const foundWorkflow = await db
      .select()
      .from(workflow)
      .where(eq(workflow.id, workflowId))
      .limit(1);

    if (foundWorkflow.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ workflow: foundWorkflow[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}