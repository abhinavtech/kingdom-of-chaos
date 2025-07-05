import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'gameuser',
  password: process.env.DB_PASSWORD || 'gamepass123',
  database: process.env.DB_DATABASE || 'kingdom_of_chaos',
  entities: ['dist/entities/*.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: true,
}); 