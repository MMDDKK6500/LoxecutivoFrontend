#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT="${LOXECUTIVO_ROOT:-/home/ubuntu/loxecutivo}"
AUTH="$ROOT/LoxecutivoAuth"
AUTH_PM2_TARGET="${AUTH_PM2_TARGET:-2}"

trap 'echo "Configuração interrompida. Confira o erro acima antes de executar novamente." >&2' ERR

command -v node >/dev/null
command -v npm >/dev/null
command -v pm2 >/dev/null
test -f "$AUTH/.env"
pm2 describe "$AUTH_PM2_TARGET" >/dev/null

if [[ -n "$(git -C "$AUTH" status --porcelain)" ]]; then
  echo "O repositório Auth possui alterações locais. Resolva-as antes de continuar." >&2
  exit 1
fi
git -C "$AUTH" pull --ff-only origin main
cd "$AUTH"
test -f migrations/001-mfa.sql
npm ci
npm test

# Lê o .env como dados, sem executá-lo como comandos de shell.
node <<'NODE'
const fs = require('node:fs');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

(async () => {
  const original = fs.readFileSync('.env', 'utf8');
  const env = dotenv.parse(original);
  for (const name of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SECRET_KEY']) {
    if (!env[name]) throw new Error(`Configure ${name} no .env antes de continuar.`);
  }
  const existingKey = env.MFA_ENCRYPTION_KEY;
  if (existingKey && !/^[a-f0-9]{64}$/i.test(existingKey)) {
    throw new Error('MFA_ENCRYPTION_KEY existente é inválida. Não será substituída automaticamente.');
  }
  const db = await mysql.createConnection({
    host: env.DB_HOST, port: Number(env.DB_PORT || 3306),
    user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME,
  });
  try {
    const [tables] = await db.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuario_mfa'", [env.DB_NAME]);
    if (tables.length && !existingKey) {
      const [rows] = await db.query('SELECT COUNT(*) AS total FROM usuario_mfa');
      if (Number(rows[0].total) > 0) throw new Error('Já existem configurações MFA sem chave no .env. Restaure a chave original do backup para evitar perda de acesso.');
    }
    const backupDirectory = require('node:path').resolve('..', 'loxecutivo-private-backups');
    fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
    fs.chmodSync(backupDirectory, 0o700);
    const backup = `${backupDirectory}/auth.env-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(backup, original, { mode: 0o600, flag: 'wx' });
    console.log(`Backup protegido criado: ${backup}`);
    // Apenas cria uma tabela adicional. Não apaga nem recria dados existentes.
    await db.query(fs.readFileSync('migrations/001-mfa.sql', 'utf8'));
    await db.query('SELECT usuario_id, secret, enabled, last_step, recovery FROM usuario_mfa LIMIT 0');
    if (!existingKey) {
      const value = crypto.randomBytes(32).toString('hex');
      const updated = original.replace(/^\s*(?:export\s+)?MFA_ENCRYPTION_KEY\s*=.*$/gm, '');
      const temporary = `.env.mfa-${crypto.randomBytes(8).toString('hex')}`;
      fs.writeFileSync(temporary, `${updated.trimEnd()}\nMFA_ENCRYPTION_KEY=${value}\n`, { mode: 0o600, flag: 'wx' });
      fs.renameSync(temporary, '.env');
      console.log('Chave MFA criada e salva no .env (valor não exibido).');
    } else {
      console.log('Chave MFA existente preservada.');
    }
    fs.chmodSync('.env', 0o600);
  } finally { await db.end(); }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
NODE

# Evita que uma chave antiga herdada do PM2 prevaleça sobre o .env.
MFA_ENCRYPTION_KEY="$(node -e "process.stdout.write(require('dotenv').parse(require('fs').readFileSync('.env')).MFA_ENCRYPTION_KEY)")" \
  pm2 restart "$AUTH_PM2_TARGET" --update-env

curl --fail --silent --show-error --retry 10 --retry-connrefused --retry-delay 2 \
  http://127.0.0.1:8082/health >/dev/null
echo "Migração concluída e Auth respondendo. Guarde uma cópia segura do .env atualizado."
echo "Execute o deploy do frontend atualizado para disponibilizar a tela Segurança da conta."
