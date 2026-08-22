const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './src/db/drizzleSchema.js',
  dialect: 'sqlite',
  dbCredentials: {
    url: './society_tracker.db',
  },
});
