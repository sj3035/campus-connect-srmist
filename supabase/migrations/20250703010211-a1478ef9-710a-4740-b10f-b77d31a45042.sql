-- Update the handle_new_user function to assign roles based on email domain for OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  user_role user_role;
BEGIN
  -- Get the email from the new user
  user_email := NEW.email;
  
  -- Determine role based on email domain
  IF user_email LIKE '%@srmist.edu.in' OR user_email LIKE '%@ist.srmtrichy.edu.in' THEN
    user_role := 'admin';
  ELSE
    user_role := 'student';
  END IF;
  
  -- For OAuth users, the role might not be in metadata, so we determine it from email
  -- For regular signups, use the role from metadata if provided
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  END IF;
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    user_email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', user_email),
    user_role
  );
  RETURN NEW;
END;
$function$