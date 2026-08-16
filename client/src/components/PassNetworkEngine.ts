/**
 * Professional Pass Network Visualizer for Football Analytics
 * Inspired by InStat/Wyscout pass map systems
 */

export interface PlayerNode {
  id: string;
  name: string;
  number: number;
  position: { x: number; y: number }; // 0-100 percentage
  touches: number;
  passesCompleted: number;
  passesAttempted: number;
}

export interface PassConnection {
  from: string; // player id
  to: string; // player id
  count: number; // number of passes
  success: number; // successful passes
}

export interface PassNetworkOptions {
  width: number;
  height: number;
  showLabels?: boolean;
  showStats?: boolean;
  minPassThreshold?: number; // minimum passes to show connection
}

export class PassNetworkEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<PassNetworkOptions>;
  private players: Map<string, PlayerNode> = new Map();
  private connections: PassConnection[] = [];

  constructor(canvas: HTMLCanvasElement, options: PassNetworkOptions) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;

    this.options = {
      width: options.width,
      height: options.height,
      showLabels: options.showLabels ?? true,
      showStats: options.showStats ?? true,
      minPassThreshold: options.minPassThreshold ?? 3
    };

    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
  }

  /**
   * Set player nodes
   */
  setPlayers(players: PlayerNode[]): void {
    this.players.clear();
    players.forEach(player => {
      this.players.set(player.id, player);
    });
  }

  /**
   * Set pass connections
   */
  setConnections(connections: PassConnection[]): void {
    this.connections = connections.filter(
      conn => conn.count >= this.options.minPassThreshold
    );
  }

  /**
   * Render the pass network
   */
  render(): void {
    const { width, height } = this.options;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw pitch outline
    this.drawPitch();

    // Draw connections (arrows) first
    this.drawConnections();

    // Draw player nodes on top
    this.drawPlayers();
  }

  /**
   * Draw football pitch
   */
  private drawPitch(): void {
    const { width, height } = this.options;
    const padding = 50;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;

    // Pitch outline
    this.ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // Center line
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2, padding);
    this.ctx.lineTo(width / 2, height - padding);
    this.ctx.stroke();

    // Center circle
    this.ctx.beginPath();
    this.ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Draw pass connections with arrows
   */
  private drawConnections(): void {
    const { width, height } = this.options;

    this.connections.forEach(conn => {
      const fromPlayer = this.players.get(conn.from);
      const toPlayer = this.players.get(conn.to);

      if (!fromPlayer || !toPlayer) return;

      const fromX = (fromPlayer.position.x / 100) * width;
      const fromY = (fromPlayer.position.y / 100) * height;
      const toX = (toPlayer.position.x / 100) * width;
      const toY = (toPlayer.position.y / 100) * height;

      // Calculate line thickness based on pass count
      const maxPasses = Math.max(...this.connections.map(c => c.count));
      const thickness = 1 + (conn.count / maxPasses) * 8;

      // Calculate success rate
      const successRate = conn.success / conn.count;

      // Color based on success rate
      const color = this.getSuccessColor(successRate);
      const alpha = 0.4 + successRate * 0.4;

      // Draw arrow
      this.drawArrow(fromX, fromY, toX, toY, thickness, color, alpha);

      // Draw pass count label
      if (this.options.showStats) {
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        this.drawPassLabel(midX, midY, conn.count, successRate);
      }
    });
  }

  /**
   * Draw arrow from one point to another
   */
  private drawArrow(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    thickness: number,
    color: string,
    alpha: number
  ): void {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Offset from node centers
    const nodeRadius = 20;
    const startX = fromX + Math.cos(angle) * nodeRadius;
    const startY = fromY + Math.sin(angle) * nodeRadius;
    const endX = toX - Math.cos(angle) * nodeRadius;
    const endY = toY - Math.sin(angle) * nodeRadius;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = thickness;

    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Draw arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * Draw pass count label
   */
  private drawPassLabel(x: number, y: number, count: number, successRate: number): void {
    this.ctx.save();
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x - 15, y - 10, 30, 20);

    // Text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(count.toString(), x, y);

    this.ctx.restore();
  }

  /**
   * Draw player nodes
   */
  private drawPlayers(): void {
    const { width, height } = this.options;

    this.players.forEach(player => {
      const x = (player.position.x / 100) * width;
      const y = (player.position.y / 100) * height;

      // Calculate node size based on touches
      const maxTouches = Math.max(...Array.from(this.players.values()).map(p => p.touches));
      const radius = 15 + (player.touches / maxTouches) * 15;

      // Draw node circle
      this.ctx.save();
      
      // Outer glow
      const gradient = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Main circle
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Player number
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(player.number.toString(), x, y);

      this.ctx.restore();

      // Draw label
      if (this.options.showLabels) {
        this.drawPlayerLabel(x, y + radius + 15, player);
      }
    });
  }

  /**
   * Draw player label
   */
  private drawPlayerLabel(x: number, y: number, player: PlayerNode): void {
    this.ctx.save();

    // Background
    const textWidth = this.ctx.measureText(player.name).width;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x - textWidth / 2 - 5, y - 10, textWidth + 10, 20);

    // Text
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(player.name, x, y);

    this.ctx.restore();
  }

  /**
   * Get color based on success rate
   */
  private getSuccessColor(successRate: number): string {
    if (successRate >= 0.9) return '#10b981'; // Green
    if (successRate >= 0.8) return '#84cc16'; // Light green
    if (successRate >= 0.7) return '#eab308'; // Yellow
    if (successRate >= 0.6) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Generate sample data for testing
   */
  static generateSampleData(): { players: PlayerNode[]; connections: PassConnection[] } {
    const players: PlayerNode[] = [
      { id: 'p1', name: 'Alisson', number: 1, position: { x: 10, y: 50 }, touches: 45, passesCompleted: 38, passesAttempted: 42 },
      { id: 'p2', name: 'Alexander-Arnold', number: 66, position: { x: 25, y: 20 }, touches: 78, passesCompleted: 65, passesAttempted: 72 },
      { id: 'p3', name: 'Van Dijk', number: 4, position: { x: 20, y: 50 }, touches: 82, passesCompleted: 75, passesAttempted: 80 },
      { id: 'p4', name: 'Robertson', number: 26, position: { x: 25, y: 80 }, touches: 71, passesCompleted: 62, passesAttempted: 68 },
      { id: 'p5', name: 'Fabinho', number: 3, position: { x: 40, y: 50 }, touches: 95, passesCompleted: 88, passesAttempted: 92 },
      { id: 'p6', name: 'Henderson', number: 14, position: { x: 55, y: 35 }, touches: 87, passesCompleted: 78, passesAttempted: 84 },
      { id: 'p7', name: 'Thiago', number: 6, position: { x: 55, y: 65 }, touches: 102, passesCompleted: 96, passesAttempted: 100 },
      { id: 'p8', name: 'Salah', number: 11, position: { x: 75, y: 20 }, touches: 64, passesCompleted: 48, passesAttempted: 56 },
      { id: 'p9', name: 'Firmino', number: 9, position: { x: 80, y: 50 }, touches: 58, passesCompleted: 45, passesAttempted: 52 },
      { id: 'p10', name: 'Mané', number: 10, position: { x: 75, y: 80 }, touches: 61, passesCompleted: 47, passesAttempted: 54 }
    ];

    const connections: PassConnection[] = [
      { from: 'p1', to: 'p3', count: 12, success: 11 },
      { from: 'p3', to: 'p5', count: 18, success: 17 },
      { from: 'p5', to: 'p6', count: 15, success: 14 },
      { from: 'p5', to: 'p7', count: 16, success: 15 },
      { from: 'p6', to: 'p8', count: 12, success: 10 },
      { from: 'p7', to: 'p10', count: 14, success: 12 },
      { from: 'p2', to: 'p6', count: 10, success: 9 },
      { from: 'p4', to: 'p7', count: 11, success: 10 },
      { from: 'p6', to: 'p9', count: 8, success: 7 },
      { from: 'p7', to: 'p9', count: 9, success: 8 },
      { from: 'p8', to: 'p9', count: 7, success: 5 },
      { from: 'p10', to: 'p9', count: 6, success: 5 }
    ];

    return { players, connections };
  }
}
