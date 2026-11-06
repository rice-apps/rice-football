-- TEMPORARY: sample questions for the Staff Q&A development demo. Names are fictional.
-- Delete this file once real staff questions are being collected.
--
-- Run in the Supabase SQL editor. To reset the demo, uncomment the truncate line first.
-- It deletes EVERY question in the table.

-- truncate table public.questions restart identity;

insert into public.questions (submitter_name, submitter_title, question, status, answer, created_at)
values
  (
    'Jordan Ellis', 'General Manager',
    'Which transfer portal running backs fit our scheme best based on yards after contact?',
    'open', null, '2026-10-22 15:10:00+00'
  ),
  (
    'Marcus Reed', 'Offensive Coordinator',
    'Why is our 1st string QB so buns?',
    'in-progress', null, '2026-10-21 19:45:00+00'
  ),
  (
    'Dana Whitfield', 'Defensive Line Coach',
    'Can we get pressure rates by defensive lineman for the last four games?',
    'answered',
    'Yes. A pressure-rate breakdown by lineman for the last four games is in the Defense section of the report library. Happy to walk through it after practice.',
    '2026-10-19 13:20:00+00'
  ),
  (
    'Sam Ortega', 'Director of Football Operations',
    'Is there a summary of opponent tendencies on 4th down we can share with the staff before Saturday?',
    'open', null, '2026-10-23 16:05:00+00'
  ),
  (
    'Jordan Ellis', 'General Manager',
    'What were our special teams starting field position averages this season?',
    'answered',
    'The season summary, split by kickoff and punt returns, is in the Special Teams section of the report library. Let us know if you want it broken down by opponent.',
    '2026-10-15 21:30:00+00'
  );
