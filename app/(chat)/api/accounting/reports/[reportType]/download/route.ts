import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getFinancialReport } from '@/lib/db/queries/financial.model';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType } = await params;
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = await getFinancialReport(reportId);
    if (!report || report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Simulate PDF generation
    const pdfContent = generatePDFReport(report);
    
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.reportName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generatePDFReport(report: any): string {
  // This is a placeholder for actual PDF generation
  // In a real implementation, you would use a library like puppeteer or jsPDF
  const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${report.reportName}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

  return mockPdfContent;
} 