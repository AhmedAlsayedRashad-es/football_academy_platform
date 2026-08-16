import jsPDF from 'jspdf';

interface SkillAssessmentData {
  playerName: string;
  date: string;
  skills: {
    name: string;
    value: number;
  }[];
  overallRating: number;
  coachNotes?: string;
}

interface OppositionAnalysisData {
  opponentName: string;
  date: string;
  keyPlayers: {
    name: string;
    position: string;
    threat: string;
    notes: string;
  }[];
  patterns: {
    name: string;
    frequency: string;
    description: string;
  }[];
  strengths: string[];
  weaknesses: string[];
}

interface MatchBriefingData {
  matchTitle: string;
  date: string;
  opponent: string;
  venue: string;
  formation: string;
  keyPoints: string[];
  playerInstructions: {
    player: string;
    role: string;
    instructions: string;
  }[];
}

// Helper function to add header
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Title
  doc.setFontSize(24);
  doc.setTextColor(26, 54, 93); // Navy blue
  doc.text(title, 20, 30);
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 20, 40);
  }
  
  // Line separator
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(2);
  doc.line(20, 45, 190, 45);
  
  return 55; // Return Y position after header
}

// Helper function to add footer
function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Future Stars Academy - Page ${pageNum}`, 105, pageHeight - 10, { align: 'center' });
  doc.text(new Date().toLocaleDateString(), 190, pageHeight - 10, { align: 'right' });
}

// Export Skill Assessment Report
export function exportSkillAssessmentPDF(data: SkillAssessmentData): void {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'Player Skill Assessment', `${data.playerName} - ${data.date}`);
  
  // Overall Rating
  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text('Overall Rating', 20, y);
  y += 10;
  
  doc.setFontSize(36);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text(`${data.overallRating.toFixed(1)}`, 20, y);
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('/ 100', 55, y);
  y += 20;
  
  // Skills Table
  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text('Skill Breakdown', 20, y);
  y += 10;
  
  // Table header
  doc.setFillColor(26, 54, 93);
  doc.rect(20, y, 170, 10, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Skill', 25, y + 7);
  doc.text('Rating', 120, y + 7);
  doc.text('Level', 155, y + 7);
  y += 10;
  
  // Table rows
  data.skills.forEach((skill, index) => {
    const bgColor = index % 2 === 0 ? 245 : 255;
    doc.setFillColor(bgColor, bgColor, bgColor);
    doc.rect(20, y, 170, 10, 'F');
    
    doc.setTextColor(50, 50, 50);
    doc.text(skill.name, 25, y + 7);
    doc.text(`${skill.value}`, 125, y + 7);
    
    // Skill level label
    let level = 'Developing';
    if (skill.value >= 90) level = 'Elite';
    else if (skill.value >= 80) level = 'Excellent';
    else if (skill.value >= 70) level = 'Good';
    else if (skill.value >= 60) level = 'Average';
    
    doc.text(level, 155, y + 7);
    y += 10;
  });
  
  y += 15;
  
  // Coach Notes
  if (data.coachNotes) {
    doc.setFontSize(16);
    doc.setTextColor(26, 54, 93);
    doc.text('Coach Notes', 20, y);
    y += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    const splitNotes = doc.splitTextToSize(data.coachNotes, 170);
    doc.text(splitNotes, 20, y);
  }
  
  addFooter(doc, 1);
  
  doc.save(`skill-assessment-${data.playerName.replace(/\s+/g, '-').toLowerCase()}-${data.date}.pdf`);
}

// Export Opposition Analysis Report
export function exportOppositionAnalysisPDF(data: OppositionAnalysisData): void {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'Opposition Analysis', `${data.opponentName} - ${data.date}`);
  
  // Key Players Section
  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text('Key Players to Watch', 20, y);
  y += 10;
  
  data.keyPlayers.forEach((player) => {
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y, 170, 20, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(26, 54, 93);
    doc.text(`${player.name} (${player.position})`, 25, y + 7);
    
    // Threat level badge
    const threatColors: Record<string, [number, number, number]> = {
      'High': [220, 53, 69],
      'Medium': [255, 193, 7],
      'Low': [40, 167, 69]
    };
    const color = threatColors[player.threat] || [100, 100, 100];
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`Threat: ${player.threat}`, 140, y + 7);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const splitNotes = doc.splitTextToSize(player.notes, 160);
    doc.text(splitNotes, 25, y + 15);
    y += 25;
  });
  
  y += 10;
  
  // Tactical Patterns
  if (y > 200) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text('Tactical Patterns', 20, y);
  y += 10;
  
  data.patterns.forEach((pattern) => {
    doc.setFontSize(12);
    doc.setTextColor(26, 54, 93);
    doc.text(`• ${pattern.name}`, 25, y);
    doc.setTextColor(212, 175, 55);
    doc.text(`(${pattern.frequency})`, 100, y);
    y += 6;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const splitDesc = doc.splitTextToSize(pattern.description, 160);
    doc.text(splitDesc, 30, y);
    y += splitDesc.length * 5 + 5;
  });
  
  y += 10;
  
  // Strengths & Weaknesses
  if (y > 220) {
    doc.addPage();
    y = 20;
  }
  
  // Two columns
  doc.setFontSize(14);
  doc.setTextColor(40, 167, 69);
  doc.text('Strengths', 20, y);
  doc.setTextColor(220, 53, 69);
  doc.text('Weaknesses', 110, y);
  y += 8;
  
  const maxItems = Math.max(data.strengths.length, data.weaknesses.length);
  doc.setFontSize(10);
  for (let i = 0; i < maxItems; i++) {
    if (data.strengths[i]) {
      doc.setTextColor(50, 50, 50);
      doc.text(`• ${data.strengths[i]}`, 25, y);
    }
    if (data.weaknesses[i]) {
      doc.setTextColor(50, 50, 50);
      doc.text(`• ${data.weaknesses[i]}`, 115, y);
    }
    y += 6;
  }
  
  addFooter(doc, 1);
  
  doc.save(`opposition-analysis-${data.opponentName.replace(/\s+/g, '-').toLowerCase()}-${data.date}.pdf`);
}

// Export Match Briefing Report
export function exportMatchBriefingPDF(data: MatchBriefingData): void {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'Pre-Match Briefing', data.matchTitle);
  
  // Match Info Box
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y, 170, 30, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('Date:', 25, y + 8);
  doc.text('Opponent:', 25, y + 16);
  doc.text('Venue:', 25, y + 24);
  doc.text('Formation:', 110, y + 8);
  
  doc.setTextColor(26, 54, 93);
  doc.text(data.date, 50, y + 8);
  doc.text(data.opponent, 50, y + 16);
  doc.text(data.venue, 50, y + 24);
  doc.text(data.formation, 145, y + 8);
  
  y += 40;
  
  // Key Points
  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text('Key Points', 20, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  data.keyPoints.forEach((point) => {
    doc.text(`• ${point}`, 25, y);
    y += 7;
  });
  
  y += 10;
  
  // Player Instructions
  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text('Player Instructions', 20, y);
  y += 10;
  
  // Table header
  doc.setFillColor(26, 54, 93);
  doc.rect(20, y, 170, 10, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Player', 25, y + 7);
  doc.text('Role', 70, y + 7);
  doc.text('Instructions', 110, y + 7);
  y += 10;
  
  data.playerInstructions.forEach((instruction, index) => {
    const bgColor = index % 2 === 0 ? 245 : 255;
    doc.setFillColor(bgColor, bgColor, bgColor);
    
    const splitInstructions = doc.splitTextToSize(instruction.instructions, 75);
    const rowHeight = Math.max(10, splitInstructions.length * 5 + 5);
    
    doc.rect(20, y, 170, rowHeight, 'F');
    
    doc.setTextColor(50, 50, 50);
    doc.text(instruction.player, 25, y + 7);
    doc.text(instruction.role, 70, y + 7);
    doc.text(splitInstructions, 110, y + 5);
    
    y += rowHeight;
    
    if (y > 270) {
      addFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      y = 20;
    }
  });
  
  addFooter(doc, doc.getNumberOfPages());
  
  doc.save(`match-briefing-${data.opponent.replace(/\s+/g, '-').toLowerCase()}-${data.date}.pdf`);
}
