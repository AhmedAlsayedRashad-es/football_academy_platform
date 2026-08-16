import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface Props {
  sessionId: number;
}

export default function SessionPdfExport({ sessionId }: Props) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [printing, setPrinting] = useState(false);

  const { data, refetch } = trpc.privateTeams.getSessionPdfData.useQuery(
    { sessionId },
    { enabled: false }
  );

  const handleExport = async () => {
    setPrinting(true);
    try {
      const result = await refetch();
      if (!result.data) return;

      const { session, coach, players, summary } = result.data;

      const attendanceColor: Record<string, string> = {
        present: '#16a34a',
        absent: '#dc2626',
        late: '#d97706',
        excused: '#2563eb',
      };

      const attendanceLabel: Record<string, string> = {
        present: isRTL ? 'حاضر' : 'Present',
        absent: isRTL ? 'غائب' : 'Absent',
        late: isRTL ? 'متأخر' : 'Late',
        excused: isRTL ? 'معذور' : 'Excused',
      };

      const sessionTypeLabel: Record<string, string> = {
        technical: isRTL ? 'تقني' : 'Technical',
        tactical: isRTL ? 'تكتيكي' : 'Tactical',
        physical: isRTL ? 'بدني' : 'Physical',
        match: isRTL ? 'مباراة' : 'Match',
        recovery: isRTL ? 'تعافي' : 'Recovery',
        mixed: isRTL ? 'مختلط' : 'Mixed',
      };

      const playerRows = players.map((p: any) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 12px; font-weight: 600;">${p.jerseyNumber ? `#${p.jerseyNumber}` : '—'}</td>
          <td style="padding: 8px 12px;">${p.firstName} ${p.lastName}</td>
          <td style="padding: 8px 12px; color: #6b7280;">${p.position || '—'}</td>
          <td style="padding: 8px 12px;">
            <span style="color: ${attendanceColor[p.attendance] || '#374151'}; font-weight: 600;">
              ${attendanceLabel[p.attendance] || p.attendance || '—'}
            </span>
          </td>
          <td style="padding: 8px 12px; text-align: center;">
            ${p.performanceRating != null ? `<strong>${p.performanceRating}/10</strong>` : '—'}
          </td>
          <td style="padding: 8px 12px; color: #6b7280; font-size: 12px;">${p.coachNotes || '—'}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'en'}">
        <head>
          <meta charset="UTF-8" />
          <title>${isRTL ? 'تقرير السيشن' : 'Session Report'} — ${session.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: ${isRTL ? "'Cairo', sans-serif" : "'Inter', sans-serif"}; color: #111827; background: white; padding: 32px; }
            .header { border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { font-size: 22px; font-weight: 700; color: #4f46e5; }
            .header .sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
            .meta-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .meta-card .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
            .meta-card .value { font-size: 16px; font-weight: 700; color: #111827; margin-top: 4px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px; }
            .summary-card { border-radius: 8px; padding: 10px 14px; text-align: center; }
            .summary-card .num { font-size: 20px; font-weight: 700; }
            .summary-card .lbl { font-size: 11px; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            thead { background: #f3f4f6; }
            thead th { padding: 10px 12px; text-align: ${isRTL ? 'right' : 'left'}; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
            .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${isRTL ? 'تقرير السيشن' : 'Session Report'}</h1>
            <div class="sub">${isRTL ? 'مُعدّ بواسطة:' : 'Prepared by:'} ${coach.name} &nbsp;|&nbsp; ${isRTL ? 'تاريخ الطباعة:' : 'Printed:'} ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="label">${isRTL ? 'اسم السيشن' : 'Session Title'}</div>
              <div class="value" style="font-size: 14px;">${session.title}</div>
            </div>
            <div class="meta-card">
              <div class="label">${isRTL ? 'التاريخ' : 'Date'}</div>
              <div class="value">${session.sessionDate ? format(new Date(session.sessionDate), 'dd/MM/yyyy') : '—'}</div>
            </div>
            <div class="meta-card">
              <div class="label">${isRTL ? 'الوقت' : 'Time'}</div>
              <div class="value">${session.startTime || '—'}${session.endTime ? ` – ${session.endTime}` : ''}</div>
            </div>
            <div class="meta-card">
              <div class="label">${isRTL ? 'النوع' : 'Type'}</div>
              <div class="value">${sessionTypeLabel[session.sessionType] || session.sessionType}</div>
            </div>
            <div class="meta-card">
              <div class="label">${isRTL ? 'المكان' : 'Location'}</div>
              <div class="value" style="font-size: 13px;">${session.location || '—'}</div>
            </div>
            <div class="meta-card">
              <div class="label">${isRTL ? 'الحالة' : 'Status'}</div>
              <div class="value" style="font-size: 13px; text-transform: capitalize;">${session.status}</div>
            </div>
          </div>

          ${session.objectives ? `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; color: #3b82f6; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">${isRTL ? 'أهداف السيشن' : 'Session Objectives'}</div>
            <p style="font-size: 13px; color: #1e40af;">${session.objectives}</p>
          </div>` : ''}

          <div class="summary-grid">
            <div class="summary-card" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
              <div class="num" style="color: #16a34a;">${summary.present}</div>
              <div class="lbl" style="color: #15803d;">${isRTL ? 'حاضر' : 'Present'}</div>
            </div>
            <div class="summary-card" style="background: #fef2f2; border: 1px solid #fecaca;">
              <div class="num" style="color: #dc2626;">${summary.absent}</div>
              <div class="lbl" style="color: #b91c1c;">${isRTL ? 'غائب' : 'Absent'}</div>
            </div>
            <div class="summary-card" style="background: #fffbeb; border: 1px solid #fde68a;">
              <div class="num" style="color: #d97706;">${summary.late}</div>
              <div class="lbl" style="color: #b45309;">${isRTL ? 'متأخر' : 'Late'}</div>
            </div>
            <div class="summary-card" style="background: #eff6ff; border: 1px solid #bfdbfe;">
              <div class="num" style="color: #2563eb;">${summary.excused}</div>
              <div class="lbl" style="color: #1d4ed8;">${isRTL ? 'معذور' : 'Excused'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isRTL ? 'اسم اللاعب' : 'Player Name'}</th>
                <th>${isRTL ? 'المركز' : 'Position'}</th>
                <th>${isRTL ? 'الحضور' : 'Attendance'}</th>
                <th style="text-align: center;">${isRTL ? 'التقييم' : 'Rating'}</th>
                <th>${isRTL ? 'ملاحظات الكوتش' : 'Coach Notes'}</th>
              </tr>
            </thead>
            <tbody>
              ${playerRows || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#9ca3af;">${isRTL ? 'لا يوجد لاعبون' : 'No players'}</td></tr>`}
            </tbody>
          </table>

          ${session.notes ? `
          <div style="margin-top: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">${isRTL ? 'ملاحظات الكوتش العامة' : 'General Coach Notes'}</div>
            <p style="font-size: 13px; color: #374151;">${session.notes}</p>
          </div>` : ''}

          <div class="footer">
            <span>${isRTL ? 'منصة سكاوتا — نظام إدارة الأكاديمية' : 'Scouta Platform — Academy Management System'}</span>
            <span>${isRTL ? 'إجمالي اللاعبين:' : 'Total Players:'} ${summary.total} &nbsp;|&nbsp; ${isRTL ? 'معدل الحضور:' : 'Attendance Rate:'} ${summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0}%</span>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleExport} disabled={printing} className="gap-1">
      {printing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
      {isRTL ? 'تصدير PDF' : 'Export PDF'}
    </Button>
  );
}
