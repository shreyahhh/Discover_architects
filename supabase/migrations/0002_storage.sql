-- Storage buckets for gallery images and resumes.
-- Both are private: the Express backend uploads/reads with the service role
-- key and serves images/resumes through its own API routes, so nothing here
-- needs to be public or need anon/authenticated policies.

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;
