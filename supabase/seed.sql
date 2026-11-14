-- Base categories (no products: the catalogue is managed from the admin dashboard)
insert into public.categories (name, slug, description, sort_order) values
  ('Girls Collection', 'girls', 'Cute, dreamy hampers made for her.', 1),
  ('Boys Collection', 'boys', 'Cool, fun hampers made for him.', 2)
on conflict (slug) do nothing;

insert into public.categories (name, slug, description, parent_id, sort_order)
select v.name, v.slug, v.description, (select id from public.categories where slug = 'girls'), v.sort_order
from (values
  ('Pink Princess Box', 'pink-princess-box', 'All things pink, sparkly and princess-worthy.', 3),
  ('Study Girl Box', 'study-girl-box', 'Aesthetic stationery and desk goodies for the study queen.', 4),
  ('Self Care Box', 'self-care-box', 'Pamper essentials for a cosy me-time.', 5),
  ('Bestie Forever Box', 'bestie-forever-box', 'Celebrate your forever person.', 6)
) as v(name, slug, description, sort_order)
on conflict (slug) do nothing;
