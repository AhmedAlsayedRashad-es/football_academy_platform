// CSV Export/Import utilities for match event data

export interface CSVMatchEvent {
  eventType: string;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  outcome?: string;
  bodyPart?: string;
  assistType?: string;
  actionType?: string;
  success?: boolean;
  completed?: boolean;
  xG?: number;
  xA?: number;
  timestamp?: string;
  playerId?: number;
  playerName?: string;
  teamId?: number;
  teamName?: string;
  minute?: number;
  phase?: string; // "in_possession" | "out_possession" | "attacking_transition" | "defensive_transition"
  zone?: string; // "build_up" | "progression" | "finishing"
}

/**
 * Convert match events to CSV format
 */
export function exportEventsToCSV(events: any[], matchInfo?: { homeTeam?: string; awayTeam?: string; date?: string }): string {
  // CSV Headers
  const headers = [
    "Event Type",
    "X Position",
    "Y Position",
    "End X",
    "End Y",
    "Outcome",
    "Body Part",
    "Assist Type",
    "Action Type",
    "Success",
    "Completed",
    "xG",
    "xA",
    "Timestamp",
    "Player ID",
    "Player Name",
    "Team ID",
    "Team Name",
    "Minute",
    "Phase",
    "Zone"
  ];

  // Add match info as comments at the top
  let csv = "";
  if (matchInfo) {
    csv += `# Match: ${matchInfo.homeTeam || "Home"} vs ${matchInfo.awayTeam || "Away"}\n`;
    csv += `# Date: ${matchInfo.date || new Date().toISOString()}\n`;
    csv += `# Exported: ${new Date().toISOString()}\n`;
  }

  csv += headers.join(",") + "\n";

  // Convert each event to CSV row
  events.forEach((event) => {
    const row = [
      event.type || "",
      event.x?.toFixed(2) || "",
      event.y?.toFixed(2) || "",
      event.endX?.toFixed(2) || "",
      event.endY?.toFixed(2) || "",
      event.outcome || "",
      event.bodyPart || "",
      event.assistType || "",
      event.actionType || "",
      event.success !== undefined ? event.success : "",
      event.completed !== undefined ? event.completed : "",
      event.xG?.toFixed(3) || "",
      event.xA?.toFixed(3) || "",
      event.timestamp || new Date().toISOString(),
      event.playerId || "",
      event.playerName || "",
      event.teamId || "",
      event.teamName || "",
      event.minute || "",
      event.phase || "",
      event.zone || ""
    ];

    csv += row.map(cell => {
      // Escape commas and quotes in cell values
      const cellStr = String(cell);
      if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(",") + "\n";
  });

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string = "match_events.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV content to match events
 */
export function importEventsFromCSV(csvContent: string): CSVMatchEvent[] {
  const lines = csvContent.split("\n").filter(line => line.trim() && !line.startsWith("#"));
  
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const events: CSVMatchEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted values)
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (insideQuotes && line[j + 1] === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add last value

    // Map values to event object
    const event: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      if (!value) return;

      switch (header.toLowerCase()) {
        case "event type":
          event.eventType = value;
          break;
        case "x position":
          event.x = parseFloat(value);
          break;
        case "y position":
          event.y = parseFloat(value);
          break;
        case "end x":
          if (value) event.endX = parseFloat(value);
          break;
        case "end y":
          if (value) event.endY = parseFloat(value);
          break;
        case "outcome":
          if (value) event.outcome = value;
          break;
        case "body part":
          if (value) event.bodyPart = value;
          break;
        case "assist type":
          if (value) event.assistType = value;
          break;
        case "action type":
          if (value) event.actionType = value;
          break;
        case "success":
          if (value) event.success = value.toLowerCase() === "true";
          break;
        case "completed":
          if (value) event.completed = value.toLowerCase() === "true";
          break;
        case "xg":
          if (value) event.xG = parseFloat(value);
          break;
        case "xa":
          if (value) event.xA = parseFloat(value);
          break;
        case "timestamp":
          if (value) event.timestamp = value;
          break;
        case "player id":
          if (value) event.playerId = parseInt(value);
          break;
        case "player name":
          if (value) event.playerName = value;
          break;
        case "team id":
          if (value) event.teamId = parseInt(value);
          break;
        case "team name":
          if (value) event.teamName = value;
          break;
        case "minute":
          if (value) event.minute = parseInt(value);
          break;
        case "phase":
          if (value) event.phase = value;
          break;
        case "zone":
          if (value) event.zone = value;
          break;
      }
    });

    // Validate required fields
    if (event.eventType && !isNaN(event.x) && !isNaN(event.y)) {
      events.push(event as CSVMatchEvent);
    }
  }

  return events;
}

/**
 * Convert CSV events to internal event format
 */
export function convertCSVToInternalFormat(csvEvents: CSVMatchEvent[]): any[] {
  return csvEvents.map(csvEvent => {
    const baseEvent = {
      x: csvEvent.x,
      y: csvEvent.y,
      timestamp: csvEvent.timestamp,
      playerId: csvEvent.playerId,
      playerName: csvEvent.playerName,
      teamId: csvEvent.teamId,
      teamName: csvEvent.teamName,
      minute: csvEvent.minute,
      phase: csvEvent.phase,
      zone: csvEvent.zone,
    };

    switch (csvEvent.eventType.toLowerCase()) {
      case "shot":
        return {
          ...baseEvent,
          type: "shot",
          outcome: csvEvent.outcome || "miss",
          bodyPart: csvEvent.bodyPart || "foot",
          assistType: csvEvent.assistType || "open_play",
          xG: csvEvent.xG || 0,
        };
      
      case "pass":
        return {
          ...baseEvent,
          type: "pass",
          startX: csvEvent.x,
          startY: csvEvent.y,
          endX: csvEvent.endX || csvEvent.x,
          endY: csvEvent.endY || csvEvent.y,
          completed: csvEvent.completed !== false,
          xA: csvEvent.xA || 0,
        };
      
      case "defensive":
        return {
          ...baseEvent,
          type: "defensive",
          actionType: csvEvent.actionType || "tackle",
          success: csvEvent.success !== false,
        };
      
      default:
        return baseEvent;
    }
  });
}

/**
 * Read CSV file from File input
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Validate CSV format
 */
export function validateCSV(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const events = importEventsFromCSV(csvContent);
    
    if (events.length === 0) {
      errors.push("No valid events found in CSV");
    }
    
    // Check for required fields
    events.forEach((event, index) => {
      if (!event.eventType) {
        errors.push(`Row ${index + 2}: Missing event type`);
      }
      if (isNaN(event.x) || isNaN(event.y)) {
        errors.push(`Row ${index + 2}: Invalid position coordinates`);
      }
    });
    
  } catch (error) {
    errors.push(`CSV parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
