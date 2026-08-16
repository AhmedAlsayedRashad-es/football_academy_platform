import { storagePut } from './storage';

interface CertificateData {
  coachName: string;
  courseTitle: string;
  level: string;
  score: number;
  date: Date;
  certificateNumber: string;
}

export async function generateCertificate(data: CertificateData): Promise<string> {
  const { coachName, courseTitle, level, score, date, certificateNumber } = data;
  
  // Create SVG certificate
  const svg = `
    <svg width="1200" height="850" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="1200" height="850" fill="#ffffff"/>
      
      <!-- Border -->
      <rect x="30" y="30" width="1140" height="790" fill="none" stroke="#1e40af" stroke-width="8"/>
      <rect x="45" y="45" width="1110" height="760" fill="none" stroke="#3b82f6" stroke-width="2"/>
      
      <!-- Header -->
      <text x="600" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#1e40af" text-anchor="middle">
        CERTIFICATE OF COMPLETION
      </text>
      
      <text x="600" y="160" font-family="Arial, sans-serif" font-size="20" fill="#64748b" text-anchor="middle">
        Football Coaching Certification
      </text>
      
      <!-- Decorative line -->
      <line x1="400" y1="190" x2="800" y2="190" stroke="#3b82f6" stroke-width="2"/>
      
      <!-- Main content -->
      <text x="600" y="250" font-family="Arial, sans-serif" font-size="24" fill="#334155" text-anchor="middle">
        This is to certify that
      </text>
      
      <text x="600" y="320" font-family="Georgia, serif" font-size="56" font-weight="bold" fill="#0f172a" text-anchor="middle">
        ${coachName}
      </text>
      
      <text x="600" y="380" font-family="Arial, sans-serif" font-size="24" fill="#334155" text-anchor="middle">
        has successfully completed the
      </text>
      
      <text x="600" y="440" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#1e40af" text-anchor="middle">
        ${courseTitle}
      </text>
      
      <text x="600" y="490" font-family="Arial, sans-serif" font-size="28" fill="#3b82f6" text-anchor="middle">
        ${level.toUpperCase()} Level
      </text>
      
      <!-- Score -->
      <text x="600" y="560" font-family="Arial, sans-serif" font-size="22" fill="#334155" text-anchor="middle">
        with a score of <tspan font-weight="bold" fill="#10b981">${score}%</tspan>
      </text>
      
      <!-- Date and Certificate Number -->
      <text x="200" y="700" font-family="Arial, sans-serif" font-size="18" fill="#64748b">
        Date: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </text>
      
      <text x="1000" y="700" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="end">
        Certificate No: ${certificateNumber}
      </text>
      
      <!-- Signature line -->
      <line x1="450" y1="750" x2="750" y2="750" stroke="#334155" stroke-width="1"/>
      <text x="600" y="780" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
        Academy Director
      </text>
      
      <!-- Footer seal/badge -->
      <circle cx="150" cy="750" r="60" fill="none" stroke="#3b82f6" stroke-width="3"/>
      <text x="150" y="745" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e40af" text-anchor="middle">
        CERTIFIED
      </text>
      <text x="150" y="765" font-family="Arial, sans-serif" font-size="14" fill="#3b82f6" text-anchor="middle">
        ${new Date().getFullYear()}
      </text>
    </svg>
  `;
  
  // Convert SVG to buffer
  const svgBuffer = Buffer.from(svg, 'utf-8');
  
  // Upload to S3
  const fileName = `certificates/${certificateNumber}-${Date.now()}.svg`;
  const { url } = await storagePut(fileName, svgBuffer, 'image/svg+xml');
  
  return url;
}

export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
