/**
 * PostgreSQL Database Service
 * Core database operations for Smart Learn
 */

const { Pool, PoolClient } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

class PostgreSQLDatabase {
  constructor(config = {}) {
    this.pool = new Pool({
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT) || 5432,
      database: config.database || process.env.DB_NAME || 'smart_learn',
      user: config.user || process.env.DB_USER || 'postgres',
      password: config.password || process.env.DB_PASSWORD || 'password',
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
  }

  async initialize() {
    try {
      const client = await this.pool.connect();
      await client.query(`
        SELECT version()
      `);
      client.release();
      return { success: true, version: 'connected' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS lessons (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS concepts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          mastery_threshold INTEGER DEFAULT 50
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
          text VARCHAR(1000) NOT NULL,
          correct_answer TEXT,
          concept_id INTEGER REFERENCES concepts(id),
          difficulty VARCHAR(20) DEFAULT 'medium',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_responses (
          id SERIAL PRIMARY KEY,
          lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
          user_answer TEXT,
          is_correct BOOLEAN,
          confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
          response_time INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS learning_sessions (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
          status VARCHAR(50) DEFAULT 'active',
          progress JSONB,
          mastery JSONB,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS voice_recordings (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
          audio_path VARCHAR(500),
          transcription TEXT,
          confidence DECIMAL(5,4),
          duration INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS voice_interactions (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE,
          recording_id INTEGER REFERENCES voice_recordings(id),
          action_type VARCHAR(50),
          action_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS audio_generations (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE,
          narration_text TEXT,
          audio_path VARCHAR(500),
          duration INTEGER,
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_responses_session 
        ON user_responses(lesson_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_learning_sessions_user 
        ON learning_sessions(user_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_learning_sessions_status 
        ON learning_sessions(status);
      `);

      await client.query('COMMIT');

      return { success: true, tables: 8, indexes: 3 };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async createLesson(title, content) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO lessons (title, content) VALUES ($1, $2) RETURNING id, title, created_at`,
        [title, content]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async getLessonById(lessonId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM lessons WHERE id = $1`,
        [lessonId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Lesson not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createConcept(name, description, masteryThreshold = 50) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO concepts (name, description, mastery_threshold) 
         VALUES ($1, $2, $3) RETURNING id`,
        [name, description, masteryThreshold]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async getConceptById(conceptId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM concepts WHERE id = $1`,
        [conceptId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Concept not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createQuestion(lessonId, text, correctAnswer, conceptId = null, difficulty = 'medium') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO questions (lesson_id, text, correct_answer, concept_id, difficulty) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [lessonId, text, correctAnswer, conceptId, difficulty]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async getQuestionsByLesson(lessonId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM questions WHERE lesson_id = $1 ORDER BY id`,
        [lessonId]
      );

      return { success: true, data: result.rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async recordUserResponse(lessonId, questionId, userAnswer, isCorrect, confidence, responseTime = null) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO user_responses (lesson_id, question_id, user_answer, is_correct, confidence, response_time) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [lessonId, questionId, userAnswer, isCorrect, confidence, responseTime]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async createLearningSession(userId, lessonId, progress = {}, mastery = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO learning_sessions (user_id, lesson_id, status, progress, mastery) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, lessonId, 'active', JSON.stringify(progress), JSON.stringify(mastery)]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async getLearningSession(sessionId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM learning_sessions WHERE id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Session not found' };
      }

      const session = result.rows[0];
      return {
        success: true,
        data: {
          ...session,
          progress: JSON.parse(session.progress),
          mastery: JSON.parse(session.mastery)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getActiveSession(userId, lessonId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM learning_sessions 
         WHERE user_id = $1 AND lesson_id = $2 AND status = $3
         ORDER BY started_at DESC
         LIMIT 1`,
        [userId, lessonId, 'active']
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Active session not found' };
      }

      const session = result.rows[0];
      return {
        success: true,
        data: {
          ...session,
          progress: JSON.parse(session.progress),
          mastery: JSON.parse(session.mastery)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateSessionProgress(sessionId, progress) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const session = await this.getLearningSession(sessionId);
      if (!session.success) {
        return session;
      }

      const updatedProgress = { ...session.data.progress, ...progress };

      const result = await client.query(
        `UPDATE learning_sessions 
         SET progress = $1, mastery = $2 
         WHERE id = $3 RETURNING id`,
        [JSON.stringify(updatedProgress), JSON.stringify(session.data.mastery), sessionId]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async updateSessionMastery(sessionId, mastery) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const session = await this.getLearningSession(sessionId);
      if (!session.success) {
        return session;
      }

      const updatedMastery = { ...session.data.mastery, ...mastery };

      const result = await client.query(
        `UPDATE learning_sessions 
         SET mastery = $1 
         WHERE id = $2 RETURNING id`,
        [JSON.stringify(updatedMastery), sessionId]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async getWeakAreas(sessionId, threshold = 50) {
    const session = await this.getLearningSession(sessionId);
    if (!session.success) {
      return session;
    }

    const mastery = session.data.mastery;
    const weakAreas = Object.entries(mastery)
      .filter(([_, score]) => score < threshold)
      .map(([concept]) => ({
        conceptId: concept,
        score: score
      }));

    return { success: true, data: weakAreas };
  }

  async generateRecommendations(sessionId) {
    const weakAreas = await this.getWeakAreas(sessionId);
    if (!weakAreas.success) {
      return weakAreas;
    }

    const recommendations = weakAreas.data
      .map(area => ({
        conceptId: area.conceptId,
        priority: area.score < 30 ? 'high' : 'medium',
        action: 'review'
      }))
      .sort((a, b) => (a.priority === 'high' ? -1 : 1));

    return { success: true, data: recommendations };
  }

  async recordVoiceRecording(sessionId, questionId, audioPath, transcription, confidence, duration) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO voice_recordings 
         (session_id, question_id, audio_path, transcription, confidence, duration) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [sessionId, questionId, audioPath, transcription, confidence, duration]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async recordVoiceInteraction(sessionId, recordingId, actionType, actionData) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO voice_interactions 
         (session_id, recording_id, action_type, action_data) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [sessionId, recordingId, actionType, JSON.stringify(actionData)]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async recordAudioGeneration(sessionId, narrationText, audioPath, duration, status = 'pending') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO audio_generations 
         (session_id, narration_text, audio_path, duration, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [sessionId, narrationText, audioPath, duration, status]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async completeSession(sessionId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE learning_sessions 
         SET status = $1, completed_at = $2 
         WHERE id = $3 RETURNING id`,
        ['completed', new Date(), sessionId]
      );

      await client.query('COMMIT');

      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async getLearningStatistics(userId) {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_sessions,
          MIN(started_at) as first_session,
          MAX(completed_at) as last_session,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
        FROM learning_sessions
        WHERE user_id = $1
      `, [userId]);

      const stats = result.rows[0];
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = { PostgreSQLDatabase, Pool };
