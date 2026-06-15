const { pool } = require('../db');
const { connectionName, mysql: mysqlConfig } = require('../config');

async function main() {
  await pool.query('SELECT 1');
  const [tables] = await pool.query('SHOW TABLES');
  console.log(`MySQL connection: ${connectionName}`);
  console.log(`Target: ${mysqlConfig.user}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
  console.log('Kết nối MySQL thành công.');
  console.log(`Số bảng hiện có: ${tables.length}`);
}

main()
  .catch((error) => {
    console.error('Không kết nối được MySQL:', error.message);
    console.error('Hãy kiểm tra MySQL connection Dự án: user root, password để trống.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
