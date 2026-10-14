-- 이드에게 물어보기 — Supabase schema
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 하세요.

create extension if not exists pgcrypto;

-- "이드에게 질문하기" 탭에서 남긴 질문/답변
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  question text not null,
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create policy "insert own questions" on public.questions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "read own questions" on public.questions
  for select to authenticated
  using (auth.uid() = user_id);

create policy "admin reads all questions" on public.questions
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'oldddong@gmail.com');

create policy "admin updates questions" on public.questions
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'oldddong@gmail.com');

-- "HR 지식 검색" 탭에서 남긴 검색어 로그 (관리자만 조회)
create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  query text not null,
  created_at timestamptz not null default now()
);

alter table public.search_logs enable row level security;

create policy "insert own search logs" on public.search_logs
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "admin reads all search logs" on public.search_logs
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'oldddong@gmail.com');

-- 회원 프로필(이메일/이름/회사/직무) — 가입 직후 앱이 본인 행을 한 번 insert합니다.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  company text,
  role text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "users insert own profile" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "admin reads all profiles" on public.profiles
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'oldddong@gmail.com');

-- 관리자가 "HR 지식 검색"에 추가로 올리는 자료(링크/텍스트). 모두가 검색할 수 있고, 관리자만 추가/삭제합니다.
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  category text not null default '기타',
  subcategory text not null default '',
  content text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "anyone reads resources" on public.resources
  for select to anon, authenticated
  using (true);

create policy "admin inserts resources" on public.resources
  for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'oldddong@gmail.com');

create policy "admin deletes resources" on public.resources
  for delete to authenticated
  using (auth.jwt() ->> 'email' = 'oldddong@gmail.com');
