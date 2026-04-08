/**
 * Voice Command Parser
 * Recognizes and parses voice commands
 */

/**
 * Parse voice command and extract intent
 */
function parseVoiceCommand(text) {
  const lowerText = text.toLowerCase().trim();
  
  if (!lowerText || lowerText.length < 2) {
    return { intent: 'unknown', text: lowerText };
  }

  // Playback controls
  if (lowerText.includes('play') || lowerText.includes('start') || lowerText.includes('resume')) {
    return { intent: 'playback', action: 'play', params: {} };
  }
  
  if (lowerText.includes('pause')) {
    return { intent: 'playback', action: 'pause', params: {} };
  }
  
  if (lowerText.includes('stop')) {
    return { intent: 'playback', action: 'stop', params: {} };
  }

  // Navigation
  if (lowerText.includes('next') || lowerText.includes('skip')) {
    return { intent: 'navigation', action: 'next', params: {} };
  }
  
  if (lowerText.includes('back') || lowerText.includes('previous') || lowerText.includes('go back')) {
    return { intent: 'navigation', action: 'previous', params: {} };
  }
  
  if (lowerText.includes('start over') || lowerText.includes('restart') || lowerText.includes('begin again')) {
    return { intent: 'navigation', action: 'restart', params: {} };
  }

  // Speed adjustment
  if (lowerText.includes('faster') || lowerText.includes('speed up')) {
    return { intent: 'speed', action: 'increase', params: { amount: 0.25 } };
  }
  
  if (lowerText.includes('slower') || lowerText.includes('slow down')) {
    return { intent: 'speed', action: 'decrease', params: { amount: 0.25 } };
  }
  
  if (lowerText.includes('normal') || lowerText.includes('standard') || lowerText.includes('regular')) {
    return { intent: 'speed', action: 'reset', params: {} };
  }

  // Volume control
  if (lowerText.includes('louder') || lowerText.includes('volume up') || lowerText.includes('turn up')) {
    return { intent: 'volume', action: 'increase', params: {} };
  }
  
  if (lowerText.includes('softer') || lowerText.includes('quieter') || lowerText.includes('volume down') || lowerText.includes('turn down')) {
    return { intent: 'volume', action: 'decrease', params: {} };
  }

  // Information
  if (lowerText.includes('what') && (lowerText.includes('am I') || lowerText.includes('am I on') || lowerText.includes('where am i'))) {
    return { intent: 'information', action: 'current', params: {} };
  }
  
  if (lowerText.includes('progress') || lowerText.includes('how many') || lowerText.includes('remaining')) {
    return { intent: 'information', action: 'progress', params: {} };
  }

  // Help
  if (lowerText.includes('help') || lowerText.includes('commands') || lowerText.includes('what can you do')) {
    return { intent: 'help', action: 'list', params: {} };
  }

  // Default: Free-form question
  return { 
    intent: isQuestion(lowerText) ? 'question' : 'statement',
    text: lowerText,
    type: classifyQuestion(lowerText)
  };
}

/**
 * Check if text is a question
 */
function isQuestion(text) {
  const questionPatterns = [
    /^what\b/i,
    /^how\b/i,
    /^why\b/i,
    /^when\b/i,
    /^where\b/i,
    /^who\b/i,
    /\?$/,
    /can you/i,
    /could you/i,
    /is it/i,
    /is this/i,
    /does it/i
  ];
  
  return questionPatterns.some(pattern => pattern.test(text));
}

/**
 * Classify question type
 */
function classifyQuestion(text) {
  const lowerText = text.toLowerCase();
  
  if (/what\b/i.test(lowerText)) return 'definition';
  if (/how\b/i.test(lowerText)) return 'process';
  if (/why\b/i.test(lowerText)) return 'reasoning';
  if (/when\b/i.test(lowerText)) return 'temporal';
  if (/where\b/i.test(lowerText)) return 'location';
  if (/who\b/i.test(lowerText)) return 'entity';
  
  return 'general';
}

/**
 * Command executor
 */
class CommandExecutor {
  constructor(lessonPlayer) {
    this.lessonPlayer = lessonPlayer;
  }

