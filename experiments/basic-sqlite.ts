/**
 * Experiment 1: Basic node:sqlite API usage
 */
import { DatabaseSync } from 'node:sqlite';

// Create in-memory database
const db = new DatabaseSync(':memory:', {
  enableForeignKeyConstraints: true,
});

console.log('=== Experiment 1: Basic CRUD ===\n');

// Create tables
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  ) STRICT;
`);

console.log('✓ Table created');

// Insert with prepared statement
const insertUser = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
const result1 = insertUser.run('Alice', 'alice@example.com');
console.log('✓ Insert result:', result1);

// Insert with named parameters
const insertNamed = db.prepare('INSERT INTO users (name, email) VALUES (:name, :email)');
const result2 = insertNamed.run({ name: 'Bob', email: 'bob@example.com' });
console.log('✓ Named insert result:', result2);

// Get single row
const getUser = db.prepare('SELECT * FROM users WHERE id = ?');
const user = getUser.get(1);
console.log('✓ Single user:', user);

// Get all rows
const getAllUsers = db.prepare('SELECT * FROM users ORDER BY id');
const users = getAllUsers.all();
console.log('✓ All users:', users);

// Update
const updateUser = db.prepare('UPDATE users SET name = ? WHERE id = ?');
const updateResult = updateUser.run('Alice Updated', 1);
console.log('✓ Update result:', updateResult);

// Verify update
console.log('✓ After update:', getUser.get(1));

// Delete
const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');
const deleteResult = deleteUser.run(2);
console.log('✓ Delete result:', deleteResult);

// Iterate
console.log('\n✓ Iterating:');
for (const u of getAllUsers.iterate()) {
  console.log('  -', u);
}

db.close();
console.log('\n✓ Database closed');
