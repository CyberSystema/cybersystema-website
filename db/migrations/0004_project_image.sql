-- Migration 0004: optional cover image for projects.

ALTER TABLE projects ADD COLUMN image_url TEXT;
ALTER TABLE projects ADD COLUMN image_alt TEXT;
