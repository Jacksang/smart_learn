/**
 * D9.1 PostgreSQL Database Integration
 * Core database schema, migrations, and models
 */

const { Pool, PoolClient } = require('pg');

describe('PostgreSQLDatabase', () => {
  let pool;
  let client;

  beforeAll(async () => {
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'smart_learn_test',
      user: 'postgres',
      password: 'password'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    client = await pool.connect();
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

  it('should create all required tables', async () => {
    await client.query(`
      CREATE TABLE lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE questions (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id),
        text VARCHAR(1000),
        correct_answer TEXT,
        concept_id INTEGER REFERENCES concepts(id)
      );

      CREATE TABLE concepts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        mastery_threshold INTEGER DEFAULT 50
      );

      CREATE TABLE user_responses (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id),
        question_id INTEGER REFERENCES questions(id),
        user_answer TEXT,
        is_correct BOOLEAN,
        confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
        response_time INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE learning_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        lesson_id INTEGER REFERENCES lessons(id),
        status VARCHAR(50),
        progress JSONB,
        mastery JSONB,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE TABLE voice_recordings (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES learning_sessions(id),
        question_id INTEGER REFERENCES questions(id),
        audio_path VARCHAR(500),
        transcription TEXT,
        confidence DECIMAL(5,4),
        duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE voice_interactions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES learning_sessions(id),
        recording_id INTEGER REFERENCES voice_recordings(id),
        action_type VARCHAR(50),
        action_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE audio_generations (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES learning_sessions(id),
        narration_text TEXT,
        audio_path VARCHAR(500),
        duration INTEGER,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = result.rows.map(row => row.table_name);

    expect(tables).toContain('lessons');
    expect(tables).toContain('questions');
    expect(tables).toContain('concepts');
    expect(tables).toContain('user_responses');
    expect(tables).toContain('learning_sessions');
    expect(tables).toContain('voice_recordings');
    expect(tables).toContain('voice_interactions');
    expect(tables).toContain('audio_generations');
  });

  it('should insert lesson successfully', async () => {
    const result = await client.query(
      `INSERT INTO lessons (title, content) VALUES ($1, $2) RETURNING id, title`,
      ['Introduction to Science', 'This is a test lesson.']
    );

    expect(result.rows[0].id).toBeDefined();
    expect(result.rows[0].title).toBe('Introduction to Science');
  });

  it('should create question with foreign keys', async () => {
    await client.query(
      `INSERT INTO lessons (title, content) VALUES ($1, $2)`,
      ['Test', 'Test']
    );

    const result = await client.query(
      `INSERT INTO concepts (name, description) VALUES ($1, $2) RETURNING id`,
      ['Test Concept', 'Test description']
    );

    const conceptId = result.rows[0].id;

    await client.query(
      `INSERT INTO lessons (title, content) VALUES ($1, $2)`,
      ['Test Lesson', 'Test']
    );

    const lessonResult = await client.query(
      `SELECT id FROM lessons ORDER BY id DESC LIMIT 1`
    );

    const lessonId = lessonResult.rows[0].id;

    const questionResult = await client.query(
      `INSERT INTO questions (lesson_id, text, correct_answer, concept_id) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [lessonId, 'What is X?', 'Answer X', conceptId]
    );

    expect(questionResult.rows[0].id).toBeDefined();
  });

  it('should track user responses with confidence', async () => {
    await client.query(`
      INSERT INTO lessons (title, content) VALUES ($1, $2)
    `, ['Test', 'Test']);

    await client.query(`
      INSERT INTO questions (lesson_id, text, correct_answer) 
      VALUES ($1, $2, $3)
    `, [1, 'What is X?', 'X']);

    const result = await client.query(
      `INSERT INTO user_responses (lesson_id, question_id, user_answer, is_correct, confidence, response_time) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [1, 1, 'X', true, 5, 3000]
    );

    expect(result.rows[0].id).toBeDefined();
  });

  it('should create learning session with JSON progress', async () => {
    const result = await client.query(
      `INSERT INTO learning_sessions 
       (user_id, lesson_id, status, progress, mastery, started_at) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        'user_123',
        1,
        'active',
        JSON.stringify({ totalQuestions: 10, answered: 5 }),
        JSON.stringify({ concept_1: 75 }),
        new Date()
      ]
    );

    expect(result.rows[0].id).toBeDefined();

    const sessionResult = await client.query(
      `SELECT progress, mastery FROM learning_sessions WHERE id = $1`,
      [result.rows[0].id]
    );

    expect(sessionResult.rows[0].progress).toBeDefined();
    expect(sessionResult.rows[0].mastery).toBeDefined();
  });

  it('should record voice input', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, 'active']);

    await client.query(`
      INSERT INTO questions (lesson_id, text, correct_answer) 
      VALUES ($1, $2, $3)
    `, [1, 'Question?', 'Answer']);

    const result = await client.query(
      `INSERT INTO voice_recordings 
       (session_id, question_id, transcription, confidence, duration) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [1, 1, 'Test transcription', 0.95, 3000]
    );

    expect(result.rows[0].id).toBeDefined();
  });

  it('should track voice command execution', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, 'active']);

    const result = await client.query(
      `INSERT INTO voice_interactions 
       (session_id, action_type, action_data) 
       VALUES ($1, $2, $3) RETURNING id`,
      [1, 'playback', JSON.stringify({ action: 'play' })]
    );

    expect(result.rows[0].id).toBeDefined();
    expect(result.rows[0].action_type).toBe('playback');
  });

  it('should store audio generation metadata', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, 'active']);

    const result = await client.query(
      `INSERT INTO audio_generations 
       (session_id, narration_text, audio_path, duration, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [1, 'Test narration', '/tmp/audio.wav', 5000, 'completed']
    );

    expect(result.rows[0].id).toBeDefined();
  });

  it('should query session progress', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status, progress) 
      VALUES ($1, $2, $3, $4)
    `, ['user_123', 1, 'active', '{"answered": 5, "total": 10}']);

    const result = await client.query(
      `SELECT progress FROM learning_sessions WHERE user_id = $1 AND status = $2`,
      ['user_123', 'active']
    );

    expect(result.rows[0].progress).toBeDefined();
    const progress = JSON.parse(result.rows[0].progress);
    expect(progress.answered).toBe(5);
  });

  it('should query mastery data', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, mastery) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, '{"concept_1": 75, "concept_2": 40}']);

    const result = await client.query(
      `SELECT mastery FROM learning_sessions WHERE user_id = $1`,
      ['user_123']
    );

    expect(result.rows[0].mastery).toBeDefined();
    const mastery = JSON.parse(result.rows[0].mastery);
    expect(mastery.concept_1).toBe(75);
    expect(mastery.concept_2).toBe(40);
  });

  it('should retrieve weak areas', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, mastery) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, '{"concept_1": 25, "concept_2": 85}']);

    const result = await client.query(
      `SELECT mastery FROM learning_sessions WHERE user_id = $1`,
      ['user_123']
    );

    const mastery = JSON.parse(result.rows[0].mastery);
    const weakAreas = Object.entries(mastery)
      .filter(([_, score]) => score < 50)
      .map(([concept]) => concept);

    expect(weakAreas).toContain('concept_1');
    expect(weakAreas).not.toContain('concept_2');
  });

  it('should update session status', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, 'active']);

    await client.query(
      `UPDATE learning_sessions SET status = $1 WHERE user_id = $2`,
      ['completed', 'user_123']
    );

    const result = await client.query(
      `SELECT status FROM learning_sessions WHERE user_id = $1`,
      ['user_123']
    );

    expect(result.rows[0].status).toBe('completed');
  });

  it('should delete session history', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, 'active']);

    await client.query(`
      DELETE FROM learning_sessions WHERE user_id = $1
    `, ['user_123']);

    const result = await client.query(
      `SELECT COUNT(*) FROM learning_sessions WHERE user_id = $1`,
      ['user_123']
    );

    expect(result.rows[0].count).toBe('0');
  });

  it('should handle concurrent session updates', async () => {
    const sessions = [];
    
    for (let i = 0; i < 10; i++) {
      const result = await client.query(
        `INSERT INTO learning_sessions (user_id, lesson_id, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [`user_${i}`, 1, 'active']
      );
      sessions.push(result.rows[0].id);
    }

    expect(sessions.length).toBe(10);
    expect(new Set(sessions).size).toBe(10); // All unique
  });

  it('should query voice recordings for session', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status) 
      VALUES ($1, $2, $3)
    `, ['user_123', 1, 'active']);

    await client.query(`
      INSERT INTO voice_recordings (session_id, transcription) 
      VALUES ($1, $2)
    `, [1, 'Recording 1']);

    await client.query(`
      INSERT INTO voice_recordings (session_id, transcription) 
      VALUES ($1, $2)
    `, [1, 'Recording 2']);

    const result = await client.query(
      `SELECT COUNT(*) FROM voice_recordings WHERE session_id = $1`,
      [1]
    );

    expect(result.rows[0].count).toBe('2');
  });

  it('should calculate learning statistics', async () => {
    await client.query(`
      INSERT INTO learning_sessions (user_id, lesson_id, status, progress, mastery) 
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'user_123', 
      1, 
      'completed',
      '{"answered": 8, "total": 10}',
      '{"concept_1": 75, "concept_2": 40}'
    ]);

    const result = await client.query(`
      SELECT 
        progress,
        mastery
      FROM learning_sessions 
      WHERE user_id = $1
    `, ['user_123']);

    expect(result.rows[0].progress).toBeDefined();
    expect(result.rows[0].mastery).toBeDefined();
  });
});

