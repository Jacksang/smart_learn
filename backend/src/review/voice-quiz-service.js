/**
 * Voice Quiz Service
 * Orchestrates voice recording, transcription, and evaluation
 */

const { WhisperFactory } = require('./whisper-cli');
const { parseVoiceCommand, CommandExecutor } = require('./voice-command-parser');

/**
 * Voice Quiz Service Class
 * Manages voice recording, transcription, and answer evaluation
 */
class VoiceQuizService {
  constructor() {
    this.whisperEngine = WhisperFactory.createEngine();
    this.commandExecutor = null;
    this.recordings = new Map();
    this.lessons = new Map();
  }

  /**
   * Initialize service with lesson player reference
   */
  initialize(lessonPlayer) {
    this.commandExecutor = new CommandExecutor(lessonPlayer);
    return this.whisperEngine.initialize();
  }

  /**
   * Record and process voice input
   */
  async recordInput(sessionId, questionId, audioPath, options = {}) {
    try {
      // Validate audio file
      await this.whisperEngine.validateAudio(audioPath);

      // Transcribe voice
      const transcription = await this.whisperEngine.transcribeWithRetry(audioPath, options);

      const parsedCommand = parseVoiceCommand(transcription.data.text);

      // Store recording
      const recordingId = this._storeRecording(sessionId, questionId, transcription, parsedCommand);

      // Check if it's a voice command
      if (parsedCommand.intent !== 'question' && parsedCommand.intent !== 'statement') {
        const commandResult = await this.commandExecutor.execute(parsedCommand);
        
        return {
          type: 'command',
          recordingId,
          transcription: transcription.data,
          command: parsedCommand,
          result: commandResult,
          timestamp: new Date().toISOString()
        };
      }

      // Evaluate as question/answer
      const evaluation = await this._evaluateAnswer(questionId, transcription.data.text);

      return {
        type: 'answer',
        recordingId,
        transcription: transcription.data,
        evaluation,
        intent: parsedCommand.intent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error recording voice input:', error);
      throw error;
    }
  }

  /**
   * Parse voice command and execute
   */
  async executeCommand(sessionId, transcribedText, options = {}) {
    const parsedCommand = parseVoiceCommand(transcribedText);

    if (parsedCommand.intent === 'question' || parsedCommand.intent === 'statement') {
      return {
        type: 'question',
        text: transcribedText,
        intent: parsedCommand.intent,
        subtype: parsedCommand.type
      };
    }

    const commandResult = await this.commandExecutor.execute(parsedCommand);

    return {
      type: 'command',
      command: parsedCommand,
      result: commandResult,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Evaluate transcribed answer against expected answer
   */
  async _evaluateAnswer(questionId, transcribedAnswer) {
    const question = this.lessons.get(questionId);

    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    const expectedAnswer = this._getExpectedAnswer(question);

    const similarity = this._calculateSimilarity(transcribedAnswer, expectedAnswer);
    const isCorrect = similarity >= 70; // 70% similarity threshold

    return {
      isCorrect,
      similarity,
      feedback: this._generateFeedback(isCorrect, similarity, questionId),
      suggestedCorrection: isCorrect ? null : this._suggestCorrection(expectedAnswer)
    };
  }

  /**
   * Get expected answer from question
   */
  _getExpectedAnswer(question) {
    if (question.expectedAnswer) {
      return question.expectedAnswer;
    }
    
    if (question.options && question.correctIndex !== undefined) {
      return question.options[question.correctIndex];
    }

    return question.answer || question.correctAnswer;
  }

  /**
   * Calculate similarity between answers
   */
  _calculateSimilarity(answer1, answer2) {
    const words1 = answer1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = answer2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    const intersection = words1.filter(word => words2.some(w2 => w2.includes(word) || word.includes(w2)));
    const union = [...new Set([...words1, ...words2])];

    const jaccard = intersection.length / union.length;
    return Math.round(jaccard * 100);
  }

  /**
   * Generate feedback based on answer evaluation
   */
  _generateFeedback(isCorrect, similarity, questionId) {
    if (isCorrect) {
      return {
        message: similarity >= 90 
          ? "Excellent! That's exactly right!" 
          : "Great job! You've got it!",
        type: 'praise',
        emoji: '🎉',
        encouragement: similarity >= 90 ? "You've mastered this concept!" : "Keep up the good work!"
      };
    }

    if (similarity >= 50) {
      return {
        message: "Good start! You're close. Let me give you a hint...",
        type: 'partial',
        hint: "Think about the key concept",
        currentScore: similarity
      };
    }

    return {
      message: "Not quite right, but you're learning!",
      type: 'encouragement',
      suggestion: "Try again or ask for a hint",
      currentScore: similarity
    };
  }

  /**
   * Suggest correction for incorrect answer
   */
  _suggestCorrection(correctAnswer) {
    return {
      correctAnswer,
      hint: "Remember to focus on the key points"
    };
  }

  /**
   * Store recording metadata
   */
  _storeRecording(sessionId, questionId, transcription, command) {
    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.recordings.set(recordingId, {
      id: recordingId,
      sessionId,
      questionId,
      transcription: transcription.data,
      command,
      timestamp: new Date().toISOString()
    });

    return recordingId;
  }

  /**
   * Get all recordings for a session
   */
  getSessionRecordings(sessionId) {
    const sessionRecordings = Array.from(this.recordings.values()).filter(
      r => r.sessionId === sessionId
    );

    return sessionRecordings;
  }

  /**
   * Get voice interaction stats for session
   */
  getSessionStats(sessionId) {
    const sessionRecordings = this.getSessionRecordings(sessionId);

    const questionsAnswered = sessionRecordings.filter(r => r.type === 'answer').length;
    const commandsExecuted = sessionRecordings.filter(r => r.type === 'command').length;
    
    const avgConfidence = sessionRecordings.reduce((sum, r) => 
      sum + (r.transcription.confidence || 0), 0
    ) / Math.max(sessionRecordings.length, 1);

    return {
      sessionId,
      totalRecordings: sessionRecordings.length,
      questionsAnswered,
      commandsExecuted,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      totalQuestions: sessionRecordings.length
    };
  }

  /**
   * Get available Whisper models
   */
  getModels() {
    return this.whisperEngine.getModels();
  }

  /**
   * Get Whisper CLI status
   */
  async getStatus() {
    return {
      initialized: this.whisperEngine.isInitialized,
      availableModels: this.whisperEngine.getModels(),
      activeJobs: this.whisperEngine.activeJobs.size
    };
  }
}

// Global instance
const voiceQuizService = new VoiceQuizService();

module.exports = {
  VoiceQuizService,
  voiceQuizService
};
