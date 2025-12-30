/**
 * Experiment 2: Transactions with node:sqlite
 */
import { DatabaseSync } from 'node:sqlite';

console.log('=== Experiment 2: Transactions ===\n');

const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE accounts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0
  ) STRICT;
`);

// Insert initial data
const insert = db.prepare('INSERT INTO accounts (name, balance) VALUES (?, ?)');
insert.run('Alice', 1000);
insert.run('Bob', 500);

const getAll = db.prepare('SELECT * FROM accounts ORDER BY id');
console.log('Initial state:', getAll.all());

// Successful transaction
console.log('\n--- Successful transfer ---');
const transfer = db.prepare('UPDATE accounts SET balance = balance + ? WHERE name = ?');

db.exec('BEGIN TRANSACTION');
console.log('In transaction?', db.isTransaction);
try {
  transfer.run(-200, 'Alice');  // Debit Alice
  transfer.run(200, 'Bob');     // Credit Bob
  db.exec('COMMIT');
  console.log('✓ Transfer committed');
} catch (err) {
  db.exec('ROLLBACK');
  console.log('✗ Transfer rolled back:', err);
}
console.log('After transfer:', getAll.all());

// Failed transaction (rollback)
console.log('\n--- Failed transfer (simulated error) ---');
db.exec('BEGIN TRANSACTION');
try {
  transfer.run(-100, 'Alice');
  // Simulate an error
  throw new Error('Simulated network error');
  transfer.run(100, 'Bob');
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  console.log('✗ Transfer rolled back due to:', (err as Error).message);
}
console.log('After rollback (unchanged):', getAll.all());

// Transaction helper function
console.log('\n--- Transaction helper pattern ---');

function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN TRANSACTION');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Use the helper
const transferResult = transaction(db, () => {
  transfer.run(-50, 'Alice');
  transfer.run(50, 'Bob');
  return { success: true, amount: 50 };
});
console.log('✓ Helper transfer result:', transferResult);
console.log('Final state:', getAll.all());

db.close();
