-- Check if the soft_delete_guide function exists
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%delete%'
ORDER BY routine_name;

-- Also check what parameters it expects
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'soft_delete_guide';
