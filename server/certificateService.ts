import { jsPDF } from 'jspdf';
import { storagePut } from './storage';

interface CertificateData {
  recipientName: string;
  courseName: string;
  completionDate: Date;
  score?: number;
  certificateId: string;
}

/**
 * Generate a PDF certificate for course completion
 */
export async function generateCourseCertificate(data: CertificateData): Promise<{ url: string; key: string }> {
  const { recipientName, courseName, completionDate, score, certificateId } = data;

  // Create PDF document (A4 landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient effect (simulated with rectangles)
  doc.setFillColor(16, 185, 129); // #10b981
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setFillColor(5, 150, 105); // #059669
  doc.triangle(0, 0, pageWidth, 0, pageWidth, pageHeight / 3, 'F');
  
  doc.setFillColor(255, 255, 255, 0.95);
  doc.roundedRect(20, 20, pageWidth - 40, pageHeight - 40, 5, 5, 'F');

  // Border decoration
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(2);
  doc.roundedRect(25, 25, pageWidth - 50, pageHeight - 50, 5, 5, 'S');
  
  doc.setLineWidth(0.5);
  doc.roundedRect(28, 28, pageWidth - 56, pageHeight - 56, 5, 5, 'S');

  // Academy logo text
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('⚽ FUTURE STARS FC', pageWidth / 2, 45, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Football Academy - Parent Education Program', pageWidth / 2, 52, { align: 'center' });

  // Certificate title
  doc.setFontSize(32);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE', pageWidth / 2, 70, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('OF COMPLETION', pageWidth / 2, 80, { align: 'center' });

  // Divider line
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, 85, pageWidth / 2 + 40, 85);

  // Recipient name
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('This is to certify that', pageWidth / 2, 95, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(recipientName, pageWidth / 2, 107, { align: 'center' });
  
  // Underline for name
  const nameWidth = doc.getTextWidth(recipientName);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - nameWidth / 2, 109, pageWidth / 2 + nameWidth / 2, 109);

  // Course completion text
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('has successfully completed the course', pageWidth / 2, 120, { align: 'center' });

  // Course name
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  
  // Split long course names into multiple lines
  const courseNameLines = doc.splitTextToSize(courseName, pageWidth - 100);
  doc.text(courseNameLines, pageWidth / 2, 130, { align: 'center' });

  // Score (if provided)
  if (score !== undefined) {
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Final Score: ${score}%`, pageWidth / 2, 145, { align: 'center' });
  }

  // Completion date
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Completed on ${completionDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    pageWidth / 2,
    score !== undefined ? 155 : 145,
    { align: 'center' }
  );

  // Signature section
  const signatureY = pageHeight - 50;
  
  // Left signature (Director)
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('Ahmed Khaled', pageWidth / 4, signatureY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Academy Director', pageWidth / 4, signatureY + 5, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 4 - 25, signatureY - 2, pageWidth / 4 + 25, signatureY - 2);

  // Right signature (Education Coordinator)
  doc.setFont('helvetica', 'bold');
  doc.text('Dr. Sarah Mohamed', (pageWidth * 3) / 4, signatureY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Education Coordinator', (pageWidth * 3) / 4, signatureY + 5, { align: 'center' });
  doc.line((pageWidth * 3) / 4 - 25, signatureY - 2, (pageWidth * 3) / 4 + 25, signatureY - 2);

  // Certificate ID at bottom
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate ID: ${certificateId}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
  doc.text('Verify at: www.futurestarsfc.com/verify', pageWidth / 2, pageHeight - 25, { align: 'center' });

  // Trophy icon (text-based)
  doc.setFontSize(40);
  doc.text('🏆', pageWidth / 2 - 7, 65);

  // Convert PDF to buffer
  const pdfBuffer = doc.output('arraybuffer');
  const pdfBlob = new Uint8Array(pdfBuffer);

  // Upload to S3
  const fileName = `certificates/${certificateId}.pdf`;
  const result = await storagePut(fileName, pdfBlob, 'application/pdf');

  return {
    url: result.url,
    key: result.key,
  };
}

/**
 * Generate a unique certificate ID
 */
export function generateCertificateId(userId: number, courseId: number): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `FSFC-${userId}-${courseId}-${timestamp}-${random}`.toUpperCase();
}
