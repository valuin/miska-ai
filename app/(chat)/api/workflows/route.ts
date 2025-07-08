import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries/db';
import { workflow } from '@/lib/db/schema/ai/workflow.schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, nodes } = body.schema;

    if (!id || !name || !nodes) {
      return NextResponse.json({ error: 'Missing required fields: id, name, or nodes in schema' }, { status: 400 });
    }

    const newWorkflow = await db.insert(workflow).values({
      id: id,
      name: name,
      description: description || null,
      schema: body.schema,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: workflow.id });

    return NextResponse.json({ success: true, workflowId: newWorkflow[0].id }, { status: 201 });
  } catch (error) {
    console.error('Error saving workflow:', error);
    return NextResponse.json({ error: 'Failed to save workflow' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const workflows = await db.select().from(workflow);
    return NextResponse.json({ workflows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}