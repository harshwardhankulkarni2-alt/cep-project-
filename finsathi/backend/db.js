// Tiny JSON-file store so it runs with zero setup. Swap for MongoDB/Postgres in production.
import fs from 'fs';
const F = './data.json';
export const db = {
  read: () => (fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : { users: [], transactions: [] }),
  write: (d) => fs.writeFileSync(F, JSON.stringify(d, null, 1)),
};
