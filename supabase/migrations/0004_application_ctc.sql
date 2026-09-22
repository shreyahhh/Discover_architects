-- Adds current/expected compensation fields to job applications, shown to
-- admins reviewing candidates. Text (not numeric) since candidates enter
-- these freely (e.g. "8 LPA", "45,000/month", "Negotiable").
-- Run against the same project the earlier migrations were applied to.

alter table job_applications add column if not exists current_ctc text;
alter table job_applications add column if not exists expected_ctc text;
