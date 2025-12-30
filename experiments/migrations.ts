/**
 * Experiment 3: Migration system with node:sqlite
 *
 * Simple version-based migration system using user_version pragma
 */
import { DatabaseSync } from 'node:sqlite';

console.log('=== Experiment 3: Migrations ===\n');

// Migration definition
interface Migration {
  version: number;
  name: string;
  up: string;  // SQL to apply
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_reviews_table',
    up: `
      CREATE TABLE reviews (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      ) STRICT;
    `,
  },
  {
    version: 2,
    name: 'create_comments_table',
    up: `
      CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      ) STRICT;
    `,
  },
  {
    version: 3,
    name: 'add_status_to_reviews',
    up: `
      ALTER TABLE reviews ADD COLUMN status TEXT DEFAULT 'in_progress';
    `,
  },
];

function getCurrentVersion(db: DatabaseSync): number {
  const stmt = db.prepare('PRAGMA user_version');
  const result = stmt.get() as { user_version: number };
  return result.user_version;
}

function setVersion(db: DatabaseSync, version: number): void {
  // PRAGMA statements can't use parameters, must use exec
  db.exec(`PRAGMA user_version = ${version}`);
}

function migrate(db: DatabaseSync, migrations: Migration[]): void {
  const currentVersion = getCurrentVersion(db);
  console.log(`Current schema version: ${currentVersion}`);

  // Sort migrations by version
  const sorted = [...migrations].sort((a, b) => a.version - b.version);

  // Find pending migrations
  const pending = sorted.filter(m => m.version > currentVersion);

  if (pending.length === 0) {
    console.log('✓ Database is up to date');
    return;
  }

  console.log(`Found ${pending.length} pending migration(s)\n`);

  for (const migration of pending) {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);

    db.exec('BEGIN TRANSACTION');
    try {
      db.exec(migration.up);
      setVersion(db, migration.version);
      db.exec('COMMIT');
      console.log(`✓ Migration ${migration.version} applied successfully`);
    } catch (err) {
      db.exec('ROLLBACK');
      console.error(`✗ Migration ${migration.version} failed:`, err);
      throw err;
    }
  }

  console.log(`\n✓ All migrations applied. New version: ${getCurrentVersion(db)}`);
}

// Test the migration system
const db = new DatabaseSync(':memory:', {
  enableForeignKeyConstraints: true,
});

console.log('--- Initial migration run ---');
migrate(db, migrations);

console.log('\n--- Second run (no-op) ---');
migrate(db, migrations);

// Verify tables exist
console.log('\n--- Verify schema ---');
const tables = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();
console.log('Tables:', tables);

// Check reviews table has status column
const reviewColumns = db.prepare('PRAGMA table_info(reviews)').all();
console.log('Reviews columns:', reviewColumns);

// Test data insertion
console.log('\n--- Test data insertion ---');
const insertReview = db.prepare(
  'INSERT INTO reviews (id, title) VALUES (?, ?)'
);
insertReview.run('review-1', 'Test Review');

const insertComment = db.prepare(
  'INSERT INTO comments (id, review_id, content) VALUES (?, ?, ?)'
);
insertComment.run('comment-1', 'review-1', 'This looks good!');

const reviews = db.prepare('SELECT * FROM reviews').all();
const comments = db.prepare('SELECT * FROM comments').all();
console.log('Reviews:', reviews);
console.log('Comments:', comments);

// Test foreign key constraint
console.log('\n--- Test foreign key constraint ---');
try {
  insertComment.run('comment-2', 'nonexistent-review', 'Bad comment');
  console.log('✗ Should have thrown foreign key error!');
} catch (err) {
  console.log('✓ Foreign key constraint enforced:', (err as Error).message);
}

// Test cascade delete
console.log('\n--- Test cascade delete ---');
const deleteReview = db.prepare('DELETE FROM reviews WHERE id = ?');
deleteReview.run('review-1');
const remainingComments = db.prepare('SELECT * FROM comments').all();
console.log('✓ Comments after deleting review:', remainingComments);

db.close();
console.log('\n✓ All experiments completed');
