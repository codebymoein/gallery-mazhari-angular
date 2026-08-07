import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { ALL_ENTITIES } from './entities';

const sqlite = process.env.DB_TYPE === 'sqlite';

export default new DataSource(
  sqlite
    ? {
        type: 'better-sqlite3',
        database:
          process.env.DB_SQLITE_PATH ||
          join(process.cwd(), 'data', 'gallery-mazhari.sqlite'),
        entities: ALL_ENTITIES,
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        synchronize: false,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: ALL_ENTITIES,
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        synchronize: false,
        connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10_000),
      },
);
