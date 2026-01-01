/**
 * List command - list all saved reviews
 */
import { parseArgs } from 'node:util';
import { initDatabase, closeDatabase } from '../../server/db/index.ts';
import { createConfig } from '../../server/config.ts';
import type { ReviewStatus } from '../../shared/types.ts';

function printHelp() {
  console.log(`
Usage: code-review list [options]

List all saved reviews for the current repository.

Options:
  --status <status>      Filter by status (in_progress|approved|changes_requested)
  --json                 Output as JSON
  -h, --help             Show this help message
`);
}

export async function listCommand(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      status: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const config = createConfig();

  try {
    const db = initDatabase(config.dbPath);

    let query = 'SELECT id, source_type, source_ref, status, created_at, updated_at FROM reviews';
    const params: string[] = [];

    if (values.status) {
      query += ' WHERE status = ?';
      params.push(values.status as ReviewStatus);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const reviews = params.length > 0 ? stmt.all(params[0]) : stmt.all();

    if (values.json) {
      console.log(JSON.stringify(reviews, null, 2));
    } else if (reviews.length === 0) {
      console.log('No reviews found.');
    } else {
      console.log('Reviews:\n');
      for (const review of reviews as Array<{
        id: string;
        source_type: string;
        source_ref: string | null;
        status: string;
        created_at: string;
      }>) {
        const statusIcon =
          review.status === 'approved'
            ? '[+]'
            : review.status === 'changes_requested'
              ? '[!]'
              : '[ ]';

        // Build a display name based on source type
        let displayName = review.source_type;
        if (review.source_type === 'branch' && review.source_ref) {
          displayName = `Branch: ${review.source_ref}`;
        } else if (review.source_type === 'commits' && review.source_ref) {
          const commits = review.source_ref.split(',');
          displayName = `Commits: ${commits.length} commit${commits.length > 1 ? 's' : ''}`;
        } else if (review.source_type === 'staged') {
          displayName = 'Staged changes';
        }

        console.log(`${statusIcon} ${displayName}`);
        console.log(`    ID: ${review.id}`);
        console.log(`    Created: ${review.created_at}\n`);
      }
    }

    closeDatabase();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('No reviews found. Database does not exist yet.');
    } else {
      throw err;
    }
  }
}
