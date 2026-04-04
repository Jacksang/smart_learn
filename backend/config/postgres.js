require('dotenv').config();

const LOCAL_DEFAULTS = {
  user: 'smartlearn',
  host: 'localhost',
  database: 'smartlearn',
  password: 'password',
  port: 5432,
};

const parseInteger = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const buildPostgresConfig = (env = process.env) => {
  const sslEnabled = parseBoolean(env.DB_SSL);
  const config = {
    user: env.DB_USER || LOCAL_DEFAULTS.user,
    host: env.DB_HOST || LOCAL_DEFAULTS.host,
    database: env.DB_NAME || LOCAL_DEFAULTS.database,
    password: env.DB_PASSWORD || LOCAL_DEFAULTS.password,
    port: parseInteger(env.DB_PORT, LOCAL_DEFAULTS.port),
  };

  const max = parseInteger(env.DB_POOL_MAX, undefined);
  if (max !== undefined) {
    config.max = max;
  }

  const idleTimeoutMillis = parseInteger(env.DB_IDLE_TIMEOUT_MS, undefined);
  if (idleTimeoutMillis !== undefined) {
    config.idleTimeoutMillis = idleTimeoutMillis;
  }

  const connectionTimeoutMillis = parseInteger(env.DB_CONNECTION_TIMEOUT_MS, undefined);
  if (connectionTimeoutMillis !== undefined) {
    config.connectionTimeoutMillis = connectionTimeoutMillis;
  }

  if (sslEnabled) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
};

module.exports = {
  LOCAL_DEFAULTS,
  parseInteger,
  parseBoolean,
  buildPostgresConfig,
};