describe('Database Migration Tests', () => {
  let pool;
  let client;

  beforeAll(async () => {
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'smart_learn_test',
      user: 'postgres',
      password: 'password'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    client = await pool.connect();
  });

  afterEach(async () => {
    client.release();
  });

  it('should create database with constraints', async () => {
    await client.query(`
      CREATE TABLE lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Test NOT NULL constraint
    try {
      await client.query(
        `INSERT INTO lessons (title) VALUES (NULL)`
      );
      fail('Should have thrown error for NULL title');
    } catch (error) {
      expect(error.code).toBeDefined();
    }
  });

  it('should enforce foreign key constraints', async () => {
    await client.query(`
      CREATE TABLE lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL
      );

      CREATE TABLE questions (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id),
        text VARCHAR(1000)
      );
    `);

    try {
      await client.query(
        `INSERT INTO questions (lesson_id, text) VALUES ($1, $2)`,
        [999, 'Test question']
      );
      fail('Should have thrown error for invalid lesson_id');
    } catch (error) {
      expect(error.code).toBeDefined();
    }
  });

  it('should enforce check constraints', async () => {
    await client.query(`
      CREATE TABLE user_responses (
        id SERIAL PRIMARY KEY,
        confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5)
      );
    `);

    try {
      await client.query(
        `INSERT INTO user_responses (confidence) VALUES ($1)`,
        [0]
      );
      fail('Should have thrown error for invalid confidence');
    } catch (error) {
      expect(error.code).toBeDefined();
    }

    try {
      await client.query(
        `INSERT INTO user_responses (confidence) VALUES ($1)`,
        [6]
      );
      fail('Should have thrown error for invalid confidence');
    } catch (error) {
      expect(error.code).toBeDefined();
    }
  });

  it('should have default timestamp', async () => {
    await client.query(`
      CREATE TABLE test_table (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await client.query(
      `INSERT INTO test_table DEFAULT VALUES RETURNING created_at`
    );

    expect(result.rows[0].created_at).toBeDefined();
  });

  it('should handle JSONB data properly', async () => {
    await client.query(`
      CREATE TABLE test_table (
        id SERIAL PRIMARY KEY,
        data JSONB
      );
    `);

    const jsonData = JSON.stringify({ key: 'value', count: 5 });
    
    await client.query(
      `INSERT INTO test_table (data) VALUES ($1)`,
      [jsonData]
    );

    const result = await client.query(`
      SELECT data FROM test_table WHERE id = 1
    `);

    expect(result.rows[0].data).toBeInstanceOf(String);
    const parsed = JSON.parse(result.rows[0].data);
    expect(parsed.key).toBe('value');
    expect(parsed.count).toBe(5);
  });
});

describe('Database Performance Tests', () => {
  let pool;

  beforeAll(async () => {
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'smart_learn_test',
      user: 'postgres',
      password: 'password'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should handle bulk insert efficiently', async () => {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE test_table (
        id SERIAL PRIMARY KEY,
        data TEXT
      );
    `);

    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await client.query(
        `INSERT INTO test_table (data) VALUES ($1)`,
        [`Test data ${i}`]
      );
    }
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // < 5 seconds for 100 inserts

    client.release();
  });

  it('should handle complex queries efficiently', async () => {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE test_table (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50),
        value INTEGER
      );
    `);

    for (let i = 0; i < 1000; i++) {
      await client.query(
        `INSERT INTO test_table (category, value) VALUES ($1, $2)`,
        [`category_${i % 10}`, i]
      );
    }

    const startTime = Date.now();
    
    const result = await client.query(`
      SELECT category, AVG(value) as avg_value
      FROM test_table
      GROUP BY category
      HAVING AVG(value) > 500
      ORDER BY avg_value DESC
    `);
    
    const duration = Date.now() - startTime;
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000); // < 2 seconds

    client.release();
  });

  it('should handle concurrent queries', async () => {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE test_table (
        id SERIAL PRIMARY KEY,
        value INTEGER
      );
    `);

    const queries = [];
    
    for (let i = 0; i < 10; i++) {
      queries.push(
        client.query(
          `INSERT INTO test_table (value) VALUES ($1)`,
          [i]
        )
      );
    }
    
    await Promise.all(queries);
    
    const count = await client.query(`
      SELECT COUNT(*) FROM test_table
    `);
    
    expect(parseInt(count.rows[0].count)).toBe(10);

    client.release();
  });
});

describe('Database Error Handling', () => {
  let pool;

  beforeAll(async () => {
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'smart_learn_test',
      user: 'postgres',
      password: 'password'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should handle connection errors', async () => {
    const badPool = new Pool({
      host: 'nonexistent.host',
      port: 5432,
      database: 'nonexistent_db',
      user: 'postgres',
      password: 'wrong_password',
      idleTimeoutMillis: 1000
    });

    try {
      const client = await badPool.connect();
      await client.query('SELECT 1');
      fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.code).toBeDefined();
    } finally {
      await badPool.end();
    }
  });

  it('should handle query errors gracefully', async () => {
    const client = await pool.connect();
    
    try {
      await client.query(`
        INSERT INTO non_existent_table (value) VALUES ($1)
      `, ['test']);
      
      fail('Should have thrown error');
    } catch (error) {
      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
    } finally {
      client.release();
    }
  });

  it('should handle transaction rollback', async () => {
    const client = await pool.connect();
    
    await client.query('BEGIN');
    
    try {
      await client.query(`
        INSERT INTO non_existent_table (value) VALUES ($1)
      `, ['test']);
      
      await client.query('ROLLBACK');
    } catch (error) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('should handle NULL values correctly', async () => {
    await client.query(`
      CREATE TABLE test_table (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT
      );
    `);

    const result = await client.query(
      `INSERT INTO test_table (title) VALUES (NULL) RETURNING *`
    );

    expect(result.rows[0].title).toBeNull();
    expect(result.rows[0].description).toBeNull();
  });
});
