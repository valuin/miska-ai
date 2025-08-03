import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getFinancialReport, updateFinancialReport } from '@/lib/db/queries/financial.model';
import { generateUUID } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType } = await params;
    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = await getFinancialReport(reportId);
    if (!report || report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate a shareable URL
    const shareId = generateUUID();
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reports/${shareId}`;
    
    // Update the report with the share URL
    await updateFinancialReport(reportId, {
      shareUrl,
      isPublic: true,
    });

    return NextResponse.json({
      success: true,
      shareUrl,
      message: 'Report shared successfully',
    });
  } catch (error) {
    console.error('Error sharing report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  try {
    const { reportType } = await params;
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    // In a real implementation, you would have a separate table for share links
    // For now, we'll simulate finding a report by share ID
    const report = await getFinancialReport(shareId);
    if (!report || !report.isPublic) {
      return NextResponse.json({ error: 'Report not found or not public' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        reportName: report.reportName,
        reportType: report.reportType,
        period: report.period,
        companyData: report.companyData,
        financialData: report.financialData,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error('Error accessing shared report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 