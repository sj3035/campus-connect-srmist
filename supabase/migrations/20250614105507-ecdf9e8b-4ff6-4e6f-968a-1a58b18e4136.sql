
-- Step 1: Add new columns (if they don't already exist)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Step 2: Update all existing rows with placeholder values
UPDATE registrations
  SET
    full_name = COALESCE(full_name, 'UNKNOWN'),
    email = COALESCE(email, 'UNKNOWN'),
    phone = COALESCE(phone, 'UNKNOWN'),
    roll_number = COALESCE(roll_number, 'UNKNOWN')
  WHERE full_name IS NULL
     OR email IS NULL
     OR phone IS NULL
     OR roll_number IS NULL;

-- Step 3: Make new columns NOT NULL
ALTER TABLE registrations
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN roll_number SET NOT NULL;
