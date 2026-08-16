import PDFDocument from 'pdfkit';
import { storagePut } from './storage';
import { learningContent } from '../shared/learningContent';

export async function generateModulePDF(level: string, moduleId: string): Promise<{ url: string; key: string }> {
  return new Promise((resolve, reject) => {
    try {
      const courseContent = learningContent[level];
      if (!courseContent) {
        throw new Error('Course content not found');
      }

      const module = courseContent.modules.find(m => m.id === moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileKey = `course-materials/${level}/${moduleId}-${Date.now()}.pdf`;
          const result = await storagePut(fileKey, pdfBuffer, 'application/pdf');
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Header
      doc.fontSize(24)
        .fillColor('#1e3a8a')
        .text(module.title, { align: 'center' });

      doc.moveDown();

      doc.fontSize(12)
        .fillColor('#6b7280')
        .text(`Duration: ${module.duration}`, { align: 'center' });

      doc.moveDown(2);

      // Horizontal line
      doc.strokeColor('#d1d5db')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke();

      doc.moveDown();

      // Key Points Section
      doc.fontSize(16)
        .fillColor('#1e3a8a')
        .text('Key Learning Points');

      doc.moveDown(0.5);

      module.keyPoints.forEach((point, index) => {
        doc.fontSize(11)
          .fillColor('#374151')
          .text(`${index + 1}. ${point}`, {
            indent: 20
          });
        doc.moveDown(0.3);
      });

      doc.moveDown();

      // Content Section
      doc.fontSize(16)
        .fillColor('#1e3a8a')
        .text('Course Content');

      doc.moveDown(0.5);

      // Parse and format the markdown content
      const contentLines = module.content.split('\n');
      
      contentLines.forEach(line => {
        // Skip empty lines
        if (line.trim() === '') {
          doc.moveDown(0.3);
          return;
        }

        // Headers
        if (line.startsWith('### ')) {
          doc.fontSize(14)
            .fillColor('#1e3a8a')
            .text(line.replace('### ', ''));
          doc.moveDown(0.3);
        } else if (line.startsWith('## ')) {
          doc.fontSize(16)
            .fillColor('#1e3a8a')
            .text(line.replace('## ', ''));
          doc.moveDown(0.5);
        } else if (line.startsWith('# ')) {
          // Skip main title as it's already in header
          return;
        }
        // Bold text
        else if (line.startsWith('**') && line.endsWith('**')) {
          doc.fontSize(11)
            .fillColor('#374151')
            .text(line.replace(/\*\*/g, ''));
          doc.moveDown(0.2);
        }
        // List items
        else if (line.startsWith('- ')) {
          doc.fontSize(10)
            .fillColor('#374151')
            .text(line.replace('- ', '• '), {
              indent: 20
            });
          doc.moveDown(0.2);
        }
        // Numbered lists
        else if (/^\d+\./.test(line)) {
          doc.fontSize(10)
            .fillColor('#374151')
            .text(line, {
              indent: 20
            });
          doc.moveDown(0.2);
        }
        // Regular paragraphs
        else {
          doc.fontSize(10)
            .fillColor('#374151')
            .text(line, {
              align: 'justify'
            });
          doc.moveDown(0.3);
        }
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
          .fillColor('#9ca3af')
          .text(
            `Future Stars FC Academy - ${module.title} | Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
