with open('client/src/pages/Home.tsx', 'r') as f:
    content = f.read()

# 1. Replace photo constants block
old = """// Academy team photos (real photos from the academy)
const ACADEMY_PHOTO_1 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/academy-training-1_80d28f1f.webp';
const ACADEMY_PHOTO_2 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/academy-training-2_72aaa80b.jpg';
const STADIUM_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/football-match-action_002175da.jpg';
const FIELD_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/youth-team-trophy_a4e4fe91.jpg';
const HERO_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/al-ahly-stadium_654ef5e1.jpg';"""

new = """// Academy team photos — real photos from the Stars Academy (Egyptian Stars Championship)
const HERO_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/_DSC3607_9717f7f3.webp';
const ACADEMY_PHOTO_1 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/645416912_1361634609317606_6269294764819225093_n_9b0e89c3.jpg';
const ACADEMY_PHOTO_2 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/645500313_1361631912651209_2241632664693131871_n_42ba55cd.jpg';
const STADIUM_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/656086811_1380857347395332_8464477083659316272_n_ac7a3c75.jpg';
const FIELD_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/ea162d51-50b1-4c54-a51e-9daae3b69036_fa76c5bf.jpg';
const COACH_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/646935491_1361633929317674_551292786635891851_n_beaca805.jpg';
const YOUTH_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/_DSC1951_0f67c08c.webp';
const COACH_DIRECTING = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/644218157_1361633249317742_6480002850924410596_n_e1c7bb3a.jpg';
const BEST_PLAYER_AWARD = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/655857068_1380857450728655_7610104573536396946_n_5c50ae03.jpg';
const MEDAL_WITH_COACH = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/656174529_1380857054062028_966486968491683669_n_aa234720.jpg';
const MEDAL_CEREMONY = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/654946875_1380856957395371_8300668602372635608_n_af021757.jpg';"""

if old in content:
    content = content.replace(old, new)
    print("Constants replaced")
else:
    print("Constants already updated or not found - checking...")
    if "COACH_DIRECTING" not in content:
        print("ERROR: constants block not found and COACH_DIRECTING missing!")
        exit(1)
    else:
        print("Constants already updated, skipping")

# 2. Replace news items
old_news = """  const newsItems = [
    {
      category: 'Achievements',
      categoryColor: '#16a34a',
      date: 'January 5, 2026',
      title: 'U16 Team Wins Regional Championship',
      desc: 'Our U16 team achieved a fantastic victory in the regional championship, defeating 12 teams from across Egypt.',
      image: ACADEMY_PHOTO_1,
    },
    {
      category: 'Training',
      categoryColor: '#2563eb',
      date: 'January 3, 2026',
      title: 'New Summer Training Program Launched',
      desc: 'Announcing the launch of an intensive summer training program with UEFA-certified coaches for all age groups.',
      image: ACADEMY_PHOTO_2,
    },
    {
      category: 'Events',
      categoryColor: '#7c3aed',
      date: 'January 1, 2026',
      title: 'Youth National Team Coach Visits Academy',
      desc: 'Special visit from the Egyptian national team youth coach to evaluate our top talents for national selection.',
      image: STADIUM_PHOTO,
    },
  ];"""

new_news = """  const newsItems = [
    {
      category: 'Achievements',
      categoryColor: '#16a34a',
      date: 'January 5, 2026',
      title: 'Stars Academy Wins Egyptian Stars Championship',
      desc: 'Our academy players claimed first place at the Egyptian Stars Championship, defeating top academies from across Egypt in an unforgettable final.',
      image: STADIUM_PHOTO,
    },
    {
      category: 'Matches',
      categoryColor: '#2563eb',
      date: 'January 3, 2026',
      title: 'Intense Match Action at ESC Tournament',
      desc: 'Academy players delivered outstanding performances in the Egyptian Stars Championship, showcasing their technical skills and competitive spirit.',
      image: ACADEMY_PHOTO_1,
    },
    {
      category: 'Community',
      categoryColor: '#7c3aed',
      date: 'January 1, 2026',
      title: 'Coach & Player Bond: The Heart of Our Academy',
      desc: 'Our coaching staff builds strong personal connections with every player, providing mentorship both on and off the pitch.',
      image: COACH_PHOTO,
    },
  ];"""

if old_news in content:
    content = content.replace(old_news, new_news)
    print("News replaced")
else:
    print("News already updated, skipping")

# 3. Replace gallery section
old_gallery_marker = "          {/* Main gallery grid */}"
new_gallery_end_marker = "          </div>\n        </div>\n      </section>\n\n      {/* ===== NEWS"

if old_gallery_marker in content:
    # Find start and end of gallery div
    start = content.index(old_gallery_marker)
    end = content.index(new_gallery_end_marker, start)
    
    new_gallery = """          {/* ── ROW 1: Hero + 2 stacked ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: '1 / 7', borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '340px' }}>
              <img src={ACADEMY_PHOTO_1} alt="Match Action" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '20px 16px 16px' }}>
                <div style={{ color: GOLD, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Egyptian Stars Championship</div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Academy Players in Match Action</div>
              </div>
            </div>
            <div style={{ gridColumn: '7 / 13', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', flex: 1, minHeight: '160px' }}>
                <img src={ACADEMY_PHOTO_2} alt="Physical Duel" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '14px' }}>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Competitive Match Play</div>
                </div>
              </div>
              <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', flex: 1, minHeight: '160px' }}>
                <img src={FIELD_PHOTO} alt="Official Team Photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '14px' }}>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Official Team Photo</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2: 4 equal columns ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            {[
              { src: COACH_PHOTO, label: 'Coach & Player Moments', tag: 'Coaching' },
              { src: STADIUM_PHOTO, label: 'Championship Celebrations', tag: 'Achievements' },
              { src: YOUTH_PHOTO, label: 'Youth Team Training', tag: 'Training' },
              { src: COACH_DIRECTING, label: 'Coach Directing from Sideline', tag: 'Coaching' },
            ].map((g, i) => (
              <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '210px' }}>
                <img src={g.src} alt={g.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
                <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                  <span style={{ backgroundColor: RED, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>{g.tag}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px' }}>
                  <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{g.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── ROW 3: asymmetric 3-column ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
            <div style={{ gridColumn: '1 / 6', borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '240px' }}>
              <img src={MEDAL_CEREMONY} alt="Medal Ceremony" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '18px 16px 14px' }}>
                <div style={{ color: GOLD, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>ESC Ceremony</div>
                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>Medal Presentation Ceremony</div>
              </div>
            </div>
            <div style={{ gridColumn: '6 / 10', borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '240px' }}>
              <img src={BEST_PLAYER_AWARD} alt="Best Player Award" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
              <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                <span style={{ backgroundColor: GOLD, color: '#000', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>Best Player</span>
              </div>
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px' }}>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Best Player of the Tournament</div>
              </div>
            </div>
            <div style={{ gridColumn: '10 / 13', borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '240px' }}>
              <img src={MEDAL_WITH_COACH} alt="Coach with Medal Winners" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px' }}>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Coach with Medal Winners</div>
              </div>
            </div>
          </div>"""
    
    content = content[:start] + new_gallery + content[end:]
    print("Gallery replaced")
else:
    print("Gallery marker not found - may already be updated")

with open('client/src/pages/Home.tsx', 'w') as f:
    f.write(content)

print("Done!")
