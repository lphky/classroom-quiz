// 用法（建議先停伺服器）：
//   node server/admin-cli.mjs create <登入名稱> <密碼> [--admin] [--name 顯示名稱] [--keep]
//   node server/admin-cli.mjs list
import { createUser } from './server.mjs';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = resolve(process.env.CQ_DATA_DIR || join(ROOT, 'data'));
const [cmd, ...args] = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);

if (cmd === 'create') {
  const [username, password] = args;
  const u = createUser({ username, password, name: opt('--name'), isAdmin: flag('--admin'), mustChange: !flag('--keep') });
  console.log(`已建立 ${u.username}${u.isAdmin ? '（管理員）' : ''}`);
} else if (cmd === 'list') {
  for (const u of JSON.parse(readFileSync(join(DATA, 'users.json'), 'utf8'))) console.log(`${u.username}\t${u.name}\t${u.isAdmin ? 'admin' : ''}\t${u.disabled ? 'disabled' : ''}`);
} else {
  console.log('node server/admin-cli.mjs create <登入名稱> <密碼> [--admin] [--name 顯示名稱] [--keep]\nnode server/admin-cli.mjs list');
}
process.exit(0);
