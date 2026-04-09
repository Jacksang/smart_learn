/**
 * D9.2 Voice Interaction Database Integration
 * Voice recording and interaction tracking
 */

const { PostgreSQLDatabase } = require('./database');
const { Pool, PoolClient } = require('pg');

describe('VoiceInteractionDatabase', () => {
  let db;
  let client;

  beforeAll(async () => {
    db = new PostgreSQLDatabase({
      host: 'localhost',
      port: 5432,
      database: 'smart_learn_test',
      user: 'postgres',
      password: 'password'
    });
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    client = await db.pool.connect();
    await client.query(`
      DROP TABLE IF EXISTS voice_interactions;
      DROP TABLE IF EXISTS voice_recordings;
      DROP TABLE IF EXISTS audio_generations;
      DROP TABLE IF EXISTS learning_sessions;
      DROP TABLE IF EXISTS user_responses;
      DROP TABLE IF EXISTS concepts;
      DROP TABLE IF EXISTS questions;
      DROP TABLE IF EXISTS lessons;
    `);
  });

  afterEach(async () => {
    client.release();
  });

  it('should create voice recordings table', async () => {
    await db.createTables();

    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'voice_recordings'
    `);

    expect(result.rows.length).toBe(1);
  });

  it('should create voice interactions table', async () => {
    await db.createTables();

    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'voice_interactions'
    `);

    expect(result.rows.length).toBe(1);
  });

  it('should create audio generations table', async () => {
    await db.createTables();

    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'audio_generations'
    `);

    expect(result.rows.length).toBe(1);
  });

  it('should record voice input with transcription', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    const result = await client.query(
      `INSERT INTO voice_recordings 
       (session_id, question_id, audio_path, transcription, confidence, duration) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [sessionId, questionId, '/tmp/audio.wav', 'Test transcription', 0.95, 3000]
    );

    expect(result.rows[0].id).toBeDefined();
    expect(result.rows[0].transcription).toBe('Test transcription');
  });

  it('should record voice command execution', async () => {
    const sessionId = await createSession(client);

    const result = await client.query(
      `INSERT INTO voice_interactions 
       (session_id, action_type, action_data) 
       VALUES ($1, $2, $3) RETURNING id`,
      [sessionId, 'playback', JSON.stringify({ action: 'play' })]
    );

    expect(result.rows[0].id).toBeDefined();
    expect(result.rows[0].action_type).toBe('playback');
  });

  it('should store audio generation metadata', async () => {
    const sessionId = await createSession(client);

    const result = await client.query(
      `INSERT INTO audio_generations 
       (session_id, narration_text, audio_path, duration, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [sessionId, 'Test narration', '/tmp/audio.wav', 5000, 'completed']
    );

    expect(result.rows[0].id).toBeDefined();
    expect(result.rows[0].status).toBe('completed');
  });

  it('should query voice recordings by session', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    await client.query(
      `INSERT INTO voice_recordings (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'Recording 1']
    );

    await client.query(
      `INSERT INTO voice_recordings (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'Recording 2']
    );

    const result = await client.query(
      `SELECT COUNT(*) FROM voice_recordings WHERE session_id = $1`,
      [sessionId]
    );

    expect(result.rows[0].count).toBe('2');
  });

  it('should query voice recordings by question', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    await client.query(
      `INSERT INTO voice_recordings (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'Recording 1']
    );

    await client.query(
      `INSERT INTO voice_recordings (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'Recording 2']
    );

    const result = await client.query(
      `SELECT COUNT(*) FROM voice_recordings WHERE question_id = $1`,
      [questionId]
    );

    expect(result.rows[0].count).toBe('2');
  });

  it('should query voice interactions by session', async () => {
    const sessionId = await createSession(client);

    await client.query(
      `INSERT INTO voice_interactions (session_id, action_type) 
       VALUES ($1, $2)`,
      [sessionId, 'playback']
    );

    await client.query(
      `INSERT INTO voice_interactions (session_id, action_type) 
       VALUES ($1, $2)`,
      [sessionId, 'navigation']
    );

    const result = await client.query(
      `SELECT COUNT(*) FROM voice_interactions WHERE session_id = $1`,
      [sessionId]
    );

    expect(result.rows[0].count).toBe('2');
  });

  it('should retrieve audio generations for session', async () => {
    const sessionId = await createSession(client);

    await client.query(
      `INSERT INTO audio_generations (session_id, narration_text, status) 
       VALUES ($1, $2, $3)`,
      [sessionId, 'Narration 1', 'completed']
    );

    await client.query(
      `INSERT INTO audio_generations (session_id, narration_text, status) 
       VALUES ($1, $2, $3)`,
      [sessionId, 'Narration 2', 'pending']
    );

    const result = await client.query(
      `SELECT * FROM audio_generations WHERE session_id = $1`,
      [sessionId]
    );

    expect(result.rows.length).toBe(2);
  });

  it('should handle transcription with special characters', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    const result = await client.query(
      `INSERT INTO voice_recordings 
       (session_id, question_id, transcription, confidence) 
       VALUES ($1, $2, $3, $4)`,
      [sessionId, questionId, 'Hello! What is X? @#$%', 0.9]
    );

    expect(result.rows[0].transcription).toBe('Hello! What is X? @#$%');
  });

  it('should handle empty transcription', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    const result = await client.query(
      `INSERT INTO voice_recordings 
       (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, '']
    );

    expect(result.rows[0].transcription).toBe('');
  });

  it('should handle null confidence', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    const result = await client.query(
      `INSERT INTO voice_recordings 
       (session_id, question_id, confidence) 
       VALUES ($1, $2, NULL)`,
      [sessionId, questionId]
    );

    expect(result.rows[0].confidence).toBeNull();
  });

  it('should handle invalid confidence values', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    await expect(
      client.query(
        `INSERT INTO voice_recordings 
         (session_id, question_id, confidence) 
         VALUES ($1, $2, $3)`,
        [sessionId, questionId, 2.5]
      )
    ).rejects.toThrow();
  });

  it('should handle long transcription text', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    const longText = 'A'.repeat(10000);

    const result = await client.query(
      `INSERT INTO voice_recordings 
       (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, longText]
    );

    expect(result.rows[0].transcription.length).toBe(10000);
  });

  it('should handle multiple concurrent voice recordings', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    const insertions = [];

    for (let i = 0; i < 10; i++) {
      insertions.push(
        client.query(
          `INSERT INTO voice_recordings 
           (session_id, question_id, transcription, confidence) 
           VALUES ($1, $2, $3, $4)`,
          [sessionId, questionId, `Recording ${i}`, 0.9]
        )
      );
    }

    await Promise.all(insertions);

    const result = await client.query(
      `SELECT COUNT(*) FROM voice_recordings WHERE session_id = $1`,
      [sessionId]
    );

    expect(result.rows[0].count).toBe('10');
  });

  it('should handle voice interactions with complex action data', async () => {
    const sessionId = await createSession(client);

    const actionData = {
      action: 'play',
      timestamp: new Date().toISOString(),
      metadata: {
        duration: 3000,
        volume: 0.8
      }
    };

    const result = await client.query(
      `INSERT INTO voice_interactions 
       (session_id, action_type, action_data) 
       VALUES ($1, $2, $3)`,
      [sessionId, 'playback', JSON.stringify(actionData)]
    );

    expect(result.rows[0].id).toBeDefined();

    const retrieve = await client.query(
      `SELECT action_data FROM voice_interactions WHERE id = $1`,
      [result.rows[0].id]
    );

    const retrievedData = JSON.parse(retrieve.rows[0].action_data);
    expect(retrievedData.action).toBe('play');
    expect(retrievedData.metadata.duration).toBe(3000);
  });

  it('should handle audio generation status transitions', async () => {
    const sessionId = await createSession(client);

    const result = await client.query(
      `INSERT INTO audio_generations 
       (session_id, narration_text, status) 
       VALUES ($1, $2, $3)`,
      [sessionId, 'Test', 'pending']
    );

    await client.query(
      `UPDATE audio_generations SET status = $1 WHERE id = $2`,
      ['processing', result.rows[0].id]
    );

    await client.query(
      `UPDATE audio_generations SET status = $1 WHERE id = $2`,
      ['completed', result.rows[0].id]
    );

    const final = await client.query(
      `SELECT status FROM audio_generations WHERE id = $1`,
      [result.rows[0].id]
    );

    expect(final.rows[0].status).toBe('completed');
  });

  it('should handle foreign key cascades', async () => {
    await db.createTables();

    const session = await client.query(
      `INSERT INTO learning_sessions (user_id, lesson_id, status) 
       VALUES ($1, $2, $3) RETURNING id`,
      ['user_123', 1, 'active']
    );

    await client.query(
      `INSERT INTO voice_recordings (session_id, audio_path) 
       VALUES ($1, $2)`,
      [session.rows[0].id, '/tmp/audio.wav']
    );

    await client.query(
      `DELETE FROM learning_sessions WHERE id = $1`,
      [session.rows[0].id]
    );

    const recordings = await client.query(
      `SELECT COUNT(*) FROM voice_recordings WHERE session_id = $1`,
      [session.rows[0].id]
    );

    expect(recordings.rows[0].count).toBe('0');
  });

  it('should handle voice recording timestamp', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    await client.query(
      `INSERT INTO voice_recordings 
       (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'Test']
    );

    const result = await client.query(
      `SELECT created_at FROM voice_recordings WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [sessionId]
    );

    expect(result.rows[0].created_at).toBeDefined();
  });

  it('should retrieve recordings in chronological order', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    await client.query(
      `INSERT INTO voice_recordings (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'First']
    );

    await client.query(
      `INSERT INTO voice_recordings (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'Second']
    );

    await client.query(
      `INSERT INTO voice_recordings (session_id, question_id, transcription) 
       VALUES ($1, $2, $3)`,
      [sessionId, questionId, 'Third']
    );

    const result = await client.query(
      `SELECT transcription FROM voice_recordings 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId]
    );

    expect(result.rows[0].transcription).toBe('First');
    expect(result.rows[1].transcription).toBe('Second');
    expect(result.rows[2].transcription).toBe('Third');
  });

  it('should query voice interactions with action filtering', async () => {
    const sessionId = await createSession(client);

    await client.query(
      `INSERT INTO voice_interactions (session_id, action_type) 
       VALUES ($1, $2)`,
      [sessionId, 'playback']
    );

    await client.query(
      `INSERT INTO voice_interactions (session_id, action_type) 
       VALUES ($1, $2)`,
      [sessionId, 'navigation']
    );

    await client.query(
      `INSERT INTO voice_interactions (session_id, action_type) 
       VALUES ($1, $2)`,
      [sessionId, 'playback']
    );

    const result = await client.query(
      `SELECT COUNT(*) FROM voice_interactions 
       WHERE session_id = $1 AND action_type = $2`,
      [sessionId, 'playback']
    );

    expect(result.rows[0].count).toBe('2');
  });

  it('should handle audio generation with all fields', async () => {
    const sessionId = await createSession(client);

    const result = await client.query(
      `INSERT INTO audio_generations 
       (session_id, narration_text, audio_path, duration, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, 'Complete narration', '/tmp/audio.wav', 5000, 'completed']
    );

    expect(result.rowCount).toBe(1);

    const full = await client.query(`
      SELECT * FROM audio_generations WHERE id = $1
    `, [result.rows[0].id]);

    expect(full.rows[0].duration).toBe(5000);
    expect(full.rows[0].status).toBe('completed');
  });

  it('should handle voice recording duration validation', async () => {
    const sessionId = await createSession(client);
    const questionId = await createQuestion(client);

    await expect(
      client.query(
        `INSERT INTO voice_recordings 
         (session_id, question_id, duration) 
         VALUES ($1, $2, $3)`,
        [sessionId, questionId, -100]
      )
    ).rejects.toThrow();
  });

  it('should handle voice interaction timestamp', async () => {
    const sessionId = await createSession(client);

    await client.query(
      `INSERT INTO voice_interactions (session_id, action_type) 
       VALUES ($1, $2)`,
      [sessionId, 'playback']
    );

    const result = await client.query(
      `SELECT created_at FROM voice_interactions WHERE session_id = $1`,
      [sessionId]
    );

    expect(result.rows[0].created_at).toBeDefined();
  });

  it('should query audio generations by status', async () => {
    const sessionId = await createSession(client);

    await client.query(
      `INSERT INTO audio_generations (session_id, status) 
       VALUES ($1, $2)`,
      [sessionId, 'completed']
    );

    await client.query(
      `INSERT INTO audio_generations (session_id, status) 
       VALUES ($1, $2)`,
      [sessionId, 'pending']
    );

    await client.query(
      `INSERT INTO audio_generations (session_id, status) 
       VALUES ($1, $2)`,
      [sessionId, 'processing']
    );

    const completed = await client.query(
      `SELECT COUNT(*) FROM audio_generations 
       WHERE session_id = $1 AND status = $2`,
      [sessionId, 'completed']
    );

    expect(completed.rows[0].count).toBe('1');
  });
});

// Helper functions
async function createSession(client) {
  const result = await client.query(
    `INSERT INTO learning_sessions (user_id, lesson_id, status) 
     VALUES ($1, $2, $3) RETURNING id`,
    ['user_123', 1, 'active']
  );
  return result.rows[0].id;
}

async function createQuestion(client) {
  const result = await client.query(
    `INSERT INTO lessons (title, content) 
     VALUES ($1, $2) RETURNING id`,
    ['Test Lesson', 'Test content']
  );

  const lessonId = result.rows[0].id;

  const qResult = await client.query(
    `INSERT INTO questions (lesson_id, text, correct_answer) 
     VALUES ($1, $2, $3) RETURNING id`,
    [lessonId, 'Test question?', 'Test answer']
  );

  return qResult.rows[0].id;
}

describe('VoiceInteractionDatabase Integration Tests', () => {
  let db;

  beforeAll(async () => {
    db = new PostgreSQLDatabase({
      host: 'localhost',
      port: 5432,
      database: 'smart_learn_test',
      user: 'postgres',
      password: 'password'
    });
  });

  afterAll(async () => {
    await db.close();
  });

  it('should integrate with PostgreSQLDatabase service', async () => {
    const result = await db.initialize();

    expect(result.success).toBe(true);
  });

  it('should create all tables through service', async () => {
    const result = await db.createTables();

    expect(result.success).toBe(true);
    expect(result.tables).toBe(8);
    expect(result.indexes).toBe(3);
  });

  it('should create voice recording through service', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const recording = await db.recordVoiceRecording(
      session.data.id,
      1,
      '/tmp/audio.wav',
      'Test transcription',
      0.95,
      3000
    );

    expect(recording.success).toBe(true);
    expect(recording.data.transcription).toBe('Test transcription');
  });

  it('should create voice interaction through service', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const interaction = await db.recordVoiceInteraction(
      session.data.id,
      null,
      'playback',
      { action: 'play' }
    );

    expect(interaction.success).toBe(true);
    expect(interaction.data.action_type).toBe('playback');
  });

  it('should create audio generation through service', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const generation = await db.recordAudioGeneration(
      session.data.id,
      'Test narration',
      '/tmp/audio.wav',
      5000,
      'completed'
    );

    expect(generation.success).toBe(true);
    expect(generation.data.status).toBe('completed');
  });

  it('should get session with voice data', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const recordings = await db.recordVoiceRecording(
      session.data.id,
      1,
      '/tmp/audio.wav',
      'Recording',
      0.9,
      2000
    );

    expect(recordings.success).toBe(true);

    const retrieved = await db.getLearningSession(session.data.id);
    expect(retrieved.success).toBe(true);
  });

  it('should complete session with voice history', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    await db.recordVoiceRecording(
      session.data.id,
      1,
      '/tmp/audio.wav',
      'Recording',
      0.9,
      2000
    );

    const completed = await db.completeSession(session.data.id);
    expect(completed.success).toBe(true);

    const final = await db.getLearningSession(session.data.id);
    expect(final.data.status).toBe('completed');
  });

  it('should handle large volume voice recordings', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
      await db.recordVoiceRecording(
        session.data.id,
        1,
        `/tmp/audio_${i}.wav`,
        `Recording ${i}`,
        0.9,
        2000
      );
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // < 5 seconds for 50 recordings
  });

  it('should handle concurrent voice operations', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const operations = [];

    for (let i = 0; i < 10; i++) {
      operations.push(
        db.recordVoiceRecording(
          session.data.id,
          1,
          `/tmp/audio_${i}.wav`,
          `Recording ${i}`,
          0.9,
          2000
        )
      );
    }

    const results = await Promise.all(operations);

    expect(results.every(r => r.success)).toBe(true);

    const count = results.filter(r => r.success).length;
    expect(count).toBe(10);
  });
});

describe('VoiceInteractionDatabase Error Handling', () => {
  let db;

  beforeAll(async () => {
    db = new PostgreSQLDatabase({
      host: 'localhost',
      port: 5432,
      database: 'smart_learn_test',
      user: 'postgres',
      password: 'password'
    });
  });

  afterAll(async () => {
    await db.close();
  });

  it('should handle invalid session ID', async () => {
    const recording = await db.recordVoiceRecording(
      99999, // Non-existent session
      1,
      '/tmp/audio.wav',
      'Test',
      0.9,
      2000
    );

    expect(recording.success).toBe(false);
    expect(recording.error).toBeDefined();
  });

  it('should handle null session ID', async () => {
    const recording = await db.recordVoiceRecording(
      null,
      1,
      '/tmp/audio.wav',
      'Test',
      0.9,
      2000
    );

    expect(recording.success).toBe(false);
  });

  it('should handle invalid transcription', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const recording = await db.recordVoiceRecording(
      session.data.id,
      1,
      '/tmp/audio.wav',
      null,
      0.9,
      2000
    );

    // Should accept null transcription
    expect(recording.success).toBe(true);
  });

  it('should handle missing question ID', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const recording = await db.recordVoiceRecording(
      session.data.id,
      null, // No question
      '/tmp/audio.wav',
      'Test',
      0.9,
      2000
    );

    // Should accept null question
    expect(recording.success).toBe(true);
  });

  it('should handle invalid confidence values', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const recording = await db.recordVoiceRecording(
      session.data.id,
      1,
      '/tmp/audio.wav',
      'Test',
      1.5, // Invalid confidence
      2000
    );

    // Should fail due to constraint
    expect(recording.success).toBe(false);
  });

  it('should handle negative duration', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const recording = await db.recordVoiceRecording(
      session.data.id,
      1,
      '/tmp/audio.wav',
      'Test',
      0.9,
      -1000
    );

    expect(recording.success).toBe(false);
  });

  it('should handle invalid audio path', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const recording = await db.recordVoiceRecording(
      session.data.id,
      1,
      '', // Empty path
      'Test',
      0.9,
      2000
    );

    // Should accept empty path
    expect(recording.success).toBe(true);
  });

  it('should handle concurrent record attempts to same session', async () => {
    const session = await db.createLearningSession('user_123', 1);
    expect(session.success).toBe(true);

    const results = await Promise.all([
      db.recordVoiceRecording(session.data.id, 1, '/tmp/1.wav', 'Test', 0.9, 2000),
      db.recordVoiceRecording(session.data.id, 1, '/tmp/2.wav', 'Test', 0.9, 2000),
      db.recordVoiceRecording(session.data.id, 1, '/tmp/3.wav', 'Test', 0.9, 2000)
    ]);

    expect(results.every(r => r.success)).toBe(true);
    expect(results.every(r => r.data.transcription === 'Test')).toBe(true);
  });
});
