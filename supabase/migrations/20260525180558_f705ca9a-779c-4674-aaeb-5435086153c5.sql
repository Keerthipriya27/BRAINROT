
-- ROLES
create type public.app_role as enum ('organizer', 'volunteer', 'sponsor', 'participant');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "users insert own role" on public.user_roles for insert with check (auth.uid() = user_id);

-- PROFILES
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  college text,
  skills text[] default '{}',
  interests text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles public read" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = user_id);

-- TIMESTAMP TRIGGER
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.touch_updated_at();

-- AUTO PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- EVENTS
create type public.event_status as enum ('draft','published','live','completed','cancelled');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  cover_url text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  capacity int default 100,
  budget numeric default 0,
  status event_status not null default 'draft',
  intelligence_score int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
create trigger trg_events_updated before update on public.events
for each row execute function public.touch_updated_at();

create policy "anyone reads published events" on public.events for select
  using (status <> 'draft' or organizer_id = auth.uid());
create policy "organizers insert events" on public.events for insert
  with check (auth.uid() = organizer_id and public.has_role(auth.uid(),'organizer'));
create policy "organizers update own events" on public.events for update
  using (auth.uid() = organizer_id);
create policy "organizers delete own events" on public.events for delete
  using (auth.uid() = organizer_id);

-- REGISTRATIONS
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references auth.users(id) on delete cascade,
  qr_code text not null default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz not null default now(),
  unique(event_id, participant_id)
);
alter table public.registrations enable row level security;
create policy "view own or organizer regs" on public.registrations for select using (
  participant_id = auth.uid()
  or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
);
create policy "participant register self" on public.registrations for insert
  with check (auth.uid() = participant_id);
create policy "participant unregister self" on public.registrations for delete
  using (auth.uid() = participant_id);

-- SPONSORSHIPS
create type public.sponsorship_status as enum ('proposed','accepted','rejected','completed');

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sponsor_id uuid not null references auth.users(id) on delete cascade,
  package_name text,
  amount numeric default 0,
  industry text,
  status sponsorship_status not null default 'proposed',
  roi_score int default 0,
  created_at timestamptz not null default now()
);
alter table public.sponsorships enable row level security;
create policy "view related sponsorships" on public.sponsorships for select using (
  sponsor_id = auth.uid()
  or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
);
create policy "sponsor propose" on public.sponsorships for insert
  with check (auth.uid() = sponsor_id and public.has_role(auth.uid(),'sponsor'));
create policy "sponsor or organizer update" on public.sponsorships for update using (
  sponsor_id = auth.uid()
  or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
);

-- VOLUNTEER TASKS
create type public.task_status as enum ('open','claimed','in_progress','done');

create table public.volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  skill_required text,
  xp_reward int not null default 50,
  status task_status not null default 'open',
  assignee_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.volunteer_tasks enable row level security;
create trigger trg_tasks_updated before update on public.volunteer_tasks
for each row execute function public.touch_updated_at();

create policy "tasks readable to authed" on public.volunteer_tasks for select using (auth.uid() is not null);
create policy "organizer creates tasks" on public.volunteer_tasks for insert with check (
  exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
);
create policy "organizer or assignee updates" on public.volunteer_tasks for update using (
  assignee_id = auth.uid()
  or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
);
create policy "organizer deletes tasks" on public.volunteer_tasks for delete using (
  exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
);

-- VOLUNTEER XP
create table public.volunteer_xp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.volunteer_xp enable row level security;
create policy "xp public read" on public.volunteer_xp for select using (true);
create policy "user upsert own xp" on public.volunteer_xp for insert with check (auth.uid() = user_id);
create policy "user update own xp" on public.volunteer_xp for update using (auth.uid() = user_id);

-- BADGES
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  awarded_at timestamptz not null default now()
);
alter table public.badges enable row level security;
create policy "badges public read" on public.badges for select using (true);
create policy "user adds own badges" on public.badges for insert with check (auth.uid() = user_id);
