const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core');

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('resident'),
  flatNumber: text('flat_number'),
  createdAt: text('created_at').notNull(),
});

const complaints = sqliteTable('complaints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  residentId: integer('resident_id').notNull().references(() => users.id),
  category: text('category').notNull(),
  description: text('description').notNull(),
  photoUrl: text('photo_url'),
  status: text('status').notNull().default('Open'),
  priority: text('priority').notNull().default('Low'),
  isOverdueFlag: integer('is_overdue_flag', { mode: 'boolean' }).notNull().default(false),
  resolvedAt: text('resolved_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

const complaintHistory = sqliteTable('complaint_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  complaintId: integer('complaint_id').notNull().references(() => complaints.id),
  actorId: integer('actor_id').references(() => users.id),
  actorRole: text('actor_role').notNull(),
  changeType: text('change_type').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

const notices = sqliteTable('notices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isImportant: integer('is_important', { mode: 'boolean' }).notNull().default(false),
  postedBy: integer('posted_by').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

module.exports = {
  users,
  complaints,
  complaintHistory,
  notices,
  settings,
};
