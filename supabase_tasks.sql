-- 테스크 테이블 추가 (Supabase / Postgres)
-- 실행 후 RLS 정책은 프로젝트에 맞게 설정하세요.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  notes text null,
  due_date date null,
  is_done boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_due_date_idx on public.tasks(user_id, due_date);
create index if not exists tasks_user_done_due_idx on public.tasks(user_id, is_done, due_date);

-- updated_at 자동 갱신 트리거
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create or replace function public.set_updated_at()
    returns trigger as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$ language plpgsql;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tasks_set_updated_at') then
    create trigger tasks_set_updated_at
    before update on public.tasks
    for each row
    execute function public.set_updated_at();
  end if;
end $$;
