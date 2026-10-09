-- sql/schema.sql
-- Schema definition for TaskFlow Task Management REST API
--
-- NOTE: Uses non-destructive CREATE TABLE IF NOT EXISTS statements.
-- IMPORTANT: `CREATE TABLE IF NOT EXISTS` will NOT perform migrations on existing tables.
-- If table structure changes in the future, explicit ALTER TABLE SQL migrations are required.

-- Function to automatically update the `updated_at` timestamp on record modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Tasks Table Definition
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Safe trigger initialization (creates trigger only if it does not already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_tasks_updated_at
            BEFORE UPDATE ON tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
