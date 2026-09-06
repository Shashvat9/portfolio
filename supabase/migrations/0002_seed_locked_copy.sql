-- Seed locked copy from docs/design-system.md "Locked Copy Reference" so the
-- public site isn't empty on first load. All text is verbatim from that section.

insert into public.site_content (id, hero_hook, synthesis_line, footer_email, footer_linkedin, resume_file_path)
values (
  1,
  'Some people finish projects. I build things that don''t need me to.',
  'Different domains, same bet — build systems that outlive the problem, not the person building them.',
  '',
  '',
  null
)
on conflict (id) do update set
  hero_hook = excluded.hero_hook,
  synthesis_line = excluded.synthesis_line;

-- 01 · Wayfinding Device (DP) — work-entry variant (no role/team given in the
-- locked copy; the metadata row is simply omitted when both are empty)
with p as (
  insert into public.projects (order_index, eyebrow, title, body, variant, role, team)
  values (
    0,
    '01 · ACCESSIBILITY / IoT',
    'Wayfinding Device',
    E'Started with one belief: a blind person shouldn''t need a companion to move through the world. V1 ran on GPS/GSM and taught me web dev, Android, and backend from scratch — but it needed constant connectivity and had no intelligence. V3 rebuilt everything: Raspberry Pi 5, camera-based object detection, haptic feedback, and offline-first communication — no internet required, zero-downtime Kafka notifications on AWS.\n\nV4 (in progress): turn-by-turn navigation, scene description, OCR, and fall detection.',
    'work',
    null,
    null
  )
  returning id
)
insert into public.project_tags (project_id, tag_text, order_index)
select id, tag, ord
from p, (values
  ('Raspberry Pi 5', 0),
  ('Computer Vision', 1),
  ('Haptics', 2),
  ('Kafka', 3),
  ('AWS', 4)
) as t(tag, ord);

with p as (select id from public.projects where title = 'Wayfinding Device')
insert into public.project_versions (project_id, label, sublabel, description, status, order_index)
select id, label, sublabel, description, status, ord
from p, (values
  ('V1 · 2019', 'breadboard prototype', 'Proof of concept.', 'complete', 0),
  ('V2 · 2021', 'enclosed unit', 'Custom PCB, field trials.', 'complete', 1),
  ('V3 · 2025', 'production unit', 'Certified for distribution.', 'complete', 2),
  ('V4 · IN PROGRESS', 'next-gen concept', 'Exploring wearable form factor.', 'in_progress', 3)
) as v(label, sublabel, description, status, ord);

-- 02 · Aerial Object Detection (Sky-Sentinel) — research-entry variant
with p as (
  insert into public.projects (order_index, eyebrow, title, body, variant, citation)
  values (
    1,
    '02 · RESEARCH / COMPUTER VISION',
    'Aerial Object Detection',
    'Aerial object detection struggles with tiny objects, occlusion, and crowded scenes. We ensembled YOLOv8x and YOLOv8m using Weighted Boxes Fusion, tested on the VisDrone dataset — the combined model hit 0.45 mAP@0.5, beating either detector alone (0.431 / 0.400), balancing accuracy against real-time UAV constraints.',
    'research',
    'M. J. Patel, S. G. Rajyaguru, et al., "Boosting Object Detection in Aerial Imagery with Ensemble YOLOv8 Models and Weighted Boxes Fusion," Proc. 9th Int. Conf. I-SMAC, 2025, pp. 237–244.'
  )
  returning id
)
insert into public.project_tags (project_id, tag_text, order_index)
select id, tag, ord
from p, (values
  ('YOLOv8', 0),
  ('PyTorch', 1),
  ('Computer Vision', 2)
) as t(tag, ord);

-- 03 · Payments Infrastructure (Payson) — work-entry variant
with p as (
  insert into public.projects (order_index, eyebrow, title, body, variant, role, team)
  values (
    2,
    '03 · FINTECH',
    'Payments Infrastructure',
    'Backend engineer on a financial-crime compliance platform — multi-module Java/Spring Boot, Nuxt frontend, MSSQL at scale. Work spans authentication flows, load-testing infrastructure, and production debugging across a system built for regulated data.',
    'work',
    'Backend',
    '6 eng.'
  )
  returning id
)
insert into public.project_tags (project_id, tag_text, order_index)
select id, tag, ord
from p, (values
  ('Java', 0),
  ('Spring Boot', 1),
  ('Nuxt', 2),
  ('MSSQL', 3)
) as t(tag, ord);

-- 04 · Autonomous Reasoning Agent (Samvit) — work-entry variant (no role/team
-- given; not a published-paper research entry, so 'research'/citation doesn't
-- fit either — metadata row is simply omitted when both are empty)
with p as (
  insert into public.projects (order_index, eyebrow, title, body, variant, role, team)
  values (
    3,
    '04 · AI · SIDE PROJECT',
    'Autonomous Reasoning Agent',
    'Not trying to build the most powerful AI — trying to build one people talk to like a friend. A system with its own memory, that decides what to keep and what to let go. Currently simulating neurochemical responses and running a default-mode-network model that lets it wander, overthink, and follow its own line of thought.',
    'work',
    null,
    null
  )
  returning id
)
insert into public.project_tags (project_id, tag_text, order_index)
select id, tag, ord
from p, (values
  ('Python', 0),
  ('LLM Architecture', 1),
  ('Memory Systems', 2)
) as t(tag, ord);
