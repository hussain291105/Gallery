-- Run this in Supabase SQL Editor.
-- Create a PRIVATE Storage bucket named "gallery-photos" in Storage first.
-- These policies restrict each signed-in user to a folder named after their auth UID.

insert into storage.buckets (id, name, public)
values ('gallery-photos', 'gallery-photos', false)
on conflict (id) do nothing;

create policy "Users can upload to their own gallery folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'gallery-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read their own gallery folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'gallery-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own gallery folder"
on storage.objects for update to authenticated
using (
  bucket_id = 'gallery-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'gallery-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own gallery folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'gallery-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
