-- Run this in your Supabase SQL Editor to allow users to delete their own accounts
create or replace function delete_user()
returns void
language sql
security definer
as $$
  delete from auth.users where id = auth.uid();
$$;
