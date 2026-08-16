import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { getMatchPalette, type TeamPalette } from '@/lib/teamColors';

// ── Types ────────────────────────────────────────────────────────────────────
export interface InfographicData {
  ourTeam: string;
  oppTeam: string;
  competition?: string;
  matchDate?: string;
  ourFormation?: string;
  oppFormation?: string;
  ourLambda: number;
  oppLambda: number;
  winPct: number;
  drawPct: number;
  lossPct: number;
  winPctSP?: number;
  drawPctSP?: number;
  lossPctSP?: number;
  setPieceImpact?: number;
  // AI-generated narrative sections
  headline?: string;
  subheadline?: string;
  ourStrengths?: string[];
  ourWeaknesses?: string[];
  oppStrengths?: string[];
  oppWeaknesses?: string[];
  keyBattles?: string[];
  tacticalAdvice?: string[];
  summary?: string;
  // Extra stats
  ourGoalsScored?: number;
  ourGoalsConceded?: number;
  oppGoalsScored?: number;
  oppGoalsConceded?: number;
  simCount?: number;
}

// ── Helper: Dot Matrix (100 dots) ────────────────────────────────────────────
function DotMatrix({ winPct, drawPct, lossPct, palette }: {
  winPct: number; drawPct: number; lossPct: number; palette: TeamPalette;
}) {
  const dots = Array.from({ length: 100 }, (_, i) => {
    const p = i + 1;
    if (p <= winPct) return 'win';
    if (p <= winPct + drawPct) return 'draw';
    return 'loss';
  });
  return (
    <div className="flex flex-wrap gap-[3px]" style={{ width: '100%' }}>
      {dots.map((type, i) => (
        <div
          key={i}
          style={{
            width: 12, height: 12, borderRadius: '50%',
            backgroundColor:
              type === 'win' ? palette.primary :
              type === 'draw' ? '#888888' : '#333333',
            opacity: type === 'win' ? 1 : type === 'draw' ? 0.7 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

// ── Helper: Stat Card ────────────────────────────────────────────────────────
function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${accent}33`,
      borderRadius: 8,
      padding: '12px 8px',
      textAlign: 'center',
      flex: 1,
      minWidth: 80,
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 4, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ── Helper: Section Header ───────────────────────────────────────────────────
function SectionHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <div style={{
      background: `${accent}22`,
      border: `1px solid ${accent}44`,
      borderRadius: 6,
      padding: '6px 14px',
      marginBottom: 12,
      textAlign: 'center',
    }}>
      <span style={{ color: accent, fontWeight: 700, fontSize: 13 }}>{title}</span>
    </div>
  );
}

// ── Helper: Probability Bar ──────────────────────────────────────────────────
function ProbBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: '#ccc' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ background: '#333', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MatchInfographic({ data }: { data: InfographicData }) {
  const ref = useRef<HTMLDivElement>(null);
  const { our, opp } = getMatchPalette(data.ourTeam, data.oppTeam);

  async function handleExport() {
    if (!ref.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: our.bg,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${data.ourTeam}_vs_${data.oppTeam}_analysis.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
  }

  const headline = data.headline || `${data.ourTeam} × ${data.oppTeam}`;
  const subheadline = data.subheadline || `تحليل احتمالي — ${data.competition || 'مباراة مهمة'}`;

  return (
    <div>
      {/* Export & Share Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={handleExport} className="gap-2" style={{ background: our.primary, color: '#fff' }}>
          <Download className="h-4 w-4" />
          تصدير PNG
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => {
          if (ref.current) {
            const w = window.open('', '_blank');
            if (w) {
              w.document.write(`<html><body style="margin:0;background:#000">${ref.current.outerHTML}</body></html>`);
              w.document.close();
            }
          }
        }}>
          <Share2 className="h-4 w-4" />
          فتح في نافذة
        </Button>
        {/* Twitter/X Share */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            const text = encodeURIComponent(`تحليل مباراة: ${data.ourTeam} × ${data.oppTeam}\nنسبة الفوز: ${data.winPct?.toFixed(1)}% | التعادل: ${data.drawPct?.toFixed(1)}% | الخسارة: ${data.lossPct?.toFixed(1)}%\n#تحليل_كرة_القدم #FootballAnalytics`);
            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
          }}
          style={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
        >
          <span className="font-bold text-sm">X</span>
          مشاركة على X
        </Button>
        {/* WhatsApp Share */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            const text = encodeURIComponent(`🏆 تحليل مباراة: ${data.ourTeam} × ${data.oppTeam}\n📊 نسبة الفوز: ${data.winPct?.toFixed(1)}%\n🤝 التعادل: ${data.drawPct?.toFixed(1)}%\n🔴 الخسارة: ${data.lossPct?.toFixed(1)}%\n📊 نموذج Dixon-Coles + Poisson — 100,000 محاكاة`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
          }}
          style={{ borderColor: '#25D366', color: '#25D366' }}
        >
          <span className="text-sm">💬</span>
          WhatsApp
        </Button>
        {/* Copy Stats */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            const text = `تحليل مباراة: ${data.ourTeam} × ${data.oppTeam}\nنسبة الفوز: ${data.winPct?.toFixed(1)}% | التعادل: ${data.drawPct?.toFixed(1)}% | الخسارة: ${data.lossPct?.toFixed(1)}%\nنموذج Dixon-Coles + Poisson — 100,000 محاكاة`;
            navigator.clipboard.writeText(text).then(() => {
              alert('تم نسخ الإحصائيات للحافظة ✅');
            });
          }}
        >
          <span className="text-sm">📋</span>
          نسخ الإحصائيات
        </Button>
      </div>

      {/* Infographic Container */}
      <div
        ref={ref}
        dir="rtl"
        style={{
          background: our.gradient,
          color: our.text,
          fontFamily: "'Cairo', 'Tajawal', 'Arial', sans-serif",
          padding: 24,
          borderRadius: 12,
          maxWidth: 600,
          margin: '0 auto',
          border: `2px solid ${our.accent}44`,
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: `2px solid ${our.accent}44`, paddingBottom: 16 }}>
          {/* Team Flags Row */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36 }}>{our.flag}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: our.primary }}>{data.ourTeam}</div>
            </div>
            <div style={{ fontSize: 22, color: our.accent, fontWeight: 900 }}>×</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36 }}>{opp.flag}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: opp.primary }}>{data.oppTeam}</div>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
            <span style={{ color: our.primary }}>{data.ourTeam}</span>
            <span style={{ color: '#fff' }}> × </span>
            <span style={{ color: opp.primary }}>{data.oppTeam}</span>
          </div>
          <div style={{ fontSize: 13, color: our.accent, marginBottom: 4 }}>{subheadline}</div>
          {data.competition && (
            <div style={{ fontSize: 11, color: '#aaa' }}>{data.competition} {data.matchDate ? `— ${data.matchDate}` : ''}</div>
          )}
        </div>

        {/* ── MAIN PROBABILITY ───────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 16,
          textAlign: 'center',
          border: `1px solid ${our.accent}33`,
        }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>التقدير المركزي لفرصة الفوز</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: our.primary, lineHeight: 1 }}>
            {data.winPct.toFixed(1)}%
          </div>
          <div style={{ fontSize: 12, color: our.accent, marginTop: 4 }}>
            النطاق الواقعي: {Math.max(0, data.winPct - 4).toFixed(0)}% — {Math.min(100, data.winPct + 4).toFixed(0)}%
          </div>
        </div>

        {/* ── STAT CARDS ROW ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <StatCard value={`${data.winPct.toFixed(1)}%`} label="فوز" accent={our.primary} />
          <StatCard value={`${data.drawPct.toFixed(1)}%`} label="تعادل" accent="#888" />
          <StatCard value={`${data.lossPct.toFixed(1)}%`} label="خسارة" accent={opp.primary} />
          <StatCard value={data.ourLambda.toFixed(2)} label="λ هجومنا" accent={our.accent} />
          <StatCard value={data.oppLambda.toFixed(2)} label="λ المنافس" accent="#aaa" />
        </div>

        {/* ── DOT MATRIX ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="🎯 شكل بصري للمحاكاة — كل نقطة = 1,000 سيناريو" accent={our.accent} />
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
            <DotMatrix winPct={Math.round(data.winPct)} drawPct={Math.round(data.drawPct)} lossPct={Math.round(data.lossPct)} palette={our} />
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
              <span><span style={{ color: our.primary }}>●</span> فوز ({data.winPct.toFixed(1)}%)</span>
              <span><span style={{ color: '#888' }}>●</span> تعادل ({data.drawPct.toFixed(1)}%)</span>
              <span><span style={{ color: '#555' }}>●</span> خسارة ({data.lossPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* ── PROBABILITY BARS ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="📊 توزيع الاحتمالات" accent={our.accent} />
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
            <ProbBar label="فوز" pct={data.winPct} color={our.primary} />
            <ProbBar label="تعادل" pct={data.drawPct} color="#888888" />
            <ProbBar label="خسارة" pct={data.lossPct} color={opp.primary} />
            {data.winPctSP !== undefined && (
              <>
                <div style={{ borderTop: `1px solid ${our.accent}33`, margin: '8px 0', paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: our.accent, marginBottom: 6 }}>مع الكرات الثابتة (+{((data.setPieceImpact || 0) * 100).toFixed(0)}%)</div>
                  <ProbBar label="فوز + كرات ثابتة" pct={data.winPctSP} color={our.primary} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── FORMATIONS ─────────────────────────────────────────────────── */}
        {(data.ourFormation || data.oppFormation) && (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader title="⚽ التشكيلات" accent={our.accent} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{data.ourTeam}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: our.primary }}>{data.ourFormation || '—'}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{data.oppTeam}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: opp.primary }}>{data.oppFormation || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STRENGTHS & WEAKNESSES ─────────────────────────────────────── */}
        {(data.ourStrengths?.length || data.oppWeaknesses?.length) && (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader title="💪 نقاط القوة والضعف" accent={our.accent} />
            <div style={{ display: 'flex', gap: 8 }}>
              {data.ourStrengths?.length ? (
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: our.primary, fontWeight: 700, marginBottom: 6 }}>نقاط قوتنا</div>
                  {data.ourStrengths.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#ccc', marginBottom: 4, lineHeight: 1.4 }}>• {s}</div>
                  ))}
                </div>
              ) : null}
              {data.oppWeaknesses?.length ? (
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: our.accent, fontWeight: 700, marginBottom: 6 }}>ثغرات المنافس</div>
                  {data.oppWeaknesses.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#ccc', marginBottom: 4, lineHeight: 1.4 }}>• {s}</div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── TACTICAL ADVICE ────────────────────────────────────────────── */}
        {data.tacticalAdvice?.length ? (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader title="🧠 التوصيات التكتيكية" accent={our.accent} />
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
              {data.tacticalAdvice.slice(0, 4).map((advice, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 8px',
                }}>
                  <span style={{ color: our.accent, fontWeight: 900, fontSize: 14, minWidth: 20 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#ddd', lineHeight: 1.5 }}>{advice}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── KEY BATTLES ────────────────────────────────────────────────── */}
        {data.keyBattles?.length ? (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader title="⚔️ المعارك الحاسمة" accent={our.accent} />
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
              {data.keyBattles.slice(0, 3).map((battle, i) => (
                <div key={i} style={{ fontSize: 12, color: '#ccc', marginBottom: 6, lineHeight: 1.4 }}>
                  <span style={{ color: our.primary }}>⚡</span> {battle}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── SUMMARY ────────────────────────────────────────────────────── */}
        {data.summary && (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader title="📋 الخلاصة الرقمية" accent={our.accent} />
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 8,
              padding: '12px 16px',
              borderRight: `4px solid ${our.primary}`,
              fontSize: 13,
              color: '#ddd',
              lineHeight: 1.7,
              fontStyle: 'italic',
            }}>
              "{data.summary}"
            </div>
          </div>
        )}

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${our.accent}33`,
          paddingTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          color: '#666',
        }}>
          <span>النموذج: Dixon-Coles + Poisson + Monte Carlo</span>
          <span style={{ color: our.accent }}>Match Intelligence Engine</span>
          <span>{data.simCount ? `${(data.simCount / 1000).toFixed(0)}K محاكاة` : '100K محاكاة'}</span>
        </div>
      </div>
    </div>
  );
}
