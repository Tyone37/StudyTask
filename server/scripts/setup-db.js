const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { connectionName, expectedDbName, mysql: mysqlConfig } = require('../config');

function assertSafeSchema(schema) {
  const forbidden = [/\bDROP\b/i, /\bTRUNCATE\b/i, /\bDELETE\s+FROM\b/i];
  const unsafe = forbidden.find((pattern) => pattern.test(schema));

  if (unsafe) {
    throw new Error('Schema contains destructive SQL. Refusing to run setup.');
  }
}

async function getColumns(connection, tableName) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [mysqlConfig.database, tableName]
  );

  return new Map(columns.map((column) => [column.COLUMN_NAME, column]));
}

async function hasIndex(connection, tableName, indexName) {
  const [indexes] = await connection.query(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [mysqlConfig.database, tableName, indexName]
  );

  return indexes.length > 0;
}

async function ensureCompatibleSchema(connection) {
  const userColumns = await getColumns(connection, 'users');

  if (!userColumns.has('full_name') && userColumns.has('name')) {
    console.log('Migration: adding users.full_name and copying values from users.name.');
    await connection.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(100) NULL AFTER id');
    await connection.query('UPDATE users SET full_name = name WHERE full_name IS NULL');
  }

  const refreshedUserColumns = await getColumns(connection, 'users');
  const legacyNameColumn = refreshedUserColumns.get('name');

  if (legacyNameColumn && legacyNameColumn.IS_NULLABLE === 'NO') {
    console.log('Migration: making legacy users.name nullable so new inserts can use full_name.');
    await connection.query('ALTER TABLE users MODIFY name VARCHAR(100) NULL');
  }

  let latestUserColumns = await getColumns(connection, 'users');
  const passwordHashColumn = latestUserColumns.get('password_hash');

  if (passwordHashColumn && passwordHashColumn.IS_NULLABLE === 'NO') {
    console.log('Migration: making users.password_hash nullable for Google-only users.');
    await connection.query('ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL');
  }

  latestUserColumns = await getColumns(connection, 'users');

  if (!latestUserColumns.has('google_sub')) {
    console.log('Migration: adding users.google_sub.');
    await connection.query('ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) NULL AFTER password_hash');
  }

  latestUserColumns = await getColumns(connection, 'users');

  if (!latestUserColumns.has('auth_provider')) {
    console.log('Migration: adding users.auth_provider.');
    await connection.query(
      "ALTER TABLE users ADD COLUMN auth_provider ENUM('local', 'google', 'both') NOT NULL DEFAULT 'local' AFTER google_sub"
    );
  }

  latestUserColumns = await getColumns(connection, 'users');

  if (!latestUserColumns.has('avatar_url')) {
    console.log('Migration: adding users.avatar_url.');
    await connection.query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER auth_provider');
  }

  if (!(await hasIndex(connection, 'users', 'idx_users_google_sub'))) {
    console.log('Migration: adding unique index idx_users_google_sub.');
    await connection.query('CREATE UNIQUE INDEX idx_users_google_sub ON users (google_sub)');
  }
}

async function main() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  assertSafeSchema(schema);

  if (mysqlConfig.database !== expectedDbName) {
    throw new Error(`Refusing to setup database ${mysqlConfig.database}; expected ${expectedDbName}.`);
  }

  console.log(`MySQL connection: ${connectionName}`);
  console.log(`Target: ${mysqlConfig.user}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
  console.log('Safety: setup only creates database/tables if missing; it does not drop or delete data.');

  const connection = await mysql.createConnection({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    multipleStatements: true
  });

  try {
    await connection.query(schema);
    await ensureCompatibleSchema(connection);
    console.log('Đã tạo database student_task_manager và các bảng cần thiết.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Không thể setup MySQL:', error.message);
  process.exitCode = 1;
});
