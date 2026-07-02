-- V006b — Réinjection données backup (3 tenants + 5 immeubles + 82 locataires + 15 users)
-- À coller dans : https://supabase.com/dashboard/project/uggxfmwpttfsfcirmeqx/sql/new

-- ── Tenants ──────────────────────────────────────────────────
INSERT INTO tenants (id, nom, telephone, password_hash, nom_cabinet, mode, plan, plan_expire, promo_code, pays, features, created_at) VALUES
('2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','LONTSI TIWA Eric R','676528917','REDACTED_PASSWORD_HASH','RCAA','entreprise','gratuit',NULL,NULL,'CM','{"ia":true,"legalos":false,"marketplace":true}','2026-06-12 21:30:42.356907+00'),
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


-- ── Locataires (82) ────────────────────────────────────────
INSERT INTO locataires (id,tenant_id,immeuble_id,nom,telephone,whatsapp,appt,type_local,loyer,caution,entree,statut,statut_juridique,jour_paiement,observations,score_locataire,tags,created_at) VALUES
(301,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'CHIACHIA TCHEUFFA','675687544',NULL,'101','appartement',60000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(302,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'(Libre)',NULL,NULL,'102','appartement',50000,0,NULL,'libre','normal',1,'Libre',100,'[]','2026-05-18 04:01:09.251145+00'),
(303,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'FOUELEFACK Micheline','696719100',NULL,'103','appartement',50000,0,NULL,'impayé','normal',1,'Doit 4 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(304,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'KWIDJEU YANGA DANA','650317449',NULL,'105','appartement',60000,0,NULL,'payé','normal',1,'Solde 3 000F',100,'[]','2026-05-18 04:01:09.251145+00'),
(305,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'HJIKI WANDJA','677395254',NULL,'106','appartement',50000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(306,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'MOTAP ZOUNKANENI','698840345',NULL,'201','appartement',70000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(307,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'MBIA SONDI Hermine','691229956',NULL,'202','appartement',70000,0,NULL,'impayé','normal',1,'Doit 6 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(308,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'TOUMBA Bruno','677382794',NULL,'203','appartement',70000,0,NULL,'impayé','normal',1,'Doit 5 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(309,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'NJUNDIYIMUN PARE Salihou','695322910',NULL,'204','appartement',60000,0,NULL,'impayé','normal',1,'Doit 2 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(310,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'ANABA Marie Brigitte','690622795',NULL,'205','appartement',70000,0,NULL,'impayé','normal',1,'Doit mars',100,'[]','2026-05-18 04:01:09.251145+00'),
(311,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'(Libre)',NULL,NULL,'206','appartement',60000,0,NULL,'libre','normal',1,'Libre',100,'[]','2026-05-18 04:01:09.251145+00'),
(312,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'YEN DIKOTTO Dorette','691351892',NULL,'301','appartement',70000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(313,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'ASSEINTELOCK Romial','652145476',NULL,'303','appartement',60000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(314,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'FONGUE MASSANGO Catherine','697572748',NULL,'304','appartement',70000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(315,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'KAMGA Joselin','690133446',NULL,'305','appartement',70000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(316,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',1,'NGUBEA NCHUBE','675352706',NULL,'306','appartement',60000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(317,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'KUETE Jean','657838623',NULL,NULL,'appartement',50000,0,NULL,'impayé','normal',1,'Doit 8 mois',100,'[]','2026-06-14 18:47:53.396318+00'),
(318,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'EBOULE EWANE Daniel Éric','692865648',NULL,NULL,'appartement',60000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-06-14 18:47:53.402612+00'),
(319,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'EFFA SEME','697065191',NULL,'S1','studio',50000,0,'2023-09-01','impayé','normal',1,NULL,100,'[]','2026-05-18 04:01:09.251145+00'),
(320,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'KEMADJOU ENONGBONG','677329832',NULL,'S2','studio',50000,0,'2023-01-01','impayé','normal',1,NULL,100,'[]','2026-05-18 04:01:09.251145+00'),
(321,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'NGATABACK Martine Sylvie',NULL,NULL,'S5','appartement',50000,0,'2025-07-01','payé','normal',1,NULL,100,'[]','2026-05-18 04:01:09.251145+00'),
(322,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'OBAME Fabrice','658251574',NULL,'A1','appartement',80000,0,'2023-12-01','payé','normal',1,NULL,100,'[]','2026-05-18 04:01:09.251145+00'),
(323,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'AFANA TINA METEH Edith C',NULL,NULL,'S6','studio',60000,0,'2025-07-01','payé','normal',1,NULL,100,'[]','2026-05-18 04:01:09.251145+00'),
(324,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'BINDZI EVOUNA Thomas','694377732',NULL,'A1','appartement',80000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(325,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'BISSA MPELE Epse NKOTO',NULL,NULL,'A2','appartement',80000,160000,'2026-05-07','payé','normal',1,'Entrée 07/05 · 4 mois payés · Caution 160 000',100,'[]','2026-05-18 04:01:09.251145+00'),
(326,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'NTOCKO TONGO SONJEY P.L.','677435071',NULL,'A3','appartement',80000,0,NULL,'impayé','normal',1,'Doit mai',100,'[]','2026-05-18 04:01:09.251145+00'),
(327,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'MEBADA ADA Nina Carine','694690646',NULL,'A4','appartement',80000,0,NULL,'impayé','normal',1,'Doit mai',100,'[]','2026-05-18 04:01:09.251145+00'),
(328,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'NGO YOCK Elisabeth','698414312',NULL,'A5','appartement',80000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(329,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'PEVEINI MASSOMA','696372579',NULL,'A6','appartement',80000,0,NULL,'impayé','normal',1,'Doit mai',100,'[]','2026-05-18 04:01:09.251145+00'),
(330,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'(Libre)',NULL,NULL,'A7','appartement',80000,0,NULL,'libre','normal',1,'Libre',100,'[]','2026-05-18 04:01:09.251145+00'),
(331,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'ESSOLA EKANI Sandrine','655712842',NULL,'A8','appartement',75000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(332,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'MOLA YOUBI Gilles Stève','670881038',NULL,'S1','studio',50000,0,NULL,'impayé','normal',1,'Doit avr & mai',100,'[]','2026-05-18 04:01:09.251145+00'),
(333,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'EDOA EDOA Jean Martin','653255076',NULL,'S2','studio',50000,0,NULL,'impayé','normal',1,'Doit mai',100,'[]','2026-05-18 04:01:09.251145+00'),
(334,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'NTOCKO TONGO SONJEY P.L.','696897847',NULL,'S3','studio',50000,0,NULL,'impayé','normal',1,'Doit mai',100,'[]','2026-05-18 04:01:09.251145+00'),
(335,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',3,'FONLIA Rita','696524174',NULL,'S4','studio',50000,0,NULL,'impayé','normal',1,'Doit mai',100,'[]','2026-05-18 04:01:09.251145+00'),
(336,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'NITCHEU BOUENDEU Anne','694896591',NULL,'1A','appartement',210000,0,NULL,'impayé','normal',1,'Doit 7 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(337,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'YITAMBE DJIAGUE Alex','695543303',NULL,'A1B','appartement',130000,0,NULL,'impayé','normal',1,'Aucune nouvelle',100,'[]','2026-05-18 04:01:09.251145+00'),
(338,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'(Libre)',NULL,NULL,'S1C','studio',120000,0,NULL,'libre','normal',1,'Libre',100,'[]','2026-05-18 04:01:09.251145+00'),
(339,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'FONTEM Vanessa MAFANG','678909400',NULL,'A1D','appartement',230000,0,NULL,'impayé','normal',1,'À expulser',100,'[]','2026-05-18 04:01:09.251145+00'),
(340,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'KALLA MANGA Estelle','695806877',NULL,'S1E','studio',90000,0,NULL,'impayé','normal',1,'Doit mars',100,'[]','2026-05-18 04:01:09.251145+00'),
(341,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'ESSOLA NGUIDJOL Pierre','656314629',NULL,'A2A','appartement',230000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(342,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'EBOKO SOLEINI Tiphanie','699947941',NULL,'S2B','studio',120000,0,NULL,'impayé','normal',1,'Doit fév & mars',100,'[]','2026-05-18 04:01:09.251145+00'),
(343,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'NDONPOUOWOUO NJIKAM F.','657603363',NULL,'S3E','studio',90000,0,NULL,'payé','normal',1,'À jour août 2026',100,'[]','2026-05-18 04:01:09.251145+00'),
(344,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'FENG Gisèle Claire','682828111',NULL,'S2C','studio',100000,0,NULL,'payé','normal',1,'À jour déc 2026',100,'[]','2026-05-18 04:01:09.251145+00'),
(345,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'JOSHUA SAMBE NDUMBE','678337522',NULL,'A2D','appartement',200000,0,NULL,'impayé','normal',1,'Doit 6 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(346,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'AZEMKOUO NGUEMO Marius',NULL,NULL,'S2E','studio',90000,0,NULL,'payé','normal',1,'À jour août 2026',100,'[]','2026-05-18 04:01:09.251145+00'),
(347,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'MBENG MANCHUNG Precious','679159041',NULL,'A3A','appartement',220000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(348,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'(Libre)',NULL,NULL,'S3B','studio',130000,0,NULL,'libre','normal',1,'Libre',100,'[]','2026-05-18 04:01:09.251145+00'),
(349,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'NJINJOH SIDDEEGAH Darla',NULL,NULL,'S3C','studio',120000,0,NULL,'payé','normal',1,'À jour août 2026',100,'[]','2026-05-18 04:01:09.251145+00'),
(350,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'HAPPY Jacques Hadrien','696889905',NULL,'A3D','appartement',220000,0,NULL,'impayé','normal',1,'Doit 6 mois+100k',100,'[]','2026-05-18 04:01:09.251145+00'),
(351,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'(Libre)',NULL,NULL,'A4A','appartement',200000,0,NULL,'libre','normal',1,'Libre',100,'[]','2026-05-18 04:01:09.251145+00'),
(352,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'KWEDI SAKE Agnès','697438357',NULL,'S4B','studio',130000,0,NULL,'impayé','normal',1,'Doit 2 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(353,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'FAYSAL MOUNIR',NULL,NULL,'S4C','studio',110000,0,NULL,'payé','normal',1,'À jour nov 2026',100,'[]','2026-05-18 04:01:09.251145+00'),
(354,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'BEKOLO WINNIE','650835106',NULL,'A4D','appartement',200000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(355,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'ENGOME MBAPPE Agnès C.','694265234',NULL,'S4E','studio',90000,0,NULL,'impayé','normal',1,'Doit mars',100,'[]','2026-05-18 04:01:09.251145+00'),
(356,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'AWA Cedric NDIFOR','676099137',NULL,'A5A','appartement',200000,0,NULL,'impayé','normal',1,'Doit 4 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(357,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'NGO MDJEBET Ange Gaelle','656572076',NULL,'S5B','studio',120000,0,NULL,'impayé','normal',1,'Doit 2 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(358,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'Romario FANWONG','683219653',NULL,'S5E','studio',95000,0,NULL,'impayé','normal',1,'Doit 4 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(359,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'TENENG Darel GHANG','678928793',NULL,'A6A','appartement',200000,0,NULL,'impayé','normal',1,'Doit fév & mars',100,'[]','2026-05-18 04:01:09.251145+00'),
(360,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'MANUELA MBEDY','698165922',NULL,'S6B','studio',125000,0,NULL,'impayé','normal',1,'Doit 2 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(361,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'ZEM Cendrine','698839902',NULL,'S6E','studio',100000,0,NULL,'impayé','normal',1,'Doit 3 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(362,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'KUMA MATE Michel Fabiola','672885444',NULL,'AR1','appartement',220000,0,NULL,'payé','normal',1,'À jour',100,'[]','2026-05-18 04:01:09.251145+00'),
(363,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'MKPA EBODE Ludovic','696228640',NULL,'SR2','studio',100000,0,NULL,'impayé','normal',1,'Doit 4 mois',100,'[]','2026-05-18 04:01:09.251145+00'),
(364,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'BAYERE Nelly ENJOH','676613261',NULL,'R3','autre',50000,0,NULL,'impayé','normal',1,'Doit mars',100,'[]','2026-05-18 04:01:09.251145+00'),
(365,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'NGEH Eric LANDJI',NULL,NULL,'SR4','studio',100000,0,NULL,'payé','normal',1,'À jour sept 2026',100,'[]','2026-05-18 04:01:09.251145+00'),
(366,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'(Libre)',NULL,NULL,'SR5','studio',110000,0,NULL,'libre','normal',1,'Libre',100,'[]','2026-05-18 04:01:09.251145+00'),
(367,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'NGUEMFOUO SONKWA G.',NULL,NULL,'S5C','studio',130000,0,NULL,'payé','normal',1,'Solde partiel',100,'[]','2026-05-18 04:01:09.251145+00'),
(368,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',4,'AGBOR AGBOR Boris','698503856',NULL,'A5D','appartement',210000,0,NULL,'payé','normal',1,'À jour juillet',100,'[]','2026-05-18 04:01:09.251145+00'),
(369,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',5,'DJEM LISSOM Patrice','672778666',NULL,'A1','appartement',50000,0,NULL,'impayé','normal',1,'Doit 8 mois – Pas pris',100,'[]','2026-05-18 04:01:09.251145+00'),
(370,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',5,'Mme ANGE','650672911',NULL,'A2','appartement',55000,0,NULL,'impayé','normal',1,'Doit 6 mois – Va passer lundi 10h-11h',100,'[]','2026-05-18 04:01:09.251145+00'),
(371,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',5,'BIYAG ALEX Maximilien','696378623',NULL,'A3','appartement',55000,0,NULL,'impayé','normal',1,'Doit 11 mois – Injoignable',100,'[]','2026-05-18 04:01:09.251145+00'),
(372,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',5,'OBOGWU Mommy','677631869',NULL,'S1','studio',35000,0,NULL,'impayé','normal',1,'Doit 8 mois – Attend la descente',100,'[]','2026-05-18 04:01:09.251145+00'),
(373,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',5,'TSAGUE NGUIMDO Rodrigue Armand','690246909',NULL,'S2','studio',35000,0,NULL,'impayé','normal',1,'Doit 3 mois – Attend la descente',100,'[]','2026-05-18 04:01:09.251145+00'),
(374,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',5,'BOUICHOANG TCHATO Alexandra Armelle','698521741',NULL,'S3','studio',35000,0,NULL,'impayé','normal',1,'Doit 6 mois – Attend la descente',100,'[]','2026-05-18 04:01:09.251145+00'),
(379,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'KUETE JEAN','698216941',NULL,'S3','studio',50000,0,'2024-05-01','impayé','normal',1,NULL,100,'[]','2026-06-14 09:21:22.393925+00'),
(380,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'EBOULE EWANE Daniel Eric','692865648',NULL,'S4','studio',60000,0,'2024-08-01','impayé','normal',1,NULL,100,'[]','2026-06-14 09:29:00.198818+00'),
(381,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'(Libre)',NULL,NULL,'S5','studio',0,0,NULL,'libre','normal',1,NULL,100,'[]','2026-06-14 09:26:48.6855+00'),
(382,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'(Libre)',NULL,NULL,'A1','appartement',0,0,NULL,'libre','normal',1,NULL,100,'[]','2026-06-14 09:50:03.309195+00'),
(383,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'(Libre)',NULL,NULL,'A2','appartement',0,0,NULL,'libre','normal',1,NULL,100,'[]','2026-06-14 09:50:03.35088+00'),
(384,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'(Libre)',NULL,NULL,'S1','studio',0,0,NULL,'libre','normal',1,NULL,100,'[]','2026-06-14 09:50:03.34617+00'),
(385,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'(Libre)',NULL,NULL,'S2','studio',0,0,NULL,'libre','normal',1,NULL,100,'[]','2026-06-14 09:50:03.358994+00'),
(386,'2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d',2,'(Libre)',NULL,NULL,'S5','studio',0,0,NULL,'libre','normal',1,NULL,100,'[]','2026-06-14 17:32:18.030072+00')
ON CONFLICT (id) DO NOTHING;
SELECT setval('locataires_id_seq', (SELECT MAX(id) FROM locataires));


-- ── Users app (15) ─────────────────────────────────────────
INSERT INTO users_app (id,tenant_id,role,nom,telephone,password,pin,immeubles,locataire_id,actif,created_at) VALUES
('ind1','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','admin','Administrateur',NULL,'REDACTED_PASSWORD_HASH',NULL,'[]',NULL,true,'2026-06-04 16:04:52.129878+00'),
('adm1','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','admin','Administrateur',NULL,'b8b8eb83374c0bf3b1c3224159f6119dbfff1b7ed6dfecdd80d4e8a895790a34',NULL,'[]',NULL,true,'2026-06-04 16:04:52.129878+00'),
('pro1','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','proprietaire','TIWA Herve Francis',NULL,'tiwa2024',NULL,'1',NULL,true,'2026-06-04 16:04:52.129878+00'),
('pro2','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','proprietaire','Ibrahim',NULL,'ibra2024',NULL,'2',NULL,false,'2026-06-04 16:04:52.129878+00'),
('loc1','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','BINDZI EVOUNA Thomas',NULL,NULL,'1234','2',17,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_392_1780483796289','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','EFFA Miryam Christelle',NULL,NULL,'0000','[]',399,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_393_1780484330121','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','EBOUTOU EBOUTOU Lydie',NULL,NULL,'0000','[]',393,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_394_1780484721716','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','TCHIMMOGNE FODJE',NULL,NULL,'0000','[]',394,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_395_1780487113637','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','TENGIM ALOYSIUS MELAH',NULL,NULL,'0000','[]',401,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_396_1780487311016','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','KOUNA GAELLE GEORGIE',NULL,NULL,'0000','[]',396,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_397_1780487450277','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','EKOGO CHARLES',NULL,NULL,'0000','[]',397,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_375_1780487601033','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','KALBASSOU ALBERT',NULL,NULL,'0000','[]',402,false,'2026-06-04 16:04:52.129878+00'),
('loc_auto_376_1780487743983','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','EBOT EPSE AGNES AYAMBA',NULL,NULL,'0000','[]',376,true,'2026-06-04 16:04:52.129878+00'),
('loc_auto_379_1781428875737','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','KUETE JEAN',NULL,NULL,'6941','[]',379,false,'2026-06-14 09:21:16.013369+00'),
('loc_auto_380_1781429331686','2f7b8d39-ee4e-40b6-83e7-ebb3c3030d2d','locataire','EBOULE EWANE Daniel Eric',NULL,NULL,'5648','[]',380,false,'2026-06-14 09:28:51.780535+00')
ON CONFLICT (id) DO NOTHING;
