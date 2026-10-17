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

-- 질문에 첨부한 이미지/파일 (url/name/type의 배열)
alter table public.questions add column if not exists attachments jsonb not null default '[]'::jsonb;

-- 질문/답변 말풍선에 다는 이모지 반응 (한 말풍선당 하나)
alter table public.questions add column if not exists question_reaction text;
alter table public.questions add column if not exists answer_reaction text;

-- 반응은 테이블 UPDATE 권한을 넓히지 않고 이 함수로만 바꿉니다:
-- 그 질문을 쓴 본인이거나 관리자만, question_reaction/answer_reaction 두 칸만 건드릴 수 있어요.
create or replace function public.set_question_reaction(p_question_id uuid, p_field text, p_emoji text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.questions where id = p_question_id;
  if v_owner is null then
    raise exception 'question not found';
  end if;
  if auth.uid() != v_owner and auth.jwt() ->> 'email' != 'oldddong@gmail.com' then
    raise exception 'not authorized';
  end if;
  if p_field = 'question' then
    update public.questions set question_reaction = p_emoji where id = p_question_id;
  elsif p_field = 'answer' then
    update public.questions set answer_reaction = p_emoji where id = p_question_id;
  else
    raise exception 'invalid field: %', p_field;
  end if;
end;
$$;

grant execute on function public.set_question_reaction(uuid, text, text) to authenticated;

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

-- 분류/요약을 나중에 채워 넣을 수 있도록 admin update 허용
create policy "admin updates resources" on public.resources
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'oldddong@gmail.com');

-- 자료의 요약 (업로드 시점엔 비어 있고, 이후 채워 넣음)
alter table public.resources add column if not exists summary text not null default '';

-- "이드에게 질문하기"에서 올리는 이미지/파일 첨부용 Storage 버킷
insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', true)
  on conflict (id) do nothing;

create policy "anyone reads attachments" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'attachments');

create policy "users upload own attachments" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- 관리자가 대기 중인 질문 없이도 먼저 메시지를 보낼 수 있게 (채팅형)
drop policy if exists "admin inserts messages" on public.questions;
create policy "admin inserts messages" on public.questions
  for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'oldddong@gmail.com');
