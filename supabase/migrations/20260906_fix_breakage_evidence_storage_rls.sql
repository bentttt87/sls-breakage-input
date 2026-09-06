-- SLS Breakage Input - restore private evidence upload RLS
-- Purpose: authenticated SLS users must be able to upload evidence to the private
-- breakage-evidence bucket. This restores the policy defined in the original v43
-- daily incident migration. Bucket remains private.

begin;

insert into storage.buckets (id, name, public)
values ('breakage-evidence', 'breakage-evidence', false)
on conflict (id) do update set public = false;

drop policy if exists "breakage evidence authenticated read" on storage.objects;
create policy "breakage evidence authenticated read"
on storage.objects
for select
to authenticated
using (bucket_id = 'breakage-evidence');

drop policy if exists "breakage evidence authenticated insert" on storage.objects;
create policy "breakage evidence authenticated insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'breakage-evidence');

commit;

notify pgrst, 'reload schema';
