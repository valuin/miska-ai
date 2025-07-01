import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteDocumentFromVault,
  getUserVaultDocuments,
} from "@/lib/db/queries/document-vault";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await getUserVaultDocuments(session.user.id);

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching vault documents:", error);

    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch vault documents" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is required" },
      { status: 400 },
    );
  }

  try {
    await deleteDocumentFromVault(documentId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document from vault:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
