/**
 * Audio Notification Service
 * Provides audio alerts for critical match events
 */

export type AlertType = 
  | 'fatigue_critical'
  | 'fatigue_high'
  | 'tactical_change'
  | 'goal_opportunity'
  | 'goal_scored'
  | 'card_received'
  | 'injury'
  | 'substitution_needed';

interface AudioNotificationOptions {
  volume?: number;
  enabled?: boolean;
}

class AudioNotificationService {
  private audioContext: AudioContext | null = null;
  private volume: number = 0.7;
  private enabled: boolean = true;
  private lastPlayTime: Map<AlertType, number> = new Map();
  private minTimeBetweenAlerts: number = 5000; // 5 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSettings();
    }
  }

  private loadSettings() {
    const savedVolume = localStorage.getItem('audioNotifications_volume');
    const savedEnabled = localStorage.getItem('audioNotifications_enabled');
    
    if (savedVolume) this.volume = parseFloat(savedVolume);
    if (savedEnabled) this.enabled = savedEnabled === 'true';
  }

  private saveSettings() {
    localStorage.setItem('audioNotifications_volume', this.volume.toString());
    localStorage.setItem('audioNotifications_enabled', this.enabled.toString());
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private canPlayAlert(type: AlertType): boolean {
    if (!this.enabled) return false;
    
    const lastTime = this.lastPlayTime.get(type) || 0;
    const now = Date.now();
    
    if (now - lastTime < this.minTimeBetweenAlerts) {
      return false;
    }
    
    this.lastPlayTime.set(type, now);
    return true;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.canPlayAlert('fatigue_critical')) return;
    
    this.initAudioContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playSequence(frequencies: number[], duration: number = 0.2, gap: number = 0.1) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, duration);
      }, index * (duration + gap) * 1000);
    });
  }

  /**
   * Play alert sound based on type
   */
  playAlert(type: AlertType, message?: string) {
    if (!this.canPlayAlert(type)) return;

    switch (type) {
      case 'fatigue_critical':
        // Urgent ascending tones
        this.playSequence([440, 554, 659, 880], 0.15, 0.05);
        break;

      case 'fatigue_high':
        // Warning double beep
        this.playSequence([523, 523], 0.2, 0.15);
        break;

      case 'tactical_change':
        // Notification chime
        this.playSequence([523, 659, 784], 0.2, 0.1);
        break;

      case 'goal_opportunity':
        // Exciting rising tone
        this.playSequence([392, 494, 587, 698], 0.15, 0.05);
        break;

      case 'goal_scored':
        // Victory fanfare
        this.playSequence([523, 659, 784, 1047], 0.25, 0.1);
        break;

      case 'card_received':
        // Sharp warning
        this.playSequence([880, 698], 0.3, 0.1);
        break;

      case 'injury':
        // Urgent alert
        this.playSequence([440, 440, 440], 0.2, 0.15);
        break;

      case 'substitution_needed':
        // Gentle reminder
        this.playSequence([659, 784], 0.25, 0.2);
        break;
    }

    // Show notification if available
    if (message && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Match Alert', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Enable/disable audio notifications
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.saveSettings();
  }

  /**
   * Check if audio notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Test audio with a sample alert
   */
  testAudio() {
    this.playAlert('tactical_change', 'Audio test');
  }
}

// Export singleton instance
export const audioNotifications = new AudioNotificationService();
