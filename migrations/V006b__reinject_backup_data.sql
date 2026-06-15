-- V006b — Réinjection données backup (3 tenants + 5 immeubles + 82 locataires + 15 users)
-- À coller dans : https://supabase.com/dashboard/project/uggxfmwpttfsfcirmeqx/sql/new

-- ── Tenants ──────────────────────────────────────────────────
INSERT INTO tenants (id, nom, telephone, password_hash, nom_cabinet, mode, plan, plan_expire, promo_code, pays, features, created_at) VALUES
('2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','LONTSI TIWA Eric R','676528917','8237a8d86b7038877840cd600b135f4edc8966be05cf3ba12727535f2670c058','RCAA','entreprise','gratuit',NULL,NULL,'CM','{"ia":true,"legalos":false,"marketplace":true}','2026-06-12 21:30:42.356907+00'),
('962df886-7628-41be-8a67-8716a4f1a4fe','Me Tiwa','693530685','f48aaf3634afe8c52abb9a74dd8bc9f29630e4468dd1b6287ff8b1d67efc391e','RCAA','entreprise','gratuit',NULL,NULL,'CM','{"ia":true,"legalos":false,"marketplace":true}','2026-06-14 19:08:59.910542+00'),
('189a7d14-4b46-4e15-a79c-998b5e17d3c2','Maitre','690409929','f48aaf3634afe8c52abb9a74dd8bc9f29630e4468dd1b6287ff8b1d67efc391e','Mon Cabinet','entreprise','gratuit',NULL,NULL,'CM','{"ia":true,"legalos":false,"marketplace":true}','2026-06-14 19:13:37.517181+00')
ON CONFLICT (id) DO NOTHING;

-- ── Immeubles ────────────────────────────────────────────────
INSERT INTO immeubles (id, tenant_id, nom_immeuble, nom, nom_proprio, tel_proprio, ville, quartier, pays, apparts, studios, chambres, duplex, couleur, pay_config, bailleur_id, created_at) VALUES
(1,'189a7d14-4b46-4e15-a79c-998b5e17d3c2','TIWA Herve Francis','TIWA Herve Francis','','','Douala','Fin Goudron Mbangue','CM',16,0,0,0,'#4f8ef7',NULL,NULL,'2026-05-17 21:00:32.413784+00'),
(2,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','MANFOUO Epse MELI Florence','MANFOUO Epse MELI Florence','MANFOUO Epse MELI Florence','','Yaoundé','Ekie','CM',2,6,0,0,'#2ecc8a',NULL,NULL,'2026-05-17 21:00:32.413784+00'),
(3,'189a7d14-4b46-4e15-a79c-998b5e17d3c2','Ibrahim','Ibrahim','','','Oyom Abang','','CM',8,4,0,0,'#f25c5c',NULL,NULL,'2026-05-17 21:00:32.413784+00'),
(4,'189a7d14-4b46-4e15-a79c-998b5e17d3c2','TEUKEU MAFOUO Fabrice Diclo','TEUKEU MAFOUO Fabrice Diclo','','','Douala','Makepe','CM',13,19,0,0,'#f06292',NULL,NULL,'2026-05-17 21:00:32.413784+00'),
(5,'189a7d14-4b46-4e15-a79c-998b5e17d3c2','TASSIE Bernard','TASSIE Bernard','','','Mendong','Maison Damase','CM',3,3,0,0,'#a78bfa',NULL,NULL,'2026-05-17 21:00:32.413784+00')
ON CONFLICT (id) DO NOTHING;

-- Réinitialiser la séquence BIGSERIAL après insertion avec IDs fixes
SELECT setval('immeubles_id_seq', (SELECT MAX(id) FROM immeubles));