  /**
   * Execute parsed command
   */
  async execute(command) {
    switch (command.intent) {
      case 'playback':
        return await this._handlePlayback(command.action);
      case 'navigation':
        return await this._handleNavigation(command.action);
      case 'speed':
        return await this._handleSpeed(command.action, command.params);
      case 'volume':
        return await this._handleVolume(command.action);
      case 'information':
        return await this._handleInformation(command.action);
      case 'help':
        return await this._handleHelp(command.action);
      case 'question':
        return { type: 'question', text: command.text, intent: 'question' };
      default:
        return { success: false, error: 'Unknown command' };
    }
  }

  /**
   * Handle playback commands
   */
  async _handlePlayback(action) {
    switch (action) {
      case 'play':
        await this.lessonPlayer.play();
        return { success: true, action: 'play', message: 'Playing lesson' };
      case 'pause':
        await this.lessonPlayer.pause();
        return { success: true, action: 'pause', message: 'Paused lesson' };
      case 'stop':
        await this.lessonPlayer.stop();
        return { success: true, action: 'stop', message: 'Stopped lesson' };
      default:
        return { success: false, error: 'Invalid playback action' };
    }
  }

  /**
   * Handle navigation commands
   */
  async _handleNavigation(action) {
    switch (action) {
      case 'next':
        const next = await this.lessonPlayer.nextQuestion();
        return { success: true, action: 'next', ...next };
      case 'previous':
        const prev = await this.lessonPlayer.previousQuestion();
        return { success: true, action: 'previous', ...prev };
      case 'restart':
        await this.lessonPlayer.restart();
        return { success: true, action: 'restart', message: 'Restarted lesson' };
      default:
        return { success: false, error: 'Invalid navigation action' };
    }
  }

  /**
   * Handle speed commands
   */
  async _handleSpeed(action, params) {
    try {
      switch (action) {
        case 'increase':
          const currentSpeed = this.lessonPlayer.getPlaybackSpeed();
          const newSpeed = Math.min(2.0, currentSpeed + (params.amount || 0.25));
          this.lessonPlayer.setPlaybackSpeed(newSpeed);
          return { success: true, action: 'speed', speed: newSpeed };
        case 'decrease':
          const currentSpeed2 = this.lessonPlayer.getPlaybackSpeed();
          const newSpeed2 = Math.max(0.5, currentSpeed2 - (params.amount || 0.25));
          this.lessonPlayer.setPlaybackSpeed(newSpeed2);
          return { success: true, action: 'speed', speed: newSpeed2 };
        case 'reset':
          this.lessonPlayer.setPlaybackSpeed(1.0);
          return { success: true, action: 'speed', speed: 1.0 };
        default:
          return { success: false, error: 'Invalid speed action' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle volume commands
   */
  async _handleVolume(action) {
    try {
      switch (action) {
        case 'increase':
          const currentVolume = this.lessonPlayer.getVolume();
          const newVolume = Math.min(1.0, currentVolume + 0.1);
          this.lessonPlayer.setVolume(newVolume);
          return { success: true, action: 'volume', volume: newVolume };
        case 'decrease':
          const currentVolume2 = this.lessonPlayer.getVolume();
          const newVolume2 = Math.max(0, currentVolume2 - 0.1);
          this.lessonPlayer.setVolume(newVolume2);
          return { success: true, action: 'volume', volume: newVolume2 };
        default:
          return { success: false, error: 'Invalid volume action' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle information commands
   */
  async _handleInformation(action) {
    try {
      switch (action) {
        case 'current':
          const current = await this.lessonPlayer.getCurrentInfo();
          return { success: true, type: 'information', data: current };
        case 'progress':
          const progress = await this.lessonPlayer.getProgress();
          return { success: true, type: 'information', data: progress };
        default:
          return { success: false, error: 'Invalid information action' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle help commands
   */
  async _handleHelp(action) {
    return {
      success: true,
      type: 'help',
      message: 'Available commands:',
      commands: [
        'Playback: play, pause, stop',
        'Navigation: next, previous, restart',
        'Speed: faster, slower, normal',
        'Volume: louder, softer',
        'Info: what am I on?, show progress',
        'Help: help, what can you do?'
      ]
    };
  }
}

module.exports = {
  parseVoiceCommand,
  isQuestion,
  classifyQuestion,
  CommandExecutor
};
