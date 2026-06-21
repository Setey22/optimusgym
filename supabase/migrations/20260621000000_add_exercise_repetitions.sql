alter table public.exercises
add column if not exists repetitions text;

comment on column public.exercises.repetitions is 'Free-text sets, reps, or duration for an exercise, such as 4 x 15 or 4 x 20 seg.';

notify pgrst, 'reload schema';
