require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  port: process.env.PORT || 5001,
  db: {
    connectionString:
      process.env.DATABASE_URL ||
      'postgres://username:password@localhost:5432/trustaudit',
  },
};

module.exports = config;

