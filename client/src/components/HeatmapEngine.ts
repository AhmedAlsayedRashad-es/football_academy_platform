/**
 * Professional Heatmap Engine for Football Analytics
 * Inspired by InStat/Wyscout visualization systems
 */

export interface HeatmapPoint {
  x: number; // 0-100 (percentage of pitch width)
  y: number; // 0-100 (percentage of pitch height)
  intensity: number; // 0-1 (activity intensity)
  timestamp?: number; // match minute
}

export interface HeatmapOptions {
  width: number;
  height: number;
  radius?: number; // blur radius
  maxIntensity?: number;
  gradient?: { [key: number]: string };
  opacity?: number;
}

export class HeatmapEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<HeatmapOptions>;
  private points: HeatmapPoint[] = [];

  // Default gradient: blue (low) -> green -> yellow -> red (high)
  private static DEFAULT_GRADIENT = {
    0.0: '#0000ff',
    0.2: '#00ffff',
    0.4: '#00ff00',
    0.6: '#ffff00',
    0.8: '#ff8800',
    1.0: '#ff0000'
  };

  constructor(canvas: HTMLCanvasElement, options: HeatmapOptions) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;

    this.options = {
      width: options.width,
      height: options.height,
      radius: options.radius || 40,
      maxIntensity: options.maxIntensity || 1,
      gradient: options.gradient || HeatmapEngine.DEFAULT_GRADIENT,
      opacity: options.opacity || 0.6
    };

    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
  }

  /**
   * Add data points to the heatmap
   */
  addPoints(points: HeatmapPoint[]): void {
    this.points = [...this.points, ...points];
  }

  /**
   * Clear all data points
   */
  clearPoints(): void {
    this.points = [];
  }

  /**
   * Render the heatmap
   */
  render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);

    if (this.points.length === 0) {
      return;
    }

    // Create intensity map
    const intensityMap = this.createIntensityMap();

    // Apply gradient and render
    this.applyGradient(intensityMap);
  }

  /**
   * Create intensity map from points
   */
  private createIntensityMap(): ImageData {
    const { width, height, radius } = this.options;
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    // Create temporary canvas for blur effect
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return imageData;

    // Draw each point with radial gradient
    this.points.forEach(point => {
      const x = (point.x / 100) * width;
      const y = (point.y / 100) * height;
      const intensity = Math.min(point.intensity, this.options.maxIntensity);

      const gradient = tempCtx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      tempCtx.fillStyle = gradient;
      tempCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    return tempCtx.getImageData(0, 0, width, height);
  }

  /**
   * Apply color gradient to intensity map
   */
  private applyGradient(intensityMap: ImageData): void {
    const { width, height, gradient, opacity } = this.options;
    const data = intensityMap.data;

    // Create gradient lookup table
    const gradientLookup = this.createGradientLookup(gradient);

    // Apply gradient colors
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha > 0) {
        const colorIndex = Math.floor(alpha * 255);
        const color = gradientLookup[colorIndex];
        
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = alpha * 255 * opacity;
      }
    }

    this.ctx.putImageData(intensityMap, 0, 0);
  }

  /**
   * Create gradient color lookup table
   */
  private createGradientLookup(gradient: { [key: number]: string }): Array<{ r: number; g: number; b: number }> {
    const lookup: Array<{ r: number; g: number; b: number }> = [];
    const stops = Object.keys(gradient).map(Number).sort((a, b) => a - b);

    for (let i = 0; i < 256; i++) {
      const position = i / 255;
      
      // Find surrounding gradient stops
      let lowerStop = stops[0];
      let upperStop = stops[stops.length - 1];
      
      for (let j = 0; j < stops.length - 1; j++) {
        if (position >= stops[j] && position <= stops[j + 1]) {
          lowerStop = stops[j];
          upperStop = stops[j + 1];
          break;
        }
      }

      // Interpolate between stops
      const range = upperStop - lowerStop;
      const factor = range === 0 ? 0 : (position - lowerStop) / range;
      
      const lowerColor = this.hexToRgb(gradient[lowerStop]);
      const upperColor = this.hexToRgb(gradient[upperStop]);

      lookup[i] = {
        r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * factor),
        g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * factor),
        b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * factor)
      };
    }

    return lookup;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Generate sample data for testing
   */
  static generateSampleData(count: number = 100): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];
    
    // Simulate player movement patterns
    for (let i = 0; i < count; i++) {
      // Cluster points in certain areas (realistic player positioning)
      const cluster = Math.random();
      let x, y;
      
      if (cluster < 0.3) {
        // Defensive third
        x = 20 + Math.random() * 30;
        y = 20 + Math.random() * 60;
      } else if (cluster < 0.7) {
        // Middle third
        x = 40 + Math.random() * 30;
        y = 15 + Math.random() * 70;
      } else {
        // Attacking third
        x = 60 + Math.random() * 30;
        y = 25 + Math.random() * 50;
      }

      points.push({
        x,
        y,
        intensity: 0.3 + Math.random() * 0.7,
        timestamp: Math.floor(Math.random() * 90)
      });
    }

    return points;
  }
}
