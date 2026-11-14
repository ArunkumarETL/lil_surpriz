-- LILSURPRIZ core schema
create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- admin users ----------
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------- products ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 150),
  sku text not null unique check (char_length(sku) between 2 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  regular_price numeric(10,2) not null check (regular_price >= 0),
  discount_price numeric(10,2) check (discount_price is null or (discount_price >= 0 and discount_price <= regular_price)),
  stock int not null default 0 check (stock >= 0),
  features text[] not null default '{}',
  items_included text[] not null default '{}',
  size text,
  weight text,
  availability text not null default 'in_stock' check (availability in ('in_stock','out_of_stock','preorder')),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  allow_customisation boolean not null default false,
  status text not null default 'draft' check (status in ('draft','active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  is_main boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id);
create unique index product_images_one_main on public.product_images(product_id) where is_main;

-- ---------- customers ----------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text,
  email text not null,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_email_idx on public.customers(lower(email));
create trigger customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- link an existing guest customer row with the same email, else create one
  update public.customers set user_id = new.id
    where user_id is null and lower(email) = lower(new.email);
  if not found then
    insert into public.customers (user_id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- coupons ----------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'),
  description text,
  discount_type text not null check (discount_type in ('percent','flat')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_order_amount numeric(10,2) not null default 0 check (min_order_amount >= 0),
  max_discount numeric(10,2) check (max_discount is null or max_discount > 0),
  usage_limit int check (usage_limit is null or usage_limit > 0),
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100)
);
create trigger coupons_updated before update on public.coupons
  for each row execute function public.set_updated_at();

-- ---------- custom enquiries ----------
create table public.custom_enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  recipient_name text,
  occasion text,
  box_colour text,
  personal_message text,
  special_instructions text,
  items jsonb not null default '[]',
  estimated_total numeric(10,2) not null default 0,
  channel text not null check (channel in ('whatsapp','online')),
  status text not null default 'new' check (status in ('new','contacted','converted','closed')),
  order_id uuid,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger custom_enquiries_updated before update on public.custom_enquiries
  for each row execute function public.set_updated_at();

-- ---------- orders ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  shipping_address jsonb not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  shipping_fee numeric(10,2) not null default 0 check (shipping_fee >= 0),
  total numeric(10,2) not null check (total >= 0),
  coupon_code text,
  status text not null default 'pending'
    check (status in ('pending','paid','processing','packed','shipped','delivered','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  payment_method text not null default 'cashfree',
  cashfree_order_id text unique,
  cf_order_id text,
  cf_payment_id text,
  payment_session_id text,
  paid_amount numeric(10,2),
  paid_at timestamptz,
  courier text,
  tracking_number text,
  tracking_url text,
  notes text,
  cancel_reason text,
  custom_enquiry_id uuid references public.custom_enquiries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.custom_enquiries
  add constraint custom_enquiries_order_fk foreign key (order_id) references public.orders(id) on delete set null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  image_url text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null check (line_total >= 0),
  customisation jsonb
);
create index order_items_order_idx on public.order_items(order_id);

-- ---------- store settings (single row) ----------
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  brand_name text not null default 'LILSURPRIZ',
  tagline text not null default 'Little gifts, big surprises.',
  logo_url text,
  whatsapp_number text,
  contact_email text,
  contact_phone text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  twitter_url text,
  pinterest_url text,
  shipping_charge numeric(10,2) not null default 79 check (shipping_charge >= 0),
  free_shipping_threshold numeric(10,2) not null default 999 check (free_shipping_threshold >= 0),
  announcement text,
  announcement_enabled boolean not null default false,
  custom_box_base_price numeric(10,2) not null default 199 check (custom_box_base_price >= 0),
  box_colours text[] not null default array['Blush Pink','Lavender','Cream','Pure White','Mint'],
  occasions text[] not null default array['Birthday','Anniversary','Best Friend','Thank You','Congratulations','Get Well Soon','Just Because','Festival'],
  updated_at timestamptz not null default now()
);
create trigger store_settings_updated before update on public.store_settings
  for each row execute function public.set_updated_at();
insert into public.store_settings (id) values (1);

-- ---------- payment confirmation (server only) ----------
create or replace function public.mark_order_paid(
  p_cashfree_order_id text, p_cf_payment_id text, p_amount numeric)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
begin
  select * into o from public.orders where cashfree_order_id = p_cashfree_order_id for update;
  if not found then
    raise exception 'order not found';
  end if;
  if o.payment_status = 'paid' then
    return o; -- idempotent
  end if;
  if p_amount is null or p_amount < o.total then
    raise exception 'paid amount % less than order total %', p_amount, o.total;
  end if;

  update public.products p
     set stock = greatest(p.stock - oi.quantity, 0)
    from public.order_items oi
   where oi.order_id = o.id and oi.product_id = p.id;

  if o.coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where code = o.coupon_code;
  end if;

  if o.custom_enquiry_id is not null then
    update public.custom_enquiries set status = 'converted', order_id = o.id where id = o.custom_enquiry_id;
  end if;

  update public.orders
     set payment_status = 'paid',
         status = case when status = 'pending' then 'paid' else status end,
         cf_payment_id = p_cf_payment_id,
         paid_amount = p_amount,
         paid_at = now()
   where id = o.id
   returning * into o;
  return o;
end $$;
revoke all on function public.mark_order_paid(text, text, numeric) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, text, numeric) to service_role;

-- ---------- Row Level Security ----------
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.coupons enable row level security;
alter table public.custom_enquiries enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

create policy "admins see own row" on public.admin_users for select using (user_id = auth.uid());

create policy "public read active categories" on public.categories for select using (is_active or public.is_admin());
create policy "admin manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active products" on public.products for select using (status = 'active' or public.is_admin());
create policy "admin manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "public read images of active products" on public.product_images for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "admin manage product images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

create policy "customer reads own profile" on public.customers for select using (user_id = auth.uid() or public.is_admin());
create policy "customer updates own profile" on public.customers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin manage customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manage coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

create policy "user reads own enquiries" on public.custom_enquiries for select using (user_id = auth.uid() or public.is_admin());
create policy "admin manage enquiries" on public.custom_enquiries for all using (public.is_admin()) with check (public.is_admin());

create policy "user reads own orders" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "admin update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "admin delete orders" on public.orders for delete using (public.is_admin());

create policy "user reads own order items" on public.order_items for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "admin manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

create policy "public read settings" on public.store_settings for select using (true);
create policy "admin update settings" on public.store_settings for update using (public.is_admin()) with check (public.is_admin());

-- Admin should not be able to forge payment state via the API: block payment column edits for non-service roles
create or replace function public.protect_payment_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres', 'supabase_admin') then
    if new.payment_status is distinct from old.payment_status
       or new.paid_amount is distinct from old.paid_amount
       or new.cf_payment_id is distinct from old.cf_payment_id
       or new.cashfree_order_id is distinct from old.cashfree_order_id
       or new.paid_at is distinct from old.paid_at
       or new.subtotal is distinct from old.subtotal
       or new.discount is distinct from old.discount
       or new.shipping_fee is distinct from old.shipping_fee
       or new.total is distinct from old.total then
      raise exception 'payment fields can only be changed by verified payment processing';
    end if;
    if new.payment_status <> 'paid' and new.status not in ('pending', 'cancelled') then
      raise exception 'unpaid orders can only be pending or cancelled';
    end if;
  end if;
  return new;
end $$;
create trigger orders_protect_payment before update on public.orders
  for each row execute function public.protect_payment_columns();

-- ---------- Storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

create policy "public read store images" on storage.objects for select
  using (bucket_id in ('product-images','branding'));
create policy "admin upload store images" on storage.objects for insert
  with check (bucket_id in ('product-images','branding') and public.is_admin());
create policy "admin update store images" on storage.objects for update
  using (bucket_id in ('product-images','branding') and public.is_admin());
create policy "admin delete store images" on storage.objects for delete
  using (bucket_id in ('product-images','branding') and public.is_admin());

-- ---------- admin: cancel order with optional restock ----------
create or replace function public.admin_cancel_order(p_order_id uuid, p_reason text, p_restock boolean)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if o.status = 'cancelled' then return; end if;
  if p_restock and o.payment_status = 'paid' then
    update public.products p set stock = p.stock + oi.qty
      from (select product_id, sum(quantity) qty from public.order_items where order_id = o.id and product_id is not null group by product_id) oi
      where p.id = oi.product_id;
  end if;
  update public.orders set status = 'cancelled', cancel_reason = nullif(trim(p_reason), '') where id = o.id;
end $$;
revoke all on function public.admin_cancel_order(uuid, text, boolean) from public, anon;
grant execute on function public.admin_cancel_order(uuid, text, boolean) to authenticated;
