-- First, check if the guides table exists and what schema it's in
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE tablename = 'guides';

-- Then get all columns in the guides table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'guides'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Try selecting from guides without specifying columns
SELECT * FROM guides LIMIT 1;
