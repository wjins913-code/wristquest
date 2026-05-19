-- WristQuest: SQLite → Supabase (Postgres) 마이그레이션
-- Supabase 대시보드 > SQL Editor 에서 그대로 실행하세요.

-- 1. 테이블 생성
create table if not exists public.assessments (
  id              bigserial primary key,
  timestamp       timestamptz not null default now(),
  pain_score      real        not null,
  function_score  real        not null,
  stability_score real        not null,
  overall_score   real        not null,
  grade           text        not null,
  survey_data     jsonb       not null,
  typing_data     jsonb       not null,
  mouse_data      jsonb       not null
);

-- 2. 최신순 조회를 빠르게
create index if not exists assessments_created_idx
  on public.assessments (id desc);

-- 3. Row Level Security 활성화
alter table public.assessments enable row level security;

-- 4. 익명(anon) 사용자에게 INSERT / SELECT 권한 부여
--    프론트엔드가 anon key 로 직접 접근하기 때문에 정책 필요.
drop policy if exists "anon can insert assessments" on public.assessments;
create policy "anon can insert assessments"
  on public.assessments
  for insert
  to anon
  with check (true);

drop policy if exists "anon can read assessments" on public.assessments;
create policy "anon can read assessments"
  on public.assessments
  for select
  to anon
  using (true);
