import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordToParticipants1704648000000 implements MigrationInterface {
  name = 'AddPasswordToParticipants1704648000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add password column to participants table
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "password" character varying(255) NOT NULL DEFAULT ''`
    );
    
    // Update questions table to set is_active default to false
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "is_active" SET DEFAULT false`
    );
    
    // Update existing questions to be inactive by default
    await queryRunner.query(
      `UPDATE "questions" SET "is_active" = false WHERE "is_active" IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove password column from participants table
    await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "password"`);
    
    // Revert questions table is_active default
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "is_active" SET DEFAULT true`
    );
  }
} 