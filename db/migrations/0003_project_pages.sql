-- Migration 0003: per-project Privacy and Support pages.
-- Both columns are nullable; presence determines whether the public page is exposed.
ALTER TABLE projects ADD COLUMN privacy_md TEXT;
ALTER TABLE projects ADD COLUMN support_md TEXT;
