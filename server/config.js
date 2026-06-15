require('dotenv').config({ quiet: true });

const dbName = process.env.DB_NAME || 'student_task_manager';
const expectedDbName = 'student_task_manager';

if (dbName !== expectedDbName && process.env.ALLOW_CUSTOM_DB !== '1') {
  throw new Error(
    `DB_NAME must be ${expectedDbName}. Refusing to use ${dbName} to avoid touching another project database.`
  );
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET || 'student-task-manager-demo-secret',
  googleClientId: String(process.env.GOOGLE_CLIENT_ID || '').trim(),
  connectionName: process.env.DB_CONNECTION_NAME || 'Dự án',
  expectedDbName,
  dbName,
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10
  }
};
