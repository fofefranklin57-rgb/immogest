// ============================================================
// DATA LAYER
// ============================================================
const STORE_KEY = 'immogest_v12';
const STORE_KEY_IND = 'immogest_individuel_v1'; // Données séparées pour mode individuel
const SEUIL_MOIS_ALERTE = 2; // Générer documents auto à partir de 2 mois d'arriérés

function getNbMoisArrieres(l) {
  if (!l || l.loyer <= 0) return 0;
  // Returns decimal value e.g. 0.5 for half month
  return Math.max(0, l.reste) / l.loyer;
}
function getNbMoisArrieresFmt(l) {
  const m = getNbMoisArrieres(l);
  if (m === 0) return '0';
  if (Number.isInteger(m)) return m.toString();
  return m.toFixed(1);
}
function getNbMoisAvance(l) {
  if (!l || l.loyer <= 0 || l.reste >= 0) return 0;
  return Math.floor(Math.abs(l.reste) / l.loyer);
}

function locataireEnAlerte(l) {
  return l.s === 'impayé' && getNbMoisArrieres(l) >= SEUIL_MOIS_ALERTE;
}

function getAlertes() {
  return DATA.locataires.filter(l => locataireEnAlerte(l));
}
const DEFAULT_DATA = {
  immeubles: [
    {id:0,nom:'TIWA Herve Francis',         ville:'Douala',   quartier:'Fin Goudron Mbangue',col:'#4f8ef7', apparts:16,studios:0,chambres:0},
    {id:1,nom:'MANFOUO Epse MELI Florence', ville:'Yaoundé',  quartier:'Ekie',               col:'#2ecc8a', apparts:7, studios:0,chambres:0},
    {id:2,nom:'Ibrahim',                     ville:'Oyom Abang',quartier:'',                  col:'#f25c5c', apparts:12,studios:0,chambres:0},
    {id:3,nom:'TEUKEU MAFOUO Fabrice Diclo',ville:'Douala',   quartier:'Makepe',             col:'#f06292', apparts:33,studios:0,chambres:0},
    {id:4,nom:'Dr Bernard',                  ville:'Mendong',  quartier:'Maison Damase',      col:'#a78bfa', apparts:6, studios:0,chambres:0},
  ],
  locataires: [
    // TIWA
    {id:1, nom:'CHIACHIA TCHEUFFA',         tel:'675687544', iid:0,appt:'101',type:'appartement',loyer:60000, reste:180000,obs:'Doit 3 mois',s:'impayé',caution:0,entree:''},
    {id:2, nom:'(Libre)',                    tel:'',          iid:0,appt:'102',type:'appartement',loyer:50000, reste:0,     obs:'Libre',     s:'libre',  caution:0,entree:''},
    {id:3, nom:'FOUELEFACK Micheline',       tel:'696719100', iid:0,appt:'103',type:'appartement',loyer:50000, reste:200000,obs:'Doit 4 mois',s:'impayé',caution:0,entree:''},
    {id:4, nom:'KWIDJEU YANGA DANA',         tel:'650317449', iid:0,appt:'105',type:'appartement',loyer:60000, reste:3000,  obs:'Solde 3 000F',s:'impayé',caution:0,entree:''},
    {id:5, nom:'HJIKI WANDJA',               tel:'677395254', iid:0,appt:'106',type:'appartement',loyer:50000, reste:0,     obs:'À jour',    s:'payé',   caution:0,entree:''},
    {id:6, nom:'MOTAP ZOUNKANENI',           tel:'698840345', iid:0,appt:'201',type:'appartement',loyer:70000, reste:210000,obs:'Doit 3 mois',s:'impayé',caution:0,entree:''},
    {id:7, nom:'MBIA SONDI Hermine',         tel:'691229956', iid:0,appt:'202',type:'appartement',loyer:70000, reste:420000,obs:'Doit 6 mois',s:'impayé',caution:0,entree:''},
    {id:8, nom:'TOUMBA Bruno',               tel:'677382794', iid:0,appt:'203',type:'appartement',loyer:70000, reste:350000,obs:'Doit 5 mois',s:'impayé',caution:0,entree:''},
    {id:9, nom:'NJUNDIYIMUN PARE Salihou',   tel:'695322910', iid:0,appt:'204',type:'appartement',loyer:60000, reste:120000,obs:'Doit 2 mois',s:'impayé',caution:0,entree:''},
    {id:10,nom:'ANABA Marie Brigitte',       tel:'690622795', iid:0,appt:'205',type:'appartement',loyer:70000, reste:70000, obs:'Doit mars',  s:'impayé',caution:0,entree:''},
    {id:11,nom:'(Libre)',                    tel:'',          iid:0,appt:'206',type:'appartement',loyer:60000, reste:0,     obs:'Libre',     s:'libre',  caution:0,entree:''},
    {id:12,nom:'YEN DIKOTTO Dorette',        tel:'691351892', iid:0,appt:'301',type:'appartement',loyer:70000, reste:210000,obs:'Doit 3 mois',s:'impayé',caution:0,entree:''},
    {id:13,nom:'ASSEINTELOCK Romial',        tel:'652145476', iid:0,appt:'303',type:'appartement',loyer:60000, reste:180000,obs:'Doit 3 mois',s:'impayé',caution:0,entree:''},
    {id:14,nom:'FONGUE MASSANGO Catherine',  tel:'697572748', iid:0,appt:'304',type:'appartement',loyer:70000, reste:0,     obs:'À jour',    s:'payé',   caution:0,entree:''},
    {id:15,nom:'KAMGA Joselin',              tel:'690133446', iid:0,appt:'305',type:'appartement',loyer:70000, reste:210000,obs:'Doit 3 mois',s:'impayé',caution:0,entree:''},
    {id:16,nom:'NGUBEA NCHUBE',              tel:'675352706', iid:0,appt:'306',type:'appartement',loyer:60000, reste:180000,obs:'Doit 3 mois',s:'impayé',caution:0,entree:''},
    // MANFOUO
    {id:60,nom:'KUETE Jean',                 tel:'657838623', iid:1,appt:'',type:'appartement',loyer:50000, reste:400000,obs:'Doit 8 mois',s:'impayé',caution:0,entree:''},
    {id:61,nom:'EBOULE EWANE Daniel Éric',   tel:'692865648', iid:1,appt:'',type:'appartement',loyer:60000, reste:0,     obs:'À jour',    s:'payé',   caution:0,entree:''},
    {id:62,nom:'EFFA SEME',                  tel:'697065191', iid:1,appt:'',type:'appartement',loyer:50000, reste:200000,obs:'Doit 4 mois',s:'impayé',caution:0,entree:''},
    {id:63,nom:'KEMADJOU ENONGBONG',         tel:'677329832', iid:1,appt:'',type:'appartement',loyer:50000, reste:200000,obs:'Doit 4 mois',s:'impayé',caution:0,entree:''},
    {id:64,nom:'NGATABACK Martine Sylvie',   tel:'',          iid:1,appt:'',type:'appartement',loyer:50000, reste:0,     obs:'À jour',    s:'payé',   caution:0,entree:''},
    {id:65,nom:'OBAME Fabrice',              tel:'658251574', iid:1,appt:'',type:'appartement',loyer:80000, reste:0,     obs:'À jour',    s:'payé',   caution:0,entree:''},
    {id:66,nom:'AFANA TINA METEH Edith C',  tel:'',          iid:1,appt:'',type:'appartement',loyer:60000, reste:0,     obs:'À jour',    s:'payé',   caution:0,entree:''},
    // IBRAHIM
    {id:17, nom:'BINDZI EVOUNA Thomas',      tel:'694377732', iid:2,appt:'A1',type:'appartement',loyer:80000, reste:0,     obs:'À jour',                              s:'payé',  caution:0,entree:''},
    {id:101,nom:'BISSA MPELE Epse NKOTO',    tel:'',          iid:2,appt:'A2',type:'appartement',loyer:80000, reste:0,     obs:'Entrée 07/05 · 4 mois payés · Caution 160 000',s:'payé',caution:160000,entree:'2026-05-07'},
    {id:25, nom:'NTOCKO TONGO SONJEY P.L.',  tel:'677435071', iid:2,appt:'A3',type:'appartement',loyer:80000, reste:80000, obs:'Doit mai',                            s:'impayé',caution:0,entree:''},
    {id:21, nom:'MEBADA ADA Nina Carine',    tel:'694690646', iid:2,appt:'A4',type:'appartement',loyer:80000, reste:80000, obs:'Doit mai',                            s:'impayé',caution:0,entree:''},
    {id:18, nom:'NGO YOCK Elisabeth',        tel:'698414312', iid:2,appt:'A5',type:'appartement',loyer:80000, reste:0,     obs:'À jour',                              s:'payé',  caution:0,entree:''},
    {id:19, nom:'PEVEINI MASSOMA',           tel:'696372579', iid:2,appt:'A6',type:'appartement',loyer:80000, reste:80000, obs:'Doit mai',                            s:'impayé',caution:0,entree:''},
    {id:100,nom:'(Libre)',                   tel:'',          iid:2,appt:'A7',type:'appartement',loyer:80000, reste:0,     obs:'Libre',                               s:'libre',  caution:0,entree:''},
    {id:20, nom:'ESSOLA EKANI Sandrine',     tel:'655712842', iid:2,appt:'A8',type:'appartement',loyer:75000, reste:0,     obs:'À jour',                              s:'payé',  caution:0,entree:''},
    {id:24, nom:'MOLA YOUBI Gilles Stève',   tel:'670881038', iid:2,appt:'S1',type:'studio',     loyer:50000, reste:100000,obs:'Doit avr & mai',                      s:'impayé',caution:0,entree:''},
    {id:22, nom:'EDOA EDOA Jean Martin',     tel:'653255076', iid:2,appt:'S2',type:'studio',     loyer:50000, reste:50000, obs:'Doit mai',                            s:'impayé',caution:0,entree:''},
    {id:26, nom:'NTOCKO TONGO SONJEY P.L.',  tel:'696897847', iid:2,appt:'S3',type:'studio',     loyer:50000, reste:50000, obs:'Doit mai',                            s:'impayé',caution:0,entree:''},
    {id:23, nom:'FONLIA Rita',               tel:'696524174', iid:2,appt:'S4',type:'studio',     loyer:50000, reste:50000, obs:'Doit mai',                            s:'impayé',caution:0,entree:''},
    // TEUKEU
    {id:27,nom:'NITCHEU BOUENDEU Anne',      tel:'694896591', iid:3,appt:'1A', type:'appartement',loyer:210000,reste:1470000,obs:'Doit 7 mois',    s:'impayé',caution:0,entree:''},
    {id:28,nom:'YITAMBE DJIAGUE Alex',       tel:'695543303', iid:3,appt:'A1B',type:'appartement',loyer:130000,reste:130000, obs:'Aucune nouvelle', s:'impayé',caution:0,entree:''},
    {id:29,nom:'(Libre)',                    tel:'',          iid:3,appt:'S1C',type:'studio',     loyer:120000,reste:0,      obs:'Libre',           s:'libre',  caution:0,entree:''},
    {id:30,nom:'FONTEM Vanessa MAFANG',      tel:'678909400', iid:3,appt:'A1D',type:'appartement',loyer:230000,reste:460000, obs:'À expulser',      s:'impayé',caution:0,entree:''},
    {id:31,nom:'KALLA MANGA Estelle',        tel:'695806877', iid:3,appt:'S1E',type:'studio',     loyer:90000, reste:90000,  obs:'Doit mars',       s:'impayé',caution:0,entree:''},
    {id:32,nom:'ESSOLA NGUIDJOL Pierre',     tel:'656314629', iid:3,appt:'A2A',type:'appartement',loyer:230000,reste:0,      obs:'À jour',          s:'payé',   caution:0,entree:''},
    {id:33,nom:'EBOKO SOLEINI Tiphanie',     tel:'699947941', iid:3,appt:'S2B',type:'studio',     loyer:120000,reste:240000, obs:'Doit fév & mars', s:'impayé',caution:0,entree:''},
    {id:34,nom:'NDONPOUOWOUO NJIKAM F.',     tel:'657603363', iid:3,appt:'S3E',type:'studio',     loyer:90000, reste:0,      obs:'À jour août 2026',s:'payé',   caution:0,entree:''},
    {id:35,nom:'FENG Gisèle Claire',         tel:'682828111', iid:3,appt:'S2C',type:'studio',     loyer:100000,reste:0,      obs:'À jour déc 2026', s:'payé',   caution:0,entree:''},
    {id:36,nom:'JOSHUA SAMBE NDUMBE',        tel:'678337522', iid:3,appt:'A2D',type:'appartement',loyer:200000,reste:1200000,obs:'Doit 6 mois',     s:'impayé',caution:0,entree:''},
    {id:37,nom:'AZEMKOUO NGUEMO Marius',     tel:'',          iid:3,appt:'S2E',type:'studio',     loyer:90000, reste:0,      obs:'À jour août 2026',s:'payé',   caution:0,entree:''},
    {id:38,nom:'MBENG MANCHUNG Precious',    tel:'679159041', iid:3,appt:'A3A',type:'appartement',loyer:220000,reste:660000, obs:'Doit 3 mois',     s:'impayé',caution:0,entree:''},
    {id:39,nom:'(Libre)',                    tel:'',          iid:3,appt:'S3B',type:'studio',     loyer:130000,reste:0,      obs:'Libre',           s:'libre',  caution:0,entree:''},
    {id:40,nom:'NJINJOH SIDDEEGAH Darla',    tel:'',          iid:3,appt:'S3C',type:'studio',     loyer:120000,reste:0,      obs:'À jour août 2026',s:'payé',   caution:0,entree:''},
    {id:41,nom:'HAPPY Jacques Hadrien',      tel:'696889905', iid:3,appt:'A3D',type:'appartement',loyer:220000,reste:1320000,obs:'Doit 6 mois+100k',s:'impayé',caution:0,entree:''},
    {id:42,nom:'(Libre)',                    tel:'',          iid:3,appt:'A4A',type:'appartement',loyer:200000,reste:0,      obs:'Libre',           s:'libre',  caution:0,entree:''},
    {id:43,nom:'KWEDI SAKE Agnès',           tel:'697438357', iid:3,appt:'S4B',type:'studio',     loyer:130000,reste:260000, obs:'Doit 2 mois',     s:'impayé',caution:0,entree:''},
    {id:44,nom:'FAYSAL MOUNIR',              tel:'',          iid:3,appt:'S4C',type:'studio',     loyer:110000,reste:0,      obs:'À jour nov 2026', s:'payé',   caution:0,entree:''},
    {id:45,nom:'BEKOLO WINNIE',              tel:'650835106', iid:3,appt:'A4D',type:'appartement',loyer:200000,reste:0,      obs:'À jour',          s:'payé',   caution:0,entree:''},
    {id:46,nom:'ENGOME MBAPPE Agnès C.',     tel:'694265234', iid:3,appt:'S4E',type:'studio',     loyer:90000, reste:90000,  obs:'Doit mars',       s:'impayé',caution:0,entree:''},
    {id:47,nom:'AWA Cedric NDIFOR',          tel:'676099137', iid:3,appt:'A5A',type:'appartement',loyer:200000,reste:800000, obs:'Doit 4 mois',     s:'impayé',caution:0,entree:''},
    {id:48,nom:'NGO MDJEBET Ange Gaelle',    tel:'656572076', iid:3,appt:'S5B',type:'studio',     loyer:120000,reste:240000, obs:'Doit 2 mois',     s:'impayé',caution:0,entree:''},
    {id:49,nom:'Romario FANWONG',            tel:'683219653', iid:3,appt:'S5E',type:'studio',     loyer:95000, reste:380000, obs:'Doit 4 mois',     s:'impayé',caution:0,entree:''},
    {id:50,nom:'TENENG Darel GHANG',         tel:'678928793', iid:3,appt:'A6A',type:'appartement',loyer:200000,reste:400000, obs:'Doit fév & mars', s:'impayé',caution:0,entree:''},
    {id:51,nom:'MANUELA MBEDY',              tel:'698165922', iid:3,appt:'S6B',type:'studio',     loyer:125000,reste:250000, obs:'Doit 2 mois',     s:'impayé',caution:0,entree:''},
    {id:52,nom:'ZEM Cendrine',               tel:'698839902', iid:3,appt:'S6E',type:'studio',     loyer:100000,reste:300000, obs:'Doit 3 mois',     s:'impayé',caution:0,entree:''},
    {id:53,nom:'KUMA MATE Michel Fabiola',   tel:'672885444', iid:3,appt:'AR1',type:'appartement',loyer:220000,reste:0,      obs:'À jour',          s:'payé',   caution:0,entree:''},
    {id:54,nom:'MKPA EBODE Ludovic',         tel:'696228640', iid:3,appt:'SR2',type:'studio',     loyer:100000,reste:400000, obs:'Doit 4 mois',     s:'impayé',caution:0,entree:''},
    {id:55,nom:'BAYERE Nelly ENJOH',         tel:'676613261', iid:3,appt:'R3', type:'autre',      loyer:50000, reste:50000,  obs:'Doit mars',       s:'impayé',caution:0,entree:''},
    {id:56,nom:'NGEH Eric LANDJI',           tel:'',          iid:3,appt:'SR4',type:'studio',     loyer:100000,reste:0,      obs:'À jour sept 2026',s:'payé',   caution:0,entree:''},
    {id:57,nom:'(Libre)',                    tel:'',          iid:3,appt:'SR5',type:'studio',     loyer:110000,reste:0,      obs:'Libre',           s:'libre',  caution:0,entree:''},
    {id:58,nom:'NGUEMFOUO SONKWA G.',        tel:'',          iid:3,appt:'S5C',type:'studio',     loyer:130000,reste:30000,  obs:'Solde partiel',   s:'impayé',caution:0,entree:''},
    {id:59,nom:'AGBOR AGBOR Boris',          tel:'698503856', iid:3,appt:'A5D',type:'appartement',loyer:210000,reste:0,      obs:'À jour juillet',  s:'payé',   caution:0,entree:''},
    {id:90,nom:'M. DJEM',                             tel:'672778666',iid:4,appt:'A1',type:'appartement',loyer:55000,reste:440000,obs:'Doit 8 mois – Pas pris',              s:'impayé',caution:0,entree:''},
    {id:91,nom:'Mme ANGE',                            tel:'650672911',iid:4,appt:'A2',type:'appartement',loyer:55000,reste:330000,obs:'Doit 6 mois – Va passer lundi 10h-11h',s:'impayé',caution:0,entree:''},
    {id:92,nom:'BIYAG ALEX Maximilien',               tel:'696378623',iid:4,appt:'A3',type:'appartement',loyer:55000,reste:605000,obs:'Doit 11 mois – Injoignable',           s:'impayé',caution:0,entree:''},
    {id:93,nom:'OBOGWU Mommy',                        tel:'677631869',iid:4,appt:'S1',type:'studio',     loyer:35000,reste:280000,obs:'Doit 8 mois – Attend la descente',     s:'impayé',caution:0,entree:''},
    {id:94,nom:'TSAGUE NGUIMDO Rodrigue Armand',      tel:'690246909',iid:4,appt:'S2',type:'studio',     loyer:35000,reste:105000,obs:'Doit 3 mois – Attend la descente',     s:'impayé',caution:0,entree:''},
    {id:95,nom:'BOUICHOANG TCHATO Alexandra Armelle', tel:'698521741',iid:4,appt:'S3',type:'studio',     loyer:35000,reste:210000,obs:'Doit 6 mois – Attend la descente',     s:'impayé',caution:0,entree:''},
  ],
  paiements: [
    {id:1, locId:17, date:'2026-04-30',montant:80000, moisC:3,anneeC:2026,type:'loyer',  mode:'especes',note:'Avril'},
    {id:2, locId:101,date:'2026-05-07',montant:320000,moisC:4,anneeC:2026,type:'loyer',  mode:'especes',note:'4 mois avance mai–août'},
    {id:3, locId:101,date:'2026-05-07',montant:160000,moisC:4,anneeC:2026,type:'caution',mode:'especes',note:'Caution 2 mois'},
    {id:4, locId:25, date:'2026-04-27',montant:80000, moisC:3,anneeC:2026,type:'loyer',  mode:'especes',note:'Avril'},
    {id:5, locId:21, date:'2026-05-06',montant:80000, moisC:3,anneeC:2026,type:'loyer',  mode:'especes',note:'Avr payé le 06/05'},
    {id:6, locId:18, date:'2026-05-14',montant:80000, moisC:4,anneeC:2026,type:'loyer',  mode:'especes',note:'Mai'},
    {id:7, locId:19, date:'2026-02-11',montant:80000, moisC:1,anneeC:2026,type:'loyer',  mode:'especes',note:'Fév'},
    {id:8, locId:20, date:'2026-05-14',montant:75000, moisC:4,anneeC:2026,type:'loyer',  mode:'especes',note:'Mai'},
    {id:9, locId:24, date:'2026-04-28',montant:50000, moisC:2,anneeC:2026,type:'loyer',  mode:'especes',note:'Mars partiel'},
    {id:10,locId:22, date:'2026-04-11',montant:50000, moisC:3,anneeC:2026,type:'loyer',  mode:'especes',note:'Avril'},
    {id:11,locId:23, date:'2026-04-28',montant:100000,moisC:3,anneeC:2026,type:'loyer',  mode:'especes',note:'Avr+partiel mai'},
    {id:12,locId:26, date:'2026-04-27',montant:50000, moisC:3,anneeC:2026,type:'loyer',  mode:'especes',note:'Avril'},
    {id:13,locId:101,date:'2026-05-07',montant:80000,moisC:4,anneeC:2026,moisFin:4,anneeFin:2026,type:'loyer',mode:'especes',note:'Entrée - Mai'},
    {id:14,locId:101,date:'2026-05-07',montant:80000,moisC:5,anneeC:2026,moisFin:5,anneeFin:2026,type:'loyer',mode:'especes',note:'Entrée - Juin'},
    {id:15,locId:101,date:'2026-05-07',montant:80000,moisC:6,anneeC:2026,moisFin:6,anneeFin:2026,type:'loyer',mode:'especes',note:'Entrée - Juillet'},
    {id:16,locId:101,date:'2026-05-07',montant:80000,moisC:7,anneeC:2026,moisFin:7,anneeFin:2026,type:'loyer',mode:'especes',note:'Entrée - Août'},


  ],
  nextLocId: 100,
  nextImmId: 5,
  nextPayId: 50,
  declarations: [],   // paiements déclarés par locataires, en attente validation
  nextDeclId: 1,
}
let DATA = {};
;

// ============================================================
// STORAGE
// ============================================================
const DATA_VERSION = 6; // increment this when adding new immeubles/locataires

function forceReset() {
  if (!confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) return;
  localStorage.removeItem('immogest_data');
  location.reload();
}

function exportData() {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'immogest_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
}

// ============================================================
// HELPERS
// ============================================================
const MNOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const gM = () => parseInt(document.getElementById('sel-mois').value);
const gA = () => parseInt(document.getElementById('sel-annee').value);
const fmt = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA';
const fmtShort = n => { const v = Number(n||0); return v>=1000000?(v/1000000).toFixed(1)+'M':(v>=1000?(v/1000).toFixed(0)+'k':v) + ' F'; };

function localBadge(appt) {
  if (!appt) return '';
  if (appt.startsWith('A') || appt.match(/^\d/)) return `<span class="local-A">${appt}</span>`;
  if (appt.startsWith('S') || appt.startsWith('R')) return `<span class="local-S">${appt}</span>`;
  return `<span class="badge badge-neutral">${appt}</span>`;
}

function actifs() { return DATA.locataires.filter(l => l.s !== 'libre'); }

function paiementsDuMois(m, a, iidFilter) {
  return DATA.paiements.filter(p => {
    let match = false;
    if (p.date) {
      const d = new Date(p.date);
      if (!isNaN(d) && d.getMonth() === m && d.getFullYear() === a) match = true;
    }
    // Supabase : mois 1-12, annee 4 chiffres
    if (!match && p.mois !== undefined && p.annee !== undefined) {
      if (p.mois === m + 1 && p.annee === a) match = true;
    }
    // Ancienne structure locale : moisC 0-11, anneeC
    if (!match && p.moisC !== undefined && p.anneeC !== undefined) {
      if (p.moisC === m && p.anneeC === a) match = true;
    }
    if (!match) return false;
    if (iidFilter !== undefined) {
      const l = DATA.locataires.find(x => x.id === p.locId);
      return l && l.iid === iidFilter;
    }
    return true;
  });
}

function showToast(msg, type='green') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderLeftColor = type==='green' ? 'var(--green)' : type==='red' ? 'var(--red)' : 'var(--accent)';
  t.style.borderLeft = '3px solid';
  t.className = 'toast show';
  setTimeout(() => t.className = 'toast', 2500);
}

function closeModals() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
}

// ============================================================
// NAVIGATION
// ============================================================
let currentPage = 'dashboard';
let currentImmId = null;

// ══════════════════════════════════════════
// RESPONSIVE MOBILE — DEPLOY17
// ══════════════════════════════════════════

function toggleSidebarMobile() {
  var sb = document.getElementById('sidebar-main');
  var ov = document.getElementById('sidebar-overlay');
  if (!sb) return;
  var isOpen = sb.classList.contains('open');
  if (isOpen) { sb.classList.remove('open'); ov.classList.remove('open'); }
  else { sb.classList.add('open'); ov.classList.add('open'); }
}

function closeSidebar() {
  var sb = document.getElementById('sidebar-main');
  var ov = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('open');
}

// Appui long = clic droit (contextmenu) sur mobile
(function() {
  var _ltTimer = null;
  var _ltTarget = null;
  document.addEventListener('touchstart', function(e) {
    _ltTarget = e.target;
    _ltTimer = setTimeout(function() {
      if (_ltTarget) {
        var evt = new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true,
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        });
        _ltTarget.dispatchEvent(evt);
      }
    }, 600);
  }, { passive: true });
  document.addEventListener('touchend',   function() { clearTimeout(_ltTimer); }, { passive: true });
  document.addEventListener('touchmove',  function() { clearTimeout(_ltTimer); }, { passive: true });
})();

// Fermer sidebar au navigate sur mobile
function navigate(page, immId) {
  currentPage = page;
  currentImmId = immId !== undefined ? immId : null;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // Sélection précise : éviter que 'immeuble' matche 'immeubles-config'
  const match = document.querySelector(`.nav-item[onclick*="'${page}'"]`) ||
                document.querySelector(`.nav-item[onclick*='"${page}"']`);
  if (match) match.classList.add('active');
  // Supprimer le bouton retour immeuble si on quitte la page immeuble
  var _btnR = document.getElementById('btn-retour-dashboard');
  if (_btnR && page !== 'immeuble') _btnR.remove();
  // Fermer la sidebar mobile au changement de page
  closeSidebar();
  renderCurrent();
  // Mettre à jour la barre de nav mobile
  _updateMobileBottomNav(page);
}

function _updateMobileBottomNav(page) {
  var ids = ['mbn-dashboard','mbn-encaissements','mbn-locataires','mbn-rapport'];
  var pages = ['dashboard','encaissements','locataires','rapport'];
  ids.forEach(function(id, i) {
    var btn = document.getElementById(id);
    if (!btn) return;
    var active = pages[i] === page;
    btn.style.color = active ? '#0E6AAF' : 'var(--text3)';
    btn.style.fontWeight = active ? '700' : '600';
  });
}

function renderCurrent() {
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'encaissements') renderEncaissements();
  else if (currentPage === 'relances') renderRelances();
  else if (currentPage === 'rapport') renderRapportPage();
  else if (currentPage === 'statistiques') renderStatistiques();
  else if (currentPage === 'rapport-annuel') renderRapportAnnuelPage();
  else if (currentPage === 'utilisateurs') renderUtilisateurs();
  else if (currentPage === 'bibliotheque') renderBibliotheque();
  else if (currentPage === 'archives') renderArchives();
  else if (currentPage === 'corbeille') renderCorbeille();
  else if (currentPage === 'validation') renderValidationComptable();
  else if (currentPage === 'locataires') renderLocataires();
  else if (currentPage === 'immeuble' && currentImmId !== null) renderImmeuble(currentImmId);
  else if (currentPage === 'immeubles-config') renderImmeublesConfig();
  else if (currentPage === 'parametres') renderParametres();
  else if (currentPage === 'signalements') renderSignalements();
  updateSidebarBadges();
}

function buildSidebar() {
  updateSidebarBadges();
}

function updateSidebarBadges() {
  const n = getAlertes().length; // Count only >= 2 months for badge
  // Update validation badge for comptable
  const valBadge = document.getElementById('badge-validation');
  if (valBadge) {
    const pending = getPendingDeclarations().length;
    valBadge.textContent = pending;
    valBadge.style.display = pending > 0 ? 'flex' : 'none';
  }
  document.getElementById('badge-relances').textContent = n;
  // Sidebar immeubles
  const sideImm = document.getElementById('sidebar-immeubles');
  let sideHtml = DATA.immeubles.map(im => {
    const locs = DATA.locataires.filter(l => l.iid === im.id && l.s !== 'libre');
    const imp = locs.filter(l => l.reste > 0).length;
    return `<div class="nav-item${currentPage==='immeuble'&&currentImmId===im.id?' active':''}" onclick="navigate('immeuble',${im.id})" oncontextmenu="showCtxImm(event,${im.id})">
      <span class="imm-dot" style="background:${im.col};"></span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${im.nom.split(' ')[0]}</span>
      ${imp>0?`<span class="nav-badge">${imp}</span>`:''}
    </div>`;
  }).join('');
  // Lien Espace Propriétaire uniquement pour le rôle proprietaire
  if (SESSION && SESSION.role === 'proprietaire') {
    sideHtml += '<div class="nav-item" onclick="openPortailProprietaire()" style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;"><span class="nav-icon">📊</span> Mon espace</div>';
  }
  sideImm.innerHTML = sideHtml;
}

function topbarAction() {
  if (currentPage === 'locataires' || currentPage === 'immeuble') openModalLocataire(currentImmId);
  else if (currentPage === 'encaissements') openModalPaiement();
  else if (currentPage === 'immeubles-config') openModalImmeuble();
  else if (currentPage === 'rapport-annuel') genDocxRapportAnnuel();
  else openModalPaiement();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  document.getElementById('page-title').textContent = 'Tableau de bord';
  document.getElementById('page-sub').textContent = MNOMS[gM()] + ' ' + gA();
  document.getElementById('topbar-main-btn').textContent = '＋ Paiement';

  const ac = actifs();
  const tL = ac.reduce((s,l)=>s+l.loyer,0);
  const tR = ac.reduce((s,l)=>s+l.reste,0);
  const nbJ = ac.filter(l=>l.s==='payé').length;
  const nbLib = DATA.locataires.filter(l=>l.s==='libre').length;
  const pays = paiementsDuMois(gM(), gA());
  const encMois = pays.filter(p=>p.type!=='caution').reduce((s,p)=>s+p.montant,0);
  const nbImm = DATA.immeubles.filter(im=>DATA.locataires.some(l=>l.iid===im.id&&l.s!=='libre')).length;

  let html = `<div class="metrics-grid">
    <div class="metric-card"><div class="metric-label">Immeubles</div><div class="metric-value accent">${nbImm}</div><div class="metric-sub">${getVisibleImmeubles().length} renseignés</div></div>
    <div class="metric-card"><div class="metric-label">Locataires actifs</div><div class="metric-value">${ac.length}</div><div class="metric-sub">${nbJ} à jour · ${nbLib} libre(s)</div></div>
    <div class="metric-card"><div class="metric-label">Loyers / mois</div><div class="metric-value" style="font-size:17px;">${fmtShort(tL)}</div><div class="metric-sub">attendu total</div></div>
    <div class="metric-card"><div class="metric-label">Encaissé ${MNOMS[gM()]}</div><div class="metric-value green" style="font-size:17px;">${fmtShort(encMois)}</div><div class="metric-sub">${pays.length} versement(s)</div></div>
    <div class="metric-card"><div class="metric-label">Impayés cumulés</div><div class="metric-value red" style="font-size:17px;">${fmtShort(tR)}</div><div class="metric-sub">${ac.filter(l=>l.reste>0).length} locataire(s)</div></div>
  </div>`;

  // Immeuble cards
  html += `<div class="imm-cards">`;
  (SESSION && getVisibleImmeubles ? getVisibleImmeubles() : DATA.immeubles).forEach(im => {
    const locs = DATA.locataires.filter(l=>l.iid===im.id&&l.s!=='libre');
    const lib = DATA.locataires.filter(l=>l.iid===im.id&&l.s==='libre').length;
    const tot = locs.reduce((s,l)=>s+l.loyer,0);
    const rest = locs.reduce((s,l)=>s+l.reste,0);
    const nbP = locs.filter(l=>l.s==='payé').length;
    const tx = locs.length ? Math.round(nbP/locs.length*100) : 0;
    const has = locs.length > 0;
    html += `<div class="imm-card" onclick="navigate('immeuble',${im.id})" oncontextmenu="showCtxImm(event,${im.id})">
      <div class="imm-card-accent" style="background:${im.col};"></div>
      <div class="imm-card-header">
        <div>
          <div class="imm-card-name">${im.nom}</div>
          <div class="imm-card-loc">📍 ${im.ville}${im.quartier?' · '+im.quartier:''}</div>
        </div>
        ${has?`<span class="badge ${tx===100?'badge-green':tx>50?'badge-yellow':'badge-red'}">${tx}%</span>`:`<span class="badge badge-neutral">En attente</span>`}
      </div>
      <div class="imm-card-body">
        ${has?`
          <div class="imm-stats">
            <div class="imm-stat"><span>${locs.length}</span>locataires</div>
            <div class="imm-stat"><span>${nbP}</span>à jour</div>
            ${lib?`<div class="imm-stat"><span>${lib}</span>libre(s)</div>`:''}
            <div class="imm-stat"><span style="font-size:12px;">${fmtShort(tot)}</span>/mois</div>
          </div>
          <div class="pb"><div class="pb-fill" style="width:${tx}%;background:${im.col};"></div></div>
          ${rest>0?`<div style="font-size:11px;color:var(--red);margin-top:6px;">Impayés : ${fmt(rest)}</div>`:''}`
          :`<div style="font-size:12px;color:var(--text3);font-style:italic;margin-top:8px;">Données non encore saisies</div>`}
      </div>
    </div>`;
  });
  html += `</div>`;

  // Chart
  html += `<div class="card"><div class="card-header"><div class="card-title">Comparatif encaissements vs impayés</div></div>
    <div class="chart-wrap"><canvas id="chart-db"></canvas></div></div>`;

  document.getElementById('content').innerHTML = html;

  if (window._chartDB) window._chartDB.destroy();
  const immD = DATA.immeubles.filter(im=>DATA.locataires.some(l=>l.iid===im.id&&l.s!=='libre'));
  const ctx = document.getElementById('chart-db');
  if (ctx) window._chartDB = new Chart(ctx, {
    type:'bar',
    data:{labels:immD.map(i=>i.nom.split(' ')[0]),datasets:[
      {label:'Loyers à jour',data:immD.map(i=>DATA.locataires.filter(l=>l.iid===i.id&&l.s==='payé').reduce((s,l)=>s+l.loyer,0)),backgroundColor:'rgba(46,204,138,.7)',borderRadius:4},
      {label:'Impayés cumulés',data:immD.map(i=>DATA.locataires.filter(l=>l.iid===i.id&&l.s!=='libre').reduce((s,l)=>s+l.reste,0)),backgroundColor:'rgba(242,92,92,.7)',borderRadius:4},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:true,position:'top',labels:{color:'#9196a8',font:{size:11},boxWidth:10,boxHeight:10}}},
      scales:{x:{ticks:{color:'#9196a8',font:{size:11}},grid:{color:'#2e3040'}},y:{ticks:{color:'#9196a8',font:{size:11},callback:v=>(v/1000).toFixed(0)+'k'},grid:{color:'#2e3040'}}}
    }
  });
}

// ============================================================
// IMMEUBLE DETAIL
// ============================================================
function renderImmeuble(iid) {
  const im = DATA.immeubles.find(i=>i.id===iid);
  if (!im) return;
  currentImmId = iid;
  currentPage = 'immeuble';
  (function(){var b=document.getElementById('topbar-main-btn');if(b){b.style.display='flex';b.textContent='+ Locataire';}})();

  // Bouton retour tableau de bord
  var _topbar = document.querySelector('.topbar-actions');
  if (_topbar && !document.getElementById('btn-retour-dashboard')) {
    var _btnRetour = document.createElement('button');
    _btnRetour.id = 'btn-retour-dashboard';
    _btnRetour.className = 'btn btn-ghost btn-sm';
    _btnRetour.textContent = '← Tableau de bord';
    _btnRetour.style.marginRight = '8px';
    _btnRetour.onclick = function(){ navigate('dashboard'); };
    _topbar.insertBefore(_btnRetour, _topbar.firstChild);
  }

  const locs = DATA.locataires.filter(l=>l.iid===iid);
  const actifsList = locs.filter(l=>l.s!=='libre');
  const libresList = locs.filter(l=>l.s==='libre');
  // Only count real locaux (those in DATA.locataires)
  const totalLocaux = locs.length;
  const occupes = actifsList.length;
  const libres = libresList.length;

  document.getElementById('page-title').textContent = im.nom;
  document.getElementById('page-sub').textContent = im.ville + (im.quartier?' · '+im.quartier:'');
  document.getElementById('topbar-main-btn').textContent = '＋ Locataire';

  const tLoyer = actifsList.reduce((s,l)=>s+l.loyer,0);
  const tReste = actifsList.reduce((s,l)=>s+l.reste,0);
  const nbAjour = actifsList.filter(l=>l.s==='payé').length;
  const nbImp = actifsList.filter(l=>l.s==='impayé').length;

  // Build locaux list: occupés + libres (placeholders)
  // Sort occupés by appt
  const sortedActifs = [...actifsList].sort((a,b)=>(a.appt||'').localeCompare(b.appt||''));
  
  let html = `
  <!-- KPIs -->
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Locaux total</div>
      <div class="metric-value accent">${totalLocaux||locs.length}</div>
      <div class="metric-sub">${im.apparts||0} apparts · ${im.studios||0} studios · ${im.chambres||0} chambres</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Occupés / Libres</div>
      <div class="metric-value">
        <span style="color:var(--red);">${occupes}</span>
        <span style="color:var(--text3);font-size:16px;"> / </span>
        <span style="color:var(--green);">${libres > 0 ? libres : libresList.length}</span>
      </div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Loyers / mois</div>
      <div class="metric-value accent">${fmtShort(tLoyer)}</div>
      <div class="metric-sub">${nbAjour} à jour · ${nbImp} impayés</div>
    </div>
    <div class="metric-card" style="border-left:4px solid var(--red);">
      <div class="metric-label">Impayés cumulés</div>
      <div class="metric-value red">${fmtShort(tReste)}</div>
    </div>
  </div>

  <!-- Grille des locaux -->
  <div class="card" style="margin-bottom:16px;">
    <div class="card-header">
      <div class="card-title">🏠 Vue d'ensemble des locaux</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:11px;"><span class="local-statut-dot" style="background:var(--red);"></span>Occupé</span>
        <span style="font-size:11px;"><span class="local-statut-dot" style="background:var(--green);"></span>Libre</span>
        <span style="font-size:11px;"><span class="local-statut-dot" style="background:var(--yellow);"></span>En travaux</span>
        ${can('canEditLocataires')?`<button class="btn btn-primary btn-sm" onclick="openModalLocataire(${iid})">＋ Locataire</button>`:''}
      </div>
    </div>
    <div class="locaux-grid">
      ${sortedActifs.map(l => {
        const mois = getNbMoisArrieres(l);
        const alerte = mois >= 2;
        return `<div class="local-card occupe" onclick="scrollToLocataire(${l.id})" oncontextmenu="showCtxMenu(event,${l.id},${iid},false)" style="cursor:pointer;">
          ${alerte?`<div style="position:absolute;top:4px;right:4px;background:var(--red);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:99px;">🚨${mois}m</div>`:''}
          <div class="local-num">${l.appt||'–'}</div>
          <div class="local-type">${l.type||'appartement'}</div>
          <div class="local-nom">${l.nom.split(' ')[0]}</div>
          <div class="local-loyer">${fmtShort(l.loyer)}/mois</div>
          <div class="local-reste" style="color:${l.reste>0?'var(--red)':l.reste<0?'var(--blue)':'var(--green)'}; font-size:10px;">
            ${l.reste>0 ? 'Doit '+fmtShort(l.reste) : l.reste<0 ? '↑'+Math.floor(Math.abs(l.reste)/l.loyer)+'m avance' : '✓ À jour'}
          </div>
        </div>`;
      }).join('')}
      ${libresList.map(l => `
        <div class="local-card libre" onclick="clicLocalLibre(${l.id},${iid})" oncontextmenu="showCtxMenu(event,${l.id},${iid},true)">
          <div class="local-num">${l.appt||'–'}</div>
          <div class="local-type">${l.type||'appartement'}</div>
          <div style="font-size:24px;margin:6px 0;">🟢</div>
          <div style="font-size:11px;color:var(--green);font-weight:600;">Libre</div>
          <div style="font-size:10px;color:var(--accent);margin-top:4px;font-weight:600;">＋ Ajouter locataire</div>
        </div>`).join('')}

    </div>
  </div>

  <!-- Tableau locataires -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">📋 Locataires (${actifsList.length})</div>
      <div style="flex:1;max-width:280px;">
        <input type="text" id="search-imm-locs-${iid}" placeholder="🔍 Nom, local, tél..." oninput="_filterImmLocs(${iid})" style="width:100%;padding:6px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;font-family:var(--font);background:var(--bg4);">
      </div>
    </div>
    <div class="table-wrap"><table class="tbl" id="tbl-locataires-${iid}">
      <thead><tr>
        <th>Local</th><th>Nom</th><th>Tél</th><th>Loyer</th>
        <th>Observations</th><th>Statut</th><th>Reste dû</th><th>Actions</th>
      </tr></thead>
      <tbody>
      ${sortedActifs.map(l => `
        <tr id="loc-row-${l.id}" class="imm-loc-row" data-search="${(l.nom+' '+(l.tel||'')+' '+(l.appt||'')).toLowerCase()}" oncontextmenu="showCtxLoc(event,${l.id})" style="cursor:context-menu;">
          <td>${localBadge(l.appt)}</td>
          <td class="td-name">${l.nom}</td>
          <td style="font-size:12px;">${l.tel||'–'}</td>
          <td class="td-amount">${fmt(l.loyer)}</td>
          <td style="font-size:11px;max-width:160px;">
            <span style="color:var(--text3);">${l.obs||''}</span>
            ${getAlertLabel(l) ? '<br><span style="font-size:10px;font-weight:700;">' + getAlertLabel(l) + '</span>' : ''}
            ${l.reste > 0 && l.loyer > 0 ? '<br><span style="font-size:10px;color:var(--red);">' + (l.reste/l.loyer).toFixed(1) + ' mois dus</span>' : ''}
          </td>
          <td><span class="badge ${l.s==='payé'?'badge-green':'badge-red'}">${l.s}</span></td>
          <td class="td-amount ${l.reste>0?'red':l.reste<0?'blue':'green'}" style="font-size:11px;">
            ${l.reste>0 ? fmtReste(l) : l.reste<0 ? fmtReste(l) : '–'}
          </td>
          <td style="white-space:nowrap;">
            <div class="action-menu">
              <button class="action-menu-btn" onclick="toggleActionMenu(this)">⋯</button>
              <div class="action-dropdown">
                ${can('canRecordPayment')?`<div class="action-dropdown-item" onclick="openModalPaiement(${iid},${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">💳 Paiement</div>`:''}
                ${can('canEditLocataires')?`<div class="action-dropdown-item" onclick="editLocataire(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📝 Modifier</div>`:''}
                <div class="action-dropdown-item" onclick="ouvrirFicheSuivi(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📊 Fiche de suivi</div>
                ${l.tel?`<div class="action-dropdown-item" onclick="envoyerAccesWhatsApp(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📲 Envoyer accès WhatsApp</div>`:''}
                ${l.pinResetRequested?`<div class="action-dropdown-item" style="color:var(--yellow);" onclick="reinitialiserPIN(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">🔑 Réinitialiser PIN (demandé)</div>`:''}
                ${can('canJuridique')?`<div class="action-dropdown-item" onclick="ouvrirGenDocx(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📄 Documents</div>`:''}
                <div class="action-dropdown-sep"></div>
                ${can('canEditLocataires')?`<div class="action-dropdown-item danger" onclick="ouvrirLiberation(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">🔓 Libérer</div>`:''}
                ${can('canEditLocataires')?`<div class="action-dropdown-item danger" onclick="supprimerLocataire(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">🗑️ Supprimer</div>`:''}
              </div>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>`;

  html = `<div style="display:flex;justify-content:flex-end;margin-bottom:8px;"><button class="btn btn-ghost btn-sm" onclick="ajouterLocal(${iid})">+ Ajouter un local</button></div>` + html;
  document.getElementById('content').innerHTML = html;
}

function scrollToLocataire(locId) {
  const row = document.getElementById('loc-row-' + locId);
  if (row) row.scrollIntoView({behavior:'smooth', block:'center'});
}
function _filterImmLocs(iid) {
  var q = (document.getElementById('search-imm-locs-'+iid)?document.getElementById('search-imm-locs-'+iid).value:'').toLowerCase().trim();
  document.querySelectorAll('tr.imm-loc-row').forEach(function(r) {
    r.style.display = !q || (r.dataset.search||'').indexOf(q) >= 0 ? '' : 'none';
  });
}

function openModalLocataire(iid, preAppt, preType) {
  if (!can('canEditLocataires')) {
    showToast('Accès refusé – modification non autorisée', 'red');
    return;
  }
  // Reset form
  document.getElementById('loc-id').value = '';
  document.getElementById('loc-nom').value = '';
  document.getElementById('loc-tel').value = '';
  if (document.getElementById('loc-whatsapp')) document.getElementById('loc-whatsapp').value = '';
  document.getElementById('loc-appt').value = preAppt || '';
  document.getElementById('loc-type').value = preType || 'appartement';
  document.getElementById('loc-loyer').value = '';
  document.getElementById('loc-reste').value = '0';
  document.getElementById('loc-caution').value = '0';
  document.getElementById('loc-entree').value = new Date().toISOString().split('T')[0];
  document.getElementById('loc-obs').value = '';
  // Populate immeuble select
  const immSel = document.getElementById('loc-imm');
  const visibles = getVisibleImmeubles();
  if (immSel) {
    immSel.innerHTML = visibles.map(im =>
      `<option value="${im.id}" ${im.id==iid?'selected':''}>${im.nom}</option>`
    ).join('');
    // Si iid null/undefined, sélectionner le premier immeuble disponible
    if (iid && visibles.find(im => im.id == iid)) {
      immSel.value = iid;
    } else if (visibles.length > 0) {
      immSel.value = visibles[0].id;
    }
  }
  // Set jour paiement default
  const jourEl = document.getElementById('loc-jour-paiement');
  if (jourEl) jourEl.value = 1;
  document.getElementById('modal-loc-title').textContent = '＋ Nouveau locataire';
  document.getElementById('modal-locataire').classList.add('open');
}

function clicLocalLibre(locId, iid) {
  if (!can('canEditLocataires')) {
    showToast('Accès refusé', 'red'); return;
  }
  ouvrirNouveauLocataireLocal(locId, iid);
}

function clicLocalVide(iid) {
  if (!can('canEditLocataires')) {
    showToast('Accès refusé', 'red'); return;
  }
  openModalLocataireVide(iid);
}

function ouvrirNouveauLocataireLocal(locId, iid) {
  // Click on a local marked libre in DATA
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  // Open modal pre-filled with local info
  openModalLocataire(iid, l.appt, l.type||'appartement');
}

function openModalLocataireVide(iid) {
  // Click on a placeholder (local vide sans locataire enregistré)
  // Open modal with iid pre-filled, user enters local number
  openModalLocataire(iid, '', 'appartement');
  // Show hint
  setTimeout(() => {
    const apptField = document.getElementById('loc-appt');
    if (apptField) {
      apptField.placeholder = 'Ex: A1, 101, Studio 2...';
      apptField.focus();
    }
  }, 200);
}


function renderEncaissements() {
  document.getElementById('page-title').textContent = 'Encaissements';
  document.getElementById('page-sub').textContent = MNOMS[gM()] + ' ' + gA();
  document.getElementById('topbar-main-btn').textContent = '＋ Paiement';

  const m=gM(), a=gA();
  const pays = paiementsDuMois(m, a);
  const encLoyer = pays.filter(p=>p.type!=='caution').reduce((s,p)=>s+p.montant,0);
  const encCaution = pays.filter(p=>p.type==='caution').reduce((s,p)=>s+p.montant,0);

  let html = `<div style="margin-bottom:16px;">
    <input type="text" id="search-enc-global" placeholder="🔍 Rechercher locataire, immeuble, mois..." oninput="_filterEncGlobal()" style="width:100%;padding:9px 16px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);box-sizing:border-box;">
  </div>
  <div class="metrics-grid">
    <div class="metric-card"><div class="metric-label">Encaissé (loyers)</div><div class="metric-value green" style="font-size:17px;">${fmtShort(encLoyer)}</div></div>
    <div class="metric-card"><div class="metric-label">Cautions reçues</div><div class="metric-value accent" style="font-size:17px;">${fmtShort(encCaution)}</div></div>
    <div class="metric-card"><div class="metric-label">Versements</div><div class="metric-value">${pays.length}</div></div>
  </div>`;

  // Par immeuble ce mois
  html += `<div class="card" style="margin-bottom:16px;"><div class="card-header"><div class="card-title">Détail ${MNOMS[m]} ${a}</div></div>`;
  if (pays.length === 0) {
    html += `<div class="empty"><div class="empty-icon">💸</div><div class="empty-text">Aucun paiement enregistré pour ${MNOMS[m]} ${a}</div></div>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>Date versement</th><th>Immeuble</th><th>Local</th><th>Locataire</th><th>Mois concerné</th><th>Type</th><th>Mode</th><th>Montant</th><th>Note</th><th></th></tr></thead>
      <tbody>`;
    pays.sort((a,b)=>b.date.localeCompare(a.date)).forEach(p => {
      const l = DATA.locataires.find(x=>x.id===p.locId);
      const im = l ? DATA.immeubles.find(i=>i.id===l.iid) : null;
      html += `<tr class="enc-row" data-search="${((l?l.nom:'')+(im?' '+im.nom:'')+ ' '+MNOMS[p.moisC]+' '+p.anneeC+' '+(p.note||'')).toLowerCase()}" oncontextmenu="showCtxPay(event,${p.id})" style="cursor:context-menu;">
        <td style="font-family:var(--mono);font-size:11px;">${p.date.split('-').reverse().join('/')}</td>
        <td style="font-size:11px;">${im?`<span style="color:${im.col};">●</span> ${im.nom.split(' ')[0]}`:'–'}</td>
        <td>${l?localBadge(l.appt):''}</td>
        <td class="td-name">${l?l.nom:'–'}</td>
        <td style="font-size:11px;">${MNOMS[p.moisC]} ${p.anneeC}</td>
        <td><span class="badge ${p.type==='caution'?'badge-purple':p.type==='loyer'?'badge-green':'badge-neutral'}">${p.type}</span></td>
        <td style="font-size:11px;color:var(--text3);">${p.mode}</td>
        <td class="td-amount green">${fmt(p.montant)}</td>
        <td style="font-size:11px;color:var(--text3);">${p.note||'–'}${p.remisAuBailleur?'<span style="margin-left:4px;background:#FFF3E0;color:#E65100;padding:1px 6px;border-radius:99px;font-size:10px;font-weight:700;">🏠 bailleur</span>':''}</td>
        <td style="white-space:nowrap;">
        ${can('canFinance')||(SESSION&&SESSION.role==='admin')?`<button class="btn btn-sm" onclick="genQuittance(${p.id})">⬇ Quittance</button>`:''}
        <button class="btn btn-ghost btn-icon btn-sm" onclick="supprimerPaiement(${p.id})" title="Supprimer">🗑</button>
      </td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }
  html += `</div>`;

  // Historique tous mois
  html += `<div class="card"><div class="card-header"><div class="card-title">Historique complet</div><button class="btn btn-sm" onclick="exportData()">↓ Exporter données</button></div>
  <div style="padding:0 0 12px 0;">
    <input type="text" id="search-enc-hist" placeholder="🔍 Locataire, immeuble, mois..." oninput="_filterEncGlobal(this.value)" style="width:100%;padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">
  </div>`;
  const allPays = [...DATA.paiements].sort((a,b)=>b.date.localeCompare(a.date));
  const byMois = {};
  allPays.forEach(p => {
    const key = `${p.anneeC}-${String(p.moisC).padStart(2,'0')}`;
    if (!byMois[key]) byMois[key] = [];
    byMois[key].push(p);
  });
  if (Object.keys(byMois).length === 0) {
    html += `<div class="empty"><div class="empty-text">Aucun historique disponible</div></div>`;
  } else {
    Object.keys(byMois).sort((a,b)=>b.localeCompare(a)).forEach(key => {
      const [yr, mo] = key.split('-');
      const grp = byMois[key];
      const tot = grp.filter(p=>p.type!=='caution').reduce((s,p)=>s+p.montant,0);
      html += `<div style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:6px;padding:4px 0;border-bottom:1px solid var(--border);">${MNOMS[parseInt(mo)]} ${yr} — <span style="color:var(--green);">${fmt(tot)}</span></div>`;
      groupPayments(grp).forEach(p => {
        const l = DATA.locataires.find(x=>x.id===p.locId);
        const im = l ? DATA.immeubles.find(i=>i.id===l.iid) : null;
        const histSearch = (l ? l.nom + ' ' + (im ? im.nom : '') : '') + ' ' + MNOMS[parseInt(mo)] + ' ' + yr;
        html += `<div class="hist-item" data-search="${histSearch.toLowerCase()}">
          <span class="hist-date">${p.date.split('-').reverse().join('/')}</span>
          <span style="font-size:11px;color:var(--text3);width:60px;flex-shrink:0;">${im?im.nom.split(' ')[0]:'–'}</span>
          <span>${l?localBadge(l.appt):''}</span>
          <span class="hist-name">${l?l.nom:'–'}</span>
          <span class="hist-amount" style="${p.type==='caution'?'color:var(--purple)':''}">${fmt(p.montant)}</span>
          <span class="hist-note">${p.type==='caution'?'caution':p.note||''}</span>
        </div>`;
      });
      html += `</div>`;
    });
  }
  html += `</div>`;
  document.getElementById('content').innerHTML = html;

  // Appui long mobile → showCtxPay sur lignes encaissements
  document.querySelectorAll('tr.enc-row').forEach(function(row) {
    var oc = row.getAttribute('oncontextmenu') || '';
    var match = oc.match(/showCtxPay\(event,(\d+)\)/);
    if (!match) return;
    var payId = parseInt(match[1]);
    var _lt = null;
    row.addEventListener('touchstart', function(e) {
      var tx = e.touches[0].clientX, ty = e.touches[0].clientY;
      _lt = setTimeout(function() {
        _lt = null;
        showCtxPay({ preventDefault:function(){}, stopPropagation:function(){}, clientX:tx, clientY:ty }, payId);
      }, 600);
    }, { passive: true });
    row.addEventListener('touchend',  function() { clearTimeout(_lt); }, { passive: true });
    row.addEventListener('touchmove', function() { clearTimeout(_lt); }, { passive: true });
  });
}

// ============================================================
// RELANCES
// ============================================================
function renderRelances() {
  document.getElementById('page-title').textContent = 'Relances & Alertes';
  document.getElementById('page-sub').textContent = 'Documents générés automatiquement à partir de 2 mois d\'arriérés';
  document.getElementById('topbar-main-btn').textContent = '＋ Paiement';

  const imps    = DATA.locataires.filter(l=>l.s==='impayé'&&l.reste>0);
  const alertes = imps.filter(l => locataireEnAlerte(l));   // >= 2 mois
  const simples = imps.filter(l => !locataireEnAlerte(l));  // <2 mois

  const totalReste = imps.reduce((s,l)=>s+l.reste,0);

  let html = `<div class="metrics-grid">
    <div class="metric-card" style="border-left:4px solid #C0392B;">
      <div class="metric-label">🚨 Dossiers en alerte (≥ 2 mois)</div>
      <div class="metric-value red">${alertes.length}</div>
      <div class="metric-sub">Mise en demeure + Plainte prêtes</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">⚠️ Retards simples (&lt; 2 mois)</div>
      <div class="metric-value" style="color:var(--yellow);">${simples.length}</div>
      <div class="metric-sub">Relance amiable</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">💰 Total à recouvrer</div>
      <div class="metric-value red" style="font-size:16px;">${fmtShort(totalReste)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">🏢 Immeubles concernés</div>
      <div class="metric-value">${new Set(imps.map(l=>l.iid)).size}</div>
    </div>
  </div>`;

  if (imps.length === 0) {
    html += `<div class="card"><div class="empty"><div class="empty-icon">✅</div><div class="empty-text">Aucun impayé ! Tous les locataires sont à jour.</div></div></div>`;
    document.getElementById('content').innerHTML = html;
    return;
  }

  // ── SECTION 1 : ALERTES >= 2 mois ──────────────────────────────────────
  if (alertes.length > 0) {
    html += `<div id="section-lettres" style="background:#FDF0F0;border:1.5px solid #C0392B;border-radius:8px;padding:10px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-weight:700;color:#C0392B;font-size:14px;">🚨 DOSSIERS EN ALERTE — ${alertes.length} locataire(s) avec ≥ 2 mois d'arriérés</div>
        <div style="font-size:12px;color:#888;margin-top:2px;">Mise en demeure et plainte générées automatiquement</div>
      </div>
      <button class="btn btn-sm" style="background:#C0392B;color:#fff;border-color:#C0392B;" onclick="telechargerTousAlertes()">⬇ Tout télécharger (${alertes.length} dossiers)</button>
    </div>`;

    // Group alertes by immeuble
    const byImmAlertes = {};
    alertes.forEach(l=>{if(!byImmAlertes[l.iid])byImmAlertes[l.iid]=[];byImmAlertes[l.iid].push(l);});

    Object.keys(byImmAlertes).forEach(iid => {
      const im = DATA.immeubles.find(i=>i.id==iid);
      if (!im) return;
      html += `<div class="card" style="margin-bottom:12px;border-left:4px solid #C0392B;">
        <div class="card-header">
          <div class="card-title" style="display:flex;align-items:center;gap:8px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${im.col};"></span>${im.nom}
            <span class="badge badge-red">🚨 ${byImmAlertes[iid].length} en alerte</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-sm" onclick="genRelanceImm(${im.id})">📄 Rapport</button>
            <button class="btn btn-primary btn-sm" onclick="genDocxRelances(${im.id})">⬇ Relances</button>
          </div>
        </div>
        <div class="table-wrap"><table>
          <thead><tr>
            <th>Local</th><th>Nom</th><th>Tél</th><th>Loyer</th><th>Arriérés</th><th>Reste dû</th><th>Situation</th><th>Documents</th>
          </tr></thead>
          <tbody>`;
      byImmAlertes[iid].forEach(l => {
        const nbMois = getNbMoisArrieres(l);
        const im2 = DATA.immeubles.find(i=>i.id===l.iid);
        const srch = (l.nom+' '+(l.tel||'')+' '+(l.appt||'')+' '+(im2?im2.nom:'')).toLowerCase();
        html += `<tr class="relance-row" data-search="${srch}" style="background:#fff8f8;cursor:context-menu;" oncontextmenu="showCtxRelance(event,${l.id})">
          <td>${localBadge(l.appt)}</td>
          <td class="td-name">${l.nom}</td>
          <td style="font-size:11px;color:var(--text3);">${l.tel||'–'}</td>
          <td class="td-amount">${fmt(l.loyer)}</td>
          <td style="text-align:center;">
            <span style="background:#FDF0F0;color:#C0392B;font-weight:700;padding:2px 8px;border-radius:99px;font-size:12px;">${nbMois} mois</span>
          </td>
          <td class="td-amount red">${fmt(l.reste)}</td>
          <td style="font-size:11px;color:var(--text3);max-width:130px;">${l.obs||'–'}</td>
          <td style="white-space:nowrap;position:relative;">
            <div class="action-menu">
              <button class="action-menu-btn" onclick="toggleActionMenu(this)" style="font-size:18px;padding:4px 10px;">⋯</button>
              <div class="action-dropdown">
                <div class="action-dropdown-item" onclick="openModalPaiement(${l.iid},${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">💳 Paiement</div>
                <div class="action-dropdown-item" onclick="previewMiseEnDemeure(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📄 Lettre</div>
                <div class="action-dropdown-item" style="color:var(--red);" onclick="previewPlainte(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">⚖️ Plainte</div>
              </div>
            </div>
          </td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    });
  }

  // ── SECTION 2 : RETARDS SIMPLES <2 mois ────────────────────────────────
  if (simples.length > 0) {
    html += `<div style="background:#FFFBEB;border:1.5px solid #F0B429;border-radius:8px;padding:10px 16px;margin-bottom:16px;margin-top:8px;">
      <div style="font-weight:700;color:#92400E;font-size:13px;">⚠️ RETARDS SIMPLES — ${simples.length} locataire(s) avec moins de 2 mois d'arriérés</div>
      <div style="font-size:12px;color:#888;margin-top:2px;">Relance amiable recommandée</div>
    </div>`;

    const byImmSimples = {};
    simples.forEach(l=>{if(!byImmSimples[l.iid])byImmSimples[l.iid]=[];byImmSimples[l.iid].push(l);});

    Object.keys(byImmSimples).forEach(iid => {
      const im = DATA.immeubles.find(i=>i.id==iid);
      if (!im) return;
      html += `<div class="card" style="margin-bottom:12px;border-left:4px solid #F0B429;">
        <div class="card-header">
          <div class="card-title" style="display:flex;align-items:center;gap:8px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${im.col};"></span>${im.nom}
          </div>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Local</th><th>Nom</th><th>Tél</th><th>Loyer</th><th>Reste dû</th><th>Situation</th><th>Actions</th></tr></thead>
          <tbody>`;
      byImmSimples[iid].forEach(l => {
        const im3 = DATA.immeubles.find(i=>i.id===l.iid);
        const srch2 = (l.nom+' '+(l.tel||'')+' '+(l.appt||'')+' '+(im3?im3.nom:'')).toLowerCase();
        html += `<tr class="relance-row" data-search="${srch2}">
          <td>${localBadge(l.appt)}</td>
          <td class="td-name">${l.nom}</td>
          <td style="font-size:11px;color:var(--text3);">${l.tel||'–'}</td>
          <td class="td-amount">${fmt(l.loyer)}</td>
          <td class="td-amount red">${fmt(l.reste)}</td>
          <td style="font-size:11px;max-width:160px;">
            <span style="color:var(--text3);">${l.obs||''}</span>
            ${getAlertLabel(l) ? '<br><span style="font-size:10px;font-weight:700;">' + getAlertLabel(l) + '</span>' : ''}
            ${l.reste > 0 && l.loyer > 0 ? '<br><span style="font-size:10px;color:var(--red);">' + (l.reste/l.loyer).toFixed(1) + ' mois dus</span>' : ''}
          </td>
          <td style="white-space:nowrap;position:relative;">
            <div class="action-menu">
              <button class="action-menu-btn" onclick="toggleActionMenu(this)" style="font-size:18px;padding:4px 10px;">⋯</button>
              <div class="action-dropdown">
                <div class="action-dropdown-item" onclick="openModalPaiement(${l.iid},${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">💳 Paiement</div>
                <div class="action-dropdown-item" onclick="previewMiseEnDemeure(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📄 Lettre</div>
              </div>
            </div>
          </td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    });
  }

  document.getElementById('content').innerHTML = html;
  // Ajouter la barre de recherche en tête
  var c = document.getElementById('content');
  var bar = document.createElement('div');
  bar.style.cssText = 'margin-bottom:14px;';
  bar.innerHTML = '<input type="text" id="search-relances" placeholder="🔍 Rechercher un locataire..." oninput="_filterRelances()" style="width:100%;padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">';
  c.insertBefore(bar, c.firstChild);
}
function _filterRelances() {
  var q = (document.getElementById('search-relances').value||'').toLowerCase().trim();
  document.querySelectorAll('#content tr.relance-row').forEach(function(r) {
    r.style.display = !q || (r.dataset.search||'').indexOf(q) >= 0 ? '' : 'none';
  });
}
async function telechargerTousAlertes() {
  const alertes = getAlertes();
  if (alertes.length === 0) { showToast("Aucun dossier en alerte","accent"); return; }
  showToast("Téléchargement de " + alertes.length + " mises en demeure...", "accent");
  for (const l of alertes) {
    await new Promise(r => setTimeout(r, 300));
    await genDocxMiseEnDemeure(l.id);
  }
  showToast("Tous les documents téléchargés ✓");
}

// ============================================================
// RAPPORT
// ============================================================
function renderRapportPage() {
  document.getElementById('page-title').textContent = 'Rapports';
  document.getElementById('page-sub').textContent = 'Sélectionnez un immeuble';
  document.getElementById('topbar-main-btn').textContent = '📄 Générer';
  document.getElementById('topbar-main-btn').style.display = 'none';

  const imms = getVisibleImmeubles();
  let html = '<div class="cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:8px;">';

  imms.forEach(im => {
    const locs = DATA.locataires.filter(l => l.iid === im.id && l.s !== 'libre');
    const nbImp = locs.filter(l => l.reste > 0).length;
    const totalLoyer = locs.reduce((s,l) => s+l.loyer, 0);
    const totalReste = locs.reduce((s,l) => s+l.reste, 0);

    html += `
      <div class="card" style="cursor:pointer;border-left:4px solid ${im.col};transition:all .15s;"
           onclick="ouvrirRapportImmeuble(${im.id})"
           onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,.12)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--text);">${im.nom}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">📍 ${im.ville}${im.quartier?' · '+im.quartier:''}</div>
          </div>
          <div style="width:36px;height:36px;border-radius:50%;background:${im.col}22;display:flex;align-items:center;justify-content:center;font-size:18px;">🏢</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Locataires</div>
            <div style="font-size:18px;font-weight:700;color:var(--text);">${locs.length}</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Impayés</div>
            <div style="font-size:18px;font-weight:700;color:${nbImp>0?'var(--red)':'var(--green)'};">${nbImp}</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Loyers/mois</div>
            <div style="font-size:13px;font-weight:700;color:var(--accent);">${fmtShort(totalLoyer)}</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Arriérés</div>
            <div style="font-size:13px;font-weight:700;color:${totalReste>0?'var(--red)':'var(--green)'};">${fmtShort(totalReste)}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;background:var(--accent-bg);color:var(--accent);padding:3px 8px;border-radius:99px;font-weight:600;">📊 Voir rapports</span>
        </div>
      </div>`;
  });

  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

function ouvrirRapportImmeuble(iid) {
  const im = DATA.immeubles.find(i => i.id === iid);
  if (!im) return;
  window._currentRapportIid = iid; // for auto-refresh after payment
  window._currentRapportIid = iid;
  
  document.getElementById('page-title').textContent = 'Rapports — ' + im.nom;
  document.getElementById('page-sub').textContent = im.ville + (im.quartier ? ' · ' + im.quartier : '');
  document.getElementById('topbar-main-btn').style.display = 'none';

  const today = new Date();
  const moisActuel = today.getMonth();
  const anneeActuelle = today.getFullYear();

  let html = `
  <!-- Sélecteurs période -->
  <div class="card" style="margin-bottom:16px;">
    <div class="card-header"><div class="card-title">📅 Choisir la période</div></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;padding:4px 0;">
      <div>
        <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px;">Mode</label>
        <div style="display:flex;gap:6px;">
          <button id="btn-mode-mois" class="btn btn-sm ${window._rptMode!=='periode'?'btn-primary':'btn-ghost'}" 
                  onclick="window._rptMode='mois';ouvrirRapportImmeuble(${iid})">Par mois</button>
          <button id="btn-mode-periode" class="btn btn-sm ${window._rptMode==='periode'?'btn-primary':'btn-ghost'}"
                  onclick="window._rptMode='periode';ouvrirRapportImmeuble(${iid})">Par période</button>
        </div>
      </div>
      ${window._rptMode !== 'periode' ? `
      <div>
        <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px;">Mois</label>
        <select class="form-control" style="height:36px;" onchange="window._rptMois=parseInt(this.value);ouvrirRapportImmeuble(${iid})">
          ${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'].map((m,i)=>
            `<option value="${i}" ${(window._rptMois!==undefined?window._rptMois:moisActuel)===i?'selected':''}>${m}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px;">Année</label>
        <select class="form-control" style="height:36px;" onchange="window._rptAnnee=parseInt(this.value);ouvrirRapportImmeuble(${iid})">
          ${[anneeActuelle-1, anneeActuelle, anneeActuelle+1].map(y=>
            `<option value="${y}" ${(window._rptAnnee||anneeActuelle)===y?'selected':''}>${y}</option>`
          ).join('')}
        </select>
      </div>` : `
      <div>
        <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px;">Du</label>
        <input type="date" class="form-control" style="height:36px;" value="${window._rptDeb||anneeActuelle+'-01-01'}"
               onchange="window._rptDeb=this.value;ouvrirRapportImmeuble(${iid})">
      </div>
      <div>
        <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px;">Au</label>
        <input type="date" class="form-control" style="height:36px;" value="${window._rptFin||anneeActuelle+'-12-31'}"
               onchange="window._rptFin=this.value;ouvrirRapportImmeuble(${iid})">
      </div>`}
    </div>
  </div>

  <!-- Actions rapports -->
  <div class="card" style="margin-bottom:16px;">
    <div class="card-header"><div class="card-title">📄 Générer des rapports</div></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;padding:4px 0;">
      <button class="btn btn-primary" onclick="genRapportImmeubleDocx(${iid})">
        📊 Rapport ${window._rptMode==='periode'?'période':'mensuel'} (.docx)
      </button>
      <button class="btn btn-ghost" onclick="previewRapportImmeubleModal(${iid})">
        👁 Aperçu rapport
      </button>
      ${can('canJuridique') ? `
      <button class="btn btn-ghost" onclick="genDocxRelances(${iid})">
        🔔 Relances locataires
      </button>` : ''}
    </div>
  </div>`;

  // ── Tableau locataires avec statut paiement ──
  const locs = DATA.locataires.filter(l => l.iid === iid && l.s !== 'libre');
  const mois = window._rptMois !== undefined ? window._rptMois : moisActuel;
  const annee = window._rptAnnee || anneeActuelle;

  html += `
  <div class="card">
    <div class="card-header">
      <div class="card-title">👥 Locataires — ${im.nom}</div>
      <div style="font-size:12px;color:var(--text3);">${locs.length} locataires actifs</div>
    </div>
    <div class="table-wrap"><table class="tbl">
      <thead><tr>
        <th>Local</th><th>Nom</th><th>Loyer</th>
        <th>Statut ${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'][mois]} ${annee}</th>
        <th>Arriérés</th><th>Actions</th>
      </tr></thead>
      <tbody>
      ${locs.map(l => {
        const paysMois = DATA.paiements.filter(p => {
          if (p.locId !== l.id) return false;
          // Match by moisC/anneeC
          if (p.moisC === mois && p.anneeC === annee) return true;
          // Also match by payment date falling in the selected month
          if (p.date) {
            const d = new Date(p.date);
            if (d.getMonth() === mois && d.getFullYear() === annee) return true;
          }
          return false;
        });
        const totalPaye = paysMois.reduce((s,p)=>s+p.montant,0);
        const statutMois = totalPaye >= l.loyer ? '✓ Payé' : totalPaye > 0 ? '½ Partiel' : '✗ Impayé';
        const couleur = totalPaye >= l.loyer ? 'var(--green)' : totalPaye > 0 ? 'var(--yellow)' : 'var(--red)';
        return `<tr>
          <td>${localBadge(l.appt)}</td>
          <td style="font-weight:600;">${l.nom}</td>
          <td class="td-amount">${fmt(l.loyer)}</td>
          <td><span style="color:${couleur};font-weight:700;font-size:12px;">${statutMois}</span>${totalPaye>0&&totalPaye<l.loyer?`<br><span style="font-size:10px;color:var(--text3);">${fmt(totalPaye)} versé</span>`:''}</td>
          <td class="td-amount ${l.reste>0?'red':'green'}" style="font-size:11px;">${fmtReste(l)}</td>
          <td style="white-space:nowrap;">
            <div class="action-menu">
              <button class="action-menu-btn" onclick="toggleActionMenu(this)">⋯</button>
              <div class="action-dropdown">
                ${can('canRecordPayment')?`<div class="action-dropdown-item" onclick="openModalPaiement(${l.iid},${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">💳 Paiement</div>`:''}
                ${can('canEditLocataires')?`<div class="action-dropdown-item" onclick="editLocataire(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📝 Modifier</div>`:''}
                <div class="action-dropdown-item" onclick="ouvrirFicheSuivi(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📊 Fiche de suivi</div>
                ${can('canJuridique')?`<div class="action-dropdown-item" onclick="previewMiseEnDemeure(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📄 Mise en demeure</div>`:''}
                <div class="action-dropdown-sep"></div>
                ${can('canEditLocataires')?`<div class="action-dropdown-item danger" onclick="supprimerLocataire(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">🗑️ Supprimer</div>`:''}
              </div>
            </div>
          </td>
        </tr>`;
      }).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight:700;background:var(--bg2);">
          <td colspan="2">TOTAL</td>
          <td class="td-amount">${fmt(locs.reduce((s,l)=>s+l.loyer,0))}</td>
          <td>${fmt(DATA.paiements.filter(p=>locs.some(l=>l.id===p.locId)&&p.moisC===mois&&p.anneeC===annee).reduce((s,p)=>s+p.montant,0))} encaissé</td>
          <td class="td-amount red">${fmt(locs.reduce((s,l)=>s+Math.max(0,l.reste),0))}</td>
          <td></td>
        </tr>
      </tfoot>
    </table></div>
  </div>`;

  // Add back button at top of html
  html = `<div style="margin-bottom:12px;">
    <button class="btn btn-ghost" onclick="renderRapportPage()" style="display:flex;align-items:center;gap:6px;">
      ← Tous les immeubles
    </button>
  </div>` + html;
  
  document.getElementById('content').innerHTML = html;
}

function genRapportImmeubleDocx(iid) {
  window._rptIid = iid;
  if (window._rptMode === 'periode') {
    genDocxRapportPeriode();
  } else {
    // Set month/year for mensuel
    const mois = window._rptMois !== undefined ? window._rptMois : new Date().getMonth();
    const annee = window._rptAnnee || new Date().getFullYear();
    window._rptMoisSel = mois;
    window._rptAnneeSel = annee;
    genDocxRapportMensuel();
  }
}

function previewRapportImmeubleModal(iid) {
  window._rptIid = iid;
  previewRapportMensuel(iid);
}


function renderRapportAnnuelPage() {
  document.getElementById('page-title').textContent = 'Rapport Annuel';
  document.getElementById('page-sub').textContent = 'Sélectionnez un immeuble';
  document.getElementById('topbar-main-btn').textContent = '📅 Générer';
  document.getElementById('topbar-main-btn').style.display = 'none';

  const imms = getVisibleImmeubles();
  const annee = new Date().getFullYear();

  let html = '<div class="cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:8px;">';

  imms.forEach(im => {
    const locs = DATA.locataires.filter(l => l.iid === im.id && l.s !== 'libre');
    const paysAnnee = DATA.paiements.filter(p => 
      locs.some(l => l.id === p.locId) && p.anneeC === annee
    );
    const totalEncaisse = paysAnnee.reduce((s,p) => s+p.montant, 0);
    const totalAttendu = locs.reduce((s,l) => s+l.loyer, 0) * 12;
    const tauxRecouvrement = totalAttendu > 0 ? Math.round(totalEncaisse/totalAttendu*100) : 0;

    html += `
      <div class="card" style="cursor:pointer;border-left:4px solid ${im.col};transition:all .15s;"
           onclick="ouvrirRapportAnnuelImmeuble(${im.id})"
           onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,.12)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--text);">${im.nom}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">📍 ${im.ville}${im.quartier?' · '+im.quartier:''}</div>
          </div>
          <div style="background:${im.col}22;color:${im.col};font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;">${annee}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Encaissé ${annee}</div>
            <div style="font-size:13px;font-weight:700;color:var(--green);">${fmtShort(totalEncaisse)}</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Recouvrement</div>
            <div style="font-size:18px;font-weight:700;color:${tauxRecouvrement>=80?'var(--green)':tauxRecouvrement>=50?'var(--yellow)':'var(--red)'};">${tauxRecouvrement}%</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Locataires</div>
            <div style="font-size:18px;font-weight:700;">${locs.length}</div>
          </div>
          <div style="background:var(--bg2);border-radius:8px;padding:8px;">
            <div style="font-size:10px;color:var(--text3);">Arriérés</div>
            <div style="font-size:13px;font-weight:700;color:var(--red);">${fmtShort(locs.reduce((s,l)=>s+Math.max(0,l.reste),0))}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          <span style="font-size:10px;background:var(--accent-bg);color:var(--accent);padding:3px 8px;border-radius:99px;font-weight:600;">📅 Voir rapport annuel</span>
        </div>
      </div>`;
  });

  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

function ouvrirRapportAnnuelImmeuble(iid) {
  const im = DATA.immeubles.find(i => i.id === iid);
  if (!im) return;
  const annee = window._rapAnnee || new Date().getFullYear();

  document.getElementById('page-title').textContent = 'Rapport Annuel — ' + im.nom;
  document.getElementById('page-sub').textContent = im.ville + (im.quartier ? ' · ' + im.quartier : '');
  document.getElementById('topbar-main-btn').style.display = 'none';

  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const locs = DATA.locataires.filter(l => l.iid === iid && l.s !== 'libre');

  let html = `
  <!-- Sélecteur année -->
  <div class="card" style="margin-bottom:16px;">
    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;padding:4px 0;">
      <div>
        <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px;">Année</label>
        <select class="form-control" style="height:36px;" onchange="window._rapAnnee=parseInt(this.value);ouvrirRapportAnnuelImmeuble(${iid})">
          ${[annee-2,annee-1,annee,annee+1].map(y=>
            `<option value="${y}" ${y===annee?'selected':''}>${y}</option>`
          ).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="window._rapAnnIid=${iid};genDocxRapportAnnuel()">
        📊 Télécharger rapport annuel (.docx)
      </button>
    </div>
  </div>

  <!-- Tableau mensuel par locataire -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">📅 Synthèse annuelle ${annee} — ${im.nom}</div>
    </div>
    <div class="table-wrap" style="overflow-x:auto;">
      <table class="tbl" style="min-width:900px;">
        <thead>
          <tr>
            <th style="min-width:140px;">Locataire</th>
            <th>Local</th>
            ${MOIS.map(m=>`<th style="min-width:60px;font-size:10px;">${m.substring(0,3)}</th>`).join('')}
            <th>Total</th>
            <th>Arriérés</th>
          </tr>
        </thead>
        <tbody>
          ${locs.map(l => {
            let totalAnnee = 0;
            const moisCells = MOIS.map((moisNom, moisIdx) => {
              const pays = DATA.paiements.filter(p => 
                p.locId === l.id && p.moisC === moisIdx && p.anneeC === annee
              );
              const total = pays.reduce((s,p)=>s+p.montant,0);
              totalAnnee += total;
              if (total === 0) return `<td style="background:#fff5f5;font-size:10px;text-align:center;color:#ccc;">–</td>`;
              if (total >= l.loyer) return `<td style="background:#f0fff4;font-size:10px;text-align:center;color:var(--green);font-weight:700;">✓</td>`;
              return `<td style="background:#fffbf0;font-size:10px;text-align:center;color:var(--yellow);font-weight:700;" title="${fmt(total)}">${Math.round(total/l.loyer*100)}%</td>`;
            }).join('');
            return `<tr>
              <td style="font-weight:600;font-size:12px;">${l.nom}</td>
              <td>${l.appt||'–'}</td>
              ${moisCells}
              <td class="td-amount" style="font-size:11px;">${fmtShort(totalAnnee)}</td>
              <td class="td-amount red" style="font-size:11px;">${l.reste>0?fmtShort(l.reste):'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;background:var(--bg2);">
            <td colspan="2">TOTAL</td>
            ${MOIS.map((_,moisIdx) => {
              const total = DATA.paiements.filter(p=>locs.some(l=>l.id===p.locId)&&p.moisC===moisIdx&&p.anneeC===annee).reduce((s,p)=>s+p.montant,0);
              return `<td style="font-size:10px;text-align:center;">${total>0?fmtShort(total):''}</td>`;
            }).join('')}
            <td class="td-amount">${fmtShort(DATA.paiements.filter(p=>locs.some(l=>l.id===p.locId)&&p.anneeC===annee).reduce((s,p)=>s+p.montant,0))}</td>
            <td class="td-amount red">${fmtShort(locs.reduce((s,l)=>s+Math.max(0,l.reste),0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;font-size:11px;">
      <span style="color:var(--green);">✓ = Payé complet</span>
      <span style="color:var(--yellow);">% = Paiement partiel</span>
      <span style="color:#ccc;">– = Non payé</span>
    </div>
  </div>`;

    // Add back button at top
  html = `<div style="margin-bottom:12px;">
    <button class="btn btn-ghost" onclick="renderRapportAnnuelPage()" style="display:flex;align-items:center;gap:6px;">
      ← Tous les immeubles
    </button>
  </div>` + html;
  
}


function ouvrirLiberation(locId) {
  if (!can('canEditLocataires')) {
    showToast('Accès refusé – modification non autorisée', 'red');
    return;
  }
  const l = DATA.locataires.find(x=>x.id===locId);
  if (!l) return;
  const im = DATA.immeubles.find(i=>i.id===l.iid);
  document.getElementById('lib-loc-id').value = locId;
  document.getElementById('lib-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('lib-solde').value = l.reste||0;
  document.getElementById('lib-obs').value = '';
  document.getElementById('lib-info').innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <div><div style="font-size:10px;color:var(--text3);">Locataire</div><div style="font-weight:600;">${l.nom}</div></div>
      <div><div style="font-size:10px;color:var(--text3);">Local</div><div style="font-weight:600;">${localBadge(l.appt)}</div></div>
      <div><div style="font-size:10px;color:var(--text3);">Immeuble</div><div style="font-weight:600;">${im?im.nom.split(' ')[0]:'–'}</div></div>
      <div><div style="font-size:10px;color:var(--text3);">Reste dû</div><div style="font-weight:600;color:var(--red);">${fmt(l.reste)}</div></div>
    </div>`;
  document.getElementById('modal-liberation').classList.add('open');
}

function savePaiement() {
  if (!can('canRecordPayment')) {
    showToast('Accès refusé – enregistrement non autorisé', 'red');
    return;
  }
  const locId = parseInt(document.getElementById('pay-loc').value);
  const montant = parseInt(document.getElementById('pay-montant').value)||0;
  const date = document.getElementById('pay-date').value;
  if (!locId || !montant || !date) {
    showToast('Locataire, date et montant obligatoires', 'red');
    return;
  }
  const type = document.getElementById('pay-type').value;
  const mode = document.getElementById('pay-mode').value;
  const note = document.getElementById('pay-note').value.trim();
  const remisAuBailleur = document.getElementById('pay-remis-bailleur') ? document.getElementById('pay-remis-bailleur').checked : false;
  const l = DATA.locataires.find(x => x.id === locId);
  const today = new Date();
  const moisCourant = today.getMonth();
  const anneeCourante = today.getFullYear();

  if (type === 'loyer' && l && l.loyer > 0) {
    // Période manuelle sélectionnée ?
    const periodeVal = document.getElementById('pay-periode') ? document.getElementById('pay-periode').value : '';
    if (periodeVal) {
      const parts = periodeVal.split('-');
      const pAnnee = parseInt(parts[0]), pMois = parseInt(parts[1]);
      DATA.paiements.push({
        id: DATA.nextPayId++, locId, date, montant,
        moisC: pMois, anneeC: pAnnee,
        moisFin: pMois, anneeFin: pAnnee,
        type, mode, note, remisAuBailleur
      });
      l.reste = Math.max(0, l.reste - montant);
      l.s = l.reste === 0 ? 'payé' : 'impayé';
      showToast('Paiement enregistré ✓');
      saveData();
      if (SESSION) { savePaiementToSupabase(DATA.paiements[DATA.paiements.length-1]); saveLocataireToSupabase(l); }
      if (typeof notifPaiementRecu === 'function') notifPaiementRecu(l, montant);
      closeModals();
      if (currentPage === 'rapport' && window._currentRapportIid) ouvrirRapportImmeuble(window._currentRapportIid);
      else renderCurrent();
      return;
    }
    // Determine which months this payment covers
    const moisCouverts = calculerMoisCouverts(l, montant);

    if (moisCouverts.length === 0) {
      // No arrears - payment goes to current month (advance or new locataire)
      DATA.paiements.push({
        id: DATA.nextPayId++, locId, date, montant,
        moisC: moisCourant, anneeC: anneeCourante,
        moisFin: moisCourant, anneeFin: anneeCourante,
        type, mode, note, remisAuBailleur
      });
    } else {
      // Distribute across months
      for (const mc of moisCouverts) {
        DATA.paiements.push({
          id: DATA.nextPayId++, locId, date,
          montant: mc.montant,
          moisC: mc.mois, anneeC: mc.annee,
          moisFin: mc.mois, anneeFin: mc.annee,
          type, mode, remisAuBailleur,
          note: moisCouverts.length > 1 ? (note || 'Paiement groupé') : note
        });
      }
    }

    // Update reste
    l.reste = Math.max(0, l.reste - montant);
    l.s = l.reste === 0 ? 'payé' : 'impayé';

    // Toast
    if (l.reste === 0) {
      showToast('Paiement enregistré ✓ — À jour !', 'green');
    } else {
      const moisR = Math.ceil(l.reste / l.loyer);
      showToast('Paiement de ' + fmt(montant) + ' enregistré — ' + moisR + ' mois restants');
    }

  } else {
    // Caution or other - simple entry
    DATA.paiements.push({
      id: DATA.nextPayId++, locId, date, montant,
      moisC: moisCourant, anneeC: anneeCourante,
      moisFin: moisCourant, anneeFin: anneeCourante,
      type, mode, note, remisAuBailleur
    });
    showToast('Paiement de ' + fmt(montant) + ' enregistré ✓');
  }

  saveData();
  // Sync Supabase
  if (SESSION) {
    DATA.paiements.filter(p => p.locId === locId).forEach(p => savePaiementToSupabase(p));
    const loc = DATA.locataires.find(l => l.id === locId);
    if (loc) saveLocataireToSupabase(loc);
  }
  // Notifier le locataire via OneSignal
  if (typeof notifPaiementRecu === 'function' && l) {
    notifPaiementRecu(l, montant);
  }
  closeModals();
  // If on rapport immeuble page, refresh it
  if (currentPage === 'rapport' && window._currentRapportIid) {
    ouvrirRapportImmeuble(window._currentRapportIid);
  } else {
    renderCurrent();
  }
}


// ============================================================
// MODAL – IMMEUBLE
// ============================================================
function saveNouveauApresLib() {
  const nom = document.getElementById('nal-nom').value.trim();
  const loyer = parseInt(document.getElementById('nal-loyer').value)||0;
  if (!nom||!loyer) { showToast('Nom et loyer obligatoires','red'); return; }
  const iid = parseInt(document.getElementById('nal-iid').value);
  const appt = document.getElementById('nal-appt').value;
  const type = document.getElementById('nal-type').value;
  const caution = parseInt(document.getElementById('nal-caution').value)||0;
  const avance = parseInt(document.getElementById('nal-avance').value)||0;
  const entree = document.getElementById('nal-entree').value;
  const obs = document.getElementById('nal-obs').value.trim();
  // Remplacer le locataire libre sur ce local
  const existing = DATA.locataires.find(l=>l.iid===iid&&l.appt===appt&&l.s==='libre');
  const waVal = document.getElementById('nal-whatsapp') ? document.getElementById('nal-whatsapp').value.trim() : '';
  const obj = { nom, tel: document.getElementById('nal-tel').value.trim(), whatsapp: waVal || undefined, iid, appt, type, loyer, caution, entree, obs: obs||(avance>0?'Payé '+avance+' mois d\'avance':''), reste:0, s:'payé' };
  if (existing) {
    Object.assign(existing, obj);
  } else {
    obj.id = DATA.nextLocId++;
    DATA.locataires.push(obj);
  }
  // Enregistrer caution comme paiement
  if (caution>0) {
    DATA.paiements.push({ id:DATA.nextPayId++, locId: existing?existing.id:obj.id, date:entree, montant:caution, moisC:new Date(entree).getMonth(), anneeC:new Date(entree).getFullYear(), type:'caution', mode:'especes', note:'Caution entrée' });
  }
  // Enregistrer avance
  if (avance>0) {
    for(let i=0;i<avance;i++){
      const d=new Date(entree); d.setMonth(d.getMonth()+i);
      DATA.paiements.push({ id:DATA.nextPayId++, locId:existing?existing.id:obj.id, date:entree, montant:loyer, moisC:d.getMonth(), anneeC:d.getFullYear(), type:'loyer', mode:'especes', note:'Avance mois '+(i+1) });
    }
  }
  saveData(); closeModals();
  showToast('Nouveau locataire enregistré ✓');
  // Sync Supabase
  if (SESSION) {
    const newLoc = DATA.locataires[DATA.locataires.length - 1];
    if (newLoc) saveLocataireToSupabase(newLoc);
  }
  renderCurrent();
}

async function confirmerLiberation() {
  const locId = parseInt(document.getElementById('lib-loc-id').value);
  const l = DATA.locataires.find(x=>x.id===locId);
  if (!l) return;
  const dateSortie = document.getElementById('lib-date').value;
  const soldeFinal = parseInt(document.getElementById('lib-solde').value)||0;
  const motif = document.getElementById('lib-motif').value;
  const obs = document.getElementById('lib-obs').value.trim();
  // Archiver
  if (!DATA.archives) DATA.archives = [];
  DATA.archives.push({
    ...l,
    archiveId: Date.now(),
    dateSortie, soldeFinal, motif, obsDepart: obs,
    dateArchivage: new Date().toISOString(),
    paiements: DATA.paiements.filter(p=>p.locId===locId),
  });
  // Sync Supabase archives (fire & forget — avant modification du local)
  var _locSnap = Object.assign({}, l);
  var _paieSnap = DATA.paiements.filter(function(p){return p.locId===locId;});
  await archiverLocataireSupabase(_locSnap, motif, _paieSnap, dateSortie, obs);
  // Mettre le local en libre
  l.nom = '(Libre)';
  l.tel = '';
  l.s = 'libre';
  l.reste = 0;
  l.obs = 'Libre depuis le ' + dateSortie.split('-').reverse().join('/');
  l.entree = '';
  saveData();
  closeModals();
  showToast('Local libéré et archivé ✓');
  // Proposer nouveau locataire
  setTimeout(() => {
    document.getElementById('nal-iid').value = l.iid;
    document.getElementById('nal-appt').value = l.appt;
    document.getElementById('nal-type').value = l.type||'appartement';
    document.getElementById('nal-entree').value = new Date().toISOString().split('T')[0];
    document.getElementById('nal-nom').value='';
    document.getElementById('nal-tel').value='';
    if (document.getElementById('nal-whatsapp')) document.getElementById('nal-whatsapp').value='';
    document.getElementById('nal-loyer').value='';
    document.getElementById('nal-caution').value='';
    document.getElementById('nal-avance').value='';
    document.getElementById('nal-obs').value='';
    const im = DATA.immeubles.find(i=>i.id===l.iid);
    document.getElementById('nal-local-info').innerHTML = `✅ Local ${localBadge(l.appt)} – ${im?im.nom:''} est maintenant libre`;
    document.getElementById('modal-nouveau-apres-lib').classList.add('open');
  }, 400);
  renderCurrent();
}

function openModalPaiement(iid, locId) {
  if (!can('canRecordPayment')) { showToast('Accès refusé', 'red'); return; }
  const immSel = document.getElementById('pay-imm');
  if (immSel) {
    immSel.innerHTML = getVisibleImmeubles().map(im =>
      `<option value="${im.id}" ${im.id==iid?'selected':''}>${im.nom}</option>`
    ).join('');
  }
  updatePayLoc(iid, locId);
  const today = new Date();
  document.getElementById('pay-date').value = today.toISOString().split('T')[0];
  const cb = document.getElementById('pay-remis-bailleur');
  if (cb) cb.checked = false;
  updatePayPeriode();
  document.getElementById('modal-paiement').classList.add('open');
}

function updatePayLoc(iid, preLocId) {
  const immId = iid || parseInt(document.getElementById('pay-imm').value);
  const locs = DATA.locataires.filter(l => l.iid === immId && l.s !== 'libre');
  const sel = document.getElementById('pay-loc');
  if (sel) {
    sel.innerHTML = locs.map(l =>
      `<option value="${l.id}" ${l.id==preLocId?'selected':''}>${l.appt ? l.appt+' — ' : ''}${l.nom}</option>`
    ).join('');
  }
  updatePayPeriode();
}

function updatePayPeriode() {
  const sel = document.getElementById('pay-periode');
  if (!sel) return;
  const locId = parseInt(document.getElementById('pay-loc').value);
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l || !l.loyer) { sel.innerHTML = '<option value="">— Automatique</option>'; return; }

  const MC = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const now = new Date();
  const jour = l.jourPaiement || 1;

  // Déterminer le mois de début
  let startY, startM;
  if (l.entree) {
    const d = new Date(l.entree); startY = d.getFullYear(); startM = d.getMonth();
  } else {
    const moisDus = l.loyer > 0 && l.reste > 0 ? Math.ceil(l.reste / l.loyer) : 1;
    const d = new Date(now.getFullYear(), now.getMonth() - moisDus + 1, 1);
    startY = d.getFullYear(); startM = d.getMonth();
  }

  // Calculer le cumul payé par mois
  const cumuls = {};
  DATA.paiements
    .filter(p => p.locId === locId && p.type !== 'caution')
    .forEach(p => {
      const k = p.anneeC + '-' + p.moisC;
      cumuls[k] = (cumuls[k] || 0) + p.montant;
    });

  // Construire la liste des périodes
  let options = '<option value="">— Automatique (plus ancien non soldé)</option>';
  let cy = startY, cm = startM;
  while (cy < now.getFullYear() || (cy === now.getFullYear() && cm <= now.getMonth())) {
    const k = cy + '-' + cm;
    const paye = cumuls[k] || 0;
    const statut = paye >= l.loyer ? ' ✓' : paye > 0 ? ' (partiel)' : '';
    const label = jour + ' ' + MC[cm] + ' - ' + jour + ' ' + MC[(cm + 1) % 12] + ' ' + cy + statut;
    options += `<option value="${cy}-${cm}">${label}</option>`;
    if (++cm > 11) { cm = 0; cy++; }
  }
  sel.innerHTML = options;
}

function editLocataire(locId) {
  if (!can('canEditLocataires')) { showToast('Accès refusé', 'red'); return; }
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  document.getElementById('loc-id').value = l.id;
  document.getElementById('loc-nom').value = l.nom;
  document.getElementById('loc-tel').value = l.tel || '';
  if (document.getElementById('loc-whatsapp')) document.getElementById('loc-whatsapp').value = l.whatsapp || '';
  document.getElementById('loc-imm').value = l.iid;
  document.getElementById('loc-appt').value = l.appt || '';
  document.getElementById('loc-type').value = l.type || 'appartement';
  document.getElementById('loc-loyer').value = l.loyer;
  document.getElementById('loc-reste').value = l.reste;
  document.getElementById('loc-caution').value = l.caution || 0;
  document.getElementById('loc-entree').value = l.entree || '';
  document.getElementById('loc-obs').value = l.obs || '';
  // Populate immeuble select
  const immSelEdit = document.getElementById('loc-imm');
  if (immSelEdit) {
    immSelEdit.innerHTML = getVisibleImmeubles().map(im => 
      `<option value="${im.id}" ${im.id==l.iid?'selected':''}>${im.nom}</option>`
    ).join('');
    immSelEdit.value = l.iid;
  }
  document.getElementById('modal-loc-title').textContent = '✎ Modifier locataire';
  const moisEl = document.getElementById('loc-mois-dus');
  if (moisEl && l.loyer > 0) moisEl.value = Math.round(Math.max(0, l.reste) / l.loyer);
  // Set jour paiement
  const jourEl = document.getElementById('loc-jour-paiement');
  if (jourEl) jourEl.value = l.jourPaiement || 1;
  document.getElementById('modal-locataire').classList.add('open');
}

function ouvrirGenDocx(locId) {
  if (!can('canJuridique')) { showToast('Accès refusé', 'red'); return; }
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  const im = DATA.immeubles.find(i => i.id === l.iid);
  // Pre-fill docx modal
  const nomEl = document.getElementById('docx-loc-nom');
  const immEl = document.getElementById('docx-imm-nom');
  if (nomEl) nomEl.textContent = l.nom;
  if (immEl) immEl.textContent = im ? im.nom : '';
  document.getElementById('docx-loc-id').value = locId;
  document.getElementById('modal-docx').classList.add('open');
}

function ouvrirHistoriqueLocal(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  const pays = DATA.paiements.filter(p => p.locId === locId)
    .sort((a,b) => new Date(b.date) - new Date(a.date));
  const im = DATA.immeubles.find(i => i.id === l.iid);
  let html = `<div class="modal-header"><h3>📋 Historique — ${l.nom}</h3></div>`;
  html += `<div style="font-size:12px;color:var(--text3);margin-bottom:12px;">${im?im.nom:''} · ${l.appt||''}</div>`;
  if (!pays.length) {
    html += '<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Aucun paiement enregistré</div></div>';
  } else {
    html += '<div class="table-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Période</th><th>Montant</th><th>Mode</th></tr></thead><tbody>';
    pays.forEach(p => {
      html += `<tr>
        <td>${p.date||'–'}</td>
        <td>${MNOMS[p.moisC]||''} ${p.anneeC}</td>
        <td class="td-amount">${fmt(p.montant)}</td>
        <td>${p.mode||'espèces'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }
  html += `<div class="modal-footer"><button class="btn btn-ghost" onclick="closeModals()">Fermer</button></div>`;
  // Show in a simple modal
  const overlay = document.getElementById('modal-apercu-recu') || document.getElementById('modal-locataire');
  if (overlay) {
    const inner = overlay.querySelector('.modal');
    if (inner) { inner.innerHTML = html; overlay.classList.add('open'); }
  }
}


// Affichage intelligent du reste dû
function fmtReste(l) {
  if (!l || l.reste <= 0) {
    if (l && l.reste <0) {
      const moisAv = Math.floor(Math.abs(l.reste) / l.loyer);
      return moisAv > 0 ? '✓ ' + moisAv + ' mois d\'avance' : '✓ Crédit ' + fmt(Math.abs(l.reste));
    }
    return '✓ À jour';
  }
  const loyer = l.loyer || 1;
  const moisExact = l.reste / loyer;
  const moisEntier = Math.floor(moisExact);
  const fraction = moisExact - moisEntier;
  
  if (fraction === 0) {
    // Exact number of months
    return moisEntier + ' mois (' + fmt(l.reste) + ')';
  } else if (moisEntier === 0) {
    // Less than 1 month
    const pct = Math.round(fraction * 100);
    return pct + '% d\'un mois (' + fmt(l.reste) + ')';
  } else {
    // Mixed: e.g. 1.5 months
    const pct = Math.round(fraction * 100);
    return moisEntier + ' mois + ' + pct + '% (' + fmt(l.reste) + ')';
  }
}

// Badge couleur selon statut
function statutBadge(l) {
  if (!l) return '';
  if (l.reste <0) return '<span class="badge badge-blue">Avance</span>';
  if (l.reste === 0) return '<span class="badge badge-green">À jour</span>';
  const mois = l.reste / (l.loyer || 1);
  if (mois <1) return '<span class="badge badge-orange">Partiel</span>';
  if (mois <2) return '<span class="badge badge-red">1 mois</span>';
  return '<span class="badge badge-red">' + Math.floor(mois) + '+ mois</span>';
}

function autoJourPaiement() {
  const entree = document.getElementById('loc-entree').value;
  const jourEl = document.getElementById('loc-jour-paiement');
  if (entree && jourEl) {
    const jour = new Date(entree).getDate();
    jourEl.value = Math.min(jour, 28);
  }
}

function calcMoisDus() {
  const loyer = parseInt(document.getElementById('loc-loyer').value)||0;
  const reste = parseInt(document.getElementById('loc-reste').value)||0;
  const moisEl = document.getElementById('loc-mois-dus');
  if (moisEl && loyer > 0) moisEl.value = Math.round(reste / loyer);
}
function calcResteFromMois() {
  const loyer = parseInt(document.getElementById('loc-loyer').value)||0;
  const mois = parseInt(document.getElementById('loc-mois-dus').value)||0;
  const resteEl = document.getElementById('loc-reste');
  if (resteEl) resteEl.value = mois * loyer;
}

async function saveLocataire() {
  if (!can('canEditLocataires')) { showToast('Accès refusé', 'red'); return; }
  const nom = document.getElementById('loc-nom') ? document.getElementById('loc-nom').value.trim() : '';
  const loyerVal = document.getElementById('loc-loyer') ? document.getElementById('loc-loyer').value.trim() : '';
  const loyer = parseInt(loyerVal) || 0;

  if (!nom) { showToast('Le nom du locataire est obligatoire', 'red'); return; }
  if (!loyerVal && loyerVal !== '0') { showToast('Le loyer mensuel est obligatoire', 'red'); return; }
  
  const existId = parseInt(document.getElementById('loc-id').value)||0;

  // Verification archives pour nouveau locataire
  if (!existId || existId === 0) {
    var _telChk = document.getElementById("loc-tel") ? document.getElementById("loc-tel").value.trim() : "";
    var _ant = await Promise.race([
      verifierLocataireArchives(nom, _telChk),
      new Promise(function(r){ setTimeout(function(){ r([]); }, 3000); })
    ]);
    if (_ant && _ant.length > 0) {
      var _a = _ant[0];
      var _emo = _a.score >= 70 ? "Bon" : _a.score >= 40 ? "Moyen" : "Mauvais";
      var _msg = "ANTECEDENT DETECTE\n\n" + _a.nom + " a deja ete locataire\n" +
        "Immeuble: " + (_a.immeuble_nom||"") + " Local " + (_a.local_num||"") + "\n" +
        "Periode: " + (_a.date_entree||"?") + " a " + (_a.date_sortie||"?") + "\n" +
        "Score: " + _a.score + "/100 (" + _emo + ")\n" +
        (_a.montant_impaye > 0 ? "Impayes: " + Number(_a.montant_impaye).toLocaleString() + " FCFA\n" : "") +
        (_a.note ? "Note: " + _a.note + "\n" : "") +
        "\nAjouter quand meme ?";
      if (!confirm(_msg)) return;
    }
  }
  const reste = parseInt(document.getElementById('loc-reste').value)||0;
  const moisDus = loyer > 0 ? Math.round(reste / loyer) : 0;
  
  const jourPaiement = parseInt(document.getElementById('loc-jour-paiement').value)||1;
  const obj = {
    nom, loyer, reste,
    tel:          document.getElementById('loc-tel').value.trim(),
    whatsapp:     (document.getElementById('loc-whatsapp') ? document.getElementById('loc-whatsapp').value.trim() : '') || undefined,
    iid:          parseInt(document.getElementById('loc-imm').value),
    appt:         document.getElementById('loc-appt').value.trim(),
    type:         document.getElementById('loc-type').value,
    caution:      parseInt(document.getElementById('loc-caution').value)||0,
    entree:       document.getElementById('loc-entree').value,
    jourPaiement: jourPaiement,
    obs:          document.getElementById('loc-obs').value.trim(),
    s:            reste > 0 ? 'impayé' : 'payé',
  };

  if (existId && existId > 0) {
    // Update existing
    const locIdx = DATA.locataires.findIndex(l => l.id === existId);
    if (locIdx >= 0) {
      DATA.locataires[locIdx] = { ...DATA.locataires[locIdx], ...obj, id: existId };
      showToast('Locataire modifié ✓');
    } else {
      // Not found - add as new
      obj.id = existId;
      DATA.locataires.push(obj);
      showToast('Locataire enregistré ✓');
    }
  } else {
    // Check if there's a libre local with same appt in same immeuble
    const libreIdx = DATA.locataires.findIndex(l => 
      l.iid === obj.iid && l.appt === obj.appt && l.s === 'libre'
    );
    if (libreIdx >= 0) {
      // Update the libre local with new tenant info
      const libreId = DATA.locataires[libreIdx].id;
      obj.id = libreId; // ← set obj.id so caution payment can use it
      DATA.locataires[libreIdx] = { ...DATA.locataires[libreIdx], ...obj, id: libreId };
      showToast('Locataire ajouté ✓');
    } else {
      // New locataire
      obj.id = DATA.nextLocId++;
      DATA.locataires.push(obj);
      showToast('Locataire ajouté ✓');
    }
  }
  
  // Auto caution payment for new locataires
  // finalId must be calculated AFTER locataire is saved (obj.id assigned)
  if (!(existId && existId > 0)) {
    const cautionVal = parseInt(document.getElementById('loc-caution').value)||0;
    const entreeVal = document.getElementById('loc-entree').value || new Date().toISOString().split('T')[0];
    if (cautionVal > 0) {
      // obj.id is now set by the save block above
      const newLocId = obj.id;
      const entreeDate = new Date(entreeVal);
      DATA.paiements.push({
        id: DATA.nextPayId++,
        locId: newLocId,
        date: entreeVal,
        montant: cautionVal,
        moisC: entreeDate.getMonth(),
        anneeC: entreeDate.getFullYear(),
        moisFin: entreeDate.getMonth(),
        anneeFin: entreeDate.getFullYear(),
        type: 'caution',
        mode: 'especes',
        note: "Caution entrée"
      });
    }
  }

  // ── Étape 2 : création automatique compte locataire ──────────────────────
  const isNewLoc = !(existId && existId > 0);
  const _ver = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
  if (isNewLoc && obj.tel) {
    const telClean = obj.tel.replace(/[^0-9]/g, '');
    const existingUser = USERS.find(function(u) {
      return u.role === 'locataire' && u.version === _ver &&
             u.tel && u.tel.replace(/[^0-9]/g,'') === telClean;
    });
    if (existingUser) {
      existingUser.locId = obj.id;
      saveUsers();
    } else {
      USERS.push({
        id: 'loc_auto_' + obj.id + '_' + Date.now(),
        version: _ver,
        role: 'locataire',
        nom: obj.nom,
        username: telClean,
        tel: obj.tel,
        password: null,
        locId: obj.id,
        iid: obj.iid,
        pin: 'craa',
        actif: true,
        customPerms: {}
      });
      // Synchroniser le PIN sur DATA.locataires pour que loginLocataire fonctionne
      obj.pin = obj.pin || 'craa';
      obj.firstLogin = true;
      saveUsers();
    }
  }

  saveData();
  closeModals();
  renderCurrent();
  
  const finalId = (existId && existId > 0) ? existId : obj.id;
  const saved = DATA.locataires.find(l => l.id === finalId);
  if (saved && moisDus >= 2) {
    setTimeout(() => showToast('⚠️ ' + saved.nom + ' : ' + moisDus + ' mois de retard', 'red'), 300);
  }
}

// ============================================================
// FICHE DE SUIVI DES LOYERS — PDF PAYSAGE
// ============================================================

function ouvrirFicheSuivi(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;

  const currentYear = new Date().getFullYear();
  const entreeYear  = l.entree ? new Date(l.entree).getFullYear() : null;
  const moisDus     = (l.loyer > 0 && l.reste > 0) ? Math.ceil(l.reste / l.loyer) : 1;
  const calcStart   = new Date(new Date().getFullYear(), new Date().getMonth() - moisDus + 1, 1).getFullYear();
  const firstYear   = entreeYear ? Math.min(entreeYear, currentYear) : calcStart;
  const years = [];
  for (let y = firstYear; y <= currentYear + 1; y++) years.push(y);
  
  // Build fiche directly with current year
  const fd = buildFicheData(locId, currentYear);
  if (!fd) return;
  const { lignes, im } = fd;
  
  const ficheContent = genFicheHtml(fd);
  
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <h3 style="margin:0;">📋 Fiche de suivi — ${l.nom}</h3>
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:12px;color:var(--text3);">Année :</label>
        <select id="fiche-annee" onchange="rafraichirFiche(${locId})" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg2);font-size:13px;">
          ${years.map(y => `<option value="${y}" ${y===currentYear?'selected':''}>${y}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="fiche-preview">${ficheContent}</div>
    <div class="modal-footer" style="margin-top:12px;">
      <button class="btn btn-ghost" onclick="closeModals()">Fermer</button>
      <button class="btn btn-primary" onclick="downloadFicheSuivi(${locId})">⬇ Télécharger PDF</button>
    </div>
  `;
  
  const modal = document.getElementById('modal-apercu-recu');
  if (modal) {
    modal.querySelector('.modal').innerHTML = html;
    modal.classList.add('open');
  }
}

function rafraichirFiche(locId) {
  const anneeEl = document.getElementById('fiche-annee');
  const annee = anneeEl ? parseInt(anneeEl.value) : new Date().getFullYear();
  const fd = buildFicheData(locId, annee);
  if (!fd) return;
  const el = document.getElementById('fiche-preview');
  if (el) el.innerHTML = genFicheHtml(fd);
}

function genFicheHtml(fd) {
  const { l, im, lignes, annee } = fd;
  const fmt = n => Number(n).toLocaleString('fr-FR');
  const td  = 'border:1px solid #ddd;padding:4px 6px;vertical-align:top;';

  const rows = lignes.map((lg, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
    if (lg.versements.length === 0) {
      return `<tr style="background:${bg};">
        <td style="${td}font-weight:600;">${lg.periode}</td>
        <td style="${td}"></td><td style="${td}"></td><td style="${td}"></td>
        <td style="${td}"></td><td style="${td}"></td><td style="${td}"></td>
      </tr>`;
    }
    const montants = lg.versements.map(v => fmt(v.montant)).join('<br>');
    const restes   = lg.versements.map(v => `<span style="color:${v.reste > 0 ? '#e74c3c' : ''}">${v.reste === 0 ? '0' : fmt(v.reste)}</span>`).join('<br>');
    const dates    = lg.versements.map(v => v.date ? new Date(v.date).toLocaleDateString('fr-FR') : '').join('<br>');
    const modes    = lg.versements.map(v => v.mode || '').join('<br>');
    const obs      = lg.versements.length > 1 ? lg.versements.length + ' versements' : (lg.versements[0].note || '');
    return `<tr style="background:${bg};">
      <td style="${td}font-weight:600;">${lg.periode}</td>
      <td style="${td}text-align:center;color:${lg.statut ? '#27ae60' : ''};">${lg.statut}</td>
      <td style="${td}text-align:right;">${montants}</td>
      <td style="${td}text-align:right;">${restes}</td>
      <td style="${td}text-align:center;">${dates}</td>
      <td style="${td}text-align:center;">${modes}</td>
      <td style="${td}">${obs}</td>
    </tr>`;
  }).join('');

  const total = lignes.reduce((s, lg) => s + lg.totalVerse, 0);

  return `
    <div style="font-family:Arial,sans-serif;font-size:11px;padding:8px;">
      <div style="text-align:center;font-size:15px;font-weight:900;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Fiche de Suivi des Loyers</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:10px;border:1px solid #333;padding:6px;">
        <div><strong>Immeuble :</strong> ${im ? im.nom : ''}</div>
        <div><strong>Nom locataire :</strong> ${l.nom}</div>
        <div><strong>N° local :</strong> ${l.appt || '–'}</div>
        <div><strong>Type :</strong> ${l.type || 'Appartement'}</div>
        <div><strong>Adresse :</strong> ${im ? im.ville + (im.quartier ? ' – ' + im.quartier : '') : ''}</div>
        <div><strong>Loyer :</strong> ${l.loyer.toLocaleString('fr-FR')} FCFA</div>
        <div><strong>Année :</strong> ${annee}</div>
        <div><strong>Date d\'entrée :</strong> ${l.entree ? new Date(l.entree).toLocaleDateString('fr-FR') : '–'}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:#0a1628;color:#fff;">
            <th style="border:1px solid #555;padding:4px 6px;text-align:left;">Période</th>
            <th style="border:1px solid #555;padding:4px 6px;">Statut</th>
            <th style="border:1px solid #555;padding:4px 6px;">Montant versé</th>
            <th style="border:1px solid #555;padding:4px 6px;">Reste</th>
            <th style="border:1px solid #555;padding:4px 6px;">Date règlement</th>
            <th style="border:1px solid #555;padding:4px 6px;">Mode règlement</th>
            <th style="border:1px solid #555;padding:4px 6px;width:20%;">Observations</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f0f0f0;font-weight:700;">
            <td style="border:1px solid #ddd;padding:4px 6px;" colspan="2">TOTAL</td>
            <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;">${total.toLocaleString('fr-FR')} FCFA</td>
            <td colspan="4" style="border:1px solid #ddd;padding:4px 6px;"></td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:16px;display:flex;justify-content:space-between;font-size:10px;">
        <div>Signature du locataire : _______________________</div>
        <div>Signature du gestionnaire : _______________________</div>
      </div>
    </div>
  `;
}


function buildFicheData(locId, annee) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return null;
  const im = DATA.immeubles.find(i => i.id === l.iid);

  const MC   = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const jour = l.jourPaiement || 1;
  const now  = new Date();

  // ── Mois de départ ──
  let startY, startM;
  if (l.entree) {
    const d = new Date(l.entree);
    startY = d.getFullYear(); startM = d.getMonth();
  } else {
    const moisDus = (l.loyer > 0 && l.reste > 0) ? Math.ceil(l.reste / l.loyer) : 1;
    const d = new Date(now.getFullYear(), now.getMonth() - moisDus + 1, 1);
    startY = d.getFullYear(); startM = d.getMonth();
  }

  // ── Slots du début au mois actuel ──
  const slots = [];
  let cy = startY, cm = startM;
  while (cy < now.getFullYear() || (cy === now.getFullYear() && cm <= now.getMonth())) {
    slots.push({ year: cy, month: cm, versements: [], cumul: 0 });
    if (++cm > 11) { cm = 0; cy++; }
    if (slots.length > 120) break;
  }

  // ── Dispatcher les paiements (triés par date) ──
  const allPays = DATA.paiements
    .filter(p => p.locId === locId && p.type !== 'caution' && p.montant > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const pay of allPays) {
    let rem = pay.montant;
    for (const s of slots) {
      if (rem <= 0) break;
      if (s.cumul >= l.loyer) continue;
      const v = Math.min(rem, l.loyer - s.cumul);
      s.cumul += v;
      s.versements.push({ montant: v, reste: Math.max(0, l.loyer - s.cumul), date: pay.date, mode: pay.mode || 'espèces', note: pay.note || '' });
      rem -= v;
    }
    // Avances : créer de nouveaux slots
    while (rem > 0 && slots.length < 120) {
      const last = slots[slots.length - 1];
      let ny = last.year, nm = last.month + 1;
      if (nm > 11) { nm = 0; ny++; }
      const ns = { year: ny, month: nm, versements: [], cumul: 0 };
      slots.push(ns);
      const v = Math.min(rem, l.loyer);
      ns.cumul += v;
      ns.versements.push({ montant: v, reste: Math.max(0, l.loyer - ns.cumul), date: pay.date, mode: pay.mode || 'espèces', note: pay.note || '' });
      rem -= v;
    }
  }

  // ── Filtrer sur l'année affichée ──
  const lignes = slots
    .filter(s => s.year === annee)
    .map(s => ({
      periode:    jour + ' ' + MC[s.month] + ' - ' + jour + ' ' + MC[(s.month + 1) % 12],
      statut:     (s.cumul >= l.loyer && s.versements.length > 0) ? 'Payé' : '',
      versements: s.versements,
      totalVerse: s.versements.reduce((sum, v) => sum + v.montant, 0),
      mois:       s.month
    }));

  return { l, im, annee, lignes };
}

function previewFicheSuivi(locId, anneeParam) {
  const anneeEl = document.getElementById('fiche-annee');
  const annee = anneeParam || (anneeEl ? parseInt(anneeEl.value) : new Date().getFullYear());
  const fd = buildFicheData(locId, annee);
  if (!fd) return;
  
  const { l, im, lignes } = fd;
  
  // Build HTML preview (landscape-style table)
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:11px;padding:8px;">
      <div style="text-align:center;font-size:15px;font-weight:900;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">
        Fiche de Suivi des Loyers
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:10px;border:1px solid #333;padding:6px;">
        <div><strong>Immeuble :</strong> ${im ? im.nom : ''}</div>
        <div><strong>Nom locataire :</strong> ${l.nom}</div>
        <div><strong>N° local :</strong> ${l.appt || '–'}</div>
        <div><strong>Type :</strong> ${l.type || 'Appartement'}</div>
        <div><strong>Adresse :</strong> ${im ? im.ville + (im.quartier ? ' – ' + im.quartier : '') : ''}</div>
        <div><strong>Loyer :</strong> ${l.loyer.toLocaleString('fr-FR')} FCFA</div>
        <div><strong>Année :</strong> ${annee}</div>
        <div><strong>Date d\'entrée :</strong> ${l.entree ? new Date(l.entree).toLocaleDateString('fr-FR') : '–'}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:#0a1628;color:#fff;">
            <th style="border:1px solid #555;padding:4px 6px;text-align:left;">Période</th>
            <th style="border:1px solid #555;padding:4px 6px;">Statut</th>
            <th style="border:1px solid #555;padding:4px 6px;">Montant versé</th>
            <th style="border:1px solid #555;padding:4px 6px;">Reste</th>
            <th style="border:1px solid #555;padding:4px 6px;">Date règlement</th>
            <th style="border:1px solid #555;padding:4px 6px;">Mode règlement</th>
            <th style="border:1px solid #555;padding:4px 6px;width:20%;">Observations</th>
          </tr>
        </thead>
        <tbody>
          ${lignes.map((lg, i) => `
            <tr style="background:${i%2===0?'#fff':'#f8f9fa'};">
              <td style="border:1px solid #ddd;padding:4px 6px;font-weight:600;">${lg.mois}</td>
              <td style="border:1px solid #ddd;padding:4px 6px;text-align:center;color:${lg.statut?'#27ae60':'#999'};">${lg.statut}</td>
              <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;">${lg.montant ? lg.montant.toLocaleString('fr-FR') : ''}</td>
              <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:${lg.reste>0?'#e74c3c':''};">${lg.reste !== '' ? (lg.reste > 0 ? lg.reste.toLocaleString('fr-FR') : '–') : ''}</td>
              <td style="border:1px solid #ddd;padding:4px 6px;text-align:center;">${lg.date ? new Date(lg.date).toLocaleDateString('fr-FR') : ''}</td>
              <td style="border:1px solid #ddd;padding:4px 6px;text-align:center;">${lg.mode}</td>
              <td style="border:1px solid #ddd;padding:4px 6px;">${lg.obs}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f0f0f0;font-weight:700;">
            <td style="border:1px solid #ddd;padding:4px 6px;" colspan="2">TOTAL</td>
            <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;">
              ${lignes.filter(lg=>lg.montant).reduce((s,lg)=>s+(lg.montant||0),0).toLocaleString('fr-FR')} FCFA
            </td>
            <td colspan="4" style="border:1px solid #ddd;padding:4px 6px;"></td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:16px;display:flex;justify-content:space-between;font-size:10px;">
        <div>Signature du locataire : _______________________</div>
        <div>Signature du gestionnaire : _______________________</div>
      </div>
    </div>
  `;
  
  document.getElementById('fiche-preview').innerHTML = html;
  document.getElementById('btn-dl-fiche').style.display = 'inline-flex';
}

function downloadFicheSuivi(locId) {
  const annee = parseInt(document.getElementById('fiche-annee').value);
  const fd = buildFicheData(locId, annee);
  if (!fd) return;
  
  const { l, im, lignes } = fd;
  
  try {
    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      showToast('Bibliothèque PDF non chargée', 'red'); return;
    }
    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, H = 210;
    const margin = 10;
    
    // ── Header ──
    doc.setFillColor(10, 22, 40);
    doc.rect(margin, margin, W - 2*margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('FICHE DE SUIVI DES LOYERS', W/2, margin+5.5, { align: 'center' });
    
    // ── Info block ──
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const infoY = margin + 12;
    doc.setDrawColor(180, 180, 180);
    doc.rect(margin, infoY, W - 2*margin, 14);
    
    const col1 = margin + 3, col2 = margin + 95, col3 = margin + 195;
    doc.setFont('helvetica', 'bold'); doc.text('Immeuble :', col1, infoY+4);
    doc.setFont('helvetica', 'normal'); doc.text(im ? im.nom : '', col1+22, infoY+4);
    
    doc.setFont('helvetica', 'bold'); doc.text('Nom locataire :', col2, infoY+4);
    doc.setFont('helvetica', 'normal'); doc.text(l.nom, col2+28, infoY+4);
    
    doc.setFont('helvetica', 'bold'); doc.text('Année :', col3, infoY+4);
    doc.setFont('helvetica', 'normal'); doc.text(String(annee), col3+14, infoY+4);
    
    doc.setFont('helvetica', 'bold'); doc.text('N° local :', col1, infoY+9);
    doc.setFont('helvetica', 'normal'); doc.text(l.appt||'–', col1+18, infoY+9);
    
    doc.setFont('helvetica', 'bold'); doc.text('Adresse :', col2, infoY+9);
    doc.setFont('helvetica', 'normal'); doc.text(im ? im.ville+(im.quartier?' – '+im.quartier:'') : '', col2+18, infoY+9);
    
    doc.setFont('helvetica', 'bold'); doc.text('Loyer mensuel :', col3, infoY+9);
    doc.setFont('helvetica', 'normal'); doc.text(l.loyer.toLocaleString('fr-FR')+' FCFA', col3+30, infoY+9);
    
    // ── Table ──
    const tableY = infoY + 17;
    const cols = [
      { label: 'Mois',            w: 22 },
      { label: 'Statut',          w: 16 },
      { label: 'Montant versé',   w: 28 },
      { label: 'Reste',           w: 22 },
      { label: 'Date règlement',  w: 28 },
      { label: 'Mode règlement',  w: 28 },
      { label: 'Observations',    w: 133 },
    ];
    
    // Header row
    doc.setFillColor(10, 22, 40);
    doc.rect(margin, tableY, W-2*margin, 7, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    let cx = margin;
    cols.forEach(c => {
      doc.text(c.label, cx + c.w/2, tableY+4.5, { align:'center' });
      cx += c.w;
    });
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lineH = 4.5; // hauteur par versement
    const rowPad = 3;  // padding vertical

    let curY = tableY + 7;
    lignes.forEach((lg, i) => {
      const nLines = Math.max(1, lg.versements.length);
      const rowH   = nLines * lineH + rowPad * 2;

      if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(margin, curY, W-2*margin, rowH, 'F'); }
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, curY, W-2*margin, rowH);

      cx = margin;
      doc.setTextColor(0, 0, 0);

      // Période
      doc.setFont('helvetica', 'bold');
      doc.text(lg.periode, cx + 2, curY + rowPad + lineH * 0.7);
      cx += cols[0].w;

      // Statut (centré verticalement)
      doc.setFont('helvetica', 'normal');
      if (lg.statut) {
        doc.setTextColor(39, 174, 96);
        doc.text(lg.statut, cx + cols[1].w/2, curY + rowH/2, { align:'center', baseline:'middle' });
        doc.setTextColor(0, 0, 0);
      }
      cx += cols[1].w;

      // Versements : montant, reste, date, mode (une ligne par versement)
      lg.versements.forEach((v, vi) => {
        const vy = curY + rowPad + vi * lineH + lineH * 0.7;
        doc.setTextColor(0, 0, 0);
        doc.text(v.montant.toLocaleString('fr-FR'), cx + cols[2].w - 2, vy, { align:'right' });
        if (v.reste === 0) {
          doc.setTextColor(80, 80, 80);
          doc.text('0', cx + cols[2].w + cols[3].w/2, vy, { align:'center' });
        } else if (v.reste > 0) {
          doc.setTextColor(231, 76, 60);
          doc.text(v.reste.toLocaleString('fr-FR'), cx + cols[2].w + cols[3].w/2, vy, { align:'center' });
        }
        doc.setTextColor(0, 0, 0);
        if (v.date) doc.text(new Date(v.date).toLocaleDateString('fr-FR'), cx + cols[2].w + cols[3].w + cols[4].w/2, vy, { align:'center' });
        doc.text(v.mode || '', cx + cols[2].w + cols[3].w + cols[4].w + cols[5].w/2, vy, { align:'center' });
      });

      // Observations
      const obsX = margin + cols[0].w + cols[1].w + cols[2].w + cols[3].w + cols[4].w + cols[5].w;
      const obs = lg.versements.length > 1 ? lg.versements.length + ' versements' : (lg.versements[0]?.note || '');
      if (obs) doc.text(obs, obsX + 2, curY + rowH/2, { baseline:'middle' });

      // Séparateurs verticaux
      cx = margin;
      doc.setDrawColor(180, 180, 180);
      cols.forEach(c => { cx += c.w; doc.line(cx, curY, cx, curY + rowH); });

      curY += rowH;
    });

    // Total row
    const totalY = curY;
    const totalPaye = lignes.reduce((s, lg) => s + lg.totalVerse, 0);
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, totalY, W-2*margin, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0,0,0);
    doc.text('TOTAL ANNUEL :', margin+2, totalY+4.5);
    doc.text(totalPaye.toLocaleString('fr-FR') + ' FCFA', margin+cols[0].w+cols[1].w+cols[2].w-2, totalY+4.5, { align:'right' });
    
    // Signatures
    const sigY = totalY + 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Signature du locataire : ___________________________', margin+10, sigY);
    doc.text('Signature du gestionnaire : ___________________________', W - margin - 90, sigY);
    
    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150,150,150);
    doc.text('ImmoGest — Cabinet CRAA — Généré le ' + new Date().toLocaleDateString('fr-FR'), W/2, H-5, { align:'center' });
    
    doc.save('Fiche_Suivi_' + l.nom.replace(/\s+/g,'_') + '_' + annee + '.pdf');
    showToast('Fiche téléchargée ✓');
    
  } catch(e) {
    console.error('PDF error:', e);
    showToast('Erreur PDF: ' + e.message, 'red');
  }
}

// ============================================================
// MIGRATION : Redistribuer les paiements multi-mois
// ============================================================

function migrerPaiementsMultiMois() {
  let nbMigres = 0;
  const nouveauxPaiements = [];
  const aSupprimer = new Set();
  
  DATA.paiements.forEach(p => {
    const moisFin = (p.moisFin !== undefined && p.moisFin !== null) ? p.moisFin : p.moisC;
    const anneeFin = p.anneeFin || p.anneeC;
    
    // Check if this payment covers multiple months
    const isMultiMois = (moisFin !== p.moisC) || (anneeFin !== p.anneeC);
    
    if (isMultiMois && p.type !== 'caution') {
      // Calculate number of months covered
      const totalMois = (anneeFin - p.anneeC) * 12 + (moisFin - p.moisC) + 1;
      
      if (totalMois > 1) {
        const montantParMois = Math.round(p.montant / totalMois);
        aSupprimer.add(p.id);
        
        // Create one entry per month
        let annee = p.anneeC;
        let mois = p.moisC;
        
        for (let i = 0; i <totalMois; i++) {
          nouveauxPaiements.push({
            id: DATA.nextPayId++,
            locId: p.locId,
            date: p.date,
            montant: i === totalMois - 1 ? 
              p.montant - (montantParMois * (totalMois - 1)) : // last month gets remainder
              montantParMois,
            moisC: mois,
            anneeC: annee,
            moisFin: mois,
            anneeFin: annee,
            type: p.type || 'loyer',
            mode: p.mode || 'especes',
            note: p.note || ('Migré depuis paiement groupé ' + totalMois + ' mois'),
          });
          
          mois++;
          if (mois > 11) { mois = 0; annee++; }
        }
        nbMigres++;
      }
    }
  });
  
  if (nbMigres === 0) {
    showToast('Aucun paiement multi-mois à migrer ✓');
    return;
  }
  
  // Remove old multi-month payments
  DATA.paiements = DATA.paiements.filter(p => !aSupprimer.has(p.id));
  
  // Add new individual payments
  DATA.paiements.push(...nouveauxPaiements);
  
  // Sort by date
  DATA.paiements.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  saveData();
  renderCurrent();
  showToast('✅ ' + nbMigres + ' paiement(s) redistribué(s) sur ' + nouveauxPaiements.length + ' mois');
}

// ============================================================
// SYSTÈME DE PAIEMENT PAR MOIS
// ============================================================

function getMoisDusList(l) {
  if (!l || l.s === 'libre') return [];
  const today = new Date();
  const todayDay = today.getDate();
  const jourPaiement = l.jourPaiement || 1;
  const currentMonthDue = todayDay >= jourPaiement;
  
  // Already paid months
  const paysMois = new Set();
  DATA.paiements
    .filter(p => p.locId === l.id && p.type !== 'caution')
    .forEach(p => {
      const key = p.anneeC + '-' + p.moisC;
      paysMois.add(key);
    });
  
  const nbMoisDus = l.loyer > 0 ? Math.ceil(Math.max(0, l.reste) / l.loyer) : 0;
  if (nbMoisDus === 0) return [];
  
  const moisDus = [];
  let year = today.getFullYear();
  let month = currentMonthDue ? today.getMonth() : today.getMonth() - 1;
  if (month <0) { month = 11; year--; }
  
  let count = 0;
  let attempts = 0;
  while (count <nbMoisDus && attempts <24) {
    attempts++;
    const key = year + '-' + month;
    if (!paysMois.has(key)) {
      moisDus.unshift({ annee: year, mois: month });
      count++;
    }
    month--;
    if (month <0) { month = 11; year--; }
  }
  return moisDus;
}

function calculerMoisCouverts(l, montant) {
  const moisDus = getMoisDusList(l);
  if (!l.loyer) return [];
  const couverts = [];
  let restant = montant;
  
  for (const m of moisDus) {
    if (restant <= 0) break;
    // Check how much already paid for this month
    const dejaPaye = DATA.paiements
      .filter(p => p.locId === l.id && p.moisC === m.mois && p.anneeC === m.annee && p.type !== 'caution')
      .reduce((s, p) => s + p.montant, 0);
    const resteaMois = l.loyer - dejaPaye;
    if (resteaMois <= 0) continue; // Already fully paid
    
    const montantMois = Math.min(restant, resteaMois);
    couverts.push({ 
      annee: m.annee, mois: m.mois, 
      montant: montantMois, 
      reste: resteaMois - montantMois,
      complet: (dejaPaye + montantMois) >= l.loyer 
    });
    restant -= montantMois;
  }
  
  // Advance payment - fill future months
  if (restant > 0) {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    if (month > 11) { month = 0; year++; }
    while (restant > 0) {
      const montantMois = Math.min(restant, l.loyer);
      couverts.push({ annee: year, mois: month, montant: montantMois, reste: l.loyer - montantMois, complet: montantMois >= l.loyer, avance: true });
      restant -= montantMois;
      month++;
      if (month > 11) { month = 0; year++; }
    }
  }
  return couverts;
}


function genRapportPeriodeIim(iid) {
  window._rptDeb = document.getElementById('rpt-deb').value;
  window._rptFin = document.getElementById('rpt-fin').value;
  genDocxRapportPeriode(iid);
}

async function genDocxRapportMensuel(iidFilter) {
  const m=gM(), a=gA();
  if (!window.docx) { showToast('Erreur interne : bibliothèque docx introuvable','red'); return; }
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
    ImageRun, Header, Footer, TabStopType, TabStopPosition
  } = window.docx;

  // ── Logos ──────────────────────────────────────────────────────────────
  const b64ToArr = s => { const b=atob(s); const a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return a; };
  const logo1Buf = b64ToArr("iVBORw0KGgoAAAANSUhEUgAAAEoAAAA5CAIAAAAeBCpJAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAuLQAALjIBEXZ9FgAABu9JREFUaEPdW1tsVEUY3nPb3XZbtzeUSq/BBihtSStQMPWCD0bFQA2XxKrRJw364qMNiT74AI8+SfTVUKKRS0KKCSEhatEWaLFyK1tbSi2BltJ2y+52z56b3+mRdd3LOXOme4uTzaanZ2b+/5v/m3/m/2eW0TTNgYJvVdVkGd/6Y54UlnVwHMNxDoah04jR4SmKurioPJxTHz1yAGH+FJZlPR62vJwtLWF4nkIvHR6wSTdHpLExxul0LNsyXwrj0CSJW13pbNrIVZRT2JDRFEX+ayp84YJ7x0t8ZWW+AHush7a0FDx5ytnSIjQ0MC6nXfVYTZLVhQXGXZCH2ACGKSjga2qV2VlNDNvFhvqsQ1W0SATTj6JxtpqoDmgo02jIZkvF3MixDa9vdLbrmwHvx6fwwR94zI3iZFLtwevpn9z5ZV/v8D2jc/yBx09/uEomKwe17ME72j+ZqOOR82MHvh3Kge4EIknhTT4MXZ3y937S0fNBu7dAiOsZVs1PGxLBA7COQ+fxaf7sLIBd/eKVjoaKOISwIYaAYECzWoUIHizjX5KgFwDAneCx58P2rm01cZp+dX4sq7oTCLOGB98Y5x4NB3N4b3McQhiZQGJWq1jDS+pOgMRAuHPTv/u45ipvVnUnEGYNL7oMxPUGhHCYR95tqykvxCt8d+9cTyAxq1Us4GHKGbMuaQHyPt/s4T3N8KVJPWpWoSQTZgHPcjodOjMCfvZ178ggMxVVDYbUYIAiFrWAl7gAxI2RYVuDnxkqTHGRPDUl3fLJU3e1YNBWPsF67iUu4rEwLPGvHLOrra34nbfVuTnx4qXIjZvKgwd6iGPkUKyKNbxY35jYW20m7RYVh2SEZ/8+Z3MT4IlDV+TxcXV+gYSr1vDeaMmXEF7YsL5o/162uCj8a784PIwkgxoImEeq1vBgPZOp9YsvqwERgnd3R4fnzU7N7w/3D0SuXVOmZzQxJVet4YEh3a+nXNCwocn+VhNcLezc7dreLo3cEi8PSqOj6vx8Uq4SwcPmy8SF9AwkiZKs5nwa3gt1dcXvv8d6nxAHB8UrvyflKhE83YCpdySHekcsl8c0oEnRhfvFFzy7dsGXGlyVp6c1UYz6VVJ4sF5iiBCVmNtwVufqa6+Cq/L47Qi46vMpc3MGV0nhoSo20KnWQFgv5+EsuFrU9Rb75FPi4JB0/Ybi98OGNuABmwlFEc4iUMocCQl7dm/b6uncrS749f2NLXgQcGDHWhMfAwPmcBIa+CPDw8ETJ+FvGI8HSXsb1jPaIwJKRVHsPzEJTSIMQgvQVZMmJoLHT0jjt52trUJjI+f10sDDEg+EqTSA9bq+HqDTj7oVziFCZ34Uf+vn1jzt2rrFuW6dft6yfKJk23pog32MiRfFQm/iSLEHwFukpJCYOnxmhBpStGH4p58D332P4zFXe7uzqYlfvZopLIieJTFqKBS5dl2euOPZt4dcGBiIZITJTMMQJNIYeLBIxkrBMJlwwVwfHNqFL17iykr5ujquspIt8SaeAXKfHzyozDyAq3FubCSH5xa4LfVlxwfvinLy09zR6QDelhQIIPPlifneP+6hJjCfuzEzsyhGBWGASgoFdEUuGjURLoROn4baQsMzzg3r+apq7LP1Q9yEQmk9ox/wEDYk1wzrSld7DWgZ637gqJA4NY8qoyIwzXAUibiWr60T6uu4VRXYZDtwRp2i0My9aFdYJGxRC8zEiCBHGqsMoGLNJBkjOP3A0WOarLif2+5q3cRXrdG9f2pslK4lbvKYuJlEpbE21pQVYv2MfZU01xhbAU4/0HNMd/rPtrnaWvn6erakxPCN5mVF1jO6hgHJERprI1gay0bjACOVopGhK0tnz/HV1f84/VWrGCH+kCMj5Ix2aguhnvb2zX708n8MaHJOiPsacPfC2rVxTt/Kcvr7NFjPEIMNN3kuEOnDOH6CsSnV5VjG7WLcbtxxIYEUWydt8EA2HI8RIgQVQchokgqtzBNWdlFF66cNHno0EBLOQ6yEzy+fogEYWlEDyLhriRUAhOTzEOsKUvcZzd6n03qxnsYksDCqYSAyx8mMkDPWjKAoKJcqOAQwQg6vkLQZsZ6hEzAAIT5xZ4Dwsfgn4S5shfBWtOe0JRveEttrClThvj4ttOTavJktK7UlMZ3rnqVgGJMCm2W3WfWcK9Qm7c0zOPfSritFh/97eCynX8K1v52jGEvaJqwDGvK2N5y6a2EEHrET8vLK/fu04jPYDuG5PHmHq6hgXG4KMY/vUo+OSr4/GZcrv+6t4i71UpirrnJupL5LbdyEDwaRn8GtY/3YOn8Kz7NFHrasjPUmyYKRqLl80d8o+B2DhN8x0NzpJZFEU4dl9dwesim0v2P4GyLM+vs0FlIyAAAAAElFTkSuQmCC");
  const logo2Buf = b64ToArr("iVBORw0KGgoAAAANSUhEUgAAADcAAAAsCAIAAABOqLdJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAIdUAACHVAQSctJ0AAAchSURBVFhH7Vn7b1NVHN9fICAoPkIICCFG1OAjgEqM/oLEBB8/EBOfMcYYxlsExivIWxEUIWhAMbzk4QZbYe+1HRtd96Dr2Eb36B5tt25zW9ut7b29va/6uZzbs7LdtjPZRmL85Jvl9tNzz/nc7z3fx+lSIoAgiF6v2NUluN0TY2LP3zLDRGRZWX0USImIIm+3h4qL2YJCJr9gYow1GEJms9jXp6pIhhQpEGBvlghOFy4m0sL19ZylOiJJqpCESBG7u1ljsRwKqcREAS89VFIqc5z6OSFSsEvYIv2DUQnvsKz6OSH+V5kQ46uS5cXW3mBlm+fkzdZDuU2rzlcfK7KfK3NWtXvb+5kQL6rjkmG8VAY54Vp1Z+q56kV79VNWZT608lqsTV2d+doBI0Tn1nYzXHKt46IyEBI+/b3yyQ3Xh4kbaTO+vvH56aoAJ6h3xsEYqxQluaS5b+Y32cPUQPFTm3Pm3DNcT069z7sLdhXc6RhIUFzGWGVBfc9zOwvo8pNSr72yz5CWXne5sqO4sbe0uQ92papj/42Gt46UTIlqxbA3vy+2dfnVWUZgLFU6+5k5W3KoRNj2q3UdXoTQcC9JstwzGPqz3Dlvay4ZCaEL9xQxYe09OmYqB1h+2Y+lVN+sTTkZtzvB4z1im7p9bHtf0OlhfAzPixL+EjM09C74tpDe9dVZC74lE8ZC7O5h8/Iln280PUdclbj1jKl9+lodWWzamqxLlS44TJDkvLqez36rnJem+AwDlv9863B+87vHTMTw6hHmNM5mb84x2fvVSWMgDQygv2GNRsHlUupkQq1xVXKC+M4xE1kJ9kNuEycoLkmv6kDQUJ7Yo9GHgX3wazke5lBuI/mI9775r1owZNpYyMEg32xnsnScxao4NX7nEVdljdNHF164R08kGht6KQlD1py6OmtY7oRKjPSz/Pzt+YTB7cKIfUwBpzK6G9AgtLVHIEPreeKqRH4mazy8KvNwXpMsy30BbunhEkLCFuwq3J1lO66379HZEPWUJyoha8OlGkrWdw6SaTUhCwJva2ALi7gyM3o0OcyrX0ShrRKee2K9urEQ4+WtHpA37nRRcvo6ncXhRSoFj7d5wtBCeBhRCZwubZ+6RnXz0cJmQsaFLEuDg9ydO9gA4fq7st8f61RtlTa3n6768u4iTzAMMi29lpJbM+rISIIzJgf9iqq82TRUC5YdKSVkUoj9/YH0DLS8OOFEeNWp2irhNrrq2z+pCyBpU9Lq9BGSQFNljWtg7hY1dy7eayDkaCCHuLDVqmwAq1XyehFV2iqvWjrpqivPVRMSTiXM7E05SJaEJNBU6fIwz0QDCEFGyNFCluHUkKksVHpLCgSTq1xzwUpIqhJro8wQkkBTZaeXpWEOI+S/AlTBo6LHk1zll2duE5KqRD7vHkiusrZj6I2/tLuIkKMEjm9cbS2TqQvX1SPna6ssvNtDV116pISQr+5X08201VkojIQk0FSJXmTmRjV6PjxZQcikkAWRb2xkCotCt0wIIFKWtFXGxviLuwqJ5z46WUHJsyYHGUmgqfJiheuRtVmE3HvdRsjEQPPBFBQw2blCa5vys0IU2ioBNLNkASVftin58mRxG20ilxw09vrVQ6o/JGz5ayhJEZVIpVtiMpfVdV9OGAkJ1dJmC15JD1sskscTEe/rpOKqXB+tHErtyVdqT0Wbh+4z2IoT5mN6+3F9Czrzx6PZHoa2Mq+uW2d1L96nJ8zT2/LQo6jzjoQk8fYWVm8IlZWJnW5FyYgiGVclMiJdeNG9Oo6T18enhl76pHv5BXsUF5SEoaxDNGxyqsp88cdtzW5DgSSx+XjFOXxLa4JfjuKqRE/03vGhngilHG2ie4B947tiiKM8sVmbsmmPN8zQLl0sd6mTxkDmeb65OXDpMldRKfb1ywl/iomrEg913uyM7S8zLJ1wCRr1PddtyEpgwD+/s+CTU5XXa7oQW7geacuP3uryDZ8cEHt6ghnXeLtdadfjeTqKuCoB9OqvHzQSlbC5ablZ1W7wYUFCVnf0M219wa6BEKIHq6DW43qkoZPS1KCcKAzG2EBOgEQqAeXcc3/Puy2jrrHbD2XqiCjgZjxVp4+lsZ8YY3+GfGHX0DlmUmom6h4CAoF/tsxxweyEocvcrbMhtpYcMB7IblTvTIgxVonMV9Xumb9jqCITQ+58bJ2OhPPU1UPtOuSqdybEGKskwKFx85Va5EukTypI0x6kSgBOtTh8B7MbVvxifnZH/oyNanEihtS9aK/+/eMmchpOivFSSYCA7Q+EG7r8KHrmVg+1u+7B1t4gQoec45JifFWOFf6LKtHDsQbDg1FZfHOU66ZIHi+eCadMlZgowDuc2YyTuPo5IVJQ9bmq2zDUfr5poszeglZccDiSVnAC5T98OE3ieBEyl6PDmxjjKqsEh3OU/+yJRCL/ALAmgvDhhI1cAAAAAElFTkSuQmCC");

  // ── Brand ───────────────────────────────────────────────────────────────
  const BLUE='0E6AAF',BLUE_L='D6E9F6',PINK='F8CACB',WHITE='FFFFFF';
  const DGRAY='333333',GRAY='666666',LGRAY='F5F5F5',RED='C0392B',GREEN='1A6B45',BORD='C5DCF0';

  // ── Helpers ─────────────────────────────────────────────────────────────
  const fmtR  = n => Number(n||0).toLocaleString('fr-FR')+' F';
  const fmtK  = n => Number(n||0).toLocaleString('fr-FR')+' FCFA';
  const br    = () => new Paragraph({children:[],spacing:{after:0}});
  const thinB = {bTop:BORD,bBot:BORD,bLeft:BORD,bRight:BORD,bTopSz:2,bBotSz:2,bLeftSz:2,bRightSz:2};

  function enToutesLettres(n) {
    const u=['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
    const t=['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
    if(n===0)return'zéro'; if(n<0)return'moins '+enToutesLettres(-n);
    let r='';
    if(n>=1000000){r+=enToutesLettres(Math.floor(n/1000000))+' million'+(Math.floor(n/1000000)>1?'s':'')+' ';n%=1000000;}
    if(n>=1000){const c=Math.floor(n/1000);r+=(c===1?'mille':(enToutesLettres(c)+' mille'))+' ';n%=1000;}
    if(n>=100){const c=Math.floor(n/100);r+=(c===1?'cent':(u[c]+' cent'))+' ';n%=100;}
    if(n>0){if(n<20){r+=u[n];}else{const tx=Math.floor(n/10),ux=n%10;if(tx===7||tx===9)r+=t[tx]+'-'+u[tx===7?10+ux:10+ux];else r+=t[tx]+(ux===1&&tx<8?' et ':ux>0?'-':'')+(ux>0?u[ux]:'');}}
    return r.trim();
  }

  function mkCell(text, opts={}) {
    const {bg=null,bold=false,color=DGRAY,size=19,align=AlignmentType.LEFT,colspan=1,italic=false,
      vAlign=VerticalAlign.CENTER,
      bTop=BORD,bBot=BORD,bLeft=BORD,bRight=BORD,bTopSz=4,bBotSz=4,bLeftSz=4,bRightSz=4,
      padT=80,padB=80,padL=100,padR=100}=opts;
    const mkB=(c,sz)=>c==='none'?{style:BorderStyle.NONE}:{style:BorderStyle.SINGLE,size:sz,color:c};
    return new TableCell({
      children:[new Paragraph({children:[new TextRun({text:String(text||''),bold,color,size,italics:italic,font:'Calibri'})],alignment:align,spacing:{after:0,before:0}})],
      columnSpan:colspan,verticalAlign:vAlign,
      margins:{top:padT,bottom:padB,left:padL,right:padR},
      borders:{top:mkB(bTop,bTopSz),bottom:mkB(bBot,bBotSz),left:mkB(bLeft,bLeftSz),right:mkB(bRight,bRightSz)},
      ...(bg?{shading:{fill:bg,type:ShadingType.CLEAR}}:{})
    });
  }

  function secTitle(text) {
    return new Paragraph({
      children:[new TextRun({text,bold:true,size:22,color:WHITE,font:'Berlin Sans FB'})],
      shading:{fill:BLUE,type:ShadingType.CLEAR},
      spacing:{before:240,after:60},indent:{left:140,right:140}
    });
  }

  const today = new Date().toLocaleDateString('fr-FR');

  // ── Determine which immeubles to include ────────────────────────────────
  const immsToReport = iidFilter !== undefined
    ? DATA.immeubles.filter(i=>i.id===iidFilter)
    : DATA.immeubles.filter(im=>DATA.locataires.some(l=>l.iid===im.id&&l.s!=='libre'));

  // Build one section per immeuble
  const sections = [];

  for (const im of immsToReport) {
    const locs = DATA.locataires.filter(l=>l.iid===im.id).sort((a,b)=>(a.appt||'').localeCompare(b.appt||''));
    const actif = locs.filter(l=>l.s!=='libre');
    const totalLoyers = actif.reduce((s,l)=>s+l.loyer,0);
    const totalReste  = actif.reduce((s,l)=>s+l.reste,0);

    // Paiements du mois pour cet immeuble
    const paysImm = DATA.paiements.filter(p=>{
      const l=DATA.locataires.find(x=>x.id===p.locId);
      // Match by actual payment date (primary) OR moisC fallback
      const byDate = p.date && new Date(p.date).getMonth()===m && new Date(p.date).getFullYear()===a;
      const byMois = !p.date && p.moisC===m && p.anneeC===a;
      return l && l.iid===im.id && (byDate || byMois);
    }).sort((a,b)=>a.date.localeCompare(b.date));
    const encLoyers   = paysImm.filter(p=>p.type!=='caution').reduce((s,p)=>s+p.montant,0);
    const encCautions = paysImm.filter(p=>p.type==='caution').reduce((s,p)=>s+p.montant,0);
    const encTotal    = paysImm.reduce((s,p)=>s+p.montant,0);

    // Bailleur & Commission calculations
    const encBailleur = paysImm.filter(p=>p.remisAuBailleur).reduce((s,p)=>s+p.montant,0);
    const encCabinet  = encTotal - encBailleur;
    const comm        = im.commission || { type: 'forfait', valeur: 0 };
    const commMontant = comm.type === 'pct'
      ? Math.round(encCabinet * (comm.valeur||0) / 100)
      : (comm.valeur || 0);
    const netAPercevoir = encCabinet - commMontant;
    const hdr = new Header({children:[
      new Table({
        width:{size:9926,type:WidthType.DXA},columnWidths:[700,5500,3726],
        rows:[new TableRow({children:[
          new TableCell({
            children:[new Paragraph({children:[new ImageRun({data:logo1Buf,transformation:{width:48,height:38},type:'png'})],spacing:{after:0}})],
            borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.SINGLE,size:6,color:BLUE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            verticalAlign:VerticalAlign.CENTER,margins:{top:0,bottom:60,left:0,right:60}
          }),
          new TableCell({
            children:[
              new Paragraph({children:[new TextRun({text:"CABINET DE RECOUVREMENT ET D\'AVOCATS ASSOCIÉS",bold:true,size:20,color:BLUE,font:'Berlin Sans FB'})],spacing:{after:20}}),
              new Paragraph({children:[new TextRun({text:"CRAA  ·  RCCM N° RC/YAD/2018/A/3347  ·  N°Contrib. PO38412724963M",size:16,color:GRAY,font:'Calibri'})],spacing:{after:0}}),
            ],
            borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.SINGLE,size:6,color:BLUE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            verticalAlign:VerticalAlign.CENTER,margins:{top:0,bottom:60,left:100,right:60}
          }),
          new TableCell({
            children:[
              new Paragraph({children:[new TextRun({text:"📞 +237 676 52 89 17",size:17,color:GRAY})],spacing:{after:20}}),
              new Paragraph({children:[new TextRun({text:"693 53 06 85",size:17,color:GRAY})],spacing:{after:20}}),
              new Paragraph({children:[new TextRun({text:"camerounaiserecourement@yahoo.com",size:15,color:GRAY,italics:true})],spacing:{after:0}}),
            ],
            borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.SINGLE,size:6,color:BLUE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            verticalAlign:VerticalAlign.CENTER,margins:{top:0,bottom:60,left:60,right:0}
          }),
        ]})]
      }),
    ]});

    // ── FOOTER ─────────────────────────────────────────────────────────
    const ftr = new Footer({children:[
      new Paragraph({
        children:[new TextRun({text:"Immeuble de la Pharmacie MESSA, 3ème étage, Yaoundé  ·  "+im.nom+" · "+MNOMS[m]+" "+a,size:16,color:'AAAAAA',italics:true,font:'Calibri'})],
        border:{top:{style:BorderStyle.SINGLE,size:4,color:BLUE,space:4}},
        spacing:{before:100}
      }),
    ]});

    // ── BODY ───────────────────────────────────────────────────────────
    const children = [
      br(),
      // Titre
      new Paragraph({
        children:[new TextRun({text:`RAPPORT MENSUEL – IMMEUBLE ${im.nom.toUpperCase()}`,bold:true,size:26,color:BLUE,font:'Berlin Sans FB'})],
        alignment:AlignmentType.CENTER,
        border:{bottom:{style:BorderStyle.SINGLE,size:6,color:PINK,space:4}},
        spacing:{after:60}
      }),
      new Paragraph({
        children:[new TextRun({text:`${im.ville}${im.quartier?' · '+im.quartier:''}  ·  ${MNOMS[m]} ${a}  ·  Au ${today}`,size:20,color:GRAY,font:'Calibri'})],
        alignment:AlignmentType.CENTER,spacing:{after:240}
      }),

      // ── Section 1 : Liste locataires ──────────────────────────────
      secTitle('  LISTE DES LOCATAIRES ET SITUATION LOCATIVE'),
      new Table({
        width:{size:9926,type:WidthType.DXA},
        columnWidths:[650,2900,820,1980,1576,2000],
        rows:[
          new TableRow({children:[
            mkCell('Local',            {bg:BLUE,bold:true,color:WHITE,size:18,align:AlignmentType.CENTER,...thinB}),
            mkCell('NOM & TÉLÉPHONE',  {bg:BLUE,bold:true,color:WHITE,size:18,...thinB}),
            mkCell('LOYER',            {bg:BLUE,bold:true,color:WHITE,size:18,align:AlignmentType.RIGHT,...thinB}),
            mkCell('DERNIER PAIEMENT', {bg:BLUE,bold:true,color:WHITE,size:18,align:AlignmentType.CENTER,...thinB}),
            mkCell('OBSERVATIONS',     {bg:BLUE,bold:true,color:WHITE,size:18,...thinB}),
            mkCell('RESTE À PAYER',    {bg:BLUE,bold:true,color:WHITE,size:18,align:AlignmentType.RIGHT,...thinB}),
          ]}),
          ...locs.map((l,i) => {
            const libre=l.s==='libre';
            const rowBg=libre?'F0F0F0':i%2===0?WHITE:'EEF6FC';
            const tColor=libre?GRAY:DGRAY;
            // Find last payment for this locataire
            const lastPays = DATA.paiements.filter(p=>p.locId===l.id).sort((a,b)=>b.date.localeCompare(a.date));
            const lastP = lastPays[0];
            const dpText = lastP ? lastP.date.split('-').reverse().join('/') : (l.entree||'–');
            const mpText = lastP ? fmtR(lastP.montant) : '';
            return new TableRow({children:[
              mkCell(l.appt||'–', {bg:rowBg,bold:!libre,color:libre?GRAY:BLUE,size:18,align:AlignmentType.CENTER,...thinB}),
              new TableCell({
                children:[
                  new Paragraph({children:[new TextRun({text:l.nom,bold:!libre,color:tColor,size:19,font:'Calibri'})],spacing:{after:0}}),
                  ...(l.tel?[new Paragraph({children:[new TextRun({text:l.tel,color:GRAY,size:17,font:'Calibri',italics:true})],spacing:{after:0}})]:[]),
                ],
                shading:{fill:rowBg,type:ShadingType.CLEAR},
                borders:{top:{style:BorderStyle.SINGLE,size:2,color:BORD},bottom:{style:BorderStyle.SINGLE,size:2,color:BORD},left:{style:BorderStyle.SINGLE,size:2,color:BORD},right:{style:BorderStyle.SINGLE,size:2,color:BORD}},
                margins:{top:80,bottom:80,left:100,right:60},verticalAlign:VerticalAlign.CENTER
              }),
              mkCell(fmtR(l.loyer), {bg:rowBg,color:tColor,size:18,align:AlignmentType.RIGHT,...thinB}),
              new TableCell({
                children:[
                  new Paragraph({children:[new TextRun({text:dpText,color:tColor,size:18,font:'Calibri'})],spacing:{after:0}}),
                  ...(mpText?[new Paragraph({children:[new TextRun({text:mpText,bold:true,color:BLUE,size:18,font:'Calibri'})],spacing:{after:0}})]:[]),
                ],
                shading:{fill:rowBg,type:ShadingType.CLEAR},
                borders:{top:{style:BorderStyle.SINGLE,size:2,color:BORD},bottom:{style:BorderStyle.SINGLE,size:2,color:BORD},left:{style:BorderStyle.SINGLE,size:2,color:BORD},right:{style:BorderStyle.SINGLE,size:2,color:BORD}},
                margins:{top:80,bottom:80,left:100,right:60},verticalAlign:VerticalAlign.CENTER
              }),
              mkCell(l.obs||'–', {bg:rowBg,color:l.reste>0?RED:l.s==='payé'?GREEN:GRAY,size:17,italic:true,...thinB}),
              mkCell(l.reste>0?fmtR(l.reste):'–', {bg:rowBg,bold:l.reste>0,color:l.reste>0?RED:GREEN,size:18,align:AlignmentType.RIGHT,...thinB}),
            ]});
          }),
          new TableRow({children:[
            mkCell('TOTAL', {bg:BLUE_L,bold:true,color:BLUE,size:19,align:AlignmentType.RIGHT,colspan:5,...thinB}),
            mkCell(fmtR(totalReste), {bg:BLUE_L,bold:true,color:totalReste>0?RED:GREEN,size:20,align:AlignmentType.RIGHT,...thinB}),
          ]}),
        ],
      }),

      br(),br(),

      // ── Section 2 : Encaissements ─────────────────────────────────
      secTitle(`  ENCAISSEMENTS – ${MNOMS[m].toUpperCase()} ${a}`),
      ...(paysImm.length === 0 ? [
        new Paragraph({children:[new TextRun({text:"Aucun versement enregistré pour ce mois.",size:20,color:GRAY,italics:true,font:'Calibri'})],spacing:{before:120,after:120}})
      ] : [
        new Table({
          width:{size:9926,type:WidthType.DXA},
          columnWidths:[1400,700,3100,2326,2400],
          rows:[
            new TableRow({children:[
              mkCell('DATE',      {bg:BLUE,bold:true,color:WHITE,size:18,align:AlignmentType.CENTER,...thinB}),
              mkCell('LOCAL',     {bg:BLUE,bold:true,color:WHITE,size:18,align:AlignmentType.CENTER,...thinB}),
              mkCell('LOCATAIRE', {bg:BLUE,bold:true,color:WHITE,size:18,...thinB}),
              mkCell('NOTE',      {bg:BLUE,bold:true,color:WHITE,size:18,...thinB}),
              mkCell('MONTANT',   {bg:BLUE,bold:true,color:WHITE,size:18,align:AlignmentType.RIGHT,...thinB}),
            ]}),
            ...groupPayments(paysImm).map((p,i) => {
              const l=DATA.locataires.find(x=>x.id===p.locId);
              const rowBg=i%2===0?WHITE:'EEF6FC';
              const isC=p.type==='caution';
              return new TableRow({children:[
                mkCell(p.date.split('-').reverse().join('/'), {bg:rowBg,color:GRAY,size:18,align:AlignmentType.CENTER,...thinB}),
                mkCell(l?l.appt||'–':'–', {bg:rowBg,bold:true,color:BLUE,size:18,align:AlignmentType.CENTER,...thinB}),
                mkCell(l?l.nom:'–', {bg:rowBg,color:DGRAY,size:18,...thinB}),
                mkCell(p.note||p.type, {bg:rowBg,color:GRAY,size:17,italic:true,...thinB}),
                mkCell(fmtK(p.montant), {bg:rowBg,bold:true,color:isC?'7F5AB0':GREEN,size:18,align:AlignmentType.RIGHT,...thinB}),
              ]});
            }),
            new TableRow({children:[
              mkCell('Loyers encaissés',{bg:LGRAY,color:GRAY,size:17,italic:true,colspan:4,align:AlignmentType.RIGHT,...thinB}),
              mkCell(fmtK(encLoyers),  {bg:LGRAY,bold:true,color:GREEN,size:18,align:AlignmentType.RIGHT,...thinB}),
            ]}),
            ...(encCautions>0?[new TableRow({children:[
              mkCell('Cautions reçues',{bg:LGRAY,color:GRAY,size:17,italic:true,colspan:4,align:AlignmentType.RIGHT,...thinB}),
              mkCell(fmtK(encCautions),{bg:LGRAY,bold:true,color:'7F5AB0',size:18,align:AlignmentType.RIGHT,...thinB}),
            ]})]:[]),
            new TableRow({children:[
              mkCell('TOTAL COLLECTÉ',{bg:BLUE_L,bold:true,color:BLUE,size:19,colspan:4,align:AlignmentType.RIGHT,...thinB}),
              mkCell(fmtK(encTotal),  {bg:BLUE_L,bold:true,color:BLUE,size:20,align:AlignmentType.RIGHT,...thinB}),
            ]}),
            ...(encBailleur>0?[new TableRow({children:[
              mkCell('Loyer reçu par le bailleur',{bg:'FFF8E1',color:'E65100',size:17,italic:true,colspan:4,align:AlignmentType.RIGHT,...thinB}),
              mkCell(fmtK(encBailleur),{bg:'FFF8E1',bold:true,color:'E65100',size:18,align:AlignmentType.RIGHT,...thinB}),
            ]})]:[]),
            ...(encBailleur>0?[new TableRow({children:[
              mkCell('TOTAL COLLECTÉ AU CABINET',{bg:BLUE_L,bold:true,color:BLUE,size:18,colspan:4,align:AlignmentType.RIGHT,...thinB}),
              mkCell(fmtK(encCabinet),{bg:BLUE_L,bold:true,color:BLUE,size:19,align:AlignmentType.RIGHT,...thinB}),
            ]})]:[]),
            ...(commMontant>0?[new TableRow({children:[
              mkCell('Commission Cabinet'+(comm.type==='pct'?' ('+comm.valeur+'%)':''),{bg:LGRAY,color:GRAY,size:17,italic:true,colspan:4,align:AlignmentType.RIGHT,...thinB}),
              mkCell(fmtK(commMontant),{bg:LGRAY,bold:true,color:GRAY,size:18,align:AlignmentType.RIGHT,...thinB}),
            ]})]:[]),
            ...(commMontant>0?[new TableRow({children:[
              mkCell('NET À PERCEVOIR',{bg:'E8F5E9',bold:true,color:'1A6B45',size:19,colspan:4,align:AlignmentType.RIGHT,...thinB}),
              mkCell(fmtK(netAPercevoir),{bg:'E8F5E9',bold:true,color:'1A6B45',size:20,align:AlignmentType.RIGHT,...thinB}),
            ]})]:[]),
          ],
        }),
      ]),

      // Mention en toutes lettres
      ...(encLoyers > 0 ? [new Paragraph({
        children:[
          new TextRun({text:'Soit : ',bold:true,size:20,color:BLUE,font:'Calibri'}),
          new TextRun({text:`${enToutesLettres(encLoyers)} (${fmtK(encLoyers)}) versés au titre des loyers de ${MNOMS[m]} ${a}.`,size:20,color:DGRAY,italics:true,font:'Calibri'}),
        ],
        border:{left:{style:BorderStyle.THICK,size:12,color:PINK,space:8}},
        indent:{left:200},spacing:{before:120,after:240},
      })] : [br()]),

      br(),

      // ── Signatures ────────────────────────────────────────────────
      new Table({
        width:{size:9926,type:WidthType.DXA},columnWidths:[4963,4963],
        rows:[new TableRow({children:[
          new TableCell({
            children:[
              new Paragraph({children:[new TextRun({text:'Le Gestionnaire',bold:true,size:20,color:BLUE,font:'Calibri'})],spacing:{after:80}}),
              new Paragraph({children:[new TextRun({text:'CRAA',size:18,color:GRAY,font:'Calibri',italics:true})],spacing:{after:400}}),
              new Paragraph({children:[new TextRun({text:'Signature & Cachet :',size:18,color:GRAY,font:'Calibri'})]}),
              new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:BLUE}},spacing:{before:560,after:0}}),
            ],
            borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            margins:{top:240,left:0,right:200,bottom:0}
          }),
          new TableCell({
            children:[
              new Paragraph({children:[new TextRun({text:"Lu et approuvé – Le Propriétaire",bold:true,size:20,color:BLUE,font:'Calibri'})],alignment:AlignmentType.RIGHT,spacing:{after:80}}),
              new Paragraph({children:[new TextRun({text:im.nom,size:18,color:GRAY,font:'Calibri',italics:true})],alignment:AlignmentType.RIGHT,spacing:{after:400}}),
              new Paragraph({children:[new TextRun({text:'Signature :',size:18,color:GRAY,font:'Calibri'})],alignment:AlignmentType.RIGHT}),
              new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:BLUE}},spacing:{before:560,after:0}}),
            ],
            borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
            margins:{top:240,left:200,right:0,bottom:0}
          }),
        ]})],
      }),
      br(),
      new Paragraph({
        children:[new TextRun({text:`Document généré le ${today} par ImmoGest · CRAA`,size:16,color:'BBBBBB',italics:true,font:'Calibri'})],
        alignment:AlignmentType.CENTER,spacing:{before:200}
      }),
    ];

    sections.push({
      properties:{page:{size:{width:11906,height:16838},margin:{top:800,right:900,bottom:800,left:900}}},
      headers:{default:hdr},
      footers:{default:ftr},
      children,
    });
  }

  if (sections.length === 0) { showToast('Aucun immeuble avec données','red'); return; }
  const doc = new Document({ styles:{default:{document:{run:{font:'Calibri',size:20}}}}, sections });
  const blob = await Packer.toBlob(doc);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const label = iidFilter !== undefined
    ? DATA.immeubles.find(i=>i.id===iidFilter)?.nom.split(' ')[0] || 'Immeuble'
    : 'Tous';
  link.download = `Rapport_${label}_${MNOMS[m]}_${a}.docx`;
  link.click();
  showToast('Rapport téléchargé ✓');
}

async function genDocxRapportPeriode(debStr, finStr, iidFilter) {
  // Reuse genDocxRapportMensuel logic but with date range
  window._rapAnnDateDeb = debStr;
  window._rapAnnDateFin = finStr;
  window._rapAnnIid     = iidFilter;
  await genDocxRapportAnnuel(); // annual report function handles date range perfectly
}


function previewRapportMensuel(iidFilter) {
  _previewIidFilter = iidFilter;
  const m=gM(), a=gA();
  const MNOMS_L = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const immsToReport = iidFilter !== undefined
    ? DATA.immeubles.filter(i=>i.id===iidFilter)
    : DATA.immeubles.filter(im=>DATA.locataires.some(l=>l.iid===im.id&&l.s!=='libre'));

  if (immsToReport.length===0) { showToast('Aucun immeuble avec données','red'); return; }

  const today = new Date().toLocaleDateString('fr-FR');
  const fmtN  = n => Number(n||0).toLocaleString('fr-FR');
  const fmtF  = n => fmtN(n)+' F';
  const fmtK  = n => fmtN(n)+' FCFA';

  function enToutesLettres(n) {
    const u=['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
    const t=['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
    if(n===0)return'zéro';if(n<0)return'moins '+enToutesLettres(-n);
    let r='';
    if(n>=1000000){r+=enToutesLettres(Math.floor(n/1000000))+' million'+(Math.floor(n/1000000)>1?'s':'')+' ';n%=1000000;}
    if(n>=1000){const c=Math.floor(n/1000);r+=(c===1?'mille':(enToutesLettres(c)+' mille'))+' ';n%=1000;}
    if(n>=100){const c=Math.floor(n/100);r+=(c===1?'cent':(u[c]+' cent'))+' ';n%=100;}
    if(n>0){if(n<20){r+=u[n];}else{const tx=Math.floor(n/10),ux=n%10;if(tx===7||tx===9)r+=t[tx]+'-'+u[tx===7?10+ux:10+ux];else r+=t[tx]+(ux===1&&tx<8?' et ':ux>0?'-':'')+(ux>0?u[ux]:'');}}
    return r.trim();
  }

  let html = '';

  immsToReport.forEach((im, idx) => {
    const locs = DATA.locataires.filter(l=>l.iid===im.id).sort((a,b)=>(a.appt||'').localeCompare(b.appt||''));
    const actif = locs.filter(l=>l.s!=='libre');
    const totalReste = actif.reduce((s,l)=>s+l.reste,0);

    const paysImm = DATA.paiements.filter(p=>{
      const l=DATA.locataires.find(x=>x.id===p.locId);
      // Match by actual payment date (primary) OR moisC fallback
      const byDate = p.date && new Date(p.date).getMonth()===m && new Date(p.date).getFullYear()===a;
      const byMois = !p.date && p.moisC===m && p.anneeC===a;
      return l && l.iid===im.id && (byDate || byMois);
    }).sort((a,b)=>a.date.localeCompare(b.date));
    const encLoyers   = paysImm.filter(p=>p.type!=='caution').reduce((s,p)=>s+p.montant,0);
    const encCautions = paysImm.filter(p=>p.type==='caution').reduce((s,p)=>s+p.montant,0);
    const encTotal    = paysImm.reduce((s,p)=>s+p.montant,0);

    // Bailleur & Commission
    const encBailleur = paysImm.filter(p=>p.remisAuBailleur).reduce((s,p)=>s+p.montant,0);
    const encCabinet  = encTotal - encBailleur;
    const comm2       = im.commission || { type: 'forfait', valeur: 0 };
    const commMontant2 = comm2.type === 'pct'
      ? Math.round(encCabinet * (comm2.valeur||0) / 100)
      : (comm2.valeur || 0);
    const netAPercevoir2 = encCabinet - commMontant2;

    if (idx > 0) html += '<div style="page-break-before:always;margin-top:40px;border-top:3px solid #0E6AAF;padding-top:24px;"></div>';

    // ── HEADER ──────────────────────────────────────────────────────
    html += `
    <div style="border-bottom:3px solid #0E6AAF;padding-bottom:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:15px;font-weight:700;color:#0E6AAF;font-family:'Berlin Sans FB',Calibri,sans-serif;letter-spacing:.3px;">CABINET DE RECOUVREMENT ET D'AVOCATS ASSOCIÉS</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">CRAA  ·  RCCM N° RC/YAD/2018/A/3347  ·  N°Contrib. PO38412724963M</div>
        <div style="font-size:11px;color:#888;">Immeuble de la Pharmacie MESSA, 3ème étage, Yaoundé</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#888;line-height:1.8;">
        <div>📞 +237 676 52 89 17</div>
        <div>693 53 06 85</div>
        <div style="font-size:10px;">camerounaiserecourement@yahoo.com</div>
      </div>
    </div>`;

    // ── TITRE ───────────────────────────────────────────────────────
    html += `
    <div style="text-align:center;margin-bottom:4px;">
      <div style="font-size:16px;font-weight:700;color:#0E6AAF;font-family:'Berlin Sans FB',Calibri,sans-serif;border-bottom:3px solid #F8CACB;display:inline-block;padding-bottom:4px;">
        RAPPORT MENSUEL – IMMEUBLE ${im.nom.toUpperCase()}
      </div>
    </div>
    <div style="text-align:center;font-size:12px;color:#888;margin-bottom:20px;">
      ${im.ville}${im.quartier?' · '+im.quartier:''}  ·  ${MNOMS_L[m]} ${a}  ·  Au ${today}
    </div>`;

    // ── SECTION 1 : LOCATAIRES ──────────────────────────────────────
    html += `<div style="background:#0E6AAF;color:#fff;font-weight:700;font-size:12px;padding:6px 12px;margin-bottom:0;font-family:'Berlin Sans FB',Calibri,sans-serif;">
      LISTE DES LOCATAIRES ET SITUATION LOCATIVE
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px;">
      <thead>
        <tr style="background:#0E6AAF;color:#fff;">
          <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;width:48px;">Local</th>
          <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:left;">Nom & Téléphone</th>
          <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:right;width:90px;">Loyer</th>
          <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;width:120px;">Dernier paiement</th>
          <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:left;width:140px;">Observations</th>
          <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:right;width:100px;">Reste à payer</th>
        </tr>
      </thead>
      <tbody>`;

    locs.forEach((l, i) => {
      const libre = l.s==='libre';
      const rowBg = libre ? '#f0f0f0' : i%2===0 ? '#fff' : '#EEF6FC';
      const lastP = DATA.paiements.filter(p=>p.locId===l.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
      const dpText = lastP ? lastP.date.split('-').reverse().join('/') : (l.entree||'–');
      const mpText = lastP ? fmtF(lastP.montant) : '';
      const obsColor = l.reste>0 ? '#C0392B' : l.s==='payé' ? '#1A6B45' : '#888';
      const resteColor = l.reste>0 ? '#C0392B' : '#1A6B45';
      html += `
        <tr style="background:${rowBg};">
          <td style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;font-weight:700;color:${libre?'#888':'#0E6AAF'};">${l.appt||'–'}</td>
          <td style="padding:6px 8px;border:1px solid #C5DCF0;">
            <div style="font-weight:${libre?'400':'600'};color:${libre?'#aaa':'#333'};">${l.nom}</div>
            ${l.tel?`<div style="font-size:11px;color:#888;font-style:italic;">${l.tel}</div>`:''}
          </td>
          <td style="padding:6px 8px;border:1px solid #C5DCF0;text-align:right;color:${libre?'#aaa':'#333'};">${fmtF(l.loyer)}</td>
          <td style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;">
            <div style="color:${libre?'#aaa':'#333'};">${dpText}</div>
            ${mpText?`<div style="font-weight:700;color:#0E6AAF;">${mpText}</div>`:''}
          </td>
          <td style="padding:6px 8px;border:1px solid #C5DCF0;font-style:italic;font-size:11px;color:${obsColor};">${l.obs||'–'}</td>
          <td style="padding:6px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:${l.reste>0?'700':'400'};color:${resteColor};">${l.reste>0?fmtF(l.reste):'–'}</td>
        </tr>`;
    });

    html += `
        <tr style="background:#D6E9F6;">
          <td colspan="5" style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#0E6AAF;font-size:13px;">TOTAL</td>
          <td style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;font-size:14px;color:${totalReste>0?'#C0392B':'#1A6B45'};">${fmtF(totalReste)}</td>
        </tr>
      </tbody>
    </table>`;

    // ── SECTION 2 : ENCAISSEMENTS ───────────────────────────────────
    html += `<div style="background:#0E6AAF;color:#fff;font-weight:700;font-size:12px;padding:6px 12px;margin-bottom:0;font-family:'Berlin Sans FB',Calibri,sans-serif;">
      ENCAISSEMENTS – ${MNOMS_L[m].toUpperCase()} ${a}
    </div>`;

    if (paysImm.length===0) {
      html += `<div style="padding:12px;font-style:italic;color:#888;font-size:12px;border:1px solid #C5DCF0;margin-bottom:16px;">Aucun versement enregistré pour ce mois.</div>`;
    } else {
      html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;">
        <thead>
          <tr style="background:#0E6AAF;color:#fff;">
            <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;width:110px;">Date</th>
            <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;width:60px;">Local</th>
            <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:left;">Locataire</th>
            <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:left;width:160px;">Note</th>
            <th style="padding:6px 8px;border:1px solid #C5DCF0;text-align:right;width:120px;">Montant</th>
          </tr>
        </thead>
        <tbody>`;
      groupPayments(paysImm).forEach((p,i) => {
        const l = DATA.locataires.find(x=>x.id===p.locId);
        const rowBg = i%2===0?'#fff':'#EEF6FC';
        const isC = p.type==='caution';
        html += `
          <tr style="background:${rowBg};">
            <td style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;color:#666;">${p.date.split('-').reverse().join('/')}</td>
            <td style="padding:6px 8px;border:1px solid #C5DCF0;text-align:center;font-weight:700;color:#0E6AAF;">${l?l.appt||'–':'–'}</td>
            <td style="padding:6px 8px;border:1px solid #C5DCF0;">${l?l.nom:'–'}</td>
            <td style="padding:6px 8px;border:1px solid #C5DCF0;font-style:italic;color:#888;">${p.note||p.type}</td>
            <td style="padding:6px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:${isC?'#7F5AB0':'#1A6B45'};">${fmtK(p.montant)}</td>
          </tr>`;
      });
      html += `
          <tr style="background:#f5f5f5;">
            <td colspan="4" style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;color:#666;font-style:italic;">Loyers encaissés</td>
            <td style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#1A6B45;">${fmtK(encLoyers)}</td>
          </tr>
          ${encCautions>0?`<tr style="background:#f5f5f5;">
            <td colspan="4" style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;color:#666;font-style:italic;">Cautions reçues</td>
            <td style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#7F5AB0;">${fmtK(encCautions)}</td>
          </tr>`:''}
          <tr style="background:#D6E9F6;">
            <td colspan="4" style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#0E6AAF;font-size:13px;">TOTAL COLLECTÉ</td>
            <td style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#0E6AAF;font-size:14px;">${fmtK(encTotal)}</td>
          </tr>
        </tbody></table>`;
      if (encBailleur>0) {
        html += '<table style="width:100%;border-collapse:collapse;margin-top:-1px;">'
          + '<tr style="background:#FFF8E1;">'
          + '<td colspan="4" style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;color:#E65100;font-style:italic;">Loyer reçu par le bailleur</td>'
          + '<td style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#E65100;">'+fmtK(encBailleur)+'</td>'
          + '</tr>'
          + '<tr style="background:#D6E9F6;">'
          + '<td colspan="4" style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#0E6AAF;font-size:13px;">TOTAL COLLECTÉ AU CABINET</td>'
          + '<td style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#0E6AAF;font-size:14px;">'+fmtK(encCabinet)+'</td>'
          + '</tr></table>';
      }
      if (commMontant2>0) {
        const commLabel2 = 'Commission Cabinet' + (comm2.type==='pct' ? ' ('+comm2.valeur+'%)' : '');
        html += '<table style="width:100%;border-collapse:collapse;margin-top:-1px;">'
          + '<tr style="background:#f5f5f5;">'
          + '<td colspan="4" style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;color:#555;font-style:italic;">'+commLabel2+'</td>'
          + '<td style="padding:5px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#555;">'+fmtK(commMontant2)+'</td>'
          + '</tr>'
          + '<tr style="background:#E8F5E9;">'
          + '<td colspan="4" style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#1A6B45;font-size:13px;">NET À PERCEVOIR</td>'
          + '<td style="padding:7px 8px;border:1px solid #C5DCF0;text-align:right;font-weight:700;color:#1A6B45;font-size:14px;">'+fmtK(netAPercevoir2)+'</td>'
          + '</tr></table>';
      }
      html += '</div>';
      if (encLoyers > 0) {
        html += `<div style="border-left:4px solid #F8CACB;padding:8px 12px;margin-bottom:16px;background:#fffaf9;font-size:12px;">
          <strong style="color:#0E6AAF;">Soit :</strong>
          <em style="color:#333;"> ${enToutesLettres(encLoyers)} (${fmtK(encLoyers)}) versés au titre des loyers de ${MNOMS_L[m]} ${a}.</em>
        </div>`;
      }
    }

    // ── SIGNATURES ──────────────────────────────────────────────────
    html += `
    <div style="display:flex;gap:40px;margin-top:32px;">
      <div style="flex:1;">
        <div style="font-weight:700;color:#0E6AAF;font-size:12px;">Le Gestionnaire</div>
        <div style="font-size:11px;color:#888;font-style:italic;margin-bottom:32px;">CRAA</div>
        <div style="font-size:11px;color:#888;">Signature & Cachet :</div>
        <div style="border-bottom:1.5px solid #0E6AAF;margin-top:40px;"></div>
      </div>
      <div style="flex:1;text-align:right;">
        <div style="font-weight:700;color:#0E6AAF;font-size:12px;">Lu et approuvé – Le Propriétaire</div>
        <div style="font-size:11px;color:#888;font-style:italic;margin-bottom:32px;">${im.nom}</div>
        <div style="font-size:11px;color:#888;">Signature :</div>
        <div style="border-bottom:1.5px solid #0E6AAF;margin-top:40px;"></div>
      </div>
    </div>
    <div style="text-align:center;font-size:10px;color:#bbb;font-style:italic;margin-top:16px;">
      Document généré le ${today} par ImmoGest · CRAA
    </div>`;
  });

  // Show in modal
  document.getElementById('rapport-preview-html').innerHTML = html;
  document.getElementById('rapport-content').textContent = '';
  const label = iidFilter !== undefined
    ? DATA.immeubles.find(i=>i.id===iidFilter)?.nom || ''
    : 'Tous immeubles';
  document.getElementById('preview-title').textContent = '📄 Aperçu – ' + label + ' · ' + MNOMS[m] + ' ' + a;
  document.getElementById('modal-rapport').classList.add('open');
}

async function genDocxRelances(iid) {
  if (!window.docx) { showToast('Bibliothèque docx non chargée','red'); return; }
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = window.docx;
  const im = DATA.immeubles.find(i=>i.id===iid);
  const locs = DATA.locataires.filter(l=>l.iid===iid&&l.s==='impayé'&&l.reste>0);
  if (!locs.length) { showToast('Aucun impayé pour cet immeuble','accent'); return; }
  const today = new Date().toLocaleDateString('fr-FR');
  const children = [
    new Paragraph({children:[new TextRun({text:'LISTE DES RELANCES',bold:true,size:28,color:'0f1117'})],alignment:AlignmentType.CENTER,spacing:{after:80}}),
    new Paragraph({children:[new TextRun({text:im.nom.toUpperCase()+' – '+im.ville,size:22,color:'555555'})],alignment:AlignmentType.CENTER,spacing:{after:80}}),
    new Paragraph({children:[new TextRun({text:today,size:20,color:'888888',italics:true})],alignment:AlignmentType.CENTER,spacing:{after:480}}),
    new Paragraph({children:[new TextRun({text:'Total à recouvrer : '+fmt(locs.reduce((s,l)=>s+l.reste,0)),bold:true,size:24,color:'c0392b'})],spacing:{after:400}}),
  ];
  locs.forEach(l => {
    children.push(new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:2,color:'cccccc'}},spacing:{before:320,after:160}}));
    children.push(new Paragraph({children:[new TextRun({text:(l.appt||'–')+' – '+l.nom,bold:true,size:24})],spacing:{after:80}}));
    children.push(new Paragraph({children:[new TextRun({text:'Tél : '+(l.tel||'–')+'   |   Loyer : '+fmt(l.loyer)+'   |   Doit : '+fmt(l.reste),size:20,color:'555555'})],spacing:{after:80}}));
    children.push(new Paragraph({children:[new TextRun({text:'Situation : '+l.obs,size:20,italics:true,color:'888888'})],spacing:{after:160}}));
    children.push(new Paragraph({children:[new TextRun({text:'Message de relance :',bold:true,size:20,color:'1e3a5f'})],spacing:{after:80}}));
    children.push(new Paragraph({children:[new TextRun({text:'Bonjour '+l.nom+', nous vous rappelons que votre loyer de '+fmt(l.loyer)+' est en souffrance. Le montant total dû s\'élève à '+fmt(l.reste)+'. Merci de régulariser votre situation dans les meilleurs délais. Cordialement, Gestion '+im.nom+'.',size:20})],spacing:{after:80}}));
  });
  children.push(new Paragraph({children:[new TextRun({text:'Généré le '+today+' par ImmoGest',size:16,color:'aaaaaa',italics:true})],alignment:AlignmentType.RIGHT,spacing:{before:480}}));
  const doc = new Document({sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1440,bottom:1440,left:1440}}},children}]});
  const buf = await Packer.toBlob(doc);
  const a=document.createElement('a'); a.href=URL.createObjectURL(buf);
  a.download='Relances_'+im.nom.split(' ')[0]+'_'+today.replace(/\//g,'-')+'.docx'; a.click();
  showToast('Liste des relances téléchargée ✓');
}


// ============================================================
// STATISTIQUES
// ============================================================
function previewDownload() {
  closeModals();
  setTimeout(() => genDocxRapportMensuel(_previewIidFilter), 200);
}

async function genDocxMiseEnDemeure(locId) {
  if (!window.docx) { showToast('Bibliothèque docx non chargée','red'); return; }
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = window.docx;
  const l = DATA.locataires.find(x=>x.id===locId);
  const im = DATA.immeubles.find(i=>i.id===l.iid);
  const today = new Date().toLocaleDateString('fr-FR');
  const mkP = (text,opts={},align=AlignmentType.LEFT) => new Paragraph({children:[new TextRun({text,...opts})],alignment:align,spacing:{after:200}});
  const doc = new Document({sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1800,bottom:1440,left:1800}}},children:[
    mkP('GESTION IMMOBILIÈRE',{bold:true,size:26}),
    mkP('Immeuble '+im.nom,{size:22,color:'555555'}),
    mkP(im.ville+(im.quartier?' · '+im.quartier:''),{size:20,color:'888888'}),
    new Paragraph({children:[],spacing:{after:480}}),
    mkP(im.ville+', le '+today,{italics:true,size:22},AlignmentType.RIGHT),
    new Paragraph({children:[],spacing:{after:320}}),
    mkP('À l\'attention de :',{bold:true,size:22}),
    mkP(l.nom,{bold:true,size:22}),
    mkP('Local '+(l.appt||'–')+' – Immeuble '+im.nom,{size:22}),
    new Paragraph({children:[],spacing:{after:320}}),
    new Paragraph({children:[new TextRun({text:'Objet : ',bold:true,size:22}),new TextRun({text:'MISE EN DEMEURE DE PAYER – Arriérés de loyer',bold:true,underline:{},size:22})],spacing:{after:480}}),
    mkP('Monsieur/Madame,',{size:22}),
    mkP('Par la présente, nous vous mettons en demeure de procéder au règlement immédiat des sommes dues au titre de votre loyer pour le local '+(l.appt||'–')+' que vous occupez au sein de l\'immeuble '+im.nom+'.',{size:22}),
    mkP('État de votre compte locatif :',{bold:true,size:22}),
    mkP('    • Loyer mensuel contractuel : '+fmt(l.loyer),{size:22}),
    mkP('    • Montant total dû : '+fmt(l.reste),{bold:true,size:22,color:'c0392b'}),
    mkP('    • Situation : '+l.obs,{size:22,italics:true}),
    new Paragraph({children:[],spacing:{after:240}}),
    new Paragraph({children:[new TextRun({text:'En conséquence, nous vous demandons formellement de procéder au règlement intégral de la somme de ',size:22}),new TextRun({text:fmt(l.reste),bold:true,size:22,color:'c0392b'}),new TextRun({text:' dans un délai de ',size:22}),new TextRun({text:'huit (8) jours',bold:true,size:22}),new TextRun({text:' à compter de la réception de la présente.',size:22})],spacing:{after:240}}),
    mkP('À défaut, nous nous verrons contraints d\'engager sans autre préavis toutes les procédures légales disponibles, notamment la résiliation judiciaire du bail, la procédure d\'expulsion et le recouvrement de toutes sommes dues.',{size:22}),
    new Paragraph({children:[],spacing:{after:240}}),
    mkP('Nous espérons que vous donnerez suite favorablement à la présente.',{size:22}),
    new Paragraph({children:[],spacing:{after:480}}),
    mkP('Veuillez agréer, Monsieur/Madame, l\'expression de nos salutations distinguées.',{size:22}),
    new Paragraph({children:[],spacing:{after:480}}),
    mkP('Le Gestionnaire',{bold:true,size:22},AlignmentType.RIGHT),
    mkP('Immeuble '+im.nom,{size:20,italics:true},AlignmentType.RIGHT),
    new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:4,color:'888888',space:1}},spacing:{before:600,after:120}}),
    mkP('Document confidentiel – Généré le '+today+' par ImmoGest',{size:16,color:'aaaaaa',italics:true},AlignmentType.CENTER),
  ]}]});
  const buf = await Packer.toBlob(doc);
  const a=document.createElement('a'); a.href=URL.createObjectURL(buf);
  a.download='MiseEnDemeure_'+l.nom.replace(/\s+/g,'_')+'_'+today.replace(/\//g,'-')+'.docx'; a.click();
  showToast('Lettre téléchargée ✓');
}


async function genDocxPlainte(locId) {
  if (!window.docx) { showToast("Bibliothèque docx non chargée","red"); return; }
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign
  } = window.docx;

  const l  = DATA.locataires.find(x=>x.id===locId);
  const im = DATA.immeubles.find(i=>i.id===l.iid);
  if (!l||!im) return;

  const tribunaux = {
    "Douala":     "TRIBUNAL DE PREMIÈRE INSTANCE DE DOUALA BONANJO",
    "Makepe":     "TRIBUNAL DE PREMIÈRE INSTANCE DE DOUALA BONANJO",
    "Yaoundé":    "TRIBUNAL DE PREMIÈRE INSTANCE DE YAOUNDÉ CENTRE ADMINISTRATIF",
    "Oyom Abang": "TRIBUNAL DE PREMIÈRE INSTANCE DE YAOUNDÉ CENTRE ADMINISTRATIF",
    "Emana":      "TRIBUNAL DE PREMIÈRE INSTANCE DE YAOUNDÉ CENTRE ADMINISTRATIF",
    "Ekie":       "TRIBUNAL DE PREMIÈRE INSTANCE DE YAOUNDÉ CENTRE ADMINISTRATIF",
    "Mendong":    "TRIBUNAL DE PREMIÈRE INSTANCE DE YAOUNDÉ EKOUNOU",
    "Damase":     "TRIBUNAL DE PREMIÈRE INSTANCE DE YAOUNDÉ EKOUNOU",
  };
  const tribunal = tribunaux[im.ville] || tribunaux[im.quartier] || ("TRIBUNAL DE PREMIÈRE INSTANCE DE " + im.ville.toUpperCase());
  const villeDoc = im.ville;
  const today    = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  const dateAuj  = new Date().toLocaleDateString("fr-FR");
  const fmtN     = n => Number(n||0).toLocaleString("fr-FR");

  function enToutesLettres(n) {
    const u=["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
    const t=["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];
    if(n===0)return"zéro";if(n<0)return"moins "+enToutesLettres(-n);
    let r="";
    if(n>=1000000){r+=enToutesLettres(Math.floor(n/1000000))+" million"+(Math.floor(n/1000000)>1?"s":"")+" ";n%=1000000;}
    if(n>=1000){const c=Math.floor(n/1000);r+=(c===1?"mille":(enToutesLettres(c)+" mille"))+" ";n%=1000;}
    if(n>=100){const c=Math.floor(n/100);r+=(c===1?"cent":(u[c]+" cent"))+" ";n%=100;}
    if(n>0){if(n<20){r+=u[n];}else{const tx=Math.floor(n/10),ux=n%10;if(tx===7||tx===9)r+=t[tx]+"-"+u[tx===7?10+ux:10+ux];else r+=t[tx]+(ux===1&&tx<8?" et ":ux>0?"-":"")+(ux>0?u[ux]:"");}}
    return r.trim();
  }

  const noBorder = {top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}};
  const sp = (n=160) => new Paragraph({children:[],spacing:{after:n}});

  function r(text, opts={}) {
    return new TextRun({text, size:opts.size||24, font:"Times New Roman",
      bold:opts.bold||false, italics:opts.italic||false,
      color:opts.color||"000000"});
  }

  function mkP(runs, opts={}) {
    const align = opts.align || AlignmentType.JUSTIFIED;
    const spacing = opts.spacing || 200;
    const children = typeof runs==="string"
      ? [new TextRun({text:runs, size:24, font:"Times New Roman", bold:opts.bold||false, color:"000000"})]
      : runs;
    return new Paragraph({children, alignment:align, spacing:{after:spacing}});
  }

  function mkCell(children, opts={}) {
    return new TableCell({
      children,
      columnSpan: opts.colspan||1,
      verticalAlign: VerticalAlign.TOP,
      margins:{top:opts.padT||100,bottom:opts.padB||100,left:opts.padL||120,right:opts.padR||120},
      borders: noBorder,
    });
  }

  const nbMois = l.loyer > 0 ? Math.round(l.reste / l.loyer) : 0;

  const doc = new Document({
    styles:{default:{document:{run:{font:"Times New Roman",size:24}}}},
    sections:[{
      properties:{page:{size:{width:11906,height:16838},margin:{top:1000,right:1200,bottom:1000,left:1200}}},
      children:[

        new Table({
          width:{size:9506,type:WidthType.DXA},
          columnWidths:[4500,5006],
          borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.NONE}},
          rows:[new TableRow({children:[
            mkCell([
              new Paragraph({children:[r("Cabinet de Recouvrement et d\u2019Avocats Associ\u00e9s",{bold:true})],spacing:{after:80}}),
              new Paragraph({children:[r("CRAA",{bold:true})],spacing:{after:80}}),
              new Paragraph({children:[r("+237 676 52 89 17 / 693 53 06 85",{size:22})],spacing:{after:0}}),
            ],{padL:0}),
            mkCell([
              new Paragraph({children:[r(villeDoc+", le "+today)],alignment:AlignmentType.RIGHT,spacing:{after:200}}),
              new Paragraph({children:[r("À",{bold:true})],alignment:AlignmentType.RIGHT,spacing:{after:80}}),
              new Paragraph({children:[r("MONSIEUR LE PROCUREUR DE LA RÉPUBLI\u0051UE",{bold:true})],alignment:AlignmentType.RIGHT,spacing:{after:80}}),
              new Paragraph({children:[r("PRÈS LE",{bold:true})],alignment:AlignmentType.RIGHT,spacing:{after:80}}),
              new Paragraph({children:[r(tribunal,{bold:true})],alignment:AlignmentType.RIGHT,spacing:{after:0}}),
            ],{padL:0,padR:0}),
          ]})]
        }),

        sp(300),

        mkP([r("Objet : ",{bold:true}), r("Plainte contre "), r(l.nom,{bold:true}), r(" pour filouterie de loyer et abus de confiance")], {spacing:80}),

        sp(200),

        mkP("Monsieur le Procureur de la République,", {bold:true, spacing:240}),

        mkP([
          r("Le Cabinet de Recouvrement et d\u2019Avocats Associ\u00e9s (CRAA), agissant pour le compte de "),
          r(im.nom,{bold:true}),
          r(", propri\u00e9taire de l\u2019immeuble sis au quartier "),
          r(im.quartier||im.ville,{bold:true}),
          r(" \u00e0 "),
          r(im.ville,{bold:true}),
          r(", a l\u2019honneur de vous exposer ce qui suit :"),
        ]),

        sp(80),

        mkP([
          r("Que "),
          r(im.nom,{bold:true}),
          r(" a consenti \u00e0 "),
          r(l.nom,{bold:true}),
          r(" un bail portant sur le logement "),
          r(l.appt||"–",{bold:true}),
          r(" sis au quartier "),
          r(im.quartier||im.ville,{bold:true}),
          r(" \u00e0 "),
          r(im.ville,{bold:true}),
          r(", au prix mensuel de "),
          r(fmtN(l.loyer)+" ("+enToutesLettres(l.loyer)+") francs CFA",{bold:true}),
          r(" ;"),
        ]),

        mkP([
          r("Que depuis son entr\u00e9e dans les lieux, le mis en cause a cess\u00e9 tout paiement de son loyer, accumulant une dette locative de "),
          r(nbMois+" mois d\u2019arri\u00e9r\u00e9s",{bold:true}),
          r(", repr\u00e9sentant un montant total de "),
          r(fmtN(l.reste)+" ("+enToutesLettres(l.reste)+") francs CFA",{bold:true}),
          r(" ;"),
        ]),

        mkP([
          r("Que toutes les relances amiables effectu\u00e9es par le plaignant sont demeur\u00e9es vaines, le mis en cause persistant dans son refus de s\u2019acquitter de ses obligations locatives, constituant ainsi l\u2019infraction de "),
          r("filouterie de loyer",{bold:true}),
          r(" ;"),
        ]),

        mkP([
          r("Que de surcro\u00eet, "),
          r(l.nom,{bold:true}),
          r(" continue d\u2019occuper ledit logement sans s\u2019acquitter du moindre loyer, en toute connaissance de cause, abusant ainsi de la confiance accord\u00e9e par le propri\u00e9taire lors de la conclusion du contrat de bail, constituant l\u2019infraction d\u2019"),
          r("abus de confiance",{bold:true}),
          r(" ;"),
        ]),

        mkP([
          r("Que ces faits sont susceptibles de constituer les infractions suivantes au regard des "),
          r("articles 74, 318 et 322 (1) du Code P\u00e9nal camerounais",{bold:true}),
          r(" : la "),
          r("filouterie de loyer",{bold:true}),
          r(" et l\u2019"),
          r("abus de confiance",{bold:true}),
          r("."),
        ]),

        sp(200),

        mkP([
          r("C\u2019est pourquoi, "),
          r(im.nom,{bold:true}),
          r(", repr\u00e9sent\u00e9 par le Cabinet CRAA, sollicite qu\u2019il vous plaise, Monsieur le Procureur de la R\u00e9publique, de bien vouloir recevoir la pr\u00e9sente plainte, d\u2019ouvrir une enqu\u00eate pr\u00e9liminaire \u00e0 l\u2019effet de faire convoquer "),
          r(l.nom,{bold:true}),
          r(" afin qu\u2019il r\u00e9ponde de ses actes, et de prendre toute mesure l\u00e9gale permettant la restitution des sommes dues et l\u2019\u00e9tablissement des responsabilit\u00e9s."),
        ]),

        sp(300),
        mkP("Profond respect", {align:AlignmentType.LEFT, spacing:400}),

        new Table({
          width:{size:9506,type:WidthType.DXA},
          columnWidths:[4753,4753],
          borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.NONE}},
          rows:[new TableRow({children:[
            mkCell([
              new Paragraph({children:[r(im.nom,{bold:true,size:22})],spacing:{after:80}}),
              new Paragraph({children:[r("Le Plaignant",{size:20,italic:true})],spacing:{after:400}}),
              new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:"000000"}},spacing:{before:560,after:0}}),
            ],{padL:0}),
            mkCell([
              new Paragraph({children:[r("Pour le Cabinet CRAA",{bold:true,size:22})],alignment:AlignmentType.RIGHT,spacing:{after:80}}),
              new Paragraph({children:[r("Le Mandataire",{size:20,italic:true})],alignment:AlignmentType.RIGHT,spacing:{after:400}}),
              new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:"000000"}},spacing:{before:560,after:0}}),
            ],{padR:0}),
          ]})]
        }),

        sp(200),
        new Paragraph({
          children:[r("Document g\u00e9n\u00e9r\u00e9 le "+dateAuj+" par ImmoGest \u00b7 CRAA",{size:18,italic:true,color:"AAAAAA"})],
          alignment:AlignmentType.CENTER
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Plainte_"+l.nom.replace(/\s+/g,"_")+"_"+dateAuj.replace(/\//g,"-")+".docx";
  a.click();
  showToast("Plainte téléchargée ✓");
}



// ============================================================
// AUTH SYSTEM
// ============================================================
const AUTH_KEY = 'immogest_auth';

// Default users
const DEFAULT_USERS = [
  // Individuel — admin uniquement (proprios et locataires créés dynamiquement)
  { id:'ind1', version:'individuel', role:'admin', nom:'Administrateur', password:'immo2024', immeubles:[], customPerms:{} },
  // Entreprise — comptes de démo
  { id:'adm1', version:'entreprise', role:'admin',         nom:'Administrateur',    username:'admin',        password:'admin2024',  immeubles:[], pin:null, customPerms:{} },
  // ges1 et cpt1 supprimés — n'existent qu'en mode entreprise, créés manuellement par l'admin
  { id:'pro1', version:'entreprise', role:'proprietaire',  nom:'TIWA Herve Francis',username:'tiwa',  tel:'',  password:'tiwa2024',   immeubles:[0], pin:null, customPerms:{}, mustChangePassword:true },
  { id:'pro2', version:'entreprise', role:'proprietaire',  nom:'Ibrahim',           username:'ibrahim', tel:'',  password:'ibra2024',   immeubles:[2], pin:null, customPerms:{}, mustChangePassword:true },
  { id:'loc1', version:'entreprise', role:'locataire',     nom:'BINDZI EVOUNA Thomas', username:'bindzi',   password:null, immeubles:[2], locId:17, pin:'1234', customPerms:{} },
];

let USERS = [];
let SESSION = null; // { userId, role, version, nom, immeubles, locId }

function loadUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem('immogest_users_v6') || 'null');
    if (saved && saved.length > 0) {
      USERS = saved;
      // Migration : s'assurer que le compte admin individuel a le bon rôle et un nom correct
      const adminInd = USERS.find(u => u.version === 'individuel');
      if (adminInd) {
        let changed = false;
        if (adminInd.role !== 'admin') { adminInd.role = 'admin'; changed = true; }
        const nomsErrones = ['Gestionnaire', 'Jean Gestionnaire', 'admin', 'user', ''];
        if (nomsErrones.includes(adminInd.nom)) { adminInd.nom = 'Administrateur'; changed = true; }
        if (changed) localStorage.setItem('immogest_users_v6', JSON.stringify(USERS));
      }
    } else {
      USERS = JSON.parse(JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('immogest_users_v6', JSON.stringify(USERS));
    }
    // PURGE PERMANENTE mode individuel : lire la session directement dans localStorage
    // car SESSION n'est pas encore chargé à ce stade
    var _sessRaw = null;
    try { _sessRaw = JSON.parse(localStorage.getItem('immogest_auth') || 'null'); } catch(e2) {}
    var _isIndivMode = _sessRaw && _sessRaw.version === 'individuel';
    // Aussi détecter via les USERS : si un compte individuel admin existe → mode individuel
    var _hasIndivAdmin = USERS.some(function(u){ return u.version==='individuel' && u.role==='admin'; });
    if (_isIndivMode || _hasIndivAdmin) {
      var _before = USERS.length;
      USERS = USERS.filter(function(u){
        return !(u.version === 'entreprise' && (u.role === 'gestionnaire' || u.role === 'comptable'));
      });
      if (USERS.length !== _before) localStorage.setItem('immogest_users_v6', JSON.stringify(USERS));
    }
  } catch(e) { USERS = JSON.parse(JSON.stringify(DEFAULT_USERS)); }
}

function saveUsers() {
  try { localStorage.setItem('immogest_users_v6', JSON.stringify(USERS)); } catch(e) {}
}

function exporterSauvegarde() {
  const backup = { version: DATA_VERSION, date: new Date().toISOString(), data: DATA, users: USERS };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ImmoGest_backup_' + new Date().toLocaleDateString('fr-FR').replace(/[/]/g, '-') + '.json';
  a.click();
  showToast('Sauvegarde exportee !');
}

function importerSauvegarde(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.data) { showToast('Fichier invalide', 'red'); return; }
      if (!confirm('Importer ? Les donnees actuelles seront remplacees.')) return;
      localStorage.setItem('immogest_data', JSON.stringify(backup.data));
      if (backup.users) localStorage.setItem('immogest_users_v6', JSON.stringify(backup.users));
      showToast('Importee ! Rechargement...');
      setTimeout(() => location.reload(), 1200);
    } catch(err) { showToast('Erreur importation', 'red'); }
  };
  reader.readAsText(file);
}


function loadSession() {
  try {
    const s = localStorage.getItem(AUTH_KEY); // DEPLOY17: localStorage pour persister entre rechargements
    if (s) SESSION = JSON.parse(s);
  } catch(e) {}
}

// Purge appelée après loadUsers + loadSession : retire gest/compta en mode individuel
function _purgeUsersIndiv() {
  if (!SESSION || SESSION.version !== 'individuel') return;
  var before = USERS.length;
  USERS = USERS.filter(function(u) {
    return !(u.version === 'entreprise' && (u.role === 'gestionnaire' || u.role === 'comptable'));
  });
  if (USERS.length !== before) saveUsers();
}

function saveSession() {
  localStorage.setItem(AUTH_KEY, JSON.stringify(SESSION)); // DEPLOY17
}

function clearSession() {
  SESSION = null;
  localStorage.removeItem(AUTH_KEY); // DEPLOY17
}

// ── PERMISSIONS ──────────────────────────────────────────────────────────────
const PERMISSIONS = {
  //                    canSeeAll  canEdit  canManageUsers  canFinance  canJuridique  canStats  canEditLocataires  canRecordPayment
  admin:        { canSeeAll:true,  canEdit:true,  canManageUsers:true,  canFinance:true,  canJuridique:true,  canStats:true,  canEditLocataires:true,  canRecordPayment:true  },
  gestionnaire: { canSeeAll:false, canEdit:true,  canManageUsers:false, canFinance:false, canJuridique:true,  canStats:true,  canEditLocataires:true,  canRecordPayment:true  },
  comptable:    { canSeeAll:true,  canEdit:false, canManageUsers:false, canFinance:true,  canJuridique:false, canStats:true,  canEditLocataires:false, canRecordPayment:true  },
  proprietaire: { canSeeAll:false, canEdit:false, canManageUsers:false, canFinance:false, canJuridique:false, canStats:true,  canEditLocataires:false, canRecordPayment:false },
  locataire:    { canSeeAll:false, canEdit:false, canManageUsers:false, canFinance:false, canJuridique:false, canStats:false, canEditLocataires:false, canRecordPayment:false },
};

function can(perm) {
  if (!SESSION) return false;
  // Individuel has ALL permissions
  if (SESSION.version === 'individuel') return true;
  // Check custom permissions first (admin-granted overrides)
  if (SESSION.customPerms && perm in SESSION.customPerms) {
    return SESSION.customPerms[perm];
  }
  // Fall back to role defaults
  return PERMISSIONS[SESSION.role]?.[perm] || false;
}

function canSeeImmeuble(iid) {
  if (!SESSION) return false;
  if (SESSION.role === 'admin') return true;
  if (SESSION.role === 'comptable') return true;
  if (SESSION.role === 'gestionnaire') return SESSION.immeubles.includes(iid);
  if (SESSION.role === 'proprietaire') return SESSION.immeubles.includes(iid);
  if (SESSION.role === 'locataire') return SESSION.immeubles.includes(iid);
  return false;
}

function getVisibleImmeubles() {
  if (!SESSION) return [];
  if (SESSION.role === 'admin' || SESSION.role === 'comptable') return DATA.immeubles;
  return DATA.immeubles.filter(im => SESSION.immeubles.includes(im.id));
}

// ── VERSION SELECTOR ─────────────────────────────────────────────────────────
function selectVersion(v, el) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('auth-individuel').style.display = v==='individuel'?'block':'none';
  document.getElementById('auth-entreprise').style.display = v==='entreprise'?'block':'none';
}

function onRoleChange(role) {
  window._authRole = role;
  const errEl = document.getElementById('err-entreprise');
  if (errEl) errEl.style.display = 'none';
  const pwdBlock = document.getElementById('login-pwd-block');
  const pinBlock = document.getElementById('login-pin-block');
  const btnLogin = document.getElementById('btn-login-ent');
  if (!role) {
    pwdBlock.style.display = 'none';
    pinBlock.style.display = 'none';
    btnLogin.style.display = 'none';
    return;
  }
  if (role === 'locataire') {
    pwdBlock.style.display = 'none';
    pinBlock.style.display = 'block';
    btnLogin.style.display = 'none';
    setTimeout(()=>document.getElementById('pin1').focus(),100);
  } else {
    pwdBlock.style.display = 'block';
    pinBlock.style.display = 'none';
    btnLogin.style.display = 'block';
    setTimeout(()=>document.getElementById('ent-username').focus(),100);
  }
}

function pinNext(el, nextId) {
  if (el.value.length === 1) document.getElementById(nextId).focus();
}
function pinBack(e, el, prevId) {
  if (e.key === 'Backspace' && !el.value) document.getElementById(prevId).focus();
}
function pinSubmit() {
  const pin = ['pin1','pin2','pin3','pin4'].map(id=>document.getElementById(id).value).join('');
  if (pin.length === 4) loginEntreprise();
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function loginIndividuel() {
  const pwd = document.getElementById('pwd-individuel').value;
  let user = USERS.find(u => u.version==='individuel' && u.role==='admin' && u.password===pwd);
  // Fallback : chercher n'importe quel compte individuel si pas de role=admin
  if (!user) user = USERS.find(u => u.version==='individuel' && u.password===pwd);
  if (!user) {
    document.getElementById('err-individuel').style.display = 'block';
    return;
  }
  // Forcer role=admin pour le compte individuel principal
  user.role = 'admin';
  // SUPPRIMER définitivement gestionnaire et comptable en mode perso
  USERS = USERS.filter(u => !(u.role === 'gestionnaire' || u.role === 'comptable'));
  saveUsers();
  startSession(user, 'individuel');
}

function loginEntreprise() {
  const role = window._authRole;
  const errEl = document.getElementById('err-entreprise');
  errEl.style.display = 'none';

  if (role === 'locataire') {
    const telInput = document.getElementById('loc-tel-login-ent') || document.getElementById('loc-tel-login');
    const pin = ['pin1','pin2','pin3','pin4'].map(id=>document.getElementById(id)?document.getElementById(id).value:'').join('');
    const telVal = telInput ? telInput.value.trim() : '';
    // Find locataire by phone + PIN
    const locataire = DATA.locataires.find(l => 
      l.tel && l.tel.replace(/[^0-9]/g,'') === telVal.replace(/[^0-9]/g,'') && 
      l.pin === pin && l.s !== 'libre'
    );
    if (!locataire) { 
      errEl.textContent='Numéro ou PIN incorrect'; 
      errEl.style.display='block'; 
      ['pin1','pin2','pin3','pin4'].forEach(id=>{document.getElementById(id).value=''});
      if(document.getElementById('pin1')) document.getElementById('pin1').focus(); 
      return; 
    }
    // Create session for locataire
    const user = { 
      id: 'loc_' + locataire.id, 
      nom: locataire.nom, 
      role: 'locataire', 
      locId: locataire.id,
      iid: locataire.iid,
      version: 'entreprise'
    };
    startSession(user, 'entreprise');
    // Show PIN change suggestion if firstLogin
    if (locataire.firstLogin) {
      setTimeout(() => showPINChangeSuggestion(locataire.id), 800);
    }
  } else {
    const username = document.getElementById('ent-username').value.trim();
    const password = document.getElementById('ent-password').value;
    const user = USERS.find(u => u.version==='entreprise' && u.role===role && u.username===username && u.password===password);
    if (!user) { errEl.textContent='Identifiant ou mot de passe incorrect'; errEl.style.display='block'; return; }
    if (user.actif === false) { errEl.textContent='Compte suspendu. Contactez l\'administrateur.'; errEl.style.display='block'; return; }
    startSession(user, 'entreprise');
  }
}

function startSession(user, version) {
  SESSION = {
    userId: user.id, role: user.role, version,
    nom: user.nom, immeubles: user.immeubles||[],
    locId: user.locId||null,
    customPerms: user.customPerms||{}
  };
  saveSession();

  // Check if user must change password
  const userRecord = USERS.find(u => u.id === user.id);
  if (userRecord && userRecord.mustChangePassword && user.role !== 'locataire') {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    showChangerMotDePasse(true); // forced = true
    return;
  }

  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';
  var aib = document.getElementById('ai-float-btn');
  if (aib) aib.style.display = 'flex';
  initApp();
}


function changerNomAdmin() {
  const user = USERS.find(u => u.version === 'individuel' && u.role === 'admin');
  if (!user) return;
  const nouveau = prompt('Votre nom d\'affichage :', user.nom || 'Administrateur');
  if (!nouveau || !nouveau.trim()) return;
  user.nom = nouveau.trim();
  SESSION.nom = user.nom;
  saveUsers();
  saveSession();
  // Rafraîchir l'affichage
  const chip = document.querySelector('.user-chip');
  if (chip) chip.remove();
  renderUserChip();
  const sidebarInfo = document.getElementById('sidebar-user-info');
  if (sidebarInfo) sidebarInfo.textContent = SESSION.nom;
  showToast('Nom mis à jour : ' + SESSION.nom, 'green');
}

function logout() {
  if (typeof logoutOneSignal === 'function') logoutOneSignal();
  clearSession();
  location.reload();
}

// ── USER CHIP in topbar ───────────────────────────────────────────────────────
function renderUserChip() {
  if (!SESSION) return;
  const roleColors = {admin:'#6B46C1',gestionnaire:'#0E6AAF',comptable:'#1A6B45',proprietaire:'#92400E',locataire:'#4A5568'};
  const roleLabels = {admin:'Admin',gestionnaire:'Gestionnaire',comptable:'Comptable',proprietaire:'Propriétaire',locataire:'Locataire'};
  const col = roleColors[SESSION.role]||'#4A5568';
  const initials = SESSION.nom.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const chip = document.createElement('div');
  chip.className = 'user-chip';
  chip.innerHTML = `
    <div class="avatar" style="background:${col};">${initials}</div>
    <span style="font-weight:500;">${SESSION.nom}</span>
    <span class="role-badge role-${SESSION.role}">${roleLabels[SESSION.role]}</span>
    <button onclick="logout()" title="Se déconnecter" style="margin-left:4px;padding:4px 10px;border-radius:5px;border:1px solid #C0392B;background:#FDF0F0;color:#C0392B;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);">⏻ Déconnexion</button>
  `;
  const topbarActions = document.querySelector('.topbar-actions');
  if (topbarActions) topbarActions.prepend(chip);
  // Also update sidebar footer info
  const sidebarInfo = document.getElementById('sidebar-user-info');
  if (sidebarInfo) sidebarInfo.textContent = SESSION.nom;
}

// ── SIDEBAR FILTER based on role ─────────────────────────────────────────────
function buildSidebarWithAuth() {
  buildSidebar(); // existing function
  // Hide nav items based on role
  if (!can('canJuridique')) {
    // hide relances juridiques button if no access
  }
  if (!can('canManageUsers')) {
    // hide user management
  }
  // Add user management for admin
  if (can('canManageUsers')) {
    const nav = document.getElementById('sidebar-nav-extra');
    if (nav) {
      const labelNav = SESSION.version === 'individuel' ? '👥 Connexions' : '👥 Utilisateurs';
      nav.innerHTML = '<div class="nav-item" onclick="navigate(\'utilisateurs\')">' +
        '<span class="nav-icon">👥</span> ' + (SESSION.version === 'individuel' ? 'Connexions' : 'Utilisateurs') + '</div>' +
        '<div class="nav-item" onclick="navigate(\'signalements\')">' +
        '<span class="nav-icon">🔧</span> Signalements' +
        '<span id="badge-signalements" style="background:#e74c3c;color:#fff;font-size:10px;padding:1px 6px;border-radius:99px;margin-left:6px;display:none;">0</span></div>';
    }
  }
}

// ── LOCATAIRE DASHBOARD ───────────────────────────────────────────────────────
async function genQuittance(payId) {
  if (!window.docx) { showToast("Bibliothèque non chargée","red"); return; }
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign } = window.docx;

  const p = DATA.paiements.find(x=>x.id===payId);
  const l = DATA.locataires.find(x=>x.id===p.locId);
  const im = DATA.immeubles.find(i=>i.id===l.iid);
  const isQuittance = p.type === 'loyer';
  const today = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  const dateAuj = new Date().toLocaleDateString("fr-FR");
  const fmtN = n => Number(n||0).toLocaleString("fr-FR");
  const BLUE="0E6AAF",BLUE_L="D6E9F6",WHITE="FFFFFF",DGRAY="333333",GRAY="666666",BORD="C5DCF0";
  const noBorder={top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}};

  function mkCell(text,opts={}) {
    const {bg=null,bold=false,color=DGRAY,size=22,align=AlignmentType.LEFT,colspan=1,bSz=2}=opts;
    return new TableCell({
      children:[new Paragraph({children:[new TextRun({text:String(text||""),bold,color,size,font:"Calibri"})],alignment:align,spacing:{after:0}})],
      columnSpan:colspan,verticalAlign:VerticalAlign.CENTER,
      margins:{top:100,bottom:100,left:120,right:120},
      borders:{top:{style:BorderStyle.SINGLE,size:bSz,color:BORD},bottom:{style:BorderStyle.SINGLE,size:bSz,color:BORD},left:{style:BorderStyle.SINGLE,size:bSz,color:BORD},right:{style:BorderStyle.SINGLE,size:bSz,color:BORD}},
      ...(bg?{shading:{fill:bg,type:ShadingType.CLEAR}}:{})
    });
  }

  function enToutesLettres(n) {
    const u=["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
    const t=["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];
    if(n===0)return"z\u00e9ro";if(n<0)return"moins "+enToutesLettres(-n);
    let r="";
    if(n>=1000000){r+=enToutesLettres(Math.floor(n/1000000))+" million"+(Math.floor(n/1000000)>1?"s":"")+" ";n%=1000000;}
    if(n>=1000){const c=Math.floor(n/1000);r+=(c===1?"mille":(enToutesLettres(c)+" mille"))+" ";n%=1000;}
    if(n>=100){const c=Math.floor(n/100);r+=(c===1?"cent":(u[c]+" cent"))+" ";n%=100;}
    if(n>0){if(n<20){r+=u[n];}else{const tx=Math.floor(n/10),ux=n%10;if(tx===7||tx===9)r+=t[tx]+"-"+u[tx===7?10+ux:10+ux];else r+=t[tx]+(ux===1&&tx<8?" et ":ux>0?"-":"")+(ux>0?u[ux]:"");}}
    return r.trim();
  }

  const refNum = "CRAA/" + (isQuittance?"QU":"RE") + "/" + new Date().getFullYear() + "/" + String(payId).padStart(4,"0");

  const doc = new Document({
    styles:{default:{document:{run:{font:"Calibri",size:22}}}},
    sections:[{
      properties:{page:{size:{width:11906,height:16838},margin:{top:1200,right:1200,bottom:1200,left:1200}}},
      children:[
        // Titre centré avec bordure
        new Paragraph({
          children:[new TextRun({text:isQuittance?"QUITTANCE DE LOYER":"REÇU DE PAIEMENT",bold:true,size:32,color:BLUE,font:"Berlin Sans FB"})],
          alignment:AlignmentType.CENTER,
          border:{bottom:{style:BorderStyle.SINGLE,size:6,color:"F8CACB",space:4}},
          spacing:{after:60}
        }),
        new Paragraph({
          children:[new TextRun({text:"Réf. : "+refNum+"   ·   "+today,size:20,color:GRAY,font:"Calibri"})],
          alignment:AlignmentType.CENTER,spacing:{after:400}
        }),

        // Tableau infos
        new Table({
          width:{size:9506,type:WidthType.DXA},columnWidths:[3000,6506],
          rows:[
            new TableRow({children:[mkCell("Bailleur / Gestionnaire",{bg:BLUE_L,bold:true,color:BLUE,size:20}),mkCell("Cabinet CRAA – "+im.nom,{bold:true,size:20})]}),
            new TableRow({children:[mkCell("Locataire",{bg:BLUE_L,bold:true,color:BLUE,size:20}),mkCell(l.nom,{size:20})]}),
            new TableRow({children:[mkCell("Local",{bg:BLUE_L,bold:true,color:BLUE,size:20}),mkCell((l.appt||"–")+" – "+im.nom+" – "+im.ville,{size:20})]}),
            new TableRow({children:[mkCell(isQuittance?"Mois concerné":"Date versement",{bg:BLUE_L,bold:true,color:BLUE,size:20}),mkCell(isQuittance?MNOMS[p.moisC]+" "+p.anneeC:p.date.split("-").reverse().join("/"),{size:20})]}),
            new TableRow({children:[mkCell("Loyer mensuel",{bg:BLUE_L,bold:true,color:BLUE,size:20}),mkCell(fmtN(l.loyer)+" FCFA",{size:20})]}),
            new TableRow({children:[mkCell("Montant réglé",{bg:BLUE_L,bold:true,color:BLUE,size:20}),mkCell(fmtN(p.montant)+" FCFA",{bold:true,size:22,color:"1A6B45"})]}),
            new TableRow({children:[mkCell("Mode de paiement",{bg:BLUE_L,bold:true,color:BLUE,size:20}),mkCell(p.mode||"Espèces",{size:20})]}),
          ]
        }),

        new Paragraph({children:[],spacing:{after:300}}),

        // Montant en toutes lettres
        new Paragraph({
          children:[
            new TextRun({text:"Soit : ",bold:true,size:22,color:BLUE,font:"Calibri"}),
            new TextRun({text:enToutesLettres(p.montant)+" francs CFA ("+fmtN(p.montant)+" FCFA)",size:22,color:DGRAY,italics:true,font:"Calibri"}),
          ],
          border:{left:{style:BorderStyle.THICK,size:12,color:"F8CACB",space:8}},
          indent:{left:200},spacing:{before:0,after:400}
        }),

        // Attestation
        new Paragraph({
          children:[new TextRun({text:isQuittance
            ? "Le bailleur soussigné certifie avoir reçu de "+l.nom+" la somme de "+fmtN(p.montant)+" FCFA au titre du loyer du local "+( l.appt||"–")+" pour le mois de "+MNOMS[p.moisC]+" "+p.anneeC+". Ce paiement solde le loyer du mois concerné."
            : "Le Cabinet CRAA certifie avoir reçu de "+l.nom+" la somme de "+fmtN(p.montant)+" FCFA en date du "+p.date.split("-").reverse().join("/")+". Ce reçu vaut preuve de paiement.",
            size:22,font:"Calibri",color:DGRAY})],
          alignment:AlignmentType.JUSTIFIED,spacing:{after:500}
        }),

        // Signatures
        new Table({
          width:{size:9506,type:WidthType.DXA},columnWidths:[4753,4753],
          borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.NONE}},
          rows:[new TableRow({children:[
            new TableCell({
              children:[
                new Paragraph({children:[new TextRun({text:"Le Gestionnaire / Bailleur",bold:true,size:20,color:BLUE,font:"Calibri"})],spacing:{after:80}}),
                new Paragraph({children:[new TextRun({text:"Cabinet CRAA",size:18,color:GRAY,font:"Calibri",italics:true})],spacing:{after:400}}),
                new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:BLUE}},spacing:{before:480,after:0}}),
              ],
              borders:noBorder,margins:{top:200,left:0,right:160,bottom:0}
            }),
            new TableCell({
              children:[
                new Paragraph({children:[new TextRun({text:"Le Locataire",bold:true,size:20,color:BLUE,font:"Calibri"})],alignment:AlignmentType.RIGHT,spacing:{after:80}}),
                new Paragraph({children:[new TextRun({text:l.nom,size:18,color:GRAY,font:"Calibri",italics:true})],alignment:AlignmentType.RIGHT,spacing:{after:400}}),
                new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:BLUE}},spacing:{before:480,after:0}}),
              ],
              borders:noBorder,margins:{top:200,left:160,right:0,bottom:0}
            }),
          ]})]
        }),

        new Paragraph({children:[],spacing:{after:300}}),
        new Paragraph({
          children:[new TextRun({text:"Document g\u00e9n\u00e9r\u00e9 le "+dateAuj+" par ImmoGest \u00b7 CRAA",size:16,color:"BBBBBB",italics:true,font:"Calibri"})],
          alignment:AlignmentType.CENTER
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (isQuittance?"Quittance":"Recu")+"_"+l.nom.replace(/\s+/g,"_")+"_"+MNOMS[p.moisC]+p.anneeC+".docx";
  a.click();
  showToast((isQuittance?"Quittance":"Reçu")+" t\u00e9l\u00e9charg\u00e9(e) \u2713");
}

// ── USER MANAGEMENT PAGE ──────────────────────────────────────────────────────
// ── GESTION UTILISATEURS — 3 ONGLETS ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// GESTION UTILISATEURS — MODE PERSO et ENTREPRISE séparés
// ═══════════════════════════════════════════════════════════════

window._usersTab = 'proprios';

function renderUtilisateurs(tab) {
  if (!can('canManageUsers')) {
    document.getElementById('content').innerHTML = '<div class="perm-denied"><div class="icon">🔒</div><div>Accès réservé à l\'administrateur</div></div>';
    return;
  }
  document.getElementById('page-title').textContent = 'Gestion des utilisateurs';
  document.getElementById('topbar-main-btn').style.display = 'none';

  if (SESSION && SESSION.version === 'individuel') {
    _renderUtilisateursPerso(tab);
  } else {
    _renderUtilisateursEntreprise(tab);
  }
}

// ── MODE PERSO : Propriétaires + Locataires uniquement ────────────────────────
function _renderUtilisateursPerso(tab) {
  if (!tab || tab === 'cabinet') tab = 'proprios';
  window._usersTab = tab;
  const t = tab;

  const proprios = USERS.filter(u => u.version === 'individuel' && u.role === 'proprietaire');
  const nbLocs   = DATA.locataires.filter(l => l.s !== 'libre').length;

  const tabStyle = id => id === t
    ? 'padding:9px 18px;border:none;border-radius:8px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;background:#0E6AAF;color:#fff;transition:all .2s;'
    : 'padding:9px 18px;border:none;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:transparent;color:var(--text2);transition:all .2s;';

  let html = '<div style="display:flex;background:var(--bg4);border-radius:10px;padding:4px;margin-bottom:20px;gap:4px;">'
    + '<button style="'+tabStyle('proprios')+'" onclick="renderUtilisateurs(\'proprios\')">🔑 Propriétaires <span style="background:rgba(255,255,255,0.25);padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">'+proprios.length+'</span></button>'
    + '<button style="'+tabStyle('locataires')+'" onclick="renderUtilisateurs(\'locataires\')">🏠 Locataires <span style="background:rgba(255,255,255,0.25);padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">'+nbLocs+'</span></button>'
    + '</div>';

  if (t === 'locataires') {
    html += _renderTabLocataires([], true);
  } else {
    html += _renderTabProprios(proprios, true);
  }

  document.getElementById('content').innerHTML = html;
}

// ── MODE ENTREPRISE : Cabinet + Propriétaires + Locataires ────────────────────
function _renderUtilisateursEntreprise(tab) {
  if (tab) window._usersTab = tab;
  if (!window._usersTab || window._usersTab === 'proprios') window._usersTab = 'cabinet';
  const t = window._usersTab;

  const cabinet   = USERS.filter(u => u.version === 'entreprise' && ['admin','gestionnaire','comptable'].includes(u.role));
  const proprios  = USERS.filter(u => u.version === 'entreprise' && u.role === 'proprietaire');
  const locataires= USERS.filter(u => u.version === 'entreprise' && u.role === 'locataire');

  const tabStyle = id => id === t
    ? 'padding:9px 18px;border:none;border-radius:8px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;background:#0E6AAF;color:#fff;transition:all .2s;'
    : 'padding:9px 18px;border:none;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:transparent;color:var(--text2);transition:all .2s;';

  let html = '<div style="display:flex;background:var(--bg4);border-radius:10px;padding:4px;margin-bottom:20px;gap:4px;">'
    + '<button style="'+tabStyle('cabinet')+'" onclick="renderUtilisateurs(\'cabinet\')">🏢 Équipe Cabinet <span style="background:rgba(255,255,255,0.25);padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">'+cabinet.length+'</span></button>'
    + '<button style="'+tabStyle('proprios')+'" onclick="renderUtilisateurs(\'proprios\')">🔑 Propriétaires <span style="background:rgba(255,255,255,0.25);padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">'+proprios.length+'</span></button>'
    + '<button style="'+tabStyle('locataires')+'" onclick="renderUtilisateurs(\'locataires\')">🏠 Locataires <span style="background:rgba(255,255,255,0.25);padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">'+locataires.length+'</span></button>'
    + '</div>';

  if (t === 'cabinet')    html += _renderTabCabinet(cabinet);
  else if (t === 'proprios') html += _renderTabProprios(proprios, false);
  else                    html += _renderTabLocataires(locataires, false);

  document.getElementById('content').innerHTML = html;
}

// ── RENDU ONGLET CABINET ──────────────────────────────────────────────────────
function _renderTabCabinet(users) {
  var roleLabels = {admin:'👑 Admin', gestionnaire:'📋 Gestionnaire', comptable:'💰 Comptable'};
  var roleColors = {admin:'var(--purple)', gestionnaire:'var(--accent)', comptable:'var(--green)'};
  var rows = '';
  users.forEach(function(u) {
    var actif = u.actif !== false;
    var imms = (u.role==='admin'||u.role==='comptable')
      ? '<span style="color:var(--green);font-size:12px;">Tous</span>'
      : (u.immeubles||[]).map(function(iid){
          var im = DATA.immeubles.find(function(i){return i.id===iid;});
          return im ? '<span class="badge badge-accent" style="margin:1px;font-size:10px;">'+im.nom.split(' ')[0]+'</span>' : '';
        }).join('') || '<span style="color:var(--text3);font-size:12px;">Aucun</span>';
    var btnEdit   = '<button class="btn btn-ghost btn-icon btn-sm" onclick="editUser(this.dataset.id)" data-id="'+u.id+'" title="Modifier">✎</button>';
    var btnBlock  = '<button class="btn btn-ghost btn-icon btn-sm" onclick="toggleBloquerUser(this.dataset.id)" data-id="'+u.id+'" title="'+(actif?'Bloquer':'Débloquer')+'" style="color:'+(actif?'var(--red)':'var(--green)')+';">'+(actif?'🔒':'🔓')+'</button>';
    var btnDelete = u.id!=='adm1' ? '<button class="btn btn-danger btn-icon btn-sm" onclick="deleteUser(this.dataset.id)" data-id="'+u.id+'" title="Supprimer">🗑</button>' : '';
    rows += '<tr style="opacity:'+(actif?'1':'0.5')+';">'
      + '<td class="td-name">'+u.nom+'</td>'
      + '<td><span class="role-badge" style="background:'+(roleColors[u.role]||'#888')+'22;color:'+(roleColors[u.role]||'#888')+';font-size:11px;">'+(roleLabels[u.role]||u.role)+'</span></td>'
      + '<td style="font-size:12px;font-family:var(--mono);">'+(u.username||'—')+'</td>'
      + '<td>'+imms+'</td>'
      + '<td>'+(actif?'<span style="color:var(--green);font-size:11px;font-weight:600;">● Actif</span>':'<span style="color:var(--red);font-size:11px;font-weight:600;">● Bloqué</span>')+'</td>'
      + '<td style="white-space:nowrap;">' + btnEdit + btnBlock + btnDelete + '</td>'
      + '</tr>';
  });
  return '<div class="card">'
    + '<div class="card-header"><div class="card-title">Équipe Cabinet CRAA</div>'
    + '<button class="btn btn-primary btn-sm" onclick="_openUserModal(null,\'cabinet\')">＋ Ajouter</button></div>'
    + '<div class="table-wrap"><table class="tbl">'
    + '<thead><tr><th>Nom</th><th>Rôle</th><th>Identifiant</th><th>Immeubles assignés</th><th>Statut</th><th></th></tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table></div></div>';
}

// ── RENDU ONGLET PROPRIÉTAIRES ────────────────────────────────────────────────
function _renderTabProprios(users, isIndiv) {
  var rows = '';
  if (users.length === 0) {
    rows = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px;font-style:italic;">Aucun propriétaire</td></tr>';
  } else {
    users.forEach(function(u) {
      var actif = u.actif !== false;
      var imms = DATA.immeubles.filter(function(im){ return (u.immeubles||[]).indexOf(im.id)>=0; });
      var btnEdit   = '<button class="btn btn-ghost btn-icon btn-sm" onclick="editUser(this.dataset.id)" data-id="'+u.id+'" title="Modifier">✎</button>';
      var btnReinit = '<button class="btn btn-ghost btn-icon btn-sm" onclick="reinitMdpUser(this.dataset.id)" data-id="'+u.id+'" title="Réinitialiser mot de passe" style="font-size:11px;">🔑</button>';
      var btnBlock  = '<button class="btn btn-ghost btn-icon btn-sm" onclick="toggleBloquerUser(this.dataset.id)" data-id="'+u.id+'" title="'+(actif?'Bloquer':'Débloquer')+'" style="color:'+(actif?'var(--red)':'var(--green)')+';">'+(actif?'🔒':'🔓')+'</button>';
      rows += '<tr style="opacity:'+(actif?'1':'0.5')+';">'
        + '<td class="td-name">'+u.nom+'</td>'
        + '<td style="font-size:12px;">'+(u.tel||'<span style="color:#ccc;">—</span>')+'</td>'
        + '<td style="font-size:12px;">'+(imms.length>0 ? imms.map(function(im){return '<span class="badge badge-accent" style="margin:1px;font-size:10px;">'+im.nom+'</span>';}).join('') : '<span style="color:var(--text3);">Aucun</span>')+'</td>'
        + '<td>'+(actif?'<span style="color:var(--green);font-size:11px;font-weight:600;">● Actif</span>':'<span style="color:var(--red);font-size:11px;font-weight:600;">● Bloqué</span>')+'</td>'
        + '<td style="white-space:nowrap;">' + btnEdit + btnReinit + btnBlock + '</td>'
        + '</tr>';
    });
  }
  return '<div class="card">'
    + '<div class="card-header"><div class="card-title">Propriétaires</div>'
    + '<button class="btn btn-primary btn-sm" onclick="_openUserModal(null,\'proprios\')">＋ Ajouter</button></div>'
    + '<div class="table-wrap"><table class="tbl">'
    + '<thead><tr><th>Nom</th><th>Téléphone</th><th>Immeubles</th><th>Statut</th><th></th></tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table></div></div>';
}

// ── RENDU ONGLET LOCATAIRES ───────────────────────────────────────────────────
function _renderTabLocataires(users, isIndiv) {
  var searchBar = '<div style="margin-bottom:14px;">'
    + '<input type="text" id="search-loc-users" placeholder="🔍 Rechercher un locataire (nom, tél, local)..." oninput="_filterLocUsers()" '
    + 'style="width:100%;padding:9px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">'
    + '</div>';

  var accordions = '';
  DATA.immeubles.forEach(function(im, idx) {
    var locsImm = DATA.locataires.filter(function(l){ return l.iid===im.id && l.s!=='libre'; });
    if (locsImm.length === 0) return;
    var rows = '';
    locsImm.forEach(function(l) {
      var actif = l.actif !== false;
      var pinLabel, pinColor;
      if (!l.pin)          { pinLabel = 'craa (défaut)'; pinColor = 'var(--text3)'; }
      else if (l.pin==='craa') { pinLabel = 'craa';          pinColor = 'var(--yellow)'; }
      else                 { pinLabel = '●●●● (modifié)'; pinColor = 'var(--green)'; }
      var btnReinit = '<button class="btn btn-ghost btn-icon btn-sm" onclick="reinitPINLocataire(this.dataset.id)" data-id="'+l.id+'" title="Réinitialiser PIN" style="font-size:11px;">🔑</button>';
      var btnBlock  = '<button class="btn btn-ghost btn-icon btn-sm" onclick="toggleBloquerLocataire(this.dataset.id)" data-id="'+l.id+'" title="'+(actif?'Bloquer':'Débloquer')+'" style="color:'+(actif?'var(--red)':'var(--green)')+';">'+(actif?'🔒':'🔓')+'</button>';
      rows += '<tr class="loc-user-row" data-search="'+(l.nom+' '+(l.tel||'')+' '+(l.appt||'')).toLowerCase()+'" style="opacity:'+(actif?'1':'0.55')+';">'
        + '<td>'+(l.appt||'—')+'</td>'
        + '<td class="td-name">'+l.nom+'</td>'
        + '<td style="font-size:12px;">'+(l.tel||'<span style="color:#ccc;">—</span>')+'</td>'
        + '<td style="font-size:11px;color:'+pinColor+';font-family:var(--mono);">'+pinLabel+'</td>'
        + '<td>'+(actif?'<span style="color:var(--green);font-size:11px;font-weight:600;">● Actif</span>':'<span style="color:var(--red);font-size:11px;font-weight:600;">● Bloqué</span>')+'</td>'
        + '<td style="white-space:nowrap;">' + btnReinit + btnBlock + '</td>'
        + '</tr>';
    });
    var blockId = 'acc-loc-' + im.id;
    var isOpen = idx === 0;
    accordions += '<div class="card" style="margin-bottom:10px;overflow:hidden;">'
      + '<div onclick="_toggleAcc(\''+blockId+'\')" style="display:flex;align-items:center;justify-content:space-between;padding:13px 18px;cursor:pointer;user-select:none;background:var(--bg2);border-bottom:1px solid var(--border);">'
      + '<div style="display:flex;align-items:center;gap:10px;">'
      + '<span style="width:11px;height:11px;border-radius:50%;background:'+im.col+';display:inline-block;flex-shrink:0;"></span>'
      + '<span style="font-weight:700;font-size:13px;">'+im.nom+'</span>'
      + '<span style="font-size:11px;color:var(--text3);">'+im.ville+(im.quartier?' · '+im.quartier:'')+'</span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      + '<span style="font-size:12px;color:var(--text3);background:var(--bg4);padding:2px 10px;border-radius:99px;">'+locsImm.length+' locataire(s)</span>'
      + '<span id="acc-arrow-'+im.id+'" style="font-size:12px;color:var(--text3);transition:transform .2s;display:inline-block;transform:'+(isOpen?'rotate(180deg)':'rotate(0deg)')+';">▼</span>'
      + '</div>'
      + '</div>'
      + '<div id="'+blockId+'" style="display:'+(isOpen?'block':'none')+';">'
      + '<div class="table-wrap"><table class="tbl">'
      + '<thead><tr><th>Local</th><th>Nom</th><th>Téléphone</th><th>PIN</th><th>Statut</th><th></th></tr></thead>'
      + '<tbody>'+rows+'</tbody>'
      + '</table></div></div></div>';
  });

  if (!accordions) accordions = '<div class="card"><div style="text-align:center;color:var(--text3);padding:24px;font-style:italic;">Aucun locataire actif</div></div>';
  return searchBar + accordions;
}

function _toggleAcc(blockId) {
  var el = document.getElementById(blockId);
  if (!el) return;
  var immId = blockId.replace('acc-loc-', '');
  var arrow = document.getElementById('acc-arrow-' + immId);
  var open = el.style.display === 'none';
  el.style.display = open ? 'block' : 'none';
  if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
}

function _filterLocUsers() {
  var q = (document.getElementById('search-loc-users').value || '').toLowerCase().trim();
  document.querySelectorAll('.loc-user-row').forEach(function(row) {
    row.style.display = (!q || row.dataset.search.indexOf(q) >= 0) ? '' : 'none';
  });
  if (q) {
    DATA.immeubles.forEach(function(im) {
      var block = document.getElementById('acc-loc-' + im.id);
      if (!block) return;
      var arrow = document.getElementById('acc-arrow-' + im.id);
      if (block.querySelectorAll('.loc-user-row:not([style*="display: none"])').length > 0) {
        block.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      }
    });
  }
}


// ── BLOCAGE / DEBLOCAGE ───────────────────────────────────────────────────────
function toggleBloquerUser(userId) {
  const u = USERS.find(x => x.id === userId);
  if (!u) return;
  u.actif = u.actif === false ? true : false;
  const action = u.actif ? 'débloqué' : 'bloqué';
  saveUsers();
  showToast(u.nom + ' ' + action + ' ✓', u.actif ? 'green' : 'red');
  renderUtilisateurs();
}

function toggleBloquerLocataire(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  l.actif = l.actif === false ? true : false;
  const action = l.actif ? 'débloqué' : 'bloqué';
  saveData();
  showToast(l.nom + ' ' + action + ' ✓', l.actif ? 'green' : 'red');
  renderUtilisateurs();
}

// ── REINITIALISATION ──────────────────────────────────────────────────────────
function reinitPINLocataire(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  if (!confirm('Réinitialiser le PIN de ' + l.nom + ' à "craa" ?')) return;
  l.pin = 'craa';
  saveData();
  showToast('PIN réinitialisé → craa ✓', 'green');
  renderUtilisateurs();
}

function reinitMdpUser(userId) {
  const u = USERS.find(x => x.id === userId);
  if (!u) return;
  if (!confirm('Réinitialiser le mot de passe de ' + u.nom + ' à "craa" ?')) return;
  u.password = 'craa';
  saveUsers();
  showToast('Mot de passe réinitialisé → craa ✓', 'green');
  renderUtilisateurs();
}

function openModalAddUser() {
  _openUserModal(null, 'cabinet');
}

function _openUserModal(userId, tabContext) {
  const u = userId ? USERS.find(x => x.id === userId) : null;
  const isEdit = !!u;
  const immOptions = DATA.immeubles.map(function(im) {
    const checked = u && u.immeubles && u.immeubles.indexOf(im.id) >= 0 ? 'checked' : '';
    return '<label style="display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:4px;">' +
           '<input type="checkbox" class="imm-assign-cb" value="' + im.id + '" ' + checked + '> ' + im.nom + '</label>';
  }).join('');

  const modalHtml = '<div id="modal-user-custom" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;">' +
    '<div style="background:var(--bg2);border-radius:16px;padding:32px;width:440px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<div style="font-size:16px;font-weight:800;color:var(--text);">' + (isEdit ? 'Modifier utilisateur' : 'Nouvel utilisateur') + '</div>' +
    '<button onclick="document.getElementById(\'modal-user-custom\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">&#215;</button>' +
    '</div>' +
    '<label class="auth-label" style="margin-bottom:6px;">NOM COMPLET</label>' +
    '<input id="mu-nom" class="auth-input" style="margin-bottom:12px;" value="' + (u ? u.nom : '') + '" placeholder="Nom complet">' +
    '<label style="font-size:10px;font-weight:700;color:rgba(232,240,254,0.45);letter-spacing:1.5px;display:block;margin-bottom:6px;">RÔLE</label>' +
    '<select id="mu-role" class="auth-input" style="margin-bottom:12px;background:var(--bg4);" onchange="_muToggleFields()">' +
    (SESSION&&SESSION.version!=='individuel' ? '<option value="gestionnaire"' + (u&&u.role==='gestionnaire'?' selected':'') + '>Gestionnaire</option>' : '') +
    (SESSION&&SESSION.version!=='individuel' ? '<option value="comptable"' + (u&&u.role==='comptable'?' selected':'') + '>Comptable</option>' : '') +
    '<option value="proprietaire"' + (u&&u.role==='proprietaire'?' selected':'') + '>Propriétaire</option>' +
    '<option value="locataire"' + (u&&u.role==='locataire'?' selected':'') + '>Locataire</option>' +
    '</select>' +
    '<div id="mu-tel-row">' +
    '<label style="font-size:10px;font-weight:700;color:rgba(232,240,254,0.45);letter-spacing:1.5px;display:block;margin-bottom:6px;">NUMÉRO DE TÉLÉPHONE</label>' +
    '<input id="mu-tel" class="auth-input" style="margin-bottom:12px;" value="' + (u&&u.tel ? u.tel : '') + '" placeholder="Ex: 699 00 00 00">' +
    '</div>' +
    '<div id="mu-pwd-row">' +
    '<label class="auth-label" style="margin-bottom:6px;">' + (isEdit ? 'NOUVEAU MOT DE PASSE (laisser vide = inchangé)' : 'MOT DE PASSE (défaut: craa)') + '</label>' +
    '<input id="mu-pwd" class="auth-input" type="password" style="margin-bottom:12px;" placeholder="' + (isEdit ? 'Laisser vide pour conserver' : 'craa') + '">' +
    '</div>' +
    '<div id="mu-pin-row" style="display:none;">' +
    '<label style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:1.5px;display:block;margin-bottom:6px;">CODE PIN (défaut: craa)</label>' +
    '<input id="mu-pin" class="auth-input" style="margin-bottom:12px;" value="' + (u&&u.pin ? u.pin : '') + '" placeholder="4 chiffres">' +
    '</div>' +
    '<div id="mu-imm-row">' +
    '<label class="auth-label" style="margin-bottom:8px;">IMMEUBLES ASSIGNÉS</label>' +
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:12px;max-height:120px;overflow-y:auto;">' +
    (immOptions || '<div style="font-size:12px;color:#aaa;">Aucun immeuble créé</div>') +
    '</div></div>' +
    '<button class="auth-btn-primary" onclick="_saveUserModal(\''+( u ? u.id : '')+'\')">' + (isEdit ? 'Enregistrer' : 'Créer utilisateur') + '</button>' +
    '</div></div>';

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  _muToggleFields();
}

function _muToggleFields() {
  var role = document.getElementById('mu-role') ? document.getElementById('mu-role').value : '';
  var pinRow = document.getElementById('mu-pin-row');
  var pwdRow = document.getElementById('mu-pwd-row');
  var immRow = document.getElementById('mu-imm-row');
  var telRow = document.getElementById('mu-tel-row');
  if (role === 'locataire') {
    if (pinRow) pinRow.style.display = 'block';
    if (pwdRow) pwdRow.style.display = 'none';
    if (immRow) immRow.style.display = 'none';
    if (telRow) telRow.style.display = 'block';
  } else if (role === 'proprietaire') {
    if (pinRow) pinRow.style.display = 'none';
    if (pwdRow) pwdRow.style.display = 'block';
    if (immRow) immRow.style.display = 'block';
    if (telRow) telRow.style.display = 'block';
  } else {
    if (pinRow) pinRow.style.display = 'none';
    if (pwdRow) pwdRow.style.display = 'block';
    if (immRow) immRow.style.display = 'block';
    if (telRow) telRow.style.display = 'none';
  }
}

function _saveUserModal(userId) {
  var nom = document.getElementById('mu-nom').value.trim();
  var role = document.getElementById('mu-role').value;
  var telEl = document.getElementById('mu-tel');
  var tel = telEl ? telEl.value.trim() : '';
  var pwd = document.getElementById('mu-pwd') ? document.getElementById('mu-pwd').value : '';
  var pin = document.getElementById('mu-pin') ? document.getElementById('mu-pin').value.trim() : '';
  var immCbs = document.querySelectorAll('.imm-assign-cb:checked');
  var immeubles = Array.from(immCbs).map(function(cb) { return parseInt(cb.value); });

  if (!nom) { showToast('Nom requis', 'red'); return; }

  if (userId) {
    // Edit existing
    var u = USERS.find(function(x) { return x.id === userId; });
    if (!u) return;
    u.nom = nom;
    u.role = role;
    u.tel = tel;
    if (pwd) u.password = pwd;
    if (pin) u.pin = pin;
    if (role !== 'admin' && role !== 'comptable') u.immeubles = immeubles;
    showToast('Utilisateur modifié ✓', 'green');
  } else {
    // Create new
    var defaultPwd = pwd || 'craa';
    var defaultPin = pin || 'craa';
    var newUser = {
      id: 'usr_' + Date.now(),
      version: (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise',
      role: role,
      nom: nom,
      tel: tel,
      username: role !== 'locataire' ? (tel || nom.toLowerCase().replace(/\s+/g,'.')) : null,
      password: role !== 'locataire' ? defaultPwd : null,
      pin: role === 'locataire' ? defaultPin : null,
      immeubles: immeubles,
      locId: null,
      customPerms: {},
      mustChangePassword: false
    };
    USERS.push(newUser);
    showToast('Utilisateur créé ✓', 'green');
  }

  saveUsers();
  var modal = document.getElementById('modal-user-custom');
  if (modal) modal.remove();
  renderUtilisateurs();
}

function editUser(userId) {
  _openUserModal(userId, window._usersTab);
}

function deleteUser(userId) {
  if (!confirm('Supprimer cet utilisateur ?')) return;
  USERS = USERS.filter(u=>u.id!==userId);
  saveUsers();
  showToast('Utilisateur supprimé');
  renderUtilisateurs();
}

// ── INIT APP AFTER LOGIN ──────────────────────────────────────────────────────
function initApp() {
  // Nettoyer les liens portail résiduels du DOM
  ['nav-portail-locataire','nav-portail-proprietaire'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  });
  // Load data
  loadData();
  document.getElementById('sel-mois').value = new Date().getMonth();
  document.getElementById('sel-annee').value = new Date().getFullYear();

  // Render user chip
  renderUserChip();
  // Mode individuel : afficher bouton modifier nom
  const btnNom = document.getElementById('btn-changer-nom');
  if (btnNom) btnNom.style.display = (SESSION && SESSION.version === 'individuel') ? 'block' : 'none';

  // Build sidebar - filter based on role
  buildSidebar();

  // Show/hide nav items based on permissions
  applyNavPermissions();

  // Add user management nav if admin (entreprise OU individuel)
  if (can('canManageUsers')) {
    const sidebarNav = document.querySelector('.sidebar-nav');
    const userNavItem = document.createElement('div');
    userNavItem.innerHTML = '<div class="nav-section">Administration</div><div class="nav-item" onclick="navigate(\'utilisateurs\')"><span class="nav-icon">👥</span> Utilisateurs</div>';
    sidebarNav.appendChild(userNavItem);
  }

  // Add validation nav for comptable
  // Section Comptabilité : uniquement en mode entreprise (pas en individuel)
  if ((SESSION.role === 'comptable' || SESSION.role === 'admin') && SESSION.version !== 'individuel') {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
      const valDiv = document.createElement('div');
      valDiv.innerHTML = "<div class=\"nav-section\">Comptabilité</div><div class=\"nav-item\" onclick=\"navigate('validation')\" style=\"position:relative;\"><span class=\"nav-icon\">\u2705</span> Valider paiements<span id=\"badge-validation\" class=\"nav-badge\" style=\"display:none;\">0</span></div>";
      sidebarNav.appendChild(valDiv);
    }
  }

  // Route based on role
  if (SESSION.role === 'locataire') {
    renderLocataireDashboard();
  } else {
    renderDashboard();
  }

  saveData();
  setInterval(saveData, 30000);
  // Badge signalements
  setTimeout(_updateBadgeSignalements, 500);

  // OneSignal: associer l'utilisateur connecté
  if (typeof loginOneSignal === 'function' && SESSION) {
    loginOneSignal(SESSION.userId, {
      role:    SESSION.role,
      version: SESSION.version || 'individuel'
    });
    // Demander la permission de notification 3s après la connexion
    setTimeout(requestNotificationPermission, 3000);
  }
}

function applyNavPermissions() {
  // Comptable: only see encaissements + quittances
  if (SESSION.role === 'comptable') {
    document.querySelectorAll('.nav-item').forEach(item => {
      const txt = item.textContent.trim();
      const allowed = ['Encaissements','Tableau de bord','Locataires'];
      const isAllowed = allowed.some(a => txt.includes(a));
      if (!isAllowed && !txt.includes('⊞') && !txt.includes('💰') && !txt.includes('👤')) {
        item.style.display = 'none';
      }
    });
  }
  // Propriétaire: no juridique, no stats financières
  if (SESSION.role === 'proprietaire') {
    document.querySelectorAll('.nav-item').forEach(item => {
      const txt = item.textContent.trim();
      if (txt.includes('Utilisateurs') || txt.includes('Immeubles')) {
        item.style.display = 'none';
      }
    });
  }
  // Locataire: hide entire sidebar
  if (SESSION.role === 'locataire') {
    document.querySelector('.sidebar').style.display = 'none';
    document.querySelector('.main').style.marginLeft = '0';
  }
}


// ============================================================
// PAYMENT DECLARATION SYSTEM
// ============================================================
let _selectedPayMode = 'mtn';

function selectPayMode(el, mode) {
  document.querySelectorAll('.pay-mode-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  _selectedPayMode = mode;
  // Show reference field for electronic payments
  const refGroup = document.getElementById('decl-ref-group');
  if (refGroup) {
    refGroup.style.display = ['mtn','orange','virement','depot'].includes(mode) ? 'block' : 'none';
  }
}

function ouvrirDeclarationPaiement(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  document.getElementById('decl-loc-id').value = locId;
  document.getElementById('decl-montant').value = l.loyer;
  document.getElementById('decl-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('decl-mois').value = new Date().getMonth();
  document.getElementById('decl-ref').value = '';
  document.getElementById('decl-obs').value = '';
  document.getElementById('decl-ref-group').style.display = 'none';
  _selectedPayMode = 'mtn';
  document.querySelectorAll('.pay-mode-btn').forEach(b => b.classList.remove('selected'));
  const mtnBtn = document.getElementById('mode-mtn');
  if (mtnBtn) mtnBtn.classList.add('selected');
  document.getElementById('modal-declaration-paiement').classList.add('open');
}

function soumettreDeclaration() {
  // Gestionnaire records payment directly - it goes to comptable as pending
  // But gestionnaire sees a "Notifier comptable" confirmation
  const locId = parseInt(document.getElementById('decl-loc-id').value);
  const montant = parseInt(document.getElementById('decl-montant').value) || 0;
  const date = document.getElementById('decl-date').value;
  const declMode = window._declMode || 'mois';
  let periodeLabel, moisC, anneeC, moisFin, anneeFin;
  if (declMode === 'periode') {
    moisC    = parseInt(document.getElementById('decl-mois-deb').value);
    anneeC   = parseInt(document.getElementById('decl-annee-deb').value);
    moisFin  = parseInt(document.getElementById('decl-mois-fin').value);
    anneeFin = parseInt(document.getElementById('decl-annee-fin').value);
    periodeLabel = MNOMS[moisC]+' '+anneeC+' → '+MNOMS[moisFin]+' '+anneeFin;
  } else {
    moisC    = parseInt(document.getElementById('decl-mois').value);
    anneeC   = parseInt(document.getElementById('decl-annee').value || new Date().getFullYear());
    moisFin  = moisC;
    anneeFin = anneeC;
    periodeLabel = MNOMS[moisC]+' '+anneeC;
  }
  const ref = document.getElementById('decl-ref').value.trim();
  const obs = document.getElementById('decl-obs').value.trim();

  if (!montant || !date) { showToast('Montant et date obligatoires', 'red'); return; }

  const l = DATA.locataires.find(x => x.id === locId);
  const im = DATA.immeubles.find(i => i.id === l.iid);

  if (!DATA.declarations) DATA.declarations = [];
  if (!DATA.nextDeclId) DATA.nextDeclId = 1;

  const decl = {
    id: DATA.nextDeclId++,
    locId, montant, date, moisC, anneeC,
    moisFin, anneeFin, periodeLabel,
    mode: _selectedPayMode,
    ref: ref || null,
    obs: obs || null,
    statut: 'pending',  // pending | validated | rejected
    dateDeclaration: new Date().toISOString(),
    dateValidation: null,
    noteComptable: null,
    receiptId: null,
    nomLocataire: l.nom,
    apptLocataire: l.appt,
    nomImmeuble: im ? im.nom : '',
  };

  DATA.declarations.push(decl);
  saveData();
  closeModals();
  showToast('Paiement déclaré ✓ — En attente de validation');

  // Refresh locataire dashboard
  if (SESSION && SESSION.role === 'locataire') {
    renderLocataireDashboard();
  }
}

// ── COMPTABLE: validation ────────────────────────────────────────────────────
function ouvrirValidation(declId) {
  const d = DATA.declarations.find(x => x.id === declId);
  if (!d) return;
  const l = DATA.locataires.find(x => x.id === d.locId);
  const im = DATA.immeubles.find(i => i.id === (l ? l.iid : -1));
  const modeLabels = {mtn:'Mobile Money MTN',orange:'Orange Money',virement:'Virement bancaire',depot:'Dépôt bancaire direct',especes:'Espèces'};

  document.getElementById('val-decl-id').value = declId;
  document.getElementById('val-montant').value = d.montant;
  document.getElementById('val-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('val-note').value = '';

  document.getElementById('val-decl-info').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
      <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Locataire</div><div style="font-weight:600;">${d.nomLocataire}</div></div>
      <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Local</div><div style="font-weight:600;">${localBadge(d.apptLocataire)}</div></div>
      <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Immeuble</div><div style="font-weight:600;">${d.nomImmeuble}</div></div>
      <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Mode</div><div style="font-weight:600;">${modeLabels[d.mode]||d.mode}</div></div>
      <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Montant déclaré</div><div style="font-weight:600;color:var(--green);">${fmt(d.montant)}</div></div>
      <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Date déclarée</div><div style="font-weight:600;">${d.date.split('-').reverse().join('/')}</div></div>
      ${d.ref?`<div style="grid-column:1/-1;"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Référence</div><div style="font-family:var(--mono);font-size:12px;">${d.ref}</div></div>`:''}
      ${d.obs?`<div style="grid-column:1/-1;"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Observations</div><div style="font-size:12px;font-style:italic;">${d.obs}</div></div>`:''}
    </div>`;

  document.getElementById('modal-validation-paiement').classList.add('open');
}

async function validerDeclaration() {
  const declId = parseInt(document.getElementById('val-decl-id').value);
  const montant = parseInt(document.getElementById('val-montant').value) || 0;
  const date = document.getElementById('val-date').value;
  const note = document.getElementById('val-note').value.trim();

  if (!montant || !date) { showToast('Montant et date obligatoires', 'red'); return; }

  const d = DATA.declarations.find(x => x.id === declId);
  if (!d) return;
  const l = DATA.locataires.find(x => x.id === d.locId);

  // Mark as validated
  d.statut = 'validated';
  d.montantValidé = montant;
  d.dateValidation = date;
  d.noteComptable = note;
  d.receiptId = 'CRAA-' + new Date().getFullYear() + '-' + String(declId).padStart(5, '0');

  // Add to official paiements
  if (!DATA.nextPayId) DATA.nextPayId = 50;
  const paiement = {
    id: DATA.nextPayId++,
    locId: d.locId,
    date, montant,
    moisC: d.moisC,
    anneeC: d.anneeC,
    type: 'loyer',
    mode: d.mode,
    note: note || 'Validé par comptable',
    declId: d.id,
    receiptId: d.receiptId,
  };
  DATA.paiements.push(paiement);
  d.payId = paiement.id;

  // Update locataire reste
  if (l) {
    l.reste = Math.max(0, l.reste - montant);
    if (l.reste === 0) l.s = 'payé';
    l.obs = 'Paiement validé le ' + date.split('-').reverse().join('/');
  }

  saveData();
  closeModals();
  showToast('Paiement validé ✓ — Reçu PDF généré');

  // Auto-generate PDF receipt
  await genPDFRecu(paiement.id, d);

  renderCurrent();
}

function rejeterDeclaration() {
  const declId = parseInt(document.getElementById('val-decl-id').value);
  const note = document.getElementById('val-note').value.trim() || 'Paiement rejeté';
  const d = DATA.declarations.find(x => x.id === declId);
  if (!d) return;
  d.statut = 'rejected';
  d.noteComptable = note;
  d.dateValidation = new Date().toISOString().split('T')[0];
  saveData();
  closeModals();
  showToast('Paiement rejeté');
  renderCurrent();
}

// ── PDF RECEIPT ───────────────────────────────────────────────────────────────
async function genPDFRecu(payId, decl) {
  if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    showToast('Bibliothèque PDF non chargée', 'red'); return;
  }
  const { jsPDF } = window.jspdf || window;

  const p = DATA.paiements.find(x => x.id === payId);
  const l = DATA.locataires.find(x => x.id === p.locId);
  const im = DATA.immeubles.find(i => i.id === l.iid);
  if (!p || !l) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const BLUE = [14, 106, 175];
  const PINK = [248, 202, 203];
  const DARK = [26, 32, 44];
  const GRAY = [100, 116, 139];
  const GREEN = [26, 107, 69];
  const fmtN = n => Number(n||0).toLocaleString('fr-FR');

  function enToutesLettres(n) {
    const u=["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
    const t=["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];
    if(n===0)return"zéro";if(n<0)return"moins "+enToutesLettres(-n);
    let r="";
    if(n>=1000000){r+=enToutesLettres(Math.floor(n/1000000))+" million"+(Math.floor(n/1000000)>1?"s":"")+" ";n%=1000000;}
    if(n>=1000){const c=Math.floor(n/1000);r+=(c===1?"mille":(enToutesLettres(c)+" mille"))+" ";n%=1000;}
    if(n>=100){const c=Math.floor(n/100);r+=(c===1?"cent":(u[c]+" cent"))+" ";n%=100;}
    if(n>0){if(n<20){r+=u[n];}else{const tx=Math.floor(n/10),ux=n%10;if(tx===7||tx===9)r+=t[tx]+"-"+u[tx===7?10+ux:10+ux];else r+=t[tx]+(ux===1&&tx<8?" et ":ux>0?"-":"")+(ux>0?u[ux]:"");}}
    return r.trim();
  }

  const today = new Date().toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric'});
  const dateAuj = new Date().toLocaleDateString('fr-FR');
  const receiptId = decl ? decl.receiptId : ('CRAA-' + new Date().getFullYear() + '-' + String(payId).padStart(5,'0'));
  const modeLabels = {mtn:'Mobile Money MTN',orange:'Orange Money',virement:'Virement bancaire',depot:'Dépôt bancaire direct',especes:'Espèces'};

  const W = 210, H = 297;
  let y = 0;

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 40, 'F');

  // Logo placeholder (circle)
  doc.setFillColor(255, 255, 255, 0.2);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);

  // Cabinet name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CABINET DE RECOUVREMENT ET D\'AVOCATS ASSOCIÉS', W/2, 14, {align:'center'});
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CRAA  ·  +237 676 52 89 17 / 693 53 06 85  ·  camerounaiserecourement@yahoo.com', W/2, 22, {align:'center'});
  doc.setFontSize(8);
  doc.text('RCCM N° RC/YAD/2018/A/3347  ·  N°Contrib. PO38412724963M  ·  Immeuble Pharmacie MESSA, 3ème étage, Yaoundé', W/2, 29, {align:'center'});

  // Pink accent line
  doc.setFillColor(...PINK);
  doc.rect(0, 38, W, 3, 'F');

  y = 50;

  // ── DOCUMENT TITLE ────────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REÇU DE PAIEMENT', W/2, y, {align:'center'});
  y += 6;

  // Reference + date line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Réf. : ' + receiptId, 20, y);
  doc.text('Émis le : ' + today, W - 20, y, {align:'right'});
  y += 3;

  // Blue underline
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(20, y+2, W-20, y+2);
  y += 10;

  // ── INFO TABLE ────────────────────────────────────────────────────────────
  const rows = [
    ['Locataire', l.nom],
    ['Local', (l.appt || '–') + ' – ' + (im ? im.nom : '') + ' – ' + (im ? im.ville : '')],
    ['Loyer mensuel', fmtN(l.loyer) + ' FCFA'],
    ['Mois concerné', MNOMS[p.moisC] + ' ' + p.anneeC],
    ['Date de paiement', p.date.split('-').reverse().join('/')],
    ['Mode de règlement', modeLabels[p.mode] || p.mode],
    ...(decl && decl.ref ? [['Référence transaction', decl.ref]] : []),
    ['Montant reçu', fmtN(p.montant) + ' FCFA'],
  ];

  const col1W = 65, col2W = 105, rowH = 9;
  rows.forEach((row, i) => {
    const rowY = y + i * rowH;
    // Alternating background
    if (i % 2 === 0) {
      doc.setFillColor(235, 244, 251);
      doc.rect(18, rowY - 5, col1W + col2W + 4, rowH, 'F');
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUE);
    doc.text(row[0], 22, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(String(row[1]), 90, rowY);
  });

  // Highlight amount row
  const amtY = y + (rows.length - 1) * rowH;
  doc.setFillColor(...BLUE);
  doc.rect(18, amtY - 5, col1W + col2W + 4, rowH, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Montant reçu', 22, amtY);
  doc.setTextColor(200, 255, 200);
  doc.text(fmtN(p.montant) + ' FCFA', 90, amtY);

  y += rows.length * rowH + 10;

  // ── AMOUNT IN WORDS ───────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...PINK);
  doc.setLineWidth(0.5);
  doc.rect(18, y-4, W-36, 14, 'FD');
  // Left pink bar
  doc.setFillColor(...PINK);
  doc.rect(18, y-4, 3, 14, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('Soit : ', 25, y+3);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...DARK);
  const amtWords = enToutesLettres(p.montant) + ' francs CFA (' + fmtN(p.montant) + ' FCFA)';
  doc.text(amtWords, 40, y+3, {maxWidth: W - 60});
  y += 22;

  // ── ATTESTATION ──────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const attestation = 'Le Cabinet CRAA certifie avoir reçu de ' + l.nom + ' la somme de ' +
    fmtN(p.montant) + ' FCFA au titre du loyer du local ' + (l.appt||'–') +
    ' pour le mois de ' + MNOMS[p.moisC] + ' ' + p.anneeC +
    '. Ce reçu constitue une pièce justificative officielle de paiement.';
  doc.text(attestation, 20, y, {maxWidth: W - 40, align: 'justify'});
  y += 20;

  // ── SIGNATURES ────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y + 20, 80, y + 20);
  doc.line(W - 80, y + 20, W - 20, y + 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('Le Gestionnaire / Bailleur', 20, y + 25);
  doc.text('Le Locataire', W - 20, y + 25, {align:'right'});
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text('Cabinet CRAA', 20, y + 30);
  doc.text(l.nom, W - 20, y + 30, {align:'right'});
  y += 40;

  // ── SECURITY STRIP ────────────────────────────────────────────────────────
  doc.setFillColor(245, 247, 250);
  doc.rect(18, y, W - 36, 18, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('🔒 Document officiel – Réf. ' + receiptId + ' – Émis le ' + dateAuj + ' par ImmoGest · CRAA', W/2, y + 5, {align:'center'});
  doc.text('Tout document non muni de cette référence est considéré comme non valide.', W/2, y + 10, {align:'center'});
  doc.text('DOCUMENT NON MODIFIABLE – Toute altération constitue un faux en écriture au sens du Code Pénal camerounais.', W/2, y + 15, {align:'center'});

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, H - 15, W, 15, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('Cabinet CRAA · Immeuble Pharmacie MESSA, 3ème étage, Yaoundé · +237 676 52 89 17', W/2, H - 8, {align:'center'});
  doc.text('+237 693 53 06 85 · camerounaiserecourement@yahoo.com', W/2, H - 4, {align:'center'});

  // Save PDF
  doc.save('Recu_' + receiptId + '_' + l.nom.replace(/\s+/g,'_') + '.pdf');
  showToast('Reçu PDF émis ✓');
}

// ── LOCATAIRE DASHBOARD WITH PAYMENT ─────────────────────────────────────────
function renderLocataireDashboard() {
  if (!SESSION) return;
  const l = DATA.locataires.find(x => x.id === SESSION.locId);
  if (!l) { document.getElementById('content').innerHTML = '<div class="perm-denied"><div class="icon">🔑</div><div>Locataire introuvable</div></div>'; return; }
  const im = DATA.immeubles.find(i => i.id === l.iid);
  const pays = DATA.paiements.filter(p => p.locId === l.id).sort((a,b) => b.date.localeCompare(a.date));
  const decls = (DATA.declarations||[]).filter(d => d.locId === l.id).sort((a,b) => b.dateDeclaration.localeCompare(a.dateDeclaration));
  const totalPaye = pays.filter(p=>p.type!=='caution').reduce((s,p)=>s+p.montant,0);
  const pendingDecls = decls.filter(d=>d.statut==='pending');

  document.getElementById('page-title').textContent = 'Mon espace';
  document.getElementById('page-sub').textContent = l.nom + ' · ' + (l.appt||'–') + ' · ' + (im?im.nom:'');
  document.getElementById('topbar-main-btn').style.display = 'none';

  const modeIcons = {mtn:'📱',orange:'🟠',virement:'🏦',depot:'💰',especes:'💵'};
  const modeLabels = {mtn:'Mobile Money MTN',orange:'Orange Money',virement:'Virement bancaire',depot:'Dépôt bancaire',especes:'Espèces'};

  let html = `
  <!-- KPIs -->
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Mon loyer mensuel</div>
      <div class="metric-value accent">${fmt(l.loyer)}</div>
    </div>
    <div class="metric-card" style="border-left:4px solid ${l.reste>0?'var(--red)':'var(--green)'};">
      <div class="metric-label">Situation actuelle</div>
      <div class="metric-value ${l.reste>0?'red':'green'}">${l.reste>0?fmt(l.reste)+' dû':'À jour ✓'}</div>
      <div class="metric-sub">${l.obs||''}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total payé</div>
      <div class="metric-value green">${fmt(totalPaye)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Immeuble</div>
      <div class="metric-value" style="font-size:13px;">${im?im.nom:'–'}</div>
      <div class="metric-sub">${im?im.ville:''}</div>
    </div>
  </div>

  <!-- Alerte impayé -->
  ${l.reste>0?`<div style="background:var(--red-bg);border:1.5px solid var(--red);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <div>
      <div style="font-weight:700;color:var(--red);">⚠️ Arriérés de loyer : ${fmt(l.reste)}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:3px;">Veuillez régulariser votre situation</div>
    </div>
    <button class="btn" style="background:var(--red);color:#fff;border-color:var(--red);" onclick="ouvrirDeclarationPaiement(${l.id})">💳 Payer maintenant</button>
  </div>`:''}

  <!-- Bouton payer si à jour -->
  ${l.reste===0?`<div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
    <button class="btn btn-primary" onclick="ouvrirDeclarationPaiement(${l.id})">💳 Déclarer un paiement</button>
  </div>`:''}

  <!-- Déclarations en attente -->
  ${pendingDecls.length>0?`
  <div class="card" style="margin-bottom:16px;border-left:4px solid var(--yellow);">
    <div class="card-header">
      <div class="card-title">⏳ Paiements en attente de validation (${pendingDecls.length})</div>
    </div>
    ${pendingDecls.map(d=>`
    <div class="decl-card pending">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:600;">${modeIcons[d.mode]||'💳'} ${modeLabels[d.mode]||d.mode} — ${fmt(d.montant)}</div>
          <div style="font-size:12px;color:var(--text3);">Déclaré le ${new Date(d.dateDeclaration).toLocaleDateString('fr-FR')} · Mois : ${MNOMS[d.moisC]} ${d.anneeC}</div>
          ${d.ref?`<div style="font-size:11px;font-family:var(--mono);color:var(--text3);">Réf: ${d.ref}</div>`:''}
        </div>
        <span class="decl-status pending">⏳ En attente</span>
      </div>
    </div>`).join('')}
  </div>`:''}

  <!-- Historique paiements validés -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">📋 Historique des paiements</div>
    </div>
    ${pays.length>0?`
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>Date</th><th>Mois</th><th>Mode</th><th>Montant</th><th>Réçu PDF</th></tr></thead>
      <tbody>
      ${pays.map(p=>`
        <tr>
          <td style="font-size:12px;">${p.date.split('-').reverse().join('/')}</td>
          <td style="font-size:12px;">${MNOMS[p.moisC]} ${p.anneeC}</td>
          <td style="font-size:12px;">${modeIcons[p.mode]||''} ${modeLabels[p.mode]||p.mode||'–'}</td>
          <td class="td-amount green">${fmt(p.montant)}</td>
          <td style="white-space:nowrap;">
            ${p.receiptId
              ? `<button class="btn btn-sm" onclick="previewRecu(${p.id})" style="margin-right:4px;">👁 Voir</button>
                 <button class="btn btn-primary btn-sm" onclick="telechargerRecuValide(${p.id})">⬇ PDF</button>`
              : '<span style="font-size:11px;color:var(--text3);">En attente</span>'}
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>`
    :'<div class="empty"><div class="empty-text">Aucun paiement enregistré</div></div>'}
  </div>

  <!-- Déclarations rejetées -->
  ${decls.filter(d=>d.statut==='rejected').length>0?`
  <div class="card" style="margin-top:16px;border-left:4px solid var(--red);">
    <div class="card-header"><div class="card-title" style="color:var(--red);">✗ Paiements rejetés</div></div>
    ${decls.filter(d=>d.statut==='rejected').map(d=>`
    <div class="decl-card rejected">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:600;">${fmt(d.montant)} – ${modeLabels[d.mode]||d.mode}</div>
          <div style="font-size:12px;color:var(--text3);">Déclaré le ${new Date(d.dateDeclaration).toLocaleDateString('fr-FR')}</div>
          ${d.noteComptable?`<div style="font-size:12px;color:var(--red);margin-top:4px;">Motif : ${d.noteComptable}</div>`:''}
        </div>
        <span class="decl-status rejected">✗ Rejeté</span>
      </div>
    </div>`).join('')}
  </div>`:''}

  <!-- NOUVELLES FONCTIONNALITÉS LOCATAIRE -->

  <!-- Numéros Mobile Money du Cabinet -->
  ${(DATA.settings&&DATA.settings.momo&&(DATA.settings.momo.mtn||DATA.settings.momo.orange||DATA.settings.momo.wave))?`
  <div class="card" style="margin-top:16px;">
    <div class="card-header"><div class="card-title">📱 Payer par Mobile Money</div></div>
    <p style="font-size:13px;color:var(--text2);margin-bottom:12px;">Numéros officiels du Cabinet CRAA pour vos paiements :</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${DATA.settings.momo.mtn?`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#FFFDE7;border-radius:10px;border:1.5px solid #FFCC00;">
        <span style="font-size:22px;">📱</span>
        <div><div style="font-weight:700;font-size:12px;color:#00338D;">MTN Mobile Money</div>
        <div style="font-size:15px;font-weight:700;letter-spacing:1px;">${DATA.settings.momo.mtn}</div></div>
      </div>`:''}
      ${DATA.settings.momo.orange?`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#FFF3E0;border-radius:10px;border:1.5px solid #FF6600;">
        <span style="font-size:22px;">🟠</span>
        <div><div style="font-weight:700;font-size:12px;color:#FF6600;">Orange Money</div>
        <div style="font-size:15px;font-weight:700;letter-spacing:1px;">${DATA.settings.momo.orange}</div></div>
      </div>`:''}
      ${DATA.settings.momo.wave?`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#E3F6FD;border-radius:10px;border:1.5px solid #1BA7E2;">
        <span style="font-size:22px;">🌊</span>
        <div><div style="font-weight:700;font-size:12px;color:#1BA7E2;">Wave</div>
        <div style="font-size:15px;font-weight:700;letter-spacing:1px;">${DATA.settings.momo.wave}</div></div>
      </div>`:''}
    </div>
    <p style="font-size:11px;color:var(--text3);margin-top:10px;">Après paiement, déclarez votre versement via le bouton "Déclarer un paiement" ci-dessus.</p>
  </div>`:''}

  <!-- Calendrier des loyers à venir -->
  <div class="card" style="margin-top:16px;">
    <div class="card-header"><div class="card-title">📅 Calendrier de mes loyers</div></div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${(()=>{
        const mois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
        const now = new Date();
        let rows = '';
        for(let i=0;i<4;i++){
          const d = new Date(now.getFullYear(), now.getMonth()+i, 5);
          const isPast = d < now && i > 0;
          const isCurrent = i === 0;
          rows += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:${isCurrent?'var(--primary-bg)':'var(--bg3)'};border:1px solid ${isCurrent?'var(--primary)':'var(--border)'};">
            <div style="font-weight:600;font-size:13px;">${mois[d.getMonth()]} ${d.getFullYear()}</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:700;color:var(--accent);">${fmt(l.loyer)}</span>
              ${isCurrent?`<span style="font-size:11px;background:var(--primary);color:#fff;padding:2px 8px;border-radius:20px;">Ce mois</span>`:''}
            </div>
          </div>`;
        }
        return rows;
      })()}
    </div>
  </div>

  <!-- Signaler un problème -->
  <div class="card" style="margin-top:16px;">
    <div class="card-header"><div class="card-title">🔧 Signaler un problème</div></div>
    <p style="font-size:13px;color:var(--text2);margin-bottom:12px;">Panne, problème dans votre logement ? Signalez-le ici.</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <select id="loc-prob-type" style="padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">
        <option value="">-- Type de problème --</option>
        <option value="eau">💧 Problème eau / plomberie</option>
        <option value="electricite">⚡ Problème électricité</option>
        <option value="serrure">🔐 Serrure / porte</option>
        <option value="toiture">🏠 Toiture / fissure</option>
        <option value="autre">📝 Autre</option>
      </select>
      <textarea id="loc-prob-desc" placeholder="Décrivez le problème..." rows="3" style="padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);resize:vertical;"></textarea>
      <button class="btn btn-primary" onclick="soumettreSignalement(${l.id})">📤 Envoyer le signalement</button>
    </div>
  </div>

  <!-- Mes signalements en cours -->
  ${(()=>{
    const mesSigs = (DATA.signalements||[]).filter(s=>s.locId===l.id).sort((a,b)=>b.date.localeCompare(a.date));
    if (!mesSigs.length) return '';
    const sc = {nouveau:'#e74c3c',en_cours:'#f39c12',resolu:'#27ae60'};
    const sl = {nouveau:'🔴 En attente',en_cours:'🟠 En cours',resolu:'✅ Résolu'};
    const tl = {eau:'💧 Eau/plomberie',electricite:'⚡ Électricité',serrure:'🔐 Serrure/porte',toiture:'🏠 Toiture/fissure',autre:'📝 Autre'};
    return `<div class="card" style="margin-top:16px;">
      <div class="card-header"><div class="card-title">🔧 Mes signalements</div></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${mesSigs.map(sig=>`
        <div style="padding:12px;background:var(--bg3);border-radius:10px;border-left:4px solid ${sc[sig.statut]||'#999'};">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <div style="font-weight:600;font-size:13px;">${tl[sig.type]||sig.type}</div>
            <span style="background:${sc[sig.statut]||'#999'};color:#fff;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;">${sl[sig.statut]||sig.statut}</span>
          </div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px;">${sig.description}</div>
          ${sig.noteAdmin?`<div style="font-size:11px;color:#7D5A00;background:#FFF9E6;border-radius:6px;padding:6px 10px;margin-top:6px;">📝 Réponse : ${sig.noteAdmin}</div>`:''}
          ${sig.dateResolution?`<div style="font-size:11px;color:var(--green);margin-top:4px;">✅ Résolu le ${new Date(sig.dateResolution).toLocaleDateString('fr-FR')}</div>`:''}
          <div style="font-size:11px;color:var(--text3);margin-top:4px;">📅 ${new Date(sig.date).toLocaleDateString('fr-FR')}</div>
        </div>`).join('')}
      </div>
    </div>`;
  })()}

  <!-- Infos logement -->
  <div class="card" style="margin-top:16px;margin-bottom:16px;">
    <div class="card-header"><div class="card-title">🏠 Mon logement</div></div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px;">
        <span style="font-size:13px;color:var(--text2);">Immeuble</span>
        <span style="font-weight:600;font-size:13px;">${im?im.nom:'–'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px;">
        <span style="font-size:13px;color:var(--text2);">Ville</span>
        <span style="font-weight:600;font-size:13px;">${im?im.ville:'–'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px;">
        <span style="font-size:13px;color:var(--text2);">Local / Appartement</span>
        <span style="font-weight:600;font-size:13px;">${l.appt||'–'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px;">
        <span style="font-size:13px;color:var(--text2);">Loyer mensuel</span>
        <span style="font-weight:600;font-size:13px;color:var(--accent);">${fmt(l.loyer)}</span>
      </div>
      ${l.entree?`<div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px;">
        <span style="font-size:13px;color:var(--text2);">Date d'entrée</span>
        <span style="font-weight:600;font-size:13px;">${new Date(l.entree).toLocaleDateString('fr-FR')}</span>
      </div>`:''}
    </div>
  </div>
  `;

  document.getElementById('content').innerHTML = html;
}

function soumettreSignalement(locId) {
  const type = document.getElementById('loc-prob-type').value;
  const desc = document.getElementById('loc-prob-desc').value.trim();
  if (!type || !desc) { alert('Veuillez sélectionner un type et décrire le problème.'); return; }
  const l = DATA.locataires.find(x => x.id === locId);
  const typeLabels = {eau:'Eau/plomberie',electricite:'Électricité',serrure:'Serrure/porte',toiture:'Toiture/fissure',autre:'Autre'};
  // Stocker le signalement dans DATA
  if (!DATA.signalements) DATA.signalements = [];
  DATA.signalements.push({
    id: Date.now(),
    locId: locId,
    locNom: l ? l.nom : '',
    iid: l ? l.iid : null,
    appt: l ? l.appt : '',
    type: type,
    typeLabel: typeLabels[type]||type,
    description: desc,
    date: new Date().toISOString().split('T')[0],
    statut: 'nouveau'
  });
  saveData();
  alert('✅ Votre signalement a été envoyé au gestionnaire.');
  document.getElementById('loc-prob-type').value = '';
  document.getElementById('loc-prob-desc').value = '';
}


// ── APERCU RECU ──────────────────────────────────────────────────────────────
function previewRecu(payId) {
  const p = DATA.paiements.find(x => x.id === payId);
  if (!p) return;
  const l  = DATA.locataires.find(x => x.id === p.locId);
  const im = DATA.immeubles.find(i => i.id === (l ? l.iid : -1));
  const d  = (DATA.declarations||[]).find(x => x.payId === payId || x.id === p.declId);

  const fmtN  = n => Number(n||0).toLocaleString('fr-FR');
  const today = new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  const receiptId = p.receiptId || (d ? d.receiptId : null) || ('CRAA-'+new Date().getFullYear()+'-'+String(payId).padStart(5,'0'));
  const modeLabels = {mtn:'Mobile Money MTN',orange:'Orange Money',virement:'Virement bancaire',depot:'Dépôt bancaire direct',especes:'Espèces'};

  function enToutesLettres(n) {
    const u=["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
    const t=["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];
    if(n===0)return"zéro";if(n<0)return"moins "+enToutesLettres(-n);
    let r="";
    if(n>=1000000){r+=enToutesLettres(Math.floor(n/1000000))+" million"+(Math.floor(n/1000000)>1?"s":"")+" ";n%=1000000;}
    if(n>=1000){const c=Math.floor(n/1000);r+=(c===1?"mille":(enToutesLettres(c)+" mille"))+" ";n%=1000;}
    if(n>=100){const c=Math.floor(n/100);r+=(c===1?"cent":(u[c]+" cent"))+" ";n%=100;}
    if(n>0){if(n<20){r+=u[n];}else{const tx=Math.floor(n/10),ux=n%10;if(tx===7||tx===9)r+=t[tx]+"-"+u[tx===7?10+ux:10+ux];else r+=t[tx]+(ux===1&&tx<8?" et ":ux>0?"-":"")+(ux>0?u[ux]:"");}}
    return r.trim();
  }

  const html = `
    <!-- En-tête -->
    <div style="background:#0E6AAF;color:#fff;padding:16px 20px;margin:-32px -32px 20px -32px;border-radius:4px 4px 0 0;">
      <div style="font-size:14px;font-weight:700;letter-spacing:.3px;">CABINET DE RECOUVREMENT ET D'AVOCATS ASSOCIÉS</div>
      <div style="font-size:11px;opacity:.8;margin-top:3px;">CRAA · +237 676 52 89 17 / 693 53 06 85 · camerounaiserecourement@yahoo.com</div>
    </div>
    <!-- Bande rose -->
    <div style="height:4px;background:#F8CACB;margin:-20px -32px 20px -32px;"></div>

    <!-- Titre -->
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:20px;font-weight:700;color:#0E6AAF;border-bottom:3px solid #F8CACB;display:inline-block;padding-bottom:4px;">REÇU DE PAIEMENT</div>
      <div style="font-size:11px;color:#888;margin-top:6px;">Réf. : <strong>${receiptId}</strong> &nbsp;·&nbsp; Émis le : ${today}</div>
    </div>

    <!-- Tableau infos -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
      <tr>
        <td style="padding:7px 10px;background:#D6E9F6;font-weight:700;color:#0E6AAF;width:35%;border:1px solid #C5DCF0;">Bailleur / Gestionnaire</td>
        <td style="padding:7px 10px;border:1px solid #C5DCF0;">Cabinet CRAA – ${im ? im.nom : '–'}</td>
      </tr>
      <tr>
        <td style="padding:7px 10px;background:#D6E9F6;font-weight:700;color:#0E6AAF;border:1px solid #C5DCF0;">Locataire</td>
        <td style="padding:7px 10px;border:1px solid #C5DCF0;font-weight:600;">${l ? l.nom : '–'}</td>
      </tr>
      <tr>
        <td style="padding:7px 10px;background:#D6E9F6;font-weight:700;color:#0E6AAF;border:1px solid #C5DCF0;">Local</td>
        <td style="padding:7px 10px;border:1px solid #C5DCF0;">${l ? (l.appt||'–')+' – '+(im?im.nom:'')+(im?' – '+im.ville:'') : '–'}</td>
      </tr>
      <tr>
        <td style="padding:7px 10px;background:#D6E9F6;font-weight:700;color:#0E6AAF;border:1px solid #C5DCF0;">Période concernée</td>
        <td style="padding:7px 10px;border:1px solid #C5DCF0;font-weight:600;">
          ${p.periodeLabel || (p.moisFin && (p.moisFin !== p.moisC || p.anneeFin !== p.anneeC)
            ? MNOMS[p.moisC]+' '+p.anneeC+' → '+MNOMS[p.moisFin]+' '+p.anneeFin
            : MNOMS[p.moisC]+' '+p.anneeC)}
        </td>
      </tr>
      <tr>
        <td style="padding:7px 10px;background:#D6E9F6;font-weight:700;color:#0E6AAF;border:1px solid #C5DCF0;">Date de paiement</td>
        <td style="padding:7px 10px;border:1px solid #C5DCF0;">${p.date ? p.date.split('-').reverse().join('/') : '–'}</td>
      </tr>
      <tr>
        <td style="padding:7px 10px;background:#D6E9F6;font-weight:700;color:#0E6AAF;border:1px solid #C5DCF0;">Mode de règlement</td>
        <td style="padding:7px 10px;border:1px solid #C5DCF0;">${modeLabels[p.mode]||p.mode||'–'}</td>
      </tr>
      <tr>
        <td style="padding:7px 10px;background:#0E6AAF;font-weight:700;color:#fff;border:1px solid #0E6AAF;">Montant reçu</td>
        <td style="padding:7px 10px;border:1px solid #0E6AAF;font-weight:700;font-size:14px;color:#1A6B45;">${fmtN(p.montant)} FCFA</td>
      </tr>
    </table>

    <!-- Toutes lettres -->
    <div style="border-left:4px solid #F8CACB;padding:10px 14px;background:#fffaf9;margin-bottom:16px;font-size:12px;">
      <strong style="color:#0E6AAF;">Soit : </strong>
      <em style="color:#333;">${enToutesLettres(p.montant)} francs CFA (${fmtN(p.montant)} FCFA)</em>
    </div>

    <!-- Attestation -->
    <p style="font-size:12px;text-align:justify;color:#333;margin-bottom:20px;">
      Le Cabinet CRAA certifie avoir reçu de <strong>${l?l.nom:'–'}</strong> la somme de
      <strong>${fmtN(p.montant)} FCFA</strong> au titre du loyer du local
      <strong>${l?l.appt||'–':'–'}</strong> pour la période de
      <strong>${p.periodeLabel || (p.moisFin && (p.moisFin !== p.moisC || p.anneeFin !== p.anneeC) ? MNOMS[p.moisC]+' '+p.anneeC+' à '+MNOMS[p.moisFin]+' '+p.anneeFin : MNOMS[p.moisC]+' '+p.anneeC)}</strong>.
      Ce reçu constitue une pièce justificative officielle de paiement.
    </p>

    <!-- Signatures -->
    <div style="display:flex;gap:30px;margin-top:20px;">
      <div style="flex:1;">
        <div style="font-weight:700;color:#0E6AAF;font-size:12px;">Le Gestionnaire / Bailleur</div>
        <div style="font-size:11px;color:#888;font-style:italic;margin-bottom:30px;">Cabinet CRAA</div>
        <div style="border-bottom:1.5px solid #0E6AAF;"></div>
      </div>
      <div style="flex:1;text-align:right;">
        <div style="font-weight:700;color:#0E6AAF;font-size:12px;">Le Locataire</div>
        <div style="font-size:11px;color:#888;font-style:italic;margin-bottom:30px;">${l?l.nom:'–'}</div>
        <div style="border-bottom:1.5px solid #0E6AAF;"></div>
      </div>
    </div>

    <!-- Sécurité -->
    <div style="margin-top:20px;background:#f5f7fa;border-radius:4px;padding:10px 14px;font-size:10px;color:#888;text-align:center;">
      🔒 Réf. ${receiptId} · Émis le ${new Date().toLocaleDateString('fr-FR')} par ImmoGest · CRAA<br>
      <strong>Document officiel non modifiable</strong> — Toute altération constitue un faux en écriture.
    </div>`;

  document.getElementById('recu-preview-content').innerHTML = html;
  document.getElementById('recu-preview-title').textContent = '🧾 Reçu — ' + receiptId;
  document.getElementById('recu-dl-btn').onclick = () => { closeModals(); telechargerRecuValide(payId); };
  document.getElementById('modal-apercu-recu').classList.add('open');
}

async function telechargerRecuValide(payId) {
  const p = DATA.paiements.find(x => x.id === payId);
  if (!p) return;
  // Find corresponding declaration
  const d = (DATA.declarations||[]).find(x => x.payId === payId || x.id === p.declId);
  await genPDFRecu(payId, d || null);
}

// ── COMPTABLE: liste des déclarations à valider ───────────────────────────────
function renderValidationComptable() {
  document.getElementById('page-title').textContent = 'Validation des paiements';
  document.getElementById('page-sub').textContent = 'Paiements déclarés par les locataires et propriétaires';
  document.getElementById('topbar-main-btn').textContent = '+ Paiement manuel';

  const pending = (DATA.declarations||[]).filter(d=>(d.statut==='pending'||d.statut==='pending_receipt') && d.type !== 'bailleur').sort((a,b)=>b.dateDeclaration.localeCompare(a.dateDeclaration));
  const validated = (DATA.declarations||[]).filter(d=>d.statut==='validated').sort((a,b)=>b.dateValidation.localeCompare(a.dateValidation)).slice(0,10);
  const pendingBailleur = (DATA.declarations||[]).filter(d=>d.statut==='pending' && d.type==='bailleur').sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const modeIcons = {mtn:'📱',orange:'🟠',virement:'🏦',depot:'💰',especes:'💵'};

  let html = '';

  // Badge alert
  if (pending.length + pendingBailleur.length > 0) {
    html += `<div class="comptable-alert">
      <span style="font-size:28px;">💰</span>
      <div>
        <div style="font-weight:700;color:var(--accent);font-size:14px;">${pending.length + pendingBailleur.length} paiement(s) en attente de validation</div>
        <div style="font-size:12px;color:var(--text3);">Vérifiez et validez pour émettre les reçus PDF officiels</div>
      </div>
    </div>`;
  }

  html += `<div class="card" style="margin-bottom:16px;">
    <div class="card-header">
      <div class="card-title">⏳ En attente de validation (${pending.length})</div>
    </div>
    ${pending.length>0?`<div class="table-wrap"><table class="tbl">
      <thead><tr><th>Date décl.</th><th>Locataire</th><th>Local</th><th>Immeuble</th><th>Mode</th><th>Mois</th><th>Montant</th><th>Source</th><th>Action</th></tr></thead>
      <tbody>
      ${pending.map(d=>`
        <tr class="valid-row" data-search="${(d.nomLocataire+' '+(d.apptLocataire||'')+' '+d.nomImmeuble+' '+(MNOMS[d.moisC]||'')+' '+d.anneeC).toLowerCase()}">
          <td style="font-size:11px;">${new Date(d.dateDeclaration).toLocaleDateString('fr-FR')}</td>
          <td style="font-weight:500;">${d.nomLocataire}</td>
          <td>${localBadge(d.apptLocataire)}</td>
          <td style="font-size:12px;color:var(--text3);">${d.nomImmeuble.split(' ')[0]}</td>
          <td style="font-size:12px;">${modeIcons[d.mode]||''} ${d.mode}</td>
          <td style="font-size:12px;">${MNOMS[d.moisC]} ${d.anneeC}</td>
          <td class="td-amount green">${fmt(d.montant)}</td>
          <td style="font-size:11px;">
            ${d.statut==='pending_receipt'
              ? `<span style="background:rgba(14,106,175,.1);color:var(--accent);padding:2px 7px;border-radius:99px;font-size:10px;font-weight:600;">📋 ${d.recordedBy||'Gestionnaire'}</span>`
              : `<span style="background:var(--green-bg);color:var(--green);padding:2px 7px;border-radius:99px;font-size:10px;font-weight:600;">🔑 Locataire</span>`}
          </td>
          <td style="white-space:nowrap;">
            <button class="btn btn-primary btn-sm" onclick="ouvrirValidation(${d.id})">✅ Valider</button>
            <button class="btn btn-danger btn-sm" onclick="rejeterRapide(${d.id})">✗</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>`
    :'<div class="empty"><div class="empty-text">✓ Aucun paiement en attente</div></div>'}
  </div>

  ${pendingBailleur.length>0?`
  <div class="card" style="margin-bottom:16px;">
    <div class="card-header">
      <div class="card-title">🏠 Paiements déclarés par le propriétaire (${pendingBailleur.length})</div>
    </div>
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>Date</th><th>Locataire</th><th>Immeuble</th><th>Note</th><th>Montant</th><th>Action</th></tr></thead>
      <tbody>
      ${pendingBailleur.map(d=>{
        const l = DATA.locataires.find(x=>x.id===d.locId);
        const im = l ? DATA.immeubles.find(i=>i.id===l.iid) : null;
        return `<tr>
          <td style="font-size:11px;">${d.date||''}</td>
          <td style="font-weight:500;">${l?l.nom:'?'}</td>
          <td style="font-size:12px;color:var(--text3);">${im?im.nom.split(' ')[0]:'?'}</td>
          <td style="font-size:12px;">${d.note||'Paiement reçu'}</td>
          <td class="td-amount green">${fmt(d.montant)}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-primary btn-sm" onclick="validerDeclBailleur(${d.id})">✅ Valider</button>
            <button class="btn btn-danger btn-sm" onclick="rejeterDeclBailleur(${d.id})">✗</button>
          </td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>
  </div>`:``}

  ${validated.length>0?`
  <div class="card">
    <div class="card-header"><div class="card-title">✅ Derniers validés (${validated.length})</div></div>
      <thead><tr><th>Date valid.</th><th>Locataire</th><th>Mois</th><th>Montant</th><th>Réf. reçu</th><th>PDF</th></tr></thead>
      <tbody>
      ${validated.map(d=>`
        <tr>
          <td style="font-size:11px;">${d.dateValidation?d.dateValidation.split('-').reverse().join('/'):'–'}</td>
          <td style="font-weight:500;">${d.nomLocataire}</td>
          <td style="font-size:12px;">${MNOMS[d.moisC]} ${d.anneeC}</td>
          <td class="td-amount green">${fmt(d.montantValidé||d.montant)}</td>
          <td style="font-size:11px;font-family:var(--mono);color:var(--accent);">${d.receiptId||'–'}</td>
          <td style="white-space:nowrap;">
            ${d.payId?`<button class="btn btn-sm" onclick="telechargerRecuValide(${d.payId})">⬇ PDF</button>`:'–'}
            ${d.payId&&can('canFinance')?`<button class="annuler-badge" onclick="annulerValidationDeclaration(${d.id})" style="margin-left:4px;">↺</button>`:''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>`:''}`;

  document.getElementById('content').innerHTML = html;
  // Barre de recherche
  var c = document.getElementById('content');
  var bar = document.createElement('div');
  bar.style.cssText = 'margin-bottom:14px;';
  bar.innerHTML = '<input type="text" id="search-validation" placeholder="🔍 Rechercher locataire, immeuble, mois..." oninput="_filterValidation()" style="width:100%;padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">';
  c.insertBefore(bar, c.firstChild);
}
function _filterValidation() {
  var q = (document.getElementById('search-validation').value||'').toLowerCase().trim();
  document.querySelectorAll('#content tr.valid-row').forEach(function(r) {
    r.style.display = !q || (r.dataset.search||'').indexOf(q) >= 0 ? '' : 'none';
  });
}
function rejeterRapide(declId) {
  if (!confirm('Rejeter ce paiement ?')) return;
  const d = DATA.declarations.find(x=>x.id===declId);
  if (!d) return;
  d.statut = 'rejected';
  d.noteComptable = 'Rejeté par le comptable';
  d.dateValidation = new Date().toISOString().split('T')[0];
  saveData();
  showToast('Paiement rejeté');
  renderValidationComptable();
}

function validerDeclBailleur(declId) {
  const d = DATA.declarations.find(x=>x.id===declId && x.type==='bailleur');
  if (!d) return;
  const l = DATA.locataires.find(x=>x.id===d.locId);
  if (!l) { showToast('Locataire introuvable', 'red'); return; }
  const today = new Date();
  DATA.paiements.push({
    id: DATA.nextPayId++,
    locId: d.locId,
    date: d.date || today.toISOString().split('T')[0],
    montant: d.montant,
    moisC: today.getMonth(),
    anneeC: today.getFullYear(),
    moisFin: today.getMonth(),
    anneeFin: today.getFullYear(),
    type: 'loyer',
    mode: 'especes',
    note: d.note || 'Reçu par le bailleur',
    remisAuBailleur: true
  });
  l.reste = Math.max(0, l.reste - d.montant);
  l.s = l.reste === 0 ? 'payé' : 'impayé';
  d.statut = 'approved';
  d.dateValidation = today.toISOString().split('T')[0];
  saveData();
  updateSidebarBadges();
  showToast('✅ Paiement bailleur validé et enregistré', 'green');
  renderValidationComptable();
}

function rejeterDeclBailleur(declId) {
  if (!confirm('Rejeter cette déclaration du propriétaire ?')) return;
  const d = DATA.declarations.find(x=>x.id===declId && x.type==='bailleur');
  if (!d) return;
  d.statut = 'rejected';
  d.dateValidation = new Date().toISOString().split('T')[0];
  saveData();
  showToast('Déclaration rejetée');
  renderValidationComptable();
}

// Count pending declarations for notification badge
function getPendingDeclarations() {
  return (DATA.declarations||[]).filter(d=>d.statut==='pending');
}


// ============================================================
// ADMIN PERMISSIONS MANAGEMENT
// ============================================================
const ALL_PERMS = [
  { key:'canSeeAll',          icon:'👁️',  label:'Voir tous les immeubles',   desc:'Accès à tous les immeubles sans restriction' },
  { key:'canEdit',            icon:'✏️',  label:'Modifier données',           desc:'Modifier immeubles, configurations' },
  { key:'canEditLocataires',  icon:'👤',  label:'Modifier locataires',        desc:'Ajouter, modifier, libérer des locataires' },
  { key:'canRecordPayment',   icon:'💳',  label:'Enregistrer paiements',      desc:'Saisir des paiements reçus' },
  { key:'canFinance',         icon:'💰',  label:'Accès finances complet',     desc:'Valider paiements, émettre reçus PDF' },
  { key:'canJuridique',       icon:'⚖️',  label:'Documents juridiques',       desc:'Générer mises en demeure, plaintes' },
  { key:'canStats',           icon:'📈',  label:'Statistiques',               desc:'Accès aux statistiques et rapports annuels' },
  { key:'canManageUsers',     icon:'👥',  label:'Gérer utilisateurs',         desc:'Ajouter/modifier/supprimer des utilisateurs' },
];

function ouvrirModalPermissions(userId) {
  const u = USERS.find(x => x.id === userId);
  if (!u) return;

  document.getElementById('perm-user-id').value = userId;

  const roleLabels = {admin:'👑 Admin',gestionnaire:'📋 Gestionnaire',comptable:'💰 Comptable',proprietaire:'🏠 Propriétaire',locataire:'🔑 Locataire'};
  document.getElementById('perm-user-info').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:700;">
        ${u.nom.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
      </div>
      <div>
        <div style="font-weight:700;font-size:14px;">${u.nom}</div>
        <div style="font-size:12px;color:var(--text3);">${roleLabels[u.role]||u.role} · ${u.username||'PIN: '+u.pin}</div>
      </div>
    </div>`;

  const defaultPerms = PERMISSIONS[u.role] || {};
  const custom = u.customPerms || {};

  let gridHtml = '';
  ALL_PERMS.forEach(p => {
    const defaultVal = defaultPerms[p.key] || false;
    const customVal = p.key in custom ? custom[p.key] : null; // null = use default
    const effectiveVal = customVal !== null ? customVal : defaultVal;

    const isGranted = effectiveVal;
    const isCustom = customVal !== null;
    const isOverride = isCustom && customVal !== defaultVal;

    gridHtml += `
    <div style="border:1.5px solid ${isOverride?(isGranted?'var(--green)':'var(--red)'):'var(--border)'};border-radius:var(--radius-sm);padding:12px;background:${isGranted?'rgba(26,107,69,.04)':'rgba(0,0,0,.01)'};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:16px;">${p.icon}</span>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text);">${p.label}</div>
            <div style="font-size:10px;color:var(--text3);">${p.desc}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <!-- Accordé -->
        <button onclick="setPermBtn('${p.key}','grant',this)"
          class="perm-btn ${customVal===true?'active-grant':''}"
          style="flex:1;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid ${customVal===true?'var(--green)':'var(--border)'};background:${customVal===true?'var(--green-bg)':'var(--bg3)'};color:${customVal===true?'var(--green)':'var(--text3)'};">
          ✓ Accorder
        </button>
        <!-- Par défaut -->
        <button onclick="setPermBtn('${p.key}','default',this)"
          class="perm-btn ${customVal===null?'active-default':''}"
          style="flex:1;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid ${customVal===null?'var(--accent)':'var(--border)'};background:${customVal===null?'rgba(14,106,175,.08)':'var(--bg3)'};color:${customVal===null?'var(--accent)':'var(--text3)'};">
          ◈ Défaut${defaultVal?' (✓)':' (✗)'}
        </button>
        <!-- Retiré -->
        <button onclick="setPermBtn('${p.key}','revoke',this)"
          class="perm-btn ${customVal===false?'active-revoke':''}"
          style="flex:1;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid ${customVal===false?'var(--red)':'var(--border)'};background:${customVal===false?'var(--red-bg)':'var(--bg3)'};color:${customVal===false?'var(--red)':'var(--text3)'};">
          ✗ Retirer
        </button>
      </div>
    </div>`;
  });

  document.getElementById('perm-grid').innerHTML = gridHtml;
  document.getElementById('modal-permissions').classList.add('open');
}

// Track pending changes in memory
let _pendingPerms = {};

function setPermBtn(permKey, action, btn) {
  // Update visual
  const container = btn.closest('div[style*="border:"]');
  const btns = container.querySelectorAll('.perm-btn');
  btns.forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.background = 'var(--bg3)';
    b.style.color = 'var(--text3)';
  });

  if (action === 'grant') {
    btn.style.borderColor = 'var(--green)';
    btn.style.background = 'var(--green-bg)';
    btn.style.color = 'var(--green)';
    _pendingPerms[permKey] = true;
  } else if (action === 'revoke') {
    btn.style.borderColor = 'var(--red)';
    btn.style.background = 'var(--red-bg)';
    btn.style.color = 'var(--red)';
    _pendingPerms[permKey] = false;
  } else {
    btn.style.borderColor = 'var(--accent)';
    btn.style.background = 'rgba(14,106,175,.08)';
    btn.style.color = 'var(--accent)';
    delete _pendingPerms[permKey];
  }
}

function sauvegarderPermissions() {
  const userId = document.getElementById('perm-user-id').value;
  const u = USERS.find(x => x.id === userId);
  if (!u) return;

  // Read current state from buttons
  const newPerms = {};
  ALL_PERMS.forEach(p => {
    if (p.key in _pendingPerms) {
      if (_pendingPerms[p.key] !== null) {
        newPerms[p.key] = _pendingPerms[p.key];
      }
    } else if (u.customPerms && p.key in u.customPerms) {
      newPerms[p.key] = u.customPerms[p.key];
    }
    // If not in pendingPerms and not in existing custom → use default (don't store)
  });

  u.customPerms = newPerms;
  _pendingPerms = {};
  saveUsers();
  closeModals();
  showToast('Droits mis à jour ✓');
  renderUtilisateurs();
}

function reinitialiserPermissions() {
  if (!confirm('Réinitialiser tous les droits personnalisés de cet utilisateur ?')) return;
  const userId = document.getElementById('perm-user-id').value;
  const u = USERS.find(x => x.id === userId);
  if (!u) return;
  u.customPerms = {};
  _pendingPerms = {};
  saveUsers();
  closeModals();
  showToast('Droits réinitialisés aux valeurs par défaut');
  renderUtilisateurs();
}


// ============================================================
// CHANGER MOT DE PASSE
// ============================================================
function checkPwdStrength(pwd) {
  const bar = document.getElementById('pwd-strength-bar');
  const lbl = document.getElementById('pwd-strength-label');
  if (!bar || !lbl) return;
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { pct:0,   col:'var(--red)',    lbl:'' },
    { pct:20,  col:'var(--red)',    lbl:'Très faible' },
    { pct:40,  col:'#E8834A',       lbl:'Faible' },
    { pct:60,  col:'var(--yellow)', lbl:'Moyen' },
    { pct:80,  col:'var(--green)',  lbl:'Fort' },
    { pct:100, col:'var(--green)',  lbl:'Très fort' },
  ];
  const lvl = levels[score];
  bar.style.width  = lvl.pct + '%';
  bar.style.background = lvl.col;
  lbl.textContent  = lvl.lbl;
  lbl.style.color  = lvl.col;
}

function showChangerMotDePasse(forced = false) {
  document.getElementById('pwd-actuel').value = '';
  document.getElementById('pwd-nouveau').value = '';
  document.getElementById('pwd-confirm').value = '';
  document.getElementById('pwd-error').style.display = 'none';
  checkPwdStrength('');

  const alertEl = document.getElementById('pwd-modal-alert');
  const cancelBtn = document.getElementById('pwd-cancel-btn');
  const titleEl = document.getElementById('pwd-modal-title');

  if (forced) {
    alertEl.style.display = 'block';
    cancelBtn.style.display = 'none';
    titleEl.textContent = '🔐 Définir mon mot de passe';
  } else {
    alertEl.style.display = 'none';
    cancelBtn.style.display = 'block';
    titleEl.textContent = '🔒 Changer mon mot de passe';
  }

  document.getElementById('modal-changer-pwd').classList.add('open');
}

function sauvegarderMotDePasse() {
  const actuel  = document.getElementById('pwd-actuel').value;
  const nouveau = document.getElementById('pwd-nouveau').value;
  const confirm = document.getElementById('pwd-confirm').value;
  const errEl   = document.getElementById('pwd-error');
  const errMsg  = document.getElementById('pwd-error-msg');

  function showErr(msg) {
    errMsg.textContent = msg;
    errEl.style.display = 'flex';
  }

  // Validations
  if (!actuel)   { showErr('Veuillez entrer votre mot de passe actuel'); return; }
  if (!nouveau)  { showErr('Veuillez entrer un nouveau mot de passe'); return; }
  if (nouveau.length <6) { showErr('Le mot de passe doit contenir au moins 6 caractères'); return; }
  if (nouveau !== confirm) { showErr('Les mots de passe ne correspondent pas'); return; }
  if (nouveau === actuel)  { showErr('Le nouveau mot de passe doit être différent de l\'ancien'); return; }

  // Verify current password
  if (!SESSION) { showErr('Session expirée. Veuillez vous reconnecter.'); return; }
  const u = USERS.find(x => x.id === SESSION.userId);
  if (!u) { showErr('Utilisateur introuvable'); return; }
  if (u.password !== actuel) { showErr('Mot de passe actuel incorrect'); return; }

  // Save new password
  u.password = nouveau;
  u.mustChangePassword = false;
  saveUsers();

  closeModals();
  showToast('Mot de passe changé avec succès ✓');

  // If it was forced (first login), now initialize app
  const wasForced = document.getElementById('pwd-modal-alert').style.display !== 'none';
  if (wasForced) {
    initApp();
  }
}


// ============================================================
// ANNULATIONS ET RESTAURATIONS
// ============================================================

function annulerPaiement(payId) {
  if (!confirm('Annuler ce paiement ? Le montant sera recrédité aux arriérés du locataire.')) return;
  const p = DATA.paiements.find(x=>x.id===payId);
  if (!p) { showToast('Paiement introuvable','red'); return; }
  const l = DATA.locataires.find(x=>x.id===p.locId);

  // Remove paiement
  DATA.paiements = DATA.paiements.filter(x=>x.id!==payId);

  // Restore reste
  if (l && p.type==='loyer') {
    l.reste += p.montant;
    l.s = 'impayé';
    l.obs = 'Paiement annulé le ' + new Date().toLocaleDateString('fr-FR');
  }

  // If had a declaration, revert it
  const d = (DATA.declarations||[]).find(x=>x.payId===payId||x.id===p.declId);
  if (d) {
    d.statut = 'cancelled';
    d.receiptId = null;
    d.payId = null;
  }

  saveData();
  showToast('Paiement annulé ✓ — Arriérés mis à jour');
  renderCurrent();
}

function restaurerLocataire(archiveId) {
  if (!confirm('Restaurer ce locataire ? Il sera remis dans son local.')) return;
  const a = DATA.archives.find(x=>x.id===archiveId);
  if (!a) { showToast('Archive introuvable','red'); return; }

  // Find the libre locataire slot
  const l = DATA.locataires.find(x=>x.iid===a.iid&&x.appt===a.appt&&x.s==='libre');
  if (l) {
    // Restore data to the libre slot
    l.nom    = a.nom;
    l.tel    = a.tel||'';
    l.loyer  = a.loyer||0;
    l.reste  = a.soldeFinal||0;
    l.s      = a.soldeFinal>0?'impayé':'payé';
    l.entree = a.entree||'';
    l.obs    = 'Restauré le '+new Date().toLocaleDateString('fr-FR');
    l.caution= 0;
  } else {
    // Create new locataire entry
    DATA.locataires.push({
      id: DATA.nextLocId++,
      iid: a.iid, nom: a.nom, tel: a.tel||'',
      appt: a.appt||'', type: 'appartement',
      loyer: a.loyer||0, reste: a.soldeFinal||0,
      s: a.soldeFinal>0?'impayé':'payé',
      obs: 'Restauré le '+new Date().toLocaleDateString('fr-FR'),
      entree: a.entree||'', caution: 0
    });
  }

  // Remove from archives
  DATA.archives = DATA.archives.filter(x=>x.id!==archiveId);
  saveData();
  showToast('Locataire restauré ✓');
  renderCurrent();
}

function annulerValidationDeclaration(declId) {
  if (!confirm('Annuler cette validation ? Le paiement sera remis en attente.')) return;
  const d = (DATA.declarations||[]).find(x=>x.id===declId);
  if (!d) { showToast('Déclaration introuvable','red'); return; }

  // Restore paiement if exists
  if (d.payId) {
    const p = DATA.paiements.find(x=>x.id===d.payId);
    if (p) {
      const l = DATA.locataires.find(x=>x.id===p.locId);
      if (l) { l.reste += p.montant; l.s='impayé'; }
      DATA.paiements = DATA.paiements.filter(x=>x.id!==d.payId);
    }
  }

  d.statut = 'pending';
  d.dateValidation = null;
  d.noteComptable = null;
  d.receiptId = null;
  d.payId = null;
  d.montantValidé = null;

  saveData();
  showToast('Validation annulée — paiement remis en attente');
  renderCurrent();
}

function loadData() {
  DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));
  DATA.declarations = [];
  DATA.archives     = [];
  DATA.archivesPermanentes = [];
  // Tous les modes : charger depuis Supabase (async)
  if (SESSION) {
    loadDataFromSupabase().then(function(ok) {
      renderCurrent();
      updateSidebarBadges();
      if (!ok) showToast('Données locales (Supabase indisponible)', 'blue');
    });
  }
  try {
    // Use separate storage for individuel mode
    const storeKey = SESSION && SESSION.version === 'individuel' ? STORE_KEY_IND : 'immogest_data';
    // Fallback : si le store individuel est vide, lire depuis immogest_data
    const rawStore = localStorage.getItem(storeKey);
    const rawFallback = localStorage.getItem('immogest_data');
    const saved = JSON.parse(rawStore && rawStore !== 'null' ? rawStore : rawFallback || 'null');
    if (saved) {
      // Restore paiements
      if (saved.paiements   && saved.paiements.length)    DATA.paiements   = saved.paiements;
      if (saved.declarations && saved.declarations.length) DATA.declarations = saved.declarations;
      if (saved.archives     && saved.archives.length)     DATA.archives     = saved.archives;
      if (saved.archivesPermanentes && saved.archivesPermanentes.length) DATA.archivesPermanentes = saved.archivesPermanentes;
      
      // Restore locataires FULLY (including new ones added by user)
      if (saved.locataires && saved.locataires.length) {
        DATA.locataires = saved.locataires;
      }
      
      // Restore immeubles if saved
      if (saved.immeubles && saved.immeubles.length) {
        DATA.immeubles = saved.immeubles;
      }
      
      // Restore counters
      if (saved.nextLocId)  DATA.nextLocId  = saved.nextLocId;
      if (saved.nextPayId)  DATA.nextPayId  = saved.nextPayId;
      if (saved.nextDeclId) DATA.nextDeclId = saved.nextDeclId;
      if (saved.nextImmId)  DATA.nextImmId  = saved.nextImmId;
      
      // Restore settings (Mobile Money numbers)
      if (saved.settings) DATA.settings = saved.settings;
      if (!DATA.settings) DATA.settings = { momo: { mtn: '', orange: '', wave: '' } };
      if (!DATA.settings.momo) DATA.settings.momo = { mtn: '', orange: '', wave: '' };
      
      if (!DATA.corbeille) DATA.corbeille = [];
      if (!DATA.corbeilleImmeubles) DATA.corbeilleImmeubles = [];
      if (!DATA.archivesPermanentes) DATA.archivesPermanentes = [];
    console.log('ImmoGest chargé:', DATA.locataires.length, 'loc,', DATA.paiements.length, 'pay');
    }
  } catch(e) {
    console.warn('ImmoGest loadData error:', e);
  }
}

function saveData() {
  try {
    if (!DATA.declarations)       DATA.declarations = [];
    if (!DATA.archives)           DATA.archives = [];
    if (!DATA.archivesPermanentes) DATA.archivesPermanentes = [];
    DATA._version = DATA_VERSION;
    // Use separate storage for individuel mode
    const storeKey = SESSION && SESSION.version === 'individuel' ? STORE_KEY_IND : 'immogest_data';
    localStorage.setItem(storeKey, JSON.stringify(DATA));
    const el = document.getElementById('last-save');
    if (el) el.textContent = 'Sauvegarde ' + new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  } catch(e) { console.error('saveData:', e); }
}

// ── Wrapper saveData + Supabase pour locataires ──
async function saveLocataireAndSupabase(l) {
  saveData();
  if (SESSION) {
    await saveLocataireToSupabase(l);
  }
}

// ── Wrapper saveData + Supabase pour immeubles ──
async function saveImmeubleAndSupabase(im) {
  saveData();
  if (SESSION) {
    await saveImmeubleToSupabase(im);
  }
}

// ── Wrapper saveData + Supabase pour paiements ──
async function savePaiementAndSupabase(p) {
  saveData();
  if (SESSION) {
    await savePaiementToSupabase(p);
  }
}

function renderLocataires() {
  // Filtrer les immeubles visibles selon le rôle
  const isProprietaire = SESSION && SESSION.role === 'proprietaire';
  const immeublesFiltres = isProprietaire
    ? DATA.immeubles.filter(im => (SESSION.immeubles||[]).includes(im.id))
    : DATA.immeubles;

  const locsFiltres = isProprietaire
    ? DATA.locataires.filter(l => l.s !== 'libre' && (SESSION.immeubles||[]).includes(l.iid))
    : actifs();

  document.getElementById('page-title').textContent = 'Locataires';
  document.getElementById('page-sub').textContent = locsFiltres.length + ' locataires actifs';
  document.getElementById('topbar-main-btn').textContent = isProprietaire ? '' : '＋ Locataire';
  if (isProprietaire) document.getElementById('topbar-main-btn').style.display = 'none';

  // Barre de recherche persistante (pas dans loc-table-wrap pour ne pas être écrasée)
  let html = `<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">`;
  html += `<input type="text" id="search-loc-main" placeholder="🔍 Rechercher nom, téléphone, local..." oninput="filterLocSearch()" style="flex:1;min-width:180px;padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">`;
  html += `</div>`;
  html += `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">`;
  immeublesFiltres.forEach(im => {
    html += `<button class="btn btn-sm filter-btn" data-iid="${im.id}" onclick="filterLoc(${im.id},this)">${im.nom.split(' ')[0]}</button>`;
  });
  html += `<button class="btn btn-primary btn-sm filter-btn active-filter" data-iid="-1" onclick="filterLoc(-1,this)">Tous</button>`;
  html += `</div><div id="loc-table-wrap"></div>`;
  document.getElementById('content').innerHTML = html;
  renderLocTable(-1);
}

function renderLocTable(iid) {
  const wrap = document.getElementById('loc-table-wrap');
  if (!wrap) return;
  const isProprietaire = SESSION && SESSION.role === 'proprietaire';
  const immsAutorisés = isProprietaire ? (SESSION.immeubles||[]) : null;
  const locs = iid === -1
    ? DATA.locataires.filter(l => l.s !== 'libre' && (!immsAutorisés || immsAutorisés.includes(l.iid)))
    : DATA.locataires.filter(l => l.iid === iid && l.s !== 'libre' && (!immsAutorisés || immsAutorisés.includes(l.iid)));

  if (!locs.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">Aucun locataire' + (iid !== -1 ? ' pour cet immeuble' : '') + '</div>';
    return;
  }
  let html = '<div class="card"><div class="table-wrap"><table class="tbl"><thead><tr>' +
    '<th>Immeuble</th><th>Local</th><th>Nom</th><th>Tél</th><th>Loyer</th><th>Statut</th><th>Reste dû</th><th>Actions</th>' +
    '</tr></thead><tbody>';
  locs.forEach(l => {
    const im = DATA.immeubles.find(i => i.id === l.iid);
    const searchData = (l.nom + ' ' + (l.tel||'') + ' ' + (l.appt||'') + ' ' + (im?im.nom:'')).toLowerCase();
    html += `<tr id="loc-row-${l.id}" class="loc-row" data-search="${searchData}" oncontextmenu="showCtxLoc(event,${l.id})" style="cursor:context-menu;">
      <td style="font-size:11px;color:var(--text2);">${im ? im.nom.split(' ')[0] : '–'}</td>
      <td>${localBadge(l.appt)}</td>
      <td class="td-name">${l.nom}</td>
      <td style="font-size:12px;">${l.tel || '–'}</td>
      <td class="td-amount">${fmt(l.loyer)}</td>
      <td><span class="badge ${l.s==='payé'?'badge-green':'badge-red'}">${l.s}</span></td>
      <td class="td-amount ${l.reste>0?'red':l.reste<0?'':'green'}" style="font-size:11px;">${l.reste>0?fmtReste(l):l.reste<0?fmtReste(l):'–'}</td>
      <td style="white-space:nowrap;">
        <div class="action-menu">
          <button class="action-menu-btn" onclick="toggleActionMenu(this)">⋯</button>
          <div class="action-dropdown">
            ${can('canRecordPayment')?`<div class="action-dropdown-item" onclick="openModalPaiement(${l.iid},${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">💳 Paiement</div>`:''}
            ${can('canEditLocataires')?`<div class="action-dropdown-item" onclick="editLocataire(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📝 Modifier</div>`:''}
            <div class="action-dropdown-item" onclick="ouvrirFicheSuivi(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📊 Fiche suivi</div>
            ${l.tel?`<div class="action-dropdown-item" onclick="envoyerAccesWhatsApp(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">📲 Envoyer accès WhatsApp</div>`:''}
            <div class="action-dropdown-sep"></div>
            ${can('canEditLocataires')?`<div class="action-dropdown-item danger" onclick="supprimerLocataire(${l.id});document.querySelectorAll('.action-dropdown.open').forEach(d=>d.classList.remove('open'))">🗑️ Supprimer</div>`:''}
          </div>
        </div>
      </td>
    </tr>`;
  });
  html += '</tbody></table></div></div>';
  wrap.innerHTML = html;

  // Appui long mobile → showCtxLoc
  wrap.querySelectorAll('tr.loc-row[id]').forEach(function(row) {
    var locId = parseInt(row.id.replace('loc-row-',''));
    var _lt = null;
    row.addEventListener('touchstart', function(e) {
      var tx = e.touches[0].clientX, ty = e.touches[0].clientY;
      _lt = setTimeout(function() {
        _lt = null;
        showCtxLoc({ preventDefault:function(){}, stopPropagation:function(){}, clientX:tx, clientY:ty }, locId);
      }, 600);
    }, { passive: true });
    row.addEventListener('touchend',  function() { clearTimeout(_lt); }, { passive: true });
    row.addEventListener('touchmove', function() { clearTimeout(_lt); }, { passive: true });
  });
}

function filterLoc(iid, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter', 'btn-primary'));
  btn.classList.add('active-filter', 'btn-primary');
  window._locFilterIid = iid;
  renderLocTable(iid);
  // Réappliquer la recherche texte si elle est active
  var q = document.getElementById('search-loc-main');
  if (q && q.value.trim()) filterLocSearch();
}

function filterLocSearch() {
  var q = (document.getElementById('search-loc-main').value || '').toLowerCase().trim();
  document.querySelectorAll('#loc-table-wrap tr.loc-row').forEach(function(row) {
    var match = !q || row.dataset.search.indexOf(q) >= 0;
    row.style.display = match ? '' : 'none';
  });
}

function _filterEncHist() {
  var q = (document.getElementById('search-enc-hist').value || '').toLowerCase().trim();
  document.querySelectorAll('.hist-item[data-search]').forEach(function(item) {
    item.style.display = !q || item.dataset.search.indexOf(q) >= 0 ? '' : 'none';
  });
}

function _filterEncGlobal(forceVal) {
  // Récupère la valeur depuis search-enc-global ou depuis l'argument (search-enc-hist)
  var globalEl = document.getElementById('search-enc-global');
  var histEl   = document.getElementById('search-enc-hist');
  var q;
  if (forceVal !== undefined) {
    // Appelé depuis search-enc-hist → synchroniser search-enc-global
    q = forceVal.toLowerCase().trim();
    if (globalEl) globalEl.value = forceVal;
  } else {
    // Appelé depuis search-enc-global → synchroniser search-enc-hist
    q = (globalEl ? globalEl.value : '').toLowerCase().trim();
    if (histEl) histEl.value = globalEl ? globalEl.value : '';
  }
  // Filtrer les lignes du tableau Détail du mois (enc-row)
  document.querySelectorAll('tr.enc-row[data-search]').forEach(function(row) {
    row.style.display = !q || row.dataset.search.indexOf(q) >= 0 ? '' : 'none';
  });
  // Filtrer les éléments de l'Historique complet (hist-item)
  document.querySelectorAll('.hist-item[data-search]').forEach(function(item) {
    item.style.display = !q || item.dataset.search.indexOf(q) >= 0 ? '' : 'none';
  });
  // Masquer/afficher les groupes mois vides dans l'historique
  document.querySelectorAll('#content .hist-item[data-search]').length; // force layout
}

function _filterCorbeille() {
  var q = (document.getElementById('search-corbeille').value || '').toLowerCase().trim();
  document.querySelectorAll('tr.corbeille-row').forEach(function(row) {
    row.style.display = !q || row.dataset.search.indexOf(q) >= 0 ? '' : 'none';
  });
}


// ══════════════════════════════════════════════════════════════
// PAGE SIGNALEMENTS — Admin / Gestionnaire
// ══════════════════════════════════════════════════════════════
function renderSignalements() {
  if (!can('canManageUsers') && !can('canEdit')) {
    document.getElementById('content').innerHTML = '<div class="perm-denied"><div class="icon">🔒</div><div>Accès réservé à l\'administrateur</div></div>';
    return;
  }
  document.getElementById('page-title').textContent = 'Signalements';
  document.getElementById('topbar-main-btn').style.display = 'none';

  const sigs = (DATA.signalements || []).sort((a,b) => b.date.localeCompare(a.date));
  const nbNew = sigs.filter(s => s.statut === 'nouveau').length;

  // Mise à jour badge sidebar
  const badge = document.getElementById('badge-signalements');
  if (badge) { badge.textContent = nbNew; badge.style.display = nbNew > 0 ? 'inline' : 'none'; }

  document.getElementById('page-sub').textContent = sigs.length + ' signalement(s) · ' + nbNew + ' nouveau(x)';

  const statutColors = { nouveau: '#e74c3c', en_cours: '#f39c12', resolu: '#27ae60' };
  const statutLabels = { nouveau: '🔴 Nouveau', en_cours: '🟠 En cours', resolu: '✅ Résolu' };
  const typeLabels = { eau: '💧 Eau/plomberie', electricite: '⚡ Électricité', serrure: '🔐 Serrure/porte', toiture: '🏠 Toiture/fissure', autre: '📝 Autre' };

  // Filtres
  let html = `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
    <button class="btn btn-sm filter-sig active-filter-sig" data-statut="tous" onclick="filterSig('tous',this)" style="background:var(--primary);color:#fff;border-color:var(--primary);">Tous (${sigs.length})</button>
    <button class="btn btn-sm filter-sig" data-statut="nouveau" onclick="filterSig('nouveau',this)">🔴 Nouveaux (${sigs.filter(s=>s.statut==='nouveau').length})</button>
    <button class="btn btn-sm filter-sig" data-statut="en_cours" onclick="filterSig('en_cours',this)">🟠 En cours (${sigs.filter(s=>s.statut==='en_cours').length})</button>
    <button class="btn btn-sm filter-sig" data-statut="resolu" onclick="filterSig('resolu',this)">✅ Résolus (${sigs.filter(s=>s.statut==='resolu').length})</button>
  </div>`;

  if (sigs.length === 0) {
    html += '<div class="card"><div style="text-align:center;padding:40px;color:var(--text3);">🎉 Aucun signalement pour l\'instant</div></div>';
  } else {
    html += '<div id="sig-list">';
    sigs.forEach(sig => {
      const l = DATA.locataires.find(x => x.id === sig.locId);
      const im = DATA.immeubles.find(i => i.id === sig.iid);
      const sc = statutColors[sig.statut] || '#999';
      const sl = statutLabels[sig.statut] || sig.statut;
      const tl = typeLabels[sig.type] || sig.type;
      html += `<div class="card sig-card" data-statut="${sig.statut}" style="margin-bottom:12px;border-left:4px solid ${sc};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
          <div>
            <div style="font-weight:700;font-size:14px;">${tl}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:3px;">
              ${sig.locNom || (l ? l.nom : '–')} · ${sig.appt || (l ? l.appt : '')} · ${im ? im.nom : '–'}
            </div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">📅 ${new Date(sig.date).toLocaleDateString('fr-FR')}</div>
          </div>
          <span style="background:${sc};color:#fff;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap;">${sl}</span>
        </div>
        <div style="background:var(--bg3);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--text);margin-bottom:12px;">${sig.description}</div>
        ${sig.noteAdmin ? `<div style="background:#FFF9E6;border:1px solid #F39C12;border-radius:8px;padding:8px 12px;font-size:12px;color:#7D5A00;margin-bottom:10px;">📝 Note : ${sig.noteAdmin}</div>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          ${sig.statut !== 'en_cours' ? `<button class="btn btn-sm" style="background:#f39c12;color:#fff;border-color:#f39c12;" onclick="updateSignalement(${sig.id},'en_cours')">🟠 En cours</button>` : ''}
          ${sig.statut !== 'resolu' ? `<button class="btn btn-sm" style="background:#27ae60;color:#fff;border-color:#27ae60;" onclick="updateSignalement(${sig.id},'resolu')">✅ Marquer résolu</button>` : ''}
          ${sig.statut !== 'nouveau' ? `<button class="btn btn-sm btn-ghost" onclick="updateSignalement(${sig.id},'nouveau')">↩ Réouvrir</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="ajouterNoteSignalement(${sig.id})">📝 Ajouter note</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--red);" onclick="supprimerSignalement(${sig.id})">🗑️</button>
        </div>
      </div>`;
    });
    html += '</div>';
  }

  document.getElementById('content').innerHTML = html;
}

function filterSig(statut, btn) {
  document.querySelectorAll('.filter-sig').forEach(b => {
    b.style.background = '';
    b.style.color = '';
    b.style.borderColor = '';
  });
  if (btn) { btn.style.background = 'var(--primary)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--primary)'; }
  document.querySelectorAll('.sig-card').forEach(card => {
    card.style.display = (statut === 'tous' || card.dataset.statut === statut) ? '' : 'none';
  });
}

function updateSignalement(sigId, newStatut) {
  if (!DATA.signalements) return;
  const sig = DATA.signalements.find(s => s.id === sigId);
  if (!sig) return;
  sig.statut = newStatut;
  if (newStatut === 'resolu') sig.dateResolution = new Date().toISOString().split('T')[0];
  saveData();
  renderSignalements();
  showToast('Statut mis à jour', 'green');
}

function ajouterNoteSignalement(sigId) {
  const note = prompt('Note de suivi (visible par l\'admin) :');
  if (!note || !note.trim()) return;
  if (!DATA.signalements) return;
  const sig = DATA.signalements.find(s => s.id === sigId);
  if (!sig) return;
  sig.noteAdmin = note.trim();
  saveData();
  renderSignalements();
}

function supprimerSignalement(sigId) {
  if (!confirm('Supprimer ce signalement ?')) return;
  DATA.signalements = (DATA.signalements || []).filter(s => s.id !== sigId);
  saveData();
  renderSignalements();
}

function _updateBadgeSignalements() {
  const nbNew = (DATA.signalements || []).filter(s => s.statut === 'nouveau').length;
  const badge = document.getElementById('badge-signalements');
  if (badge) { badge.textContent = nbNew; badge.style.display = nbNew > 0 ? 'inline' : 'none'; }
}

function renderParametres() {
  if (!SESSION) { document.getElementById('content').innerHTML = '<div class="card"><p style="color:var(--text2);padding:8px;">🔒 Session expirée. Veuillez vous reconnecter.</p></div>'; return; }
  const peutGererMomo = SESSION.role === 'admin' || SESSION.role === 'comptable';
  if (!peutGererMomo) {
    document.getElementById('content').innerHTML = '<div class="card"><p style="color:var(--text2);padding:8px;">🔒 La configuration des numéros Mobile Money est réservée à l\'administrateur et au comptable.</p></div>';
    return;
  }
  // Mode individuel : afficher aussi la section "Mon compte" pour modifier le nom
  const isIndiv = SESSION && SESSION.version === 'individuel';
  document.getElementById('page-title').textContent = 'Paramètres';
  document.getElementById('page-sub').textContent = 'Configuration Mobile Money';
  document.getElementById('topbar-main-btn').textContent = '';

  if (!DATA.settings) DATA.settings = {};
  if (!DATA.settings.momo) DATA.settings.momo = { mtn: '', orange: '', wave: '' };
  const m = DATA.settings.momo;

  const monNom = SESSION ? SESSION.nom : '';
  const sectionMonCompte = isIndiv ? `
    <div class="card" style="max-width:520px;margin-bottom:16px;">
      <div class="card-title" style="margin-bottom:16px;">👤 Mon compte</div>
      <div class="form-group">
        <label>Mon nom affiché</label>
        <input type="text" id="admin-nom-perso" value="${monNom}" placeholder="Votre nom" class="form-control">
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="sauvegarderNomAdmin()">💾 Enregistrer mon nom</button>
    </div>` : '';

  document.getElementById('content').innerHTML = sectionMonCompte + `
    <div class="card" style="max-width:520px;">
      <div class="card-title" style="margin-bottom:20px;">📱 Numéros Mobile Money du Cabinet</div>
      <p style="font-size:13px;color:var(--text2);margin-bottom:24px;">Ces numéros seront affichés aux locataires quand ils souhaitent payer par Mobile Money.</p>

      <div style="display:flex;flex-direction:column;gap:20px;">

        <!-- MTN -->
        <div style="display:flex;align-items:center;gap:16px;padding:16px;border:2px solid #FFCC00;border-radius:12px;background:#FFFDE7;">
          <div style="width:52px;height:52px;flex-shrink:0;">
            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" width="52" height="52">
              <circle cx="26" cy="26" r="26" fill="#FFCC00"/>
              <text x="26" y="22" text-anchor="middle" font-size="10" font-weight="900" font-family="Arial,sans-serif" fill="#00338D">MTN</text>
              <text x="26" y="34" text-anchor="middle" font-size="7" font-family="Arial,sans-serif" fill="#00338D">Mobile Money</text>
            </svg>
          </div>
          <div style="flex:1;">
            <label style="font-weight:700;font-size:13px;color:#00338D;display:block;margin-bottom:6px;">MTN Mobile Money</label>
            <input type="tel" id="momo-mtn" value="${m.mtn || ''}" placeholder="6XX XXX XXX" style="width:100%;padding:10px 12px;border:1px solid #CBD5E0;border-radius:8px;font-size:14px;font-family:var(--font);box-sizing:border-box;">
          </div>
        </div>

        <!-- Orange -->
        <div style="display:flex;align-items:center;gap:16px;padding:16px;border:2px solid #FF6600;border-radius:12px;background:#FFF3E0;">
          <div style="width:52px;height:52px;flex-shrink:0;">
            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" width="52" height="52">
              <circle cx="26" cy="26" r="26" fill="#FF6600"/>
              <rect x="10" y="18" width="32" height="16" rx="3" fill="#fff"/>
              <text x="26" y="30" text-anchor="middle" font-size="9" font-weight="900" font-family="Arial,sans-serif" fill="#FF6600">orange</text>
            </svg>
          </div>
          <div style="flex:1;">
            <label style="font-weight:700;font-size:13px;color:#FF6600;display:block;margin-bottom:6px;">Orange Money</label>
            <input type="tel" id="momo-orange" value="${m.orange || ''}" placeholder="6XX XXX XXX" style="width:100%;padding:10px 12px;border:1px solid #CBD5E0;border-radius:8px;font-size:14px;font-family:var(--font);box-sizing:border-box;">
          </div>
        </div>

        <!-- Wave -->
        <div style="display:flex;align-items:center;gap:16px;padding:16px;border:2px solid #1BA7E2;border-radius:12px;background:#E3F6FD;">
          <div style="width:52px;height:52px;flex-shrink:0;">
            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" width="52" height="52">
              <circle cx="26" cy="26" r="26" fill="#1BA7E2"/>
              <text x="26" y="24" text-anchor="middle" font-size="11" font-weight="900" font-family="Arial,sans-serif" fill="#fff">Wave</text>
              <path d="M14 32 Q20 28 26 32 Q32 36 38 32" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <div style="flex:1;">
            <label style="font-weight:700;font-size:13px;color:#1BA7E2;display:block;margin-bottom:6px;">Wave</label>
            <input type="tel" id="momo-wave" value="${m.wave || ''}" placeholder="7XX XXX XXX" style="width:100%;padding:10px 12px;border:1px solid #CBD5E0;border-radius:8px;font-size:14px;font-family:var(--font);box-sizing:border-box;">
          </div>
        </div>

      </div>

      <button class="btn btn-primary" style="width:100%;margin-top:24px;padding:14px;" onclick="saveParametresMomo()">
        💾 Enregistrer les numéros
      </button>
    </div>

    <!-- Section Campay -->
    <div class="card" style="max-width:520px;margin-top:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#FFC107,#FF8F00);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div>
        <div>
          <div class="card-title" style="margin:0;">Campay — Paiements MTN & Orange</div>
          <div style="font-size:11px;color:var(--green);margin-top:2px;">✅ Actif — USSD push automatique</div>
        </div>
      </div>
      <p style="font-size:12px;color:var(--text2);margin:0;">
        Les abonnements ImmoGest sont payés automatiquement via MTN Mobile Money et Orange Money.
        Le client reçoit une demande USSD sur son téléphone et confirme avec son PIN.
      </p>
    </div>

    <!-- Section OneSignal -->
    <div class="card" style="max-width:520px;margin-top:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:36px;height:36px;background:#E8244D;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🔔</div>
        <div>
          <div class="card-title" style="margin:0;">OneSignal — Notifications push</div>
          <div id="onesignal-status-badge" style="font-size:11px;margin-top:2px;"></div>
        </div>
      </div>
      <p style="font-size:12px;color:var(--text2);margin-bottom:16px;">
        Envoie des notifications gratuites à tes locataires et propriétaires (loyers, rappels, confirmations).
        Crée un compte gratuit sur <strong>onesignal.com</strong> → New App → Web App.
      </p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-group">
          <label style="font-size:12px;font-weight:700;">App ID <span style="color:var(--text3);font-weight:400;">(Settings → Keys & IDs)</span></label>
          <input type="text" id="onesignal-appid" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:monospace;box-sizing:border-box;">
        </div>
        <div class="form-group">
          <label style="font-size:12px;font-weight:700;">REST API Key <span style="color:var(--text3);font-weight:400;">(pour envoyer des notifs)</span></label>
          <input type="password" id="onesignal-restkey" placeholder="os_v2_..."
            style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:monospace;box-sizing:border-box;">
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:16px;padding:12px;" onclick="saveOneSignalKeys()">
        🔔 Activer les notifications
      </button>
      <button class="btn btn-ghost" style="width:100%;margin-top:8px;padding:10px;font-size:12px;" onclick="notifTousImpayés()">
        ⚠️ Envoyer rappel à tous les locataires impayés
      </button>
    </div>
  `;

  // Afficher le statut OneSignal actuel
  if (typeof _updateOneSignalStatusBadge === 'function') _updateOneSignalStatusBadge();
}



function sauvegarderNomAdmin() {
  if (!SESSION) return;
  const input = document.getElementById('admin-nom-perso');
  if (!input) return;
  const nom = input.value.trim();
  if (!nom) { showToast('Le nom ne peut pas être vide', 'red'); return; }
  // Mettre à jour SESSION
  SESSION.nom = nom;
  // Mettre à jour dans USERS
  const user = USERS.find(u => u.id === SESSION.userId);
  if (user) { user.nom = nom; saveUsers(); }
  // Mettre à jour l'affichage
  const sidebarInfo = document.getElementById('sidebar-user-info');
  if (sidebarInfo) sidebarInfo.textContent = nom;
  // Mettre à jour le chip dans la topbar
  const chip = document.querySelector('.user-chip span');
  if (chip) chip.textContent = nom;
  showToast('Nom mis à jour : ' + nom, 'green');
}

function saveParametresMomo() {
  if (!DATA.settings) DATA.settings = {};
  if (!DATA.settings.momo) DATA.settings.momo = {};
  DATA.settings.momo.mtn    = (document.getElementById('momo-mtn').value    || '').trim();
  DATA.settings.momo.orange = (document.getElementById('momo-orange').value || '').trim();
  DATA.settings.momo.wave   = (document.getElementById('momo-wave').value   || '').trim();
  saveData();
  alert('✅ Numéros Mobile Money enregistrés !');
}

function renderImmeublesConfig() {
  document.getElementById('page-title').textContent = 'Configuration des immeubles';
  document.getElementById('page-sub').textContent = DATA.immeubles.length + ' immeubles';
  var _tbi=document.getElementById('topbar-main-btn'); if(_tbi){_tbi.style.display='flex';_tbi.textContent='＋ Immeuble';}

  const canEdit = can('canEdit');
  let html = '<div style="margin-bottom:14px;">';
  html += '<input type="text" id="search-imm-config" placeholder="🔍 Rechercher un immeuble..." oninput="_filterImmConfig()" style="width:100%;padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">';
  html += '</div>';
  html += '<div class="card"><div class="card-header"><div class="card-title">Immeubles enregistrés</div></div>';
  html += '<div class="table-wrap"><table class="tbl"><thead><tr>';
  html += '<th>Nom</th><th>Ville</th><th>Apparts</th><th>Studios</th><th>Chambres</th><th>Total locaux</th><th>Occupés</th><th>Actions</th>';
  html += '</tr></thead><tbody>';
  DATA.immeubles.forEach(im => {
    const locs = DATA.locataires.filter(l=>l.iid===im.id&&l.s!=='libre');
    const total = (im.apparts||0)+(im.studios||0)+(im.chambres||0);
    const searchData = (im.nom+' '+(im.ville||'')+' '+(im.quartier||'')).toLowerCase();
    const actionsImm = canEdit
      ? '<div style="position:relative;display:inline-block;"><button class="btn btn-ghost btn-sm" onclick="toggleImmDropdown('+im.id+',event)" style="padding:4px 10px;font-size:16px;line-height:1;">⋮</button>'
        + '<div id="ddm-imm-'+im.id+'" style="display:none;position:absolute;right:0;top:100%;z-index:9999;background:var(--bg2);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.15);min-width:150px;overflow:hidden;">'
        + '<div class="action-dropdown-item" onclick="editImmeuble('+im.id+');closeImmDropdown()">✏️ Modifier</div>'
        + '<div class="action-dropdown-item danger" style="color:var(--red);" onclick="supprimerImmeuble('+im.id+');closeImmDropdown()">🗑️ Supprimer</div>'
        + '</div></div>'
      : '';
    // data-immid pour appui long mobile
    html += '<tr class="imm-config-row" data-search="'+searchData+'" data-immid="'+im.id+'">'
      + '<td style="font-weight:600;">'+im.nom+'</td>'
      + '<td>'+im.ville+(im.quartier?' · '+im.quartier:'')+'</td>'
      + '<td style="text-align:center;">'+(im.apparts||0)+'</td>'
      + '<td style="text-align:center;">'+(im.studios||0)+'</td>'
      + '<td style="text-align:center;">'+(im.chambres||0)+'</td>'
      + '<td style="text-align:center;font-weight:700;">'+(total||locs.length)+'</td>'
      + '<td style="text-align:center;">'+locs.length+'</td>'
      + '<td style="position:relative;white-space:nowrap;">'+actionsImm+'</td>'
      + '</tr>';
  });
  html += '</tbody></table></div></div>';
  if (canEdit) {
    // Sur PC : bouton Ajouter visible + message appui long masqué
    // Sur mobile : message appui long visible, bouton topbar suffit
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-bottom:4px;flex-wrap:wrap;gap:8px;">'
      + '<button onclick="openModalImmeuble()" class="btn btn-primary btn-sm" style="display:flex;align-items:center;gap:6px;"><span style="font-size:15px;">＋</span> Ajouter un immeuble</button>'
      + '<span class="mobile-only-hint" style="font-size:11px;color:var(--text3);">💡 Appui long sur une ligne pour modifier ou supprimer</span>'
      + '</div>';
  }
  document.getElementById('content').innerHTML = html;

  // Appui long sur ligne = menu contextuel immeuble (mobile)
  if (canEdit) {
    document.querySelectorAll('tr.imm-config-row[data-immid]').forEach(function(row) {
      var immId = parseInt(row.dataset.immid);
      var _lt = null;
      row.addEventListener('touchstart', function(e) {
        _lt = setTimeout(function() {
          _lt = null;
          _showImmCtxMenu(immId, e.touches[0].clientX, e.touches[0].clientY);
        }, 600);
      }, { passive: true });
      row.addEventListener('touchend',  function() { clearTimeout(_lt); }, { passive: true });
      row.addEventListener('touchmove', function() { clearTimeout(_lt); }, { passive: true });
    });
  }
}

function _showImmCtxMenu(immId, x, y) {
  var old = document.getElementById('imm-ctx-menu');
  if (old) old.remove();
  var menu = document.createElement('div');
  menu.id = 'imm-ctx-menu';
  menu.style.cssText = 'position:fixed;z-index:9999;background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,0.18);min-width:190px;overflow:hidden;animation:fadeInStep .18s ease;';
  var left = Math.min(x, window.innerWidth - 200);
  var top  = Math.min(y, window.innerHeight - 120);
  menu.style.left = left + 'px';
  menu.style.top  = top  + 'px';

  // Utiliser touchend + preventDefault pour éviter le conflit avec le listener de fermeture
  var itemStyle = 'padding:15px 18px;cursor:pointer;font-size:15px;display:flex;align-items:center;gap:10px;';
  var item1 = document.createElement('div');
  item1.style.cssText = itemStyle + 'border-bottom:1px solid var(--border);';
  item1.innerHTML = '✏️ Modifier';
  item1.addEventListener('touchend', function(e) {
    e.preventDefault(); e.stopPropagation();
    _closeImmCtxMenu();
    setTimeout(function(){ editImmeuble(immId); }, 80);
  });
  item1.addEventListener('click', function(e) {
    e.stopPropagation();
    _closeImmCtxMenu();
    editImmeuble(immId);
  });

  var item2 = document.createElement('div');
  item2.style.cssText = itemStyle + 'color:var(--red);';
  item2.innerHTML = '🗑️ Supprimer';
  item2.addEventListener('touchend', function(e) {
    e.preventDefault(); e.stopPropagation();
    _closeImmCtxMenu();
    setTimeout(function(){ supprimerImmeuble(immId); }, 80);
  });
  item2.addEventListener('click', function(e) {
    e.stopPropagation();
    _closeImmCtxMenu();
    supprimerImmeuble(immId);
  });

  menu.appendChild(item1);
  menu.appendChild(item2);
  document.body.appendChild(menu);

  // Fermer si on tape ailleurs (délai pour ne pas capturer le touchend courant)
  setTimeout(function() {
    document.addEventListener('touchstart', _closeImmCtxMenu, { once: true, passive: true });
    document.addEventListener('click',      _closeImmCtxMenu, { once: true });
  }, 200);
}

function _closeImmCtxMenu() {
  var m = document.getElementById('imm-ctx-menu');
  if (m) m.remove();
}

function toggleImmDropdown(immId, e) {
  e.stopPropagation();
  var menu = document.getElementById('ddm-imm-' + immId);
  if (!menu) return;
  var isOpen = menu.style.display === 'block';
  document.querySelectorAll('[id^="ddm-imm-"]').forEach(function(m) { m.style.display = 'none'; });
  menu.style.display = isOpen ? 'none' : 'block';
}

function closeImmDropdown() {
  document.querySelectorAll('[id^="ddm-imm-"]').forEach(function(m) { m.style.display = 'none'; });
}

document.addEventListener('click', function() { closeImmDropdown(); });

function _filterImmConfig() {
  var q = (document.getElementById('search-imm-config').value||'').toLowerCase().trim();
  document.querySelectorAll('.imm-config-row').forEach(function(r) {
    r.style.display = !q || r.dataset.search.indexOf(q) >= 0 ? '' : 'none';
  });
}

function renderStatistiques() {
  document.getElementById('page-title').textContent = 'Statistiques';
  document.getElementById('page-sub').textContent = 'Analyses par immeuble';
  document.getElementById('topbar-main-btn').textContent = '📄 Exporter';

  // Filtre immeuble sélectionné
  const selIid = window._statsIid !== undefined ? window._statsIid : -1;
  const selSeuil = window._statsSeuil !== undefined ? window._statsSeuil : 0;
  const selSens = window._statsSens !== undefined ? window._statsSens : 'retard'; // 'retard' ou 'avance'

  const immFiltres = selIid === -1
    ? DATA.immeubles.filter(im=>DATA.locataires.some(l=>l.iid===im.id&&l.s!=='libre'))
    : DATA.immeubles.filter(im=>im.id===selIid);

  let html = '';

  // ── Filtres ──────────────────────────────────────────────────────────────
  html += `<div class="card" style="margin-bottom:16px;">
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
      <div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Immeuble</div>
        <select onchange="window._statsIid=parseInt(this.value);renderStatistiques();" style="font-size:13px;padding:6px 10px;border:1px solid var(--border2);border-radius:var(--radius-sm);background:var(--bg3);color:var(--text);">
          <option value="-1" ${selIid===-1?'selected':''}>Tous les immeubles</option>
          ${DATA.immeubles.map(im=>`<option value="${im.id}" ${selIid===im.id?'selected':''}>${im.nom}</option>`).join('')}
        </select>
      </div>
      <div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Tri par</div>
        <select onchange="window._statsSens=this.value;renderStatistiques();" style="font-size:13px;padding:6px 10px;border:1px solid var(--border2);border-radius:var(--radius-sm);background:var(--bg3);color:var(--text);">
          <option value="retard" ${selSens==='retard'?'selected':''}>Arriérés (mois de retard)</option>
          <option value="avance" ${selSens==='avance'?'selected':''}>Avance (mois payés d\'avance)</option>
          <option value="montant" ${selSens==='montant'?'selected':''}>Montant dû</option>
          <option value="alpha" ${selSens==='alpha'?'selected':''}>Nom (A-Z)</option>
        </select>
      </div>
      <div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Seuil minimum (mois)</div>
        <select onchange="window._statsSeuil=parseInt(this.value);renderStatistiques();" style="font-size:13px;padding:6px 10px;border:1px solid var(--border2);border-radius:var(--radius-sm);background:var(--bg3);color:var(--text);">
          <option value="0" ${selSeuil===0?'selected':''}>Tous</option>
          <option value="1" ${selSeuil===1?'selected':''}>≥ 1 mois</option>
          <option value="2" ${selSeuil===2?'selected':''}>≥ 2 mois</option>
          <option value="3" ${selSeuil===3?'selected':''}>≥ 3 mois</option>
          <option value="4" ${selSeuil===4?'selected':''}>≥ 4 mois</option>
          <option value="5" ${selSeuil===5?'selected':''}>≥ 5 mois</option>
          <option value="6" ${selSeuil===6?'selected':''}>≥ 6 mois</option>
        </select>
      </div>
      <button class="btn btn-sm" onclick="window._statsIid=-1;window._statsSeuil=0;window._statsSens='retard';renderStatistiques();">↺ Réinitialiser</button>
    </div>
  </div>`;

  // ── Stats globales pour les immeubles filtrés ─────────────────────────────
  immFiltres.forEach(im => {
    const tousLocs = DATA.locataires.filter(l=>l.iid===im.id&&l.s!=='libre');
    const libres   = DATA.locataires.filter(l=>l.iid===im.id&&l.s==='libre').length;

    // Calcul nb mois pour chaque locataire
    const avecMois = tousLocs.map(l => {
      const nbMois = l.loyer>0 ? l.reste/l.loyer : 0;
      return {...l, nbMois};
    });

    // Appliquer filtre seuil selon sens
    let filtered = avecMois;
    if (selSens === 'retard' && selSeuil > 0) {
      filtered = avecMois.filter(l => l.s==='impayé' && l.nbMois >= selSeuil);
    } else if (selSens === 'avance' && selSeuil > 0) {
      filtered = avecMois.filter(l => l.s==='payé');
    } else if (selSeuil > 0) {
      filtered = avecMois.filter(l => l.s==='impayé' && l.nbMois >= selSeuil);
    }

    // Tri
    if (selSens==='retard' || selSens==='montant') {
      filtered.sort((a,b)=>b.reste-a.reste);
    } else if (selSens==='alpha') {
      filtered.sort((a,b)=>a.nom.localeCompare(b.nom));
    }

    const totalLoyers = tousLocs.reduce((s,l)=>s+l.loyer,0);
    const totalReste  = tousLocs.reduce((s,l)=>s+l.reste,0);
    const nbAJour     = tousLocs.filter(l=>l.s==='payé').length;
    const nbEnRetard  = tousLocs.filter(l=>l.s==='impayé').length;
    const txRecouvr   = totalLoyers>0 ? Math.round((totalLoyers-totalReste)/totalLoyers*100) : 0;

    // Histogramme des retards
    const retardBuckets = {1:0,2:0,3:0,4:0,5:0,6:0};
    tousLocs.filter(l=>l.s==='impayé').forEach(l=>{
      const m = Math.round(l.nbMois||l.reste/l.loyer);
      const k = Math.min(m,6);
      if(k>=1) retardBuckets[k]=(retardBuckets[k]||0)+1;
    });

    html += `<div class="card" style="margin-bottom:18px;">
      <div class="card-header">
        <div class="card-title" style="display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${im.col};"></span>
          ${im.nom} <span style="font-size:12px;color:var(--text3);">· ${im.ville}${im.quartier?' · '+im.quartier:''}</span>
        </div>
        <span class="badge ${txRecouvr>=70?'badge-green':txRecouvr>=40?'badge-yellow':'badge-red'}">${txRecouvr}% recouvré</span>
      </div>

      <!-- KPIs immeuble -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px;">
        <div style="background:var(--bg3);border-radius:6px;padding:10px 12px;">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Locataires</div>
          <div style="font-size:20px;font-weight:600;">${tousLocs.length}</div>
          <div style="font-size:11px;color:var(--text3);">${libres} libre(s)</div>
        </div>
        <div style="background:var(--green-bg);border-radius:6px;padding:10px 12px;">
          <div style="font-size:10px;color:var(--green);text-transform:uppercase;">À jour</div>
          <div style="font-size:20px;font-weight:600;color:var(--green);">${nbAJour}</div>
          <div style="font-size:11px;color:var(--text3);">${tousLocs.length>0?Math.round(nbAJour/tousLocs.length*100):0}%</div>
        </div>
        <div style="background:var(--red-bg);border-radius:6px;padding:10px 12px;">
          <div style="font-size:10px;color:var(--red);text-transform:uppercase;">En retard</div>
          <div style="font-size:20px;font-weight:600;color:var(--red);">${nbEnRetard}</div>
          <div style="font-size:11px;color:var(--text3);">${fmt(totalReste)}</div>
        </div>
        <div style="background:var(--bg3);border-radius:6px;padding:10px 12px;">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Loyers/mois</div>
          <div style="font-size:16px;font-weight:600;">${fmtShort(totalLoyers)}</div>
        </div>
        <div style="background:var(--bg3);border-radius:6px;padding:10px 12px;">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;">≥2 mois retard</div>
          <div style="font-size:20px;font-weight:600;color:var(--red);">${tousLocs.filter(l=>l.s==='impayé'&&l.loyer>0&&l.reste/l.loyer>=2).length}</div>
          <div style="font-size:11px;color:var(--text3);">dossiers</div>
        </div>
      </div>

      <!-- Histogramme retards -->
      ${tousLocs.filter(l=>l.s==='impayé').length>0?`
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;">Répartition par nombre de mois de retard</div>
        <div style="display:flex;gap:8px;align-items:flex-end;height:60px;">
          ${[1,2,3,4,5,6].map(m=>{
            const cnt = tousLocs.filter(l=>l.s==='impayé'&&l.loyer>0&&Math.round(l.reste/l.loyer)===m).length;
            const pct = nbEnRetard>0?Math.round(cnt/nbEnRetard*100):0;
            const h = Math.max(pct,4);
            const col = m<=1?'#F0B429':m<=2?'#E8834A':m<=3?'#E05252':'#C0392B';
            return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;">
              <div style="font-size:10px;color:var(--text3);margin-bottom:2px;">${cnt}</div>
              <div style="width:100%;background:${col};border-radius:3px 3px 0 0;height:${h}px;opacity:.85;"></div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px;">${m}${m===6?'+':''} mois</div>
            </div>`;
          }).join('')}
        </div>
      </div>`:''}

      <!-- Tableau filtré -->
      <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;">
        ${filtered.length} locataire(s) affiché(s)
        ${selSeuil>0?`<span style="background:var(--red-bg);color:var(--red);padding:1px 7px;border-radius:99px;margin-left:6px;">≥ ${selSeuil} mois</span>`:''}
      </div>
      <div style="overflow-x:auto;"><table class="tbl">
        <thead><tr>
          <th>Local</th><th>Nom</th><th>Téléphone</th><th>Loyer</th>
          <th>Mois retard</th><th>Reste dû</th><th>Statut</th><th>Actions</th>
        </tr></thead>
        <tbody>
        ${filtered.map((l,i)=>{
          const mois = l.loyer>0?Math.round(l.reste/l.loyer):0;
          const coulMois = mois>=6?'#C0392B':mois>=4?'#E05252':mois>=2?'#E8834A':'#F0B429';
          return `<tr>
            <td>${localBadge(l.appt)}</td>
            <td class="td-name">${l.nom}</td>
            <td style="font-size:11px;color:var(--text3);">${l.tel||'–'}</td>
            <td class="td-amount">${fmt(l.loyer)}</td>
            <td style="text-align:center;">
              ${l.s==='impayé'&&mois>0?
                `<span style="background:${coulMois}22;color:${coulMois};font-weight:700;padding:2px 10px;border-radius:99px;font-size:12px;">${mois} mois</span>`
                :`<span style="color:var(--green);font-size:12px;">✓ À jour</span>`}
            </td>
            <td class="td-amount ${l.reste>0?'red':'green'}">${l.reste>0?fmt(l.reste):'–'}</td>
            <td><span class="badge ${l.s==='payé'?'badge-green':'badge-red'}">${l.s}</span></td>
            <td style="white-space:nowrap;">
              ${l.s==='impayé'?`
                <button class="btn btn-primary btn-sm" onclick="openModalPaiement(${l.iid},${l.id})">＋ Paiement</button>
                ${mois>=2?`<button class="btn btn-sm" style="background:#C0392B;color:#fff;border-color:#C0392B;" onclick="previewPlainte(${l.id})">⚖ Plainte</button>`:''}
              `:''}
            </td>
          </tr>`;
        }).join('')}
        </tbody>
        ${filtered.filter(l=>l.reste>0).length>0?`
        <tfoot>
          <tr style="background:var(--bg3);">
            <td colspan="5" style="text-align:right;font-weight:600;padding:8px 10px;font-size:13px;">Total affiché</td>
            <td style="font-weight:700;color:var(--red);font-family:var(--mono);padding:8px 10px;">${fmt(filtered.reduce((s,l)=>s+l.reste,0))}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>`:''}
      </table></div>
    </div>`;
  });

  document.getElementById('content').innerHTML = html;

  // Appui long mobile → showCtxRelance sur lignes relances
  document.querySelectorAll('tr.relance-row[oncontextmenu]').forEach(function(row) {
    var oc = row.getAttribute('oncontextmenu') || '';
    var match = oc.match(/showCtxRelance\(event,(\d+)\)/);
    if (!match) return;
    var locId = parseInt(match[1]);
    var _lt = null;
    row.addEventListener('touchstart', function(e) {
      var tx = e.touches[0].clientX, ty = e.touches[0].clientY;
      _lt = setTimeout(function() {
        _lt = null;
        showCtxRelance({ preventDefault:function(){}, stopPropagation:function(){}, clientX:tx, clientY:ty }, locId);
      }, 600);
    }, { passive: true });
    row.addEventListener('touchend',  function() { clearTimeout(_lt); }, { passive: true });
    row.addEventListener('touchmove', function() { clearTimeout(_lt); }, { passive: true });
  });
}

// ============================================================
// RAPPORT ANNUEL
// ============================================================
function toggleSidebarGestion() {
  const el = document.getElementById('sidebar-gestion');
  const icon = document.getElementById('gest-toggle-icon');
  if (!el) return;
  if (el.style.display === 'none') {
    el.style.display = '';
    if (icon) icon.textContent = '▾';
  } else {
    el.style.display = 'none';
    if (icon) icon.textContent = '▸';
  }
}

function toggleSidebarImmeubles() {
  const el = document.getElementById('sidebar-immeubles');
  const icon = document.getElementById('imm-toggle-icon');
  if (!el) return;
  if (el.style.display === 'none') {
    el.style.display = '';
    if (icon) icon.textContent = '▾';
  } else {
    el.style.display = 'none';
    if (icon) icon.textContent = '▸';
  }
}

function getAlertLabel(l) {
  if (!l || l.reste <= 0) return '';
  const mois = l.loyer > 0 ? l.reste / l.loyer : 0;
  if (mois >= 10) return '🔴 À déguerpir';
  if (mois >= 5)  return '🟠 Cas critique';
  if (mois >= 2)  return '🟡 À surveiller';
  return '';
}

// Group payments by locataire+date+type - sum montants for rapport
function groupPayments(pays) {
  const groups = {};
  pays.forEach(p => {
    const key = p.locId + '_' + p.date + '_' + p.type;
    if (!groups[key]) {
      groups[key] = { ...p, montant: 0 };
    }
    groups[key].montant += p.montant;
    // Keep most recent note
    if (p.note && p.note !== 'Paiement groupé') {
      groups[key].note = p.note;
    }
  });
  return Object.values(groups).sort((a,b) => a.date.localeCompare(b.date));
}

// ============================================================
// CORBEILLE LOCATAIRES
// ============================================================

// ── Étape 4 : helpers blocage/réactivation automatique ──────────────────────
function _bloquerUserParTel(tel) {
  if (!tel) return;
  var tc = tel.replace(/[^0-9]/g,'');
  // Bloquer dans USERS (mode entreprise)
  USERS.forEach(function(u) {
    if (u.tel && u.tel.replace(/[^0-9]/g,'') === tc) u.actif = false;
  });
  saveUsers();
  // Bloquer aussi dans DATA.locataires (mode individuel — connexion lit DATA directement)
  DATA.locataires.forEach(function(l) {
    if (l.tel && l.tel.replace(/[^0-9]/g,'') === tc) l.actif = false;
  });
}
function _debloquerUserParTel(tel) {
  if (!tel) return;
  var tc = tel.replace(/[^0-9]/g,'');
  USERS.forEach(function(u) {
    if (u.tel && u.tel.replace(/[^0-9]/g,'') === tc) u.actif = true;
  });
  saveUsers();
  DATA.locataires.forEach(function(l) {
    if (l.tel && l.tel.replace(/[^0-9]/g,'') === tc) l.actif = true;
  });
}
function _majActifProprietaire(immId) {
  // Bloquer/débloquer proprio dans USERS si plus aucun immeuble actif
  USERS.forEach(function(u) {
    if (u.role !== 'proprietaire' || !u.immeubles) return;
    var hasActive = u.immeubles.some(function(id) {
      return DATA.immeubles.some(function(im) { return im.id === id; });
    });
    u.actif = hasActive;
  });
  saveUsers();
}

async function supprimerLocataire(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l || l.s === 'libre') return;
  if (!confirm('Supprimer ' + l.nom + ' ?\nIl ira dans la corbeille pendant 30 jours.')) return;
  
  // Move to trash
  if (!DATA.corbeille) DATA.corbeille = [];
  DATA.corbeille.push({
    ...l,
    _deletedAt: new Date().toISOString(),
    _paiements: DATA.paiements.filter(p => p.locId === locId)
  });
  // Sync Supabase corbeille
  var _paiesLoc = DATA.paiements.filter(function(p){return p.locId===locId;});
  await mettreEnCorbeilleSupabase(l, _paiesLoc);
  
  // Reset local to libre
  const idx = DATA.locataires.findIndex(x => x.id === locId);
  if (idx >= 0) {
    DATA.locataires[idx] = {
      id: locId, iid: l.iid, appt: l.appt,
      type: l.type || 'appartement',
      nom: '(Libre)', tel: '', loyer: l.loyer,
      reste: 0, caution: 0, entree: '', obs: '',
      s: 'libre', jourPaiement: 1,
    };
  }
  
  // Remove payments from active data (kept in corbeille)
  DATA.paiements = DATA.paiements.filter(p => p.locId !== locId);
  
  // Étape 4 : bloquer le compte locataire
  if (l.tel) _bloquerUserParTel(l.tel);

  // Update corbeille badge
  updateCorbeilleBadge();
  updateArchivesBadge();
  saveData();
  renderCurrent();
  showToast(l.nom + ' déplacé dans la corbeille 🗑️');
}

function restaurerDepuisCorbeille(locId) {
  if (!DATA.corbeille) return;
  const idx = DATA.corbeille.findIndex(x => x.id === locId);
  if (idx <0) return;
  const l = DATA.corbeille[idx];
  
  // Restore locataire
  const locIdx = DATA.locataires.findIndex(x => x.id === locId);
  const { _deletedAt, _paiements, ...locData } = l;
  if (locIdx >= 0) {
    DATA.locataires[locIdx] = locData;
  } else {
    DATA.locataires.push(locData);
  }
  
  // Restore payments
  if (_paiements && _paiements.length) {
    // Remove any duplicate payments first
    DATA.paiements = DATA.paiements.filter(p => p.locId !== locId);
    DATA.paiements.push(..._paiements);
  }
  
  // Remove from corbeille
  DATA.corbeille.splice(idx, 1);
  
  // Étape 4 : réactiver le compte locataire
  if (locData.tel) _debloquerUserParTel(locData.tel);

  updateCorbeilleBadge();
  updateArchivesBadge();
  saveData();
  renderCurrent();
  showToast(locData.nom + ' restauré ✓', 'green');
}

async function viderCorbeille() {
  if (!DATA.corbeille || DATA.corbeille.length === 0) {
    showToast('La corbeille est déjà vide');
    return;
  }
  if (!confirm('Vider définitivement la corbeille ? Ces locataires seront archivés définitivement.')) return;
  // Archiver tous les éléments restants avant de vider
  if (!DATA.archivesPermanentes) DATA.archivesPermanentes = [];
  for (const l of DATA.corbeille) {
    DATA.archivesPermanentes.push({ ...l, _archivedAt: new Date().toISOString() });
    await archiverLocataireSupabase(l, l.motif || "suppression_manuelle", l._paiements || []);
    await retirerDeCorbeilleSupabase(l.id);
  }
  DATA.corbeille = [];
  updateCorbeilleBadge();
  saveData();
  renderCurrent();
  showToast('Corbeille vidée — ' + DATA.archivesPermanentes.length + ' archive(s) permanente(s) ✓');
}

function viderArchivesPermanentes() {
  const n = (DATA.archivesPermanentes || []).length;
  if (n === 0) { showToast('Aucune archive permanente'); return; }
  if (!confirm('Supprimer définitivement ' + n + ' archive(s) permanente(s) ? Cette action est IRRÉVERSIBLE.')) return;
  DATA.archivesPermanentes = [];
  saveData();
  renderCorbeille();
  showToast('Archives permanentes supprimées ✓');
}

async function purgerCorbeilleAuto() {
  if (!DATA.corbeille) return;
  if (!DATA.archivesPermanentes) DATA.archivesPermanentes = [];
  const now = new Date();
  const before = DATA.corbeille.length;
  const aArchiver = [];
  DATA.corbeille = DATA.corbeille.filter(l => {
    const deleted = new Date(l._deletedAt);
    const jours = (now - deleted) / (1000 * 60 * 60 * 24);
    if (jours >= 30) { aArchiver.push(l); return false; }
    return true;
  });
  if (aArchiver.length > 0) {
    for (const l of aArchiver) {
      DATA.archivesPermanentes.push({
        ...l,
        _archivedAt: new Date().toISOString()
      });
      await archiverLocataireSupabase(l, "auto_30_jours", l._paiements || []);
      await retirerDeCorbeilleSupabase(l.id);
    }
    saveData();
    console.log(aArchiver.length + ' locataire(s) archivé(s) définitivement depuis la corbeille');
  }
}

function updateArchivesBadge() {
  const badge = document.getElementById('badge-archives');
  if (!badge) return;
  const count = (DATA.archives || []).length + (DATA.corbeilleImmeubles || []).length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function updateCorbeilleBadge() {
  const badge = document.getElementById('badge-corbeille');
  if (!badge) return;
  const count = (DATA.corbeille || []).length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function renderArchives() {
  document.getElementById('page-title').textContent = 'Archives';
  document.getElementById('page-sub').textContent = 'Dossiers permanents — locataires libérés, immeubles retirés, historiques';
  var _tbtn = document.getElementById('topbar-main-btn');
  if (_tbtn) { _tbtn.style.display='flex'; _tbtn.textContent='← Tableau de bord'; _tbtn.onclick=function(){navigate('dashboard');}; }

  // Onglet actif (locataires / immeubles / permanentes)
  if (!window._archivesTab) window._archivesTab = 'locataires';

  const tab = window._archivesTab;
  const archives   = DATA.archives || [];
  const corbImm    = DATA.corbeilleImmeubles || [];
  const permanentes = DATA.archivesPermanentes || [];

  // ── Barre de recherche + onglets ──
  let html = `<div style="margin-bottom:14px;">
    <input type="text" id="search-archives" placeholder="🔍 Rechercher nom, immeuble, motif..." oninput="_filterArchives()" style="width:100%;padding:9px 16px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);box-sizing:border-box;">
  </div>
  <div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:0;">
    <button onclick="window._archivesTab='locataires';renderArchives();" style="padding:7px 16px;border:none;border-radius:8px 8px 0 0;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:600;background:${tab==='locataires'?'var(--primary)':'transparent'};color:${tab==='locataires'?'#fff':'var(--text2)'};border-bottom:${tab==='locataires'?'2px solid var(--primary)':'none'};">
      👤 Locataires libérés <span style="background:${tab==='locataires'?'rgba(255,255,255,0.25)':'var(--bg3)'};padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">${archives.length}</span>
    </button>
    <button onclick="window._archivesTab='immeubles';renderArchives();" style="padding:7px 16px;border:none;border-radius:8px 8px 0 0;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:600;background:${tab==='immeubles'?'var(--primary)':'transparent'};color:${tab==='immeubles'?'#fff':'var(--text2)'};border-bottom:${tab==='immeubles'?'2px solid var(--primary)':'none'};">
      🏢 Immeubles retirés <span style="background:${tab==='immeubles'?'rgba(255,255,255,0.25)':'var(--bg3)'};padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">${corbImm.length}</span>
    </button>
    <button onclick="window._archivesTab='permanentes';renderArchives();" style="padding:7px 16px;border:none;border-radius:8px 8px 0 0;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:600;background:${tab==='permanentes'?'var(--primary)':'transparent'};color:${tab==='permanentes'?'#fff':'var(--text2)'};border-bottom:${tab==='permanentes'?'2px solid var(--primary)':'none'};">
      🗄️ Archives permanentes <span style="background:${tab==='permanentes'?'rgba(255,255,255,0.25)':'var(--bg3)'};padding:1px 7px;border-radius:99px;font-size:11px;margin-left:4px;">${permanentes.length}</span>
    </button>
  </div>`;

  // ══════════════════════════════════════════════
  // ONGLET 1 — LOCATAIRES LIBÉRÉS
  // ══════════════════════════════════════════════
  if (tab === 'locataires') {
    if (archives.length === 0) {
      html += `<div class="empty"><div class="empty-icon">📂</div><div class="empty-text">Aucun locataire archivé</div></div>`;
    } else {
      html += `<div class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr>
          <th>Nom</th><th>Immeuble</th><th>Local</th><th>Loyer</th>
          <th>Entrée</th><th>Sortie</th><th>Solde départ</th><th>Motif</th><th>Actions</th>
        </tr></thead><tbody>`;

      archives.slice().sort((a,b)=>(b.dateArchivage||'').localeCompare(a.dateArchivage||'')).forEach(a => {
        const im = DATA.immeubles.find(i => i.id === a.iid);
        const imNom = im ? im.nom : '–';
        const searchData = (a.nom + ' ' + imNom + ' ' + (a.motif||'') + ' ' + (a.appt||'')).toLowerCase();
        const solde = a.soldeFinal || 0;
        const soldeColor = solde > 0 ? 'var(--red)' : solde < 0 ? 'var(--green)' : 'var(--text3)';
        const nbPay = (a.paiements || []).length;
        html += `<tr class="arch-loc-row" data-search="${searchData}">
          <td style="font-weight:600;">${a.nom}</td>
          <td style="font-size:12px;">${im ? `<span style="color:${im.col};">●</span> ${imNom}` : '–'}</td>
          <td>${localBadge(a.appt)}</td>
          <td class="td-amount">${fmt(a.loyer||0)}</td>
          <td style="font-size:11px;color:var(--text3);">${a.entree ? a.entree.split('-').reverse().join('/') : '–'}</td>
          <td style="font-size:11px;color:var(--text3);">${a.dateSortie ? a.dateSortie.split('-').reverse().join('/') : '–'}</td>
          <td style="font-weight:600;color:${soldeColor};">${solde !== 0 ? fmt(Math.abs(solde)) + (solde>0?' dû':' avoir') : '–'}</td>
          <td style="font-size:11px;color:var(--text3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${a.motif||''}">${a.motif||'–'}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-sm" onclick="voirHistoriqueArchive(${a.archiveId})" title="${nbPay} paiement(s)">📋 Historique</button>
            <button class="btn btn-primary btn-sm" onclick="reaffecterLocataireArchive(${a.archiveId})">↩ Réaffecter</button>
          </td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    }
  }

  // ══════════════════════════════════════════════
  // ONGLET 2 — IMMEUBLES RETIRÉS
  // ══════════════════════════════════════════════
  else if (tab === 'immeubles') {
    if (corbImm.length === 0) {
      html += `<div class="empty"><div class="empty-icon">🏢</div><div class="empty-text">Aucun immeuble retiré</div></div>`;
    } else {
      html += `<div class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr>
          <th>Immeuble</th><th>Adresse</th><th>Propriétaire</th><th>Locataires</th>
          <th>Retiré le</th><th>Actions</th>
        </tr></thead><tbody>`;

      corbImm.slice().sort((a,b)=>(b._deletedAt||'').localeCompare(a._deletedAt||'')).forEach(im => {
        const { _deletedAt, _locataires } = im;
        const nbLoc = (_locataires||[]).length;
        const searchData = (im.nom + ' ' + (im.adresse||'') + ' ' + (im.proprio||'')).toLowerCase();
        html += `<tr class="arch-imm-row" data-search="${searchData}">
          <td style="font-weight:600;"><span style="color:${im.col||'var(--primary)'};">●</span> ${im.nom}</td>
          <td style="font-size:12px;color:var(--text3);">${im.adresse||'–'}</td>
          <td style="font-size:12px;">${im.proprio||'–'}</td>
          <td style="font-size:12px;color:var(--text3);">${nbLoc > 0 ? nbLoc + ' locataire(s) sauvegardé(s)' : '–'}</td>
          <td style="font-size:11px;color:var(--text3);">${_deletedAt ? new Date(_deletedAt).toLocaleDateString('fr-FR') : '–'}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="restaurerImmeuble(${im.id})">↩ Restaurer</button>
          </td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    }
  }

  // ══════════════════════════════════════════════
  // ONGLET 3 — ARCHIVES PERMANENTES (ex-corbeille >30j)
  // ══════════════════════════════════════════════
  else if (tab === 'permanentes') {
    if (permanentes.length === 0) {
      html += `<div class="empty"><div class="empty-icon">🗄️</div><div class="empty-text">Aucune archive permanente</div></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">Historique permanent des locataires. Le score de fiabilité est calculé sur la base des paiements et incidents.</div>`;
      html += `<div class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr>
          <th>Nom</th><th>Immeuble</th><th>Local</th><th>Loyer</th>
          <th>Score</th><th>Supprimé le</th><th>Archivé le</th>
        </tr></thead><tbody>`;

      permanentes.slice().sort((a,b)=>(b._archivedAt||'').localeCompare(a._archivedAt||'')).forEach(l => {
        const im = DATA.immeubles.find(i => i.id === l.iid);
        const searchData = (l.nom + ' ' + (im?im.nom:'') + ' ' + (l.appt||'')).toLowerCase();
        const scoreHtml = typeof getScoreDisplay === 'function'
          ? getScoreDisplay(l.score || 100)
          : (l.score || 100) + '/100';
        html += `<tr class="arch-perm-row" data-search="${searchData}">
          <td style="font-weight:600;">${l.nom}</td>
          <td style="font-size:12px;">${im ? `<span style="color:${im.col};">●</span> ${im.nom}` : '–'}</td>
          <td>${localBadge(l.appt)}</td>
          <td class="td-amount">${fmt(l.loyer||0)}</td>
          <td style="font-size:12px;text-align:center;">${scoreHtml}</td>
          <td style="font-size:11px;color:var(--text3);">${l._deletedAt ? new Date(l._deletedAt).toLocaleDateString('fr-FR') : '–'}</td>
          <td style="font-size:11px;color:var(--text3);">${l._archivedAt ? new Date(l._archivedAt).toLocaleDateString('fr-FR') : '–'}</td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    }
  }

  document.getElementById('content').innerHTML = html;
}

function _filterArchives() {
  var q = (document.getElementById('search-archives').value || '').toLowerCase().trim();
  ['arch-loc-row','arch-imm-row','arch-perm-row'].forEach(function(cls) {
    document.querySelectorAll('tr.' + cls + '[data-search]').forEach(function(row) {
      row.style.display = !q || row.dataset.search.indexOf(q) >= 0 ? '' : 'none';
    });
  });
}

function voirHistoriqueArchive(archiveId) {
  const a = (DATA.archives || []).find(x => x.archiveId === archiveId);
  if (!a) { showToast('Archive introuvable', 'red'); return; }
  const pays = a.paiements || [];
  const im = DATA.immeubles.find(i => i.id === a.iid);
  const total = pays.filter(p=>p.type!=='caution').reduce((s,p)=>s+p.montant,0);

  let html = `<div style="margin-bottom:12px;">
    <div style="font-size:15px;font-weight:700;margin-bottom:2px;">${a.nom}</div>
    <div style="font-size:12px;color:var(--text3);">${im?im.nom:'–'} · Local ${a.appt||'–'} · Entrée ${a.entree?a.entree.split('-').reverse().join('/'):'–'} → Sortie ${a.dateSortie?a.dateSortie.split('-').reverse().join('/'):'–'}</div>
    <div style="font-size:12px;margin-top:4px;">Total encaissé : <strong style="color:var(--green);">${fmt(total)}</strong> · ${pays.length} versement(s)</div>
    ${a.motif ? `<div style="font-size:12px;color:var(--text3);margin-top:2px;">Motif départ : ${a.motif}</div>` : ''}
    ${a.obsDepart ? `<div style="font-size:12px;color:var(--text3);margin-top:2px;">Obs : ${a.obsDepart}</div>` : ''}
    ${(a.soldeFinal||0) !== 0 ? `<div style="font-size:12px;margin-top:2px;color:${a.soldeFinal>0?'var(--red)':'var(--green)'};">Solde départ : ${fmt(Math.abs(a.soldeFinal))} ${a.soldeFinal>0?'dû par le locataire':'à rembourser'}</div>` : ''}
  </div>`;

  if (pays.length === 0) {
    html += `<div style="color:var(--text3);font-size:13px;">Aucun paiement enregistré.</div>`;
  } else {
    html += `<div style="max-height:340px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:var(--bg3);">
        <th style="padding:6px 8px;text-align:left;">Date</th>
        <th style="padding:6px 8px;text-align:left;">Mois concerné</th>
        <th style="padding:6px 8px;text-align:left;">Type</th>
        <th style="padding:6px 8px;text-align:right;">Montant</th>
        <th style="padding:6px 8px;text-align:left;">Note</th>
      </tr></thead><tbody>`;
    pays.slice().sort((a,b)=>b.date.localeCompare(a.date)).forEach(p => {
      html += `<tr style="border-bottom:1px solid var(--border);">
        <td style="padding:5px 8px;font-family:var(--mono);">${p.date.split('-').reverse().join('/')}</td>
        <td style="padding:5px 8px;">${MNOMS[p.moisC]||''} ${p.anneeC||''}</td>
        <td style="padding:5px 8px;"><span class="badge ${p.type==='caution'?'badge-purple':p.type==='loyer'?'badge-green':'badge-neutral'}">${p.type}</span></td>
        <td style="padding:5px 8px;text-align:right;font-weight:600;color:var(--green);">${fmt(p.montant)}</td>
        <td style="padding:5px 8px;color:var(--text3);">${p.note||'–'}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }

  // Afficher dans modal générique
  document.getElementById('preview-modal-title').textContent = 'Historique — ' + a.nom;
  document.getElementById('preview-modal-body').innerHTML = html;
  document.getElementById('preview-modal-dl').style.display = 'none';
  document.getElementById('modal-preview').style.display = 'flex';
}

function reaffecterLocataireArchive(archiveId) {
  const a = (DATA.archives || []).find(x => x.archiveId === archiveId);
  if (!a) { showToast('Archive introuvable', 'red'); return; }

  // Trouver tous les locaux libres disponibles
  const libres = DATA.locataires.filter(l => l.s === 'libre');
  if (libres.length === 0) {
    showToast('Aucun local libre disponible', 'red');
    return;
  }

  // Construire la liste des locaux libres
  let choix = 'Choisir un local libre pour ' + a.nom + ' :\n\n';
  libres.forEach((l, i) => {
    const im = DATA.immeubles.find(x => x.id === l.iid);
    choix += (i+1) + '. ' + (im?im.nom:'?') + ' — Local ' + (l.appt||'?') + ' (Loyer actuel: ' + fmt(l.loyer) + ')\n';
  });
  const rep = prompt(choix + '\nEntrez le numéro du local :');
  if (!rep) return;
  const idx = parseInt(rep) - 1;
  if (isNaN(idx) || idx < 0 || idx >= libres.length) {
    showToast('Numéro invalide', 'red');
    return;
  }

  const local = libres[idx];
  const locIdx = DATA.locataires.findIndex(x => x.id === local.id);
  if (locIdx < 0) return;

  // Réaffecter le locataire dans le local choisi
  DATA.locataires[locIdx] = {
    ...DATA.locataires[locIdx],
    nom:    a.nom,
    tel:    a.tel || '',
    loyer:  a.loyer || local.loyer,
    reste:  0,
    caution: 0,
    s:      'payé',
    entree: new Date().toISOString().split('T')[0],
    obs:    'Réaffecté depuis archives le ' + new Date().toLocaleDateString('fr-FR'),
    jourPaiement: a.jourPaiement || 1,
  };

  // Conserver l'archive (ne pas la supprimer — historique permanent)
  const im = DATA.immeubles.find(x => x.id === local.iid);
  saveData();
  updateArchivesBadge();
  showToast(a.nom + ' réaffecté dans ' + (im?im.nom:'le local') + ' ✓', 'green');
  renderArchives();
}


// ╔══════════════════════════════════════════════════════════════╗
// ║         BIBLIOTHÈQUE JURIDIQUE — ImmoGest                   ║
// ║  Textes de référence : droit immobilier camerounais         ║
// ╚══════════════════════════════════════════════════════════════╝

const BIBLIOTHEQUE = [
  {
    id: 'code-civil',
    titre: 'Code Civil — Bail & Locations',
    icone: '⚖️',
    couleur: '#0E6AAF',
    description: 'Dispositions relatives au contrat de bail, obligations du bailleur et du preneur.',
    articles: [
      { ref: 'Art. 1709', titre: 'Définition du louage', texte: "Le louage des choses est un contrat par lequel l'une des parties s'oblige à faire jouir l'autre d'une chose pendant un certain temps, et moyennant un certain prix que celle-ci s'oblige de lui payer." },
      { ref: 'Art. 1710', titre: 'Louage d\'immeubles', texte: "Le louage des maisons et celui des biens meubles est ordinairement désigné sous le nom de loyer ; le louage des maisons à usage d'habitation est soumis aux dispositions du présent code." },
      { ref: 'Art. 1719', titre: 'Obligations du bailleur', texte: "Le bailleur est obligé, par la nature du contrat, et sans qu'il soit besoin d'aucune stipulation particulière : 1° De délivrer au preneur la chose louée ; 2° D'entretenir cette chose en état de servir à l'usage pour lequel elle a été louée ; 3° D'en faire jouir paisiblement le preneur pendant la durée du bail ; 4° D'assurer également la permanence et la qualité des plantations." },
      { ref: 'Art. 1720', titre: 'Délivrance en bon état', texte: "Le bailleur est tenu de délivrer la chose en bon état de réparations de toute espèce. Il doit y faire, pendant la durée du bail, toutes les réparations qui peuvent devenir nécessaires, autres que les locatives." },
      { ref: 'Art. 1728', titre: 'Obligations du preneur', texte: "Le preneur est tenu de deux obligations principales : 1° D'user de la chose louée en bon père de famille, et suivant la destination qui lui a été donnée par le bail, ou suivant celle présumée d'après les circonstances, à défaut de convention ; 2° De payer le prix du bail aux termes convenus." },
      { ref: 'Art. 1730', titre: 'État des lieux', texte: "S'il a été fait un état des lieux entre le bailleur et le preneur, celui-ci doit rendre la chose telle qu'il l'a reçue, suivant cet état, excepté ce qui a péri ou a été dégradé par vétusté ou force majeure." },
      { ref: 'Art. 1732', titre: 'Dégradations', texte: "Il répond des dégradations ou des pertes qui arrivent pendant sa jouissance, à moins qu'il ne prouve qu'elles ont eu lieu sans sa faute." },
      { ref: 'Art. 1733', titre: 'Incendie', texte: "Il répond de l'incendie, à moins qu'il ne prouve que l'incendie est arrivé par cas fortuit ou force majeure, ou par vice de construction, ou que le feu a été communiqué par une maison voisine." },
      { ref: 'Art. 1736', titre: 'Durée du congé', texte: "Si le bail a été fait sans écrit, l'une des parties ne pourra donner congé à l'autre qu'en observant les délais fixés par l'usage des lieux." },
      { ref: 'Art. 1741', titre: 'Résiliation du bail', texte: "Le contrat de louage se résout par la perte de la chose louée, et par le défaut respectif du bailleur et du preneur de remplir leurs engagements." },
      { ref: 'Art. 1752', titre: 'Loyers arriérés', texte: "Le bailleur a un droit de préférence sur les meubles garnissant les lieux loués pour le paiement des loyers arriérés." },
      { ref: 'Art. 1755', titre: 'Réparations locatives', texte: "Aucune des réparations réputées locatives n'est à la charge des locataires quand elles ne sont occasionnées que par vétusté ou force majeure." },
    ]
  },
  {
    id: 'code-penal',
    titre: 'Code Pénal Camerounais',
    icone: '🔒',
    couleur: '#C0392B',
    description: 'Articles applicables aux litiges immobiliers : impayés, violations, voies de fait.',
    articles: [
      { ref: 'Art. 74', titre: 'Élément intentionnel (obligatoire)', texte: "Sauf disposition contraire de la loi, nul ne peut être puni pour un fait prévu par la loi comme infraction s'il n'a pas agi intentionnellement. L'intention coupable résulte de la conscience qu'avait l'agent de la nature et des conséquences de son acte. IMPORTANT : Cet article doit être cité dans toute plainte pénale pour établir l'élément moral de l'infraction." },
      { ref: 'Art. 279', titre: 'Coups et blessures graves (> 30 jours ITT)', texte: "Est puni d'un emprisonnement de 6 ans à 10 ans et d'une amende de 100 000 à 1 000 000 francs, quiconque par coups, violences ou voies de fait cause à autrui une incapacité de travail supérieure à trente jours." },
      { ref: 'Art. 280', titre: 'Coups et blessures simples (8 à 30 jours)', texte: "Est puni d'un emprisonnement de 1 an à 5 ans et d'une amende de 50 000 à 500 000 francs, quiconque par coups, violences ou voies de fait cause à autrui une incapacité de travail de 8 à 30 jours." },
      { ref: 'Art. 281', titre: 'Coups et blessures légers (< 8 jours)', texte: "Est puni d'un emprisonnement de 10 jours à 1 an et d'une amende de 25 000 à 100 000 francs, quiconque par coups, violences ou voies de fait cause à autrui une incapacité de travail inférieure à 8 jours ou ne causant aucune incapacité de travail." },
      { ref: 'Art. 284', titre: 'Menaces verbales', texte: "Est puni d'un emprisonnement de 15 jours à 3 ans et d'une amende de 5 000 à 500 000 francs, quiconque menace autrui de voies de fait ou de violences de nature à troubler sa tranquillité." },
      { ref: 'Art. 305', titre: 'Diffamation', texte: "Est puni d'un emprisonnement de 10 jours à 6 mois et d'une amende de 20 000 à 500 000 francs, ou de l'une de ces deux peines seulement, quiconque impute à un tiers un fait précis de nature à porter atteinte à son honneur ou à sa considération." },
      { ref: 'Art. 318', titre: 'Abus de confiance', texte: "Est puni d'un emprisonnement de 1 an à 10 ans et d'une amende de 100 000 à 2 000 000 francs, quiconque, ayant reçu à charge de les rendre, représenter ou faire un emploi déterminé, des fonds, valeurs, objets quelconques ou tous effets mobiliers détourne ces fonds, valeurs, objets ou effets au préjudice d'autrui." },
      { ref: 'Art. 318-1', titre: 'Filouterie (loyers, services)', texte: "Est puni d'un emprisonnement de 10 jours à 2 ans et d'une amende de 20 000 à 300 000 francs, quiconque, sachant qu'il est hors d'état de payer, se fait servir des repas, se fait fournir des logements, ou se fait délivrer des marchandises, en sachant qu'il ne pourra les payer. S'applique notamment à la filouterie de loyer (occupation sans paiement)." },
      { ref: 'Art. 319', titre: 'Escroquerie', texte: "Est puni d'un emprisonnement de 1 an à 10 ans et d'une amende de 100 000 à 3 000 000 francs, quiconque, par usage d'un faux nom, d'une fausse qualité, par des manœuvres frauduleuses, abuse de la confiance d'une personne pour se faire remettre des fonds, des valeurs, un bien quelconque." },
      { ref: 'Art. 358', titre: 'Abandon du domicile conjugal', texte: "Est puni d'un emprisonnement de 1 mois à 1 an et d'une amende, l'époux ou l'épouse qui, sans motif légitime, abandonne le domicile conjugal. Applicable en cas de départ du logement familial sans accord." },
      { ref: 'Art. 358-1', titre: 'Expulsion du domicile conjugal', texte: "Est puni d'un emprisonnement de 3 mois à 2 ans et d'une amende de 50 000 à 500 000 francs, quiconque expulse ou contraint son conjoint à quitter le domicile conjugal, sauf décision de justice." },
      { ref: 'Art. 361', titre: 'Adultère', texte: "Est punie d'un emprisonnement de 2 mois à 2 ans, la femme convaincue d'adultère. Est puni des mêmes peines, le complice de la femme adultère." },
      { ref: 'Art. 228', titre: 'Violation de domicile', texte: "Est puni d'un emprisonnement de 15 jours à 1 an et d'une amende de 5 000 à 200 000 francs, quiconque s'introduit ou se maintient dans le domicile d'autrui contre le gré de celui qui l'occupe légitimement, même s'il y a droit de propriété." },
    ]
  },
  {
    id: 'ordonnance-74',
    titre: 'Ord. n°74-1 du 06/07/1974 — Régime foncier',
    icone: '🏛️',
    couleur: '#7D3C98',
    description: 'Régime foncier et domanial du Cameroun. Fondement de toute propriété immobilière.',
    articles: [
      { ref: 'Art. 1', titre: 'Domaine national', texte: "Les terres du Cameroun font partie soit du domaine public, soit du domaine privé de l'État ou des collectivités publiques, soit du patrimoine des particuliers. Les terres qui ne font pas l'objet d'une appropriation privée constituent le domaine national." },
      { ref: 'Art. 2', titre: 'Domaine public', texte: "Le domaine public est constitué des biens qui sont affectés à l'usage du public ou à un service public et qui sont par nature ou par détermination de la loi insusceptibles d'appropriation privée." },
      { ref: 'Art. 8', titre: 'Titre foncier', texte: "La propriété foncière est établie et prouvée par le titre foncier qui est l'acte authentique constatant les droits réels immobiliers d'une personne sur un immeuble. Le titre foncier est inattaquable, intransférable et définitif." },
      { ref: 'Art. 17', titre: 'Immatriculation obligatoire', texte: "Toute mutation de propriété immobilière doit faire l'objet d'une immatriculation au livre foncier. Aucun acte translatif de propriété n'est opposable aux tiers s'il n'a pas été préalablement inscrit au livre foncier." },
      { ref: 'Art. 29', titre: 'Droits coutumiers', texte: "Les droits coutumiers exercés collectivement ou individuellement sur les terres des particuliers sont maintenus dans les conditions fixées par les textes particuliers. Toutefois, ils ne peuvent en aucun cas être invoqués à l'encontre des droits reconnus par les textes en vigueur." },
    ]
  },
  {
    id: 'loi-2019-019',
    titre: 'Loi n°2019/019 — Copropriété',
    icone: '🏢',
    couleur: '#1A6B45',
    description: 'Statut de la copropriété des immeubles bâtis au Cameroun.',
    articles: [
      { ref: 'Art. 1', titre: 'Champ d\'application', texte: "La présente loi régit les immeubles bâtis ou groupes d'immeubles bâtis dont la propriété est répartie entre plusieurs personnes par lots comprenant chacun une partie privative et une quote-part de parties communes." },
      { ref: 'Art. 5', titre: 'Parties communes', texte: "Les parties communes sont les parties des bâtiments et des terrains affectées à l'usage ou à l'utilité de tous les copropriétaires ou de plusieurs d'entre eux. Elles comprennent notamment : le sol, les cours, parcs et jardins, les voies d'accès, le gros œuvre des bâtiments, les éléments d'équipement commun." },
      { ref: 'Art. 10', titre: 'Règlement de copropriété', texte: "Un règlement de copropriété fixe la destination des parties privatives et communes ainsi que les conditions de leur jouissance. Il détermine les règles relatives à l'administration des parties communes et précise la quote-part des charges communes afférente à chaque lot." },
      { ref: 'Art. 14', titre: 'Syndicat des copropriétaires', texte: "Les copropriétaires constituent un syndicat doté de la personnalité civile. Il a pour objet la conservation de l'immeuble et l'administration des parties communes. Le syndicat peut agir en justice tant en demande qu'en défense, même contre certains des copropriétaires." },
      { ref: 'Art. 22', titre: 'Charges communes', texte: "Chaque copropriétaire est tenu de participer aux charges communes générales relatives à la conservation, à l'entretien et à l'administration des parties communes, proportionnellement aux valeurs relatives des parties privatives comprises dans son lot." },
    ]
  },
  {
    id: 'decret-2008',
    titre: 'Décret n°2008/0738 — Normes habitat',
    icone: '📐',
    couleur: '#E67E22',
    description: 'Normes de construction et d\'habitabilité des logements au Cameroun.',
    articles: [
      { ref: 'Art. 3', titre: 'Surface minimale', texte: "Tout logement à usage d'habitation doit avoir une superficie habitable minimale de 9 m² pour une pièce unique, et de 7 m² pour chaque pièce supplémentaire. La hauteur sous plafond ne peut être inférieure à 2,40 mètres." },
      { ref: 'Art. 5', titre: 'Aération et éclairage', texte: "Tout logement doit disposer d'une aération naturelle suffisante. Chaque pièce habitable doit comporter au moins une fenêtre donnant sur l'extérieur, d'une surface vitrée égale au moins au dixième de la superficie du plancher." },
      { ref: 'Art. 8', titre: 'Salubrité', texte: "Les logements doivent être construits sur des terrains non inondables et être protégés contre les remontées d'humidité. Les planchers du rez-de-chaussée doivent être imperméables et surélevés d'au moins 20 cm au-dessus du sol naturel." },
      { ref: 'Art. 12', titre: 'Installations sanitaires', texte: "Tout logement doit comporter des installations sanitaires comprenant au minimum : un cabinet d'aisances avec cuvette, une douche ou baignoire, un lavabo. Ces installations doivent être raccordées à un réseau d'assainissement ou à une fosse septique réglementaire." },
    ]
  },
  {
    id: 'procedures',
    titre: 'Procédures & Voies de recours',
    icone: '📋',
    couleur: '#2C3E50',
    description: 'Guide pratique des recours juridiques disponibles pour le gestionnaire immobilier.',
    articles: [
      { ref: 'Proc. 1', titre: 'Mise en demeure (loyers impayés)', texte: "Étapes : (1) Rédiger une mise en demeure par lettre recommandée avec AR. (2) Délai de réponse : 8 à 15 jours. (3) En cas d'échec : saisir le tribunal de grande instance compétent. (4) Demander une ordonnance d'expulsion ou une injonction de payer. Pièces requises : contrat de bail, relevé des impayés, copies des quittances, lettre de mise en demeure." },
      { ref: 'Proc. 2', titre: 'Injonction de payer', texte: "Procédure simplifiée et rapide pour recouvrer des créances certaines, liquides et exigibles. Déposer une requête auprès du président du tribunal de première instance compétent. Le juge peut rendre une ordonnance d'injonction de payer sans audience contradictoire préalable. Le débiteur dispose de 15 jours pour former opposition." },
      { ref: 'Proc. 3', titre: 'Résiliation judiciaire du bail', texte: "En cas d'inexécution grave par le locataire (impayés répétés, dégradations, troubles de voisinage) : (1) Clause résolutoire du contrat de bail. (2) Saisine du tribunal de grande instance. (3) Demande de résiliation et d'expulsion. Délai moyen : 2 à 6 mois selon l'encombrement du tribunal." },
      { ref: 'Proc. 4', titre: 'Plainte pénale (filouterie de loyer)', texte: "Lorsque le locataire occupe les lieux en sachant qu'il ne peut payer (Art. 318-1 CP) : (1) Déposer une plainte pénale au commissariat ou à la gendarmerie. (2) Joindre : contrat de bail, état des loyers impayés, mise en demeure restée sans suite. (3) Citations des articles 74 et 318-1 du Code Pénal. (4) Se constituer partie civile pour obtenir réparation." },
      { ref: 'Proc. 5', titre: 'Caution — modalités de restitution', texte: "La caution doit être restituée dans un délai raisonnable après la remise des clés (en pratique 1 mois). Elle peut être retenue partiellement ou totalement en cas de : loyers impayés, dégradations constatées à l'état des lieux de sortie, charges non réglées. Tout litige sur la caution relève du tribunal de grande instance." },
      { ref: 'Proc. 6', titre: 'Dépôt de plainte — modèle SONGOUM', texte: "Format standard des plaintes pénales au Cameroun : (1) En-tête : Nom + ville/date alignés. (2) Destinataire centré en majuscules. (3) Objet à gauche. (4) Corps : paragraphes commençant par 'Que...'. (5) Demande intégrée dans le dernier 'Que...'. (6) Clôture : 'Profond respect' + signature droite. Références légales à citer : Art. 74 CP (intentionnel) + article spécifique de l'infraction." },
    ]
  }
];

// ── État de la bibliothèque ──
if (!window._biblio) window._biblio = { searchQ: '', openId: null, openArt: null };

function renderBibliotheque() {
  document.getElementById('page-title').textContent = 'Bibliothèque juridique';
  document.getElementById('page-sub').textContent = 'Textes de loi — droit immobilier camerounais';
  var btn = document.getElementById('topbar-main-btn');
  if (btn) { btn.style.display = 'flex'; btn.textContent = '← Tableau de bord'; btn.onclick = function(){ navigate('dashboard'); }; }

  var q = window._biblio.searchQ || '';

  var html = '<div style="margin-bottom:16px;">'
    + '<input type="text" id="search-biblio" placeholder="🔍 Rechercher un article, une loi, un mot-clé..." '
    + 'value="' + q.replace(/"/g,'&quot;') + '" '
    + 'oninput="window._biblio.searchQ=this.value;renderBibliotheque();" '
    + 'style="width:100%;padding:9px 16px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);box-sizing:border-box;">'
    + '</div>';

  var ql = q.toLowerCase();

  BIBLIOTHEQUE.forEach(function(cat) {
    // Filtrer les articles selon la recherche
    var arts = ql ? cat.articles.filter(function(a) {
      return a.ref.toLowerCase().includes(ql)
          || a.titre.toLowerCase().includes(ql)
          || a.texte.toLowerCase().includes(ql)
          || cat.titre.toLowerCase().includes(ql);
    }) : cat.articles;

    if (ql && arts.length === 0) return; // masquer catégorie vide

    var isOpen = window._biblio.openId === cat.id || ql.length > 0;

    html += '<div class="card" style="margin-bottom:12px;">';
    html += '<div class="card-header" style="cursor:pointer;user-select:none;" onclick="_biblioCatToggle(\'' + cat.id + '\')">';
    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '<span style="font-size:20px;">' + cat.icone + '</span>';
    html += '<div>';
    html += '<div class="card-title" style="color:' + cat.couleur + ';">' + cat.titre + '</div>';
    html += '<div style="font-size:11px;color:var(--text3);margin-top:2px;">' + cat.description + '</div>';
    html += '</div></div>';
    html += '<div style="font-size:12px;color:var(--text3);display:flex;align-items:center;gap:8px;">';
    html += '<span style="background:var(--bg3);padding:2px 8px;border-radius:99px;font-size:11px;">' + arts.length + ' article' + (arts.length>1?'s':'') + '</span>';
    html += '<span style="font-size:16px;">' + (isOpen ? '▲' : '▼') + '</span>';
    html += '</div></div>';

    if (isOpen) {
      html += '<div style="padding:0 4px 4px;">';
      arts.forEach(function(a) {
        var artKey = cat.id + '_' + a.ref;
        var artOpen = window._biblio.openArt === artKey;
        html += '<div style="border-bottom:1px solid var(--border);padding:0;">';
        html += '<div onclick="_biblioArtToggle(\'' + artKey + '\')" style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px;cursor:pointer;border-radius:6px;transition:background .15s;" onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<div style="display:flex;align-items:center;gap:10px;">';
        html += '<span style="font-size:11px;font-weight:700;color:' + cat.couleur + ';background:' + cat.couleur + '1a;padding:2px 8px;border-radius:4px;white-space:nowrap;font-family:var(--mono);">' + a.ref + '</span>';
        html += '<span style="font-size:13px;font-weight:600;color:var(--text);">' + _biblioHighlight(a.titre, ql) + '</span>';
        html += '</div>';
        html += '<span style="color:var(--text3);font-size:13px;">' + (artOpen ? '▲' : '▼') + '</span>';
        html += '</div>';

        if (artOpen) {
          html += '<div style="padding:10px 14px 14px;background:var(--bg3);border-radius:0 0 6px 6px;margin:0 4px 4px;">';
          html += '<p style="font-size:13px;line-height:1.75;color:var(--text2);margin:0 0 10px;">' + _biblioHighlight(a.texte, ql) + '</p>';
          html += '<button onclick="event.stopPropagation();_biblioCopier(\'' + cat.id + '\',\'' + a.ref + '\')" class="btn btn-ghost btn-sm" style="font-size:11px;">📋 Copier la référence</button>';
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
  });

  if (ql && html.indexOf('card-title') < 0) {
    html += '<div class="empty"><div class="empty-icon">📚</div><div class="empty-text">Aucun résultat pour "' + q + '"</div></div>';
  }

  document.getElementById('content').innerHTML = html;
  // Remettre le focus sur la recherche
  if (q) { var el = document.getElementById('search-biblio'); if(el) { el.focus(); el.setSelectionRange(q.length,q.length); } }
}

function _biblioCatToggle(catId) {
  window._biblio.openId = window._biblio.openId === catId ? null : catId;
  window._biblio.openArt = null;
  renderBibliotheque();
}

function _biblioArtToggle(artKey) {
  window._biblio.openArt = window._biblio.openArt === artKey ? null : artKey;
  renderBibliotheque();
}

function _biblioHighlight(text, q) {
  if (!q || q.length < 2) return text;
  var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
  return text.replace(re, '<mark style="background:#FFF3CD;border-radius:2px;padding:0 2px;">$1</mark>');
}

function _biblioCopier(catId, ref) {
  var cat = BIBLIOTHEQUE.find(function(c){ return c.id===catId; });
  if (!cat) return;
  var art = cat.articles.find(function(a){ return a.ref===ref; });
  if (!art) return;
  var txt = ref + ' (' + cat.titre.split('—')[0].trim() + ') — ' + art.titre + '\n' + art.texte;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(function(){ showToast('Référence copiée ✓','green'); });
  } else {
    var el = document.createElement('textarea');
    el.value = txt; document.body.appendChild(el); el.select();
    document.execCommand('copy'); document.body.removeChild(el);
    showToast('Référence copiée ✓','green');
  }
}

function renderCorbeille() {
  document.getElementById('page-title').textContent = 'Corbeille';
  document.getElementById('page-sub').textContent = 'Locataires supprimés — restauration possible sous 30 jours';
  document.getElementById('topbar-main-btn').style.display = 'none';
  
  const corbeille = DATA.corbeille || [];
  const now = new Date();
  
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div style="font-size:13px;color:var(--text3);">${corbeille.length} locataire(s) dans la corbeille</div>
    ${corbeille.length > 0 ? `<button class="btn btn-danger btn-sm" onclick="viderCorbeille()">🗑️ Vider la corbeille</button>` : ''}
  </div>`;
  
  if (corbeille.length > 0) {
    html += `<div style="margin-bottom:12px;">
      <input type="text" id="search-corbeille" placeholder="🔍 Rechercher dans la corbeille (nom, immeuble)..." oninput="_filterCorbeille()" style="width:100%;padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);background:var(--bg4);">
    </div>`;
  }
  
  if (corbeille.length === 0) {
    html += `<div class="empty"><div class="empty-icon">🗑️</div><div class="empty-text">La corbeille est vide</div></div>`;
  } else {
    html += `<div class="card"><div class="table-wrap"><table class="tbl">
      <thead><tr>
        <th>Nom</th><th>Immeuble</th><th>Local</th><th>Loyer</th>
        <th>Supprimé le</th><th>Jours restants</th><th>Actions</th>
      </tr></thead>
      <tbody>`;
    
    corbeille.forEach(l => {
      const im = DATA.immeubles.find(i => i.id === l.iid);
      const deleted = new Date(l._deletedAt);
      const joursEcoules = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
      const joursRestants = 30 - joursEcoules;
      const urgence = joursRestants <= 5 ? 'var(--red)' : joursRestants <= 10 ? 'var(--yellow)' : 'var(--text3)';
      
      html += `<tr class="corbeille-row" data-search="${(l.nom+' '+(im?im.nom:'')).toLowerCase()}">
        <td style="font-weight:600;">${l.nom}</td>
        <td>${im ? im.nom : '–'}</td>
        <td>${localBadge(l.appt)}</td>
        <td class="td-amount">${fmt(l.loyer)}</td>
        <td style="color:var(--text3);font-size:12px;">${deleted.toLocaleDateString('fr-FR')}</td>
        <td style="color:${urgence};font-weight:600;">${joursRestants}j</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="restaurerDepuisCorbeille(${l.id})">↩ Restaurer</button>
          <button class="btn btn-danger btn-sm" onclick="supprimerDefinitivement(${l.id})">✕ Supprimer</button>
        </td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
  }
  
  document.getElementById('content').innerHTML = html;
}

function supprimerArchivePermanente(locId, archivedAt) {
  const l = (DATA.archivesPermanentes || []).find(x => x.id === locId && x._archivedAt === archivedAt);
  if (!l) return;
  if (!confirm('Supprimer définitivement le dossier de ' + l.nom + ' ? Cette action est irréversible.')) return;
  DATA.archivesPermanentes = DATA.archivesPermanentes.filter(x => !(x.id === locId && x._archivedAt === archivedAt));
  saveData();
  renderCorbeille();
  showToast('Dossier supprimé définitivement');
}

function supprimerDefinitivement(locId) {
  const l = (DATA.corbeille || []).find(x => x.id === locId);
  if (!l) return;
  if (!confirm('Supprimer définitivement ' + l.nom + ' ? Il sera archivé de façon permanente.')) return;
  // Archiver dans archivesPermanentes avant de retirer de la corbeille
  if (!DATA.archivesPermanentes) DATA.archivesPermanentes = [];
  DATA.archivesPermanentes.push({ ...l, _archivedAt: new Date().toISOString() });
  DATA.corbeille = DATA.corbeille.filter(x => x.id !== locId);
  updateCorbeilleBadge();
  updateArchivesBadge();
  saveData();
  renderCorbeille();
  showToast(l.nom + ' archivé définitivement ✓');
}


function ajouterLocal(iid) {
  var appt = prompt('Numero du local (ex: A5, S3, 201) :');
  if (!appt || !appt.trim()) return;
  var typeNum = prompt('Type:\n1=Appartement (A)\n2=Studio (S)\n3=Chambre (Ch)\n4=Duplex (D)\n5=Villa (V)\n6=Autre\nEntrez 1-6:') || '1';
  var types = ['appartement','studio','chambre','duplex','villa','autre'];
  var type = types[(parseInt(typeNum)||1)-1] || 'appartement';
  var newLocal = {
    id: DATA.nextLocId++, iid: iid,
    appt: appt.trim().toUpperCase(), type: type,
    nom: '(Libre)', tel: '', loyer: 0, reste: 0,
    caution: 0, entree: '', obs: '', s: 'libre', jourPaiement: 1,
  };
  DATA.locataires.push(newLocal);
  var im = DATA.immeubles.find(function(i){return i.id===iid;});
  if(im){
    if(type==='appartement') im.apparts=(im.apparts||0)+1;
    else if(type==='studio') im.studios=(im.studios||0)+1;
    else if(type==='chambre') im.chambres=(im.chambres||0)+1;
  }
  saveData(); renderCurrent();
  showToast('Local ' + newLocal.appt + ' ajoute !', 'green');
}

// ── CONTEXT MENU ──────────────────────────────────────────────────────────────
let _ctxLocId = null;
let _ctxIid = null;
let _ctxIsLibre = false;
let _ctxPayId = null;
let _ctxImmId = null;

function _posCtxMenu(e, touchX, touchY) {
  const menu = document.getElementById('ctx-menu');
  menu.style.display = 'block';
  const cx = touchX !== undefined ? touchX : e.clientX;
  const cy = touchY !== undefined ? touchY : e.clientY;
  const x = Math.min(cx, window.innerWidth - 210);
  const y = Math.min(cy, window.innerHeight - 250);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function showCtxMenu(e, locId, iid, isLibre) {
  e.preventDefault(); e.stopPropagation();
  _ctxLocId = locId; _ctxIid = iid; _ctxIsLibre = isLibre;
  const items = document.getElementById('ctx-menu-items');
  if (isLibre) {
    items.innerHTML =
      '<div class="ctx-item" onclick="ctxAjouterLocataire()">➕ Ajouter un locataire</div>' +
      '<div class="ctx-item" onclick="ctxModifierLocal()">✏️ Modifier le local</div>' +
      '<div class="ctx-sep"></div>' +
      '<div class="ctx-item ctx-danger" onclick="ctxSupprimerLocal()">🗑️ Supprimer le local</div>';
  } else {
    items.innerHTML =
      '<div class="ctx-item" onclick="ctxModifierLocataire()">📝 Modifier</div>' +
      '<div class="ctx-item" onclick="ctxPaiement()">💳 Enregistrer paiement</div>' +
      '<div class="ctx-item" onclick="ctxFicheSuivi()">📊 Fiche de suivi</div>' +
      '<div class="ctx-sep"></div>' +
      '<div class="ctx-item ctx-danger" onclick="ctxSupprimerLocataire()">🗑️ Supprimer locataire</div>' +
      '<div class="ctx-item ctx-danger" onclick="ctxSupprimerLocal()">🗑️ Supprimer le local</div>';
  }
  _posCtxMenu(e);
}

// Context menu for locataire rows (in list)
function showCtxLoc(e, locId) {
  e.preventDefault(); e.stopPropagation();
  _ctxLocId = locId;
  const l = DATA.locataires.find(x => x.id === locId);
  const items = document.getElementById('ctx-menu-items');
  items.innerHTML =
    '<div class="ctx-item" onclick="editLocataire(' + locId + ');hideCtxMenu()">📝 Modifier</div>' +
    '<div class="ctx-item" onclick="openModalPaiement(' + (l?l.iid:0) + ',' + locId + ');hideCtxMenu()">💳 Paiement</div>' +
    '<div class="ctx-item" onclick="ouvrirFicheSuivi(' + locId + ');hideCtxMenu()">📊 Fiche de suivi</div>' +
    '<div class="ctx-sep"></div>' +
    '<div class="ctx-item ctx-danger" onclick="supprimerLocataire(' + locId + ');hideCtxMenu()">🗑️ Supprimer</div>';
  _posCtxMenu(e);
}

// Context menu for paiement rows
function showCtxPay(e, payId) {
  e.preventDefault(); e.stopPropagation();
  _ctxPayId = payId;
  const items = document.getElementById('ctx-menu-items');
  items.innerHTML =
    '<div class="ctx-item ctx-danger" onclick="supprimerPaiement(' + payId + ');hideCtxMenu()">🗑️ Supprimer ce paiement</div>';
  _posCtxMenu(e);
}

// Context menu for relance rows
function showCtxRelance(e, locId) {
  e.preventDefault(); e.stopPropagation();
  _ctxLocId = locId;
  const l = DATA.locataires.find(x => x.id === locId);
  const items = document.getElementById('ctx-menu-items');
  items.innerHTML =
    '<div class="ctx-item" onclick="previewMiseEnDemeure(' + locId + ');hideCtxMenu()">📄 Mise en demeure</div>' +
    '<div class="ctx-item" onclick="previewPlainte(' + locId + ');hideCtxMenu()">⚖️ Plainte</div>' +
    '<div class="ctx-item" onclick="openModalPaiement(' + (l?l.iid:0) + ',' + locId + ');hideCtxMenu()">💳 Enregistrer paiement</div>' +
    '<div class="ctx-sep"></div>' +
    '<div class="ctx-item" onclick="ouvrirFicheSuivi(' + locId + ');hideCtxMenu()">📊 Fiche de suivi</div>';
  _posCtxMenu(e);
}

// Context menu for sidebar immeuble
function showCtxImm(e, immId) {
  e.preventDefault(); e.stopPropagation();
  _ctxImmId = immId;
  const im = DATA.immeubles.find(i => i.id === immId);
  const items = document.getElementById('ctx-menu-items');
  var nav = "navigate('immeuble'," + immId + ");hideCtxMenu()";
  var rpt = "window._rptIid=" + immId + ";ouvrirRapportImmeuble(" + immId + ");hideCtxMenu()";
  items.innerHTML =
    '<div class="ctx-item" onclick="' + nav + '">🏠 Ouvrir</div>' +
    '<div class="ctx-item" onclick="openModalPaiement(' + immId + ');hideCtxMenu()">💳 Paiement</div>' +
    '<div class="ctx-item" onclick="editImmeuble(' + immId + ');hideCtxMenu()">✏️ Modifier</div>' +
    '<div class="ctx-item" onclick="' + rpt + '">📊 Rapport</div>' +
    '<div class="ctx-sep"></div>' +
    '<div class="ctx-item ctx-danger" onclick="supprimerImmeuble(' + immId + ');hideCtxMenu()">🗑️ Supprimer</div>';
  _posCtxMenu(e);
}

function hideCtxMenu() {
  const m = document.getElementById('ctx-menu');
  if (m) m.style.display = 'none';
}

function ctxAjouterLocataire() {
  hideCtxMenu();
  const l = DATA.locataires.find(x => x.id === _ctxLocId);
  openModalLocataire(_ctxIid, l ? l.appt : '', l ? l.type : 'appartement');
}

function ctxModifierLocataire() {
  hideCtxMenu();
  editLocataire(_ctxLocId);
}

function ctxPaiement() {
  hideCtxMenu();
  openModalPaiement(_ctxIid, _ctxLocId);
}

function ctxFicheSuivi() {
  hideCtxMenu();
  ouvrirFicheSuivi(_ctxLocId);
}

function ctxSupprimerLocataire() {
  hideCtxMenu();
  supprimerLocataire(_ctxLocId);
}

function ctxModifierLocal() {
  hideCtxMenu();
  const l = DATA.locataires.find(x => x.id === _ctxLocId);
  if (!l) return;
  const newAppt = prompt('Numéro du local :', l.appt || '');
  if (newAppt === null) return;
  const typeNum = prompt('Type:\n1=Appartement\n2=Studio\n3=Chambre\n4=Duplex\n5=Villa\n6=Autre', '1') || '1';
  const types = ['appartement','studio','chambre','duplex','villa','autre'];
  l.appt = newAppt.trim().toUpperCase();
  l.type = types[(parseInt(typeNum)||1)-1] || l.type;
  saveData();
  renderCurrent();
  showToast('Local modifié ✓', 'green');
}

function ctxSupprimerLocal() {
  hideCtxMenu();
  const l = DATA.locataires.find(x => x.id === _ctxLocId);
  if (!l) return;
  const msg = l.s === 'libre' 
    ? 'Supprimer le local ' + (l.appt||'') + ' définitivement ?'
    : 'Supprimer le local ' + (l.appt||'') + ' et son locataire ' + l.nom + ' ?\nLe locataire ira dans la corbeille.';
  if (!confirm(msg)) return;
  
  if (l.s !== 'libre') {
    // Send locataire to corbeille first
    supprimerLocataire(_ctxLocId);
    // Then remove the local entirely
    setTimeout(() => {
      DATA.locataires = DATA.locataires.filter(x => x.id !== _ctxLocId);
      saveData();
      renderCurrent();
    }, 100);
  } else {
    // Just remove the libre local
    DATA.locataires = DATA.locataires.filter(x => x.id !== _ctxLocId);
    // Update immeuble composition
    const im = DATA.immeubles.find(i => i.id === _ctxIid);
    if (im) {
      if (l.type === 'appartement' && im.apparts > 0) im.apparts--;
      else if (l.type === 'studio' && im.studios > 0) im.studios--;
      else if (l.type === 'chambre' && im.chambres > 0) im.chambres--;
    }
    saveData();
    renderCurrent();
    showToast('Local supprimé ✓');
  }
}


function setAuthModeNew(mode) {
  // Conserve pour compatibilite — redirige vers le nouveau systeme
  if (mode === 'individuel') authGoStep('2-perso');
  else authGoStep('2-ent');
}

// ── NOUVEAU SYSTEME DE NAVIGATION AUTH ───────────────────────────────────────
function authGoStep(step) {
  // Cache toutes les etapes
  document.querySelectorAll('.auth-step').forEach(function(el) {
    el.classList.remove('active');
  });
  // Affiche l'etape demandee
  var target = document.getElementById('auth-step-' + step);
  if (target) {
    target.classList.add('active');
  }
  // Init role entreprise par defaut
  if (step === '2-ent') {
    window._authRole = 'admin';
    var sel = document.getElementById('role-selector');
    if (sel) sel.value = 'admin';
    var pinSec = document.getElementById('pin-section-new');
    var credSec = document.getElementById('creds-section-new');
    if (pinSec) pinSec.style.display = 'none';
    if (credSec) credSec.style.display = 'block';
  }
}

function loginLocataire() {
  var tel = document.getElementById('loc-tel-login');
  var errEl = document.getElementById('err-locataire');
  if (!tel) return;
  var telVal = tel.value.trim();
  var pin = ['loc-pin1','loc-pin2','loc-pin3','loc-pin4'].map(function(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }).join('');
  if (!telVal) { errEl.textContent = 'Veuillez entrer votre numéro de téléphone'; errEl.style.display = 'block'; return; }
  if (pin.length < 4) { errEl.textContent = 'Veuillez entrer votre code PIN (4 chiffres)'; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  // Trouver le locataire par téléphone
  var locataire = DATA.locataires.find(function(l) {
    return l.tel && l.tel.replace(/[^0-9]/g,'') === telVal.replace(/[^0-9]/g,'') && l.s !== 'libre';
  });
  // Vérifier le PIN : soit sur DATA.locataires, soit dans USERS (auto-créé)
  if (locataire) {
    var userRecord = USERS.find(function(u) {
      return u.role === 'locataire' && u.locId === locataire.id;
    });
    var pinOk = false;
    if (locataire.pin && locataire.pin === pin) {
      pinOk = true;
    } else if (userRecord && userRecord.pin && userRecord.pin === pin) {
      pinOk = true;
      // Synchroniser le PIN dans DATA.locataires pour les prochaines connexions
      locataire.pin = pin;
    } else if (!locataire.pin && (!userRecord || !userRecord.pin) && pin === 'craa') {
      pinOk = true; // PIN par défaut
      locataire.pin = 'craa';
    }
    if (!pinOk) locataire = null;
  }
  if (!locataire) {
    errEl.textContent = 'Numéro ou PIN incorrect';
    errEl.style.display = 'block';
    ['loc-pin1','loc-pin2','loc-pin3','loc-pin4'].forEach(function(id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var p1 = document.getElementById('loc-pin1'); if (p1) p1.focus();
    return;
  }
  if (locataire.actif === false) {
    errEl.textContent = 'Compte suspendu. Contactez le Cabinet CRAA.';
    errEl.style.display = 'block';
    return;
  }
  var _locVersion = 'entreprise'; // loginLocataire peut être appelé hors session active
  var user = {
    id: 'loc_' + locataire.id,
    nom: locataire.nom,
    role: 'locataire',
    locId: locataire.id,
    iid: locataire.iid,
    version: _locVersion
  };
  startSession(user, _locVersion);
  if (locataire.firstLogin) {
    setTimeout(function() { showPINChangeSuggestion(locataire.id); }, 800);
  }
}

function loginProprietaire() {
  var telEl = document.getElementById('proprio-tel');
  var pwdEl = document.getElementById('proprio-pwd');
  var errEl = document.getElementById('err-proprio');
  var telVal = telEl ? telEl.value.trim() : '';
  var pwdVal = pwdEl ? pwdEl.value : '';
  if (!telVal) { errEl.textContent = 'Veuillez entrer votre numéro de téléphone'; errEl.style.display = 'block'; return; }
  if (!pwdVal) { errEl.textContent = 'Veuillez entrer votre mot de passe'; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  // Cherche dans USERS : entreprise ET individuel
  var user = USERS.find(function(u) {
    return u.role === 'proprietaire' &&
           (u.version === 'entreprise' || u.version === 'individuel') &&
           u.tel && u.tel.replace(/[^0-9]/g,'') === telVal.replace(/[^0-9]/g,'') &&
           u.password === pwdVal;
  });
  if (!user) {
    errEl.textContent = 'Numéro ou mot de passe incorrect';
    errEl.style.display = 'block';
    return;
  }
  if (user.actif === false) {
    errEl.textContent = 'Compte suspendu.';
    errEl.style.display = 'block';
    return;
  }
  startSession(user, user.version || 'entreprise');
}

// Gestion parametre URL ?portail=locataire|proprietaire
function checkPortailParam() {
  var params = new URLSearchParams(window.location.search);
  var portail = params.get('portail');
  if (portail === 'locataire') {
    authGoStep('3-locataire');
  } else if (portail === 'proprietaire') {
    authGoStep('3-proprio');
  }
}

function editImmeuble(immId) { openModalImmeuble(immId); }

function openModalImmeuble(immId) {
  const isEdit = immId && immId > 0;
  const im = isEdit ? DATA.immeubles.find(i => i.id === immId) : null;
  document.getElementById('modal-imm-title').textContent = isEdit ? 'Modifier immeuble' : 'Nouvel immeuble';
  document.getElementById('imm-id').value = isEdit ? immId : '';
  document.getElementById('imm-nom-immeuble').value = im ? (im.nomImmeuble||im.nom||'') : '';
  document.getElementById('imm-nom').value = im ? (im.nomProprio||im.nom||'') : '';
  document.getElementById('imm-tel-proprio').value = im ? (im.telProprio||'') : '';
  document.getElementById('imm-ville').value = im ? im.ville : '';
  document.getElementById('imm-quartier').value = im ? (im.quartier||'') : '';
  document.getElementById('imm-couleur').value = im ? im.col : '#4f8ef7';
  const comm = im && im.commission ? im.commission : { type: 'forfait', valeur: 0 };
  document.getElementById('imm-commission-type').value = comm.type || 'forfait';
  document.getElementById('imm-commission-valeur').value = comm.valeur || 0;
  document.getElementById('modal-immeuble').classList.add('open');
}

function saveImmeuble() {
  const existId = parseInt(document.getElementById('imm-id').value) || 0;
  const nomImmeuble = document.getElementById('imm-nom-immeuble').value.trim();
  const nomProprio  = document.getElementById('imm-nom').value.trim();
  const telProprio  = document.getElementById('imm-tel-proprio').value.trim();
  const ville       = document.getElementById('imm-ville').value.trim();
  if (!nomImmeuble || !nomProprio || !ville) { showToast('Nom immeuble, propriétaire et ville requis', 'red'); return; }
  const quartier  = document.getElementById('imm-quartier').value.trim();
  const col       = document.getElementById('imm-couleur').value || '#4f8ef7';
  const commType  = document.getElementById('imm-commission-type').value || 'forfait';
  const commValeur= parseFloat(document.getElementById('imm-commission-valeur').value) || 0;
  const commission= { type: commType, valeur: commValeur };
  // nom (affiché) = nomImmeuble pour la sidebar/cards
  const nom = nomImmeuble;
  if (existId > 0) {
    const idx = DATA.immeubles.findIndex(i => i.id === existId);
    if (idx >= 0) {
      DATA.immeubles[idx] = { ...DATA.immeubles[idx], nom, nomImmeuble, nomProprio, telProprio, ville, quartier, col, commission };
    }
    showToast('Immeuble modifié ✓', 'green');
  } else {
    const newId = Math.max(0, ...DATA.immeubles.map(i => i.id)) + 1;
    DATA.immeubles.push({ id: newId, nom, nomImmeuble, nomProprio, telProprio, ville, quartier, col, commission, apparts:0, studios:0, chambres:0 });
    // ── Étape 3 : création automatique compte propriétaire ──────────────────
    if (telProprio) {
      const telClean = telProprio.replace(/[^0-9]/g, '');
      const _verImm = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
      const existing = USERS.find(function(u) {
        return u.role === 'proprietaire' && u.version === _verImm &&
               u.tel && u.tel.replace(/[^0-9]/g,'') === telClean;
      });
      if (existing) {
        if (!existing.immeubles) existing.immeubles = [];
        if (!existing.immeubles.includes(newId)) existing.immeubles.push(newId);
        saveUsers();
        showToast('Immeuble lié au compte proprio existant ✓', 'green');
      } else {
        const newUserId = 'pro_' + newId + '_' + Date.now();
        USERS.push({
          id: newUserId,
          version: _verImm,
          role: 'proprietaire',
          nom: nomProprio,
          username: telClean,
          tel: telProprio,
          password: 'craa',
          immeubles: [newId],
          pin: null,
          actif: true,
          customPerms: {},
          mustChangePassword: true
        });
        saveUsers();
        showToast('Compte proprio créé (tel: ' + telProprio + ', mdp: craa) ✓', 'green');
      }
    }
    showToast('Immeuble ajouté ✓', 'green');
  }
  saveData();
  // Sync Supabase
  if (SESSION) {
    const lastImm = DATA.immeubles[DATA.immeubles.length - 1];
    if (lastImm) saveImmeubleToSupabase(lastImm);
  }
  closeModals();
  renderCurrent();
}

function supprimerImmeuble(immId) {
  const im = DATA.immeubles.find(i => i.id === immId);
  if (!im) return;
  const locsActifs = DATA.locataires.filter(l => l.iid === immId && l.s !== 'libre');
  const msg = locsActifs.length > 0
    ? 'Supprimer ' + im.nom + ' ?\n' + locsActifs.length + ' locataire(s) iront en corbeille.'
    : 'Supprimer ' + im.nom + ' ? Il ira dans la corbeille 30 jours.';
  if (!confirm(msg)) return;
  if (!DATA.corbeille) DATA.corbeille = [];
  if (!DATA.corbeilleImmeubles) DATA.corbeilleImmeubles = [];
  // Sauvegarder l'immeuble dans corbeilleImmeubles pour restauration
  DATA.corbeilleImmeubles.push(Object.assign({}, im, {
    _deletedAt: new Date().toISOString(),
    _locataires: locsActifs.map(function(l) {
      return Object.assign({}, l, { _paiements: DATA.paiements.filter(function(p){ return p.locId === l.id; }) });
    })
  }));
  // Send active locataires to corbeille
  locsActifs.forEach(function(l) {
    DATA.corbeille.push(Object.assign({}, l, {
      _deletedAt: new Date().toISOString(),
      _paiements: DATA.paiements.filter(function(p){ return p.locId === l.id; })
    }));
    // Archiver directement dans Supabase (suppression immeuble)
    var _paiesImm = DATA.paiements.filter(function(p){return p.locId===l.id;});
    archiverLocataireSupabase(Object.assign({},l), "suppression_immeuble", _paiesImm, null, "");
    DATA.paiements = DATA.paiements.filter(function(p){ return p.locId !== l.id; });
    // Étape 4 : bloquer chaque locataire
    if (l.tel) _bloquerUserParTel(l.tel);
  });
  // Remove immeuble and all its locaux
  DATA.immeubles = DATA.immeubles.filter(function(i){ return i.id !== immId; });
  DATA.locataires = DATA.locataires.filter(function(l){ return l.iid !== immId; });
  // Étape 4 : bloquer proprio si plus d'immeuble actif
  _majActifProprietaire(immId);
  updateCorbeilleBadge();
  saveData();
  renderCurrent();
  showToast(im.nom + ' supprime ✓');
}

function restaurerImmeuble(immId) {
  if (!DATA.corbeilleImmeubles) { showToast('Aucun immeuble en corbeille', 'red'); return; }
  const idx = DATA.corbeilleImmeubles.findIndex(function(x){ return x.id === immId; });
  if (idx < 0) { showToast('Immeuble non trouvé en corbeille', 'red'); return; }
  const im = DATA.corbeilleImmeubles[idx];
  const { _deletedAt, _locataires, ...immData } = im;
  // Restaurer l'immeuble
  DATA.immeubles.push(immData);
  // Restaurer les locataires si sauvegardés
  if (_locataires && _locataires.length) {
    _locataires.forEach(function(l) {
      var { _paiements, ...locData } = l;
      DATA.locataires.push(locData);
      if (_paiements) DATA.paiements.push.apply(DATA.paiements, _paiements);
      // Étape 4 : réactiver locataire
      if (locData.tel) _debloquerUserParTel(locData.tel);
    });
  }
  DATA.corbeilleImmeubles.splice(idx, 1);
  // Étape 4 : réactiver proprio
  _majActifProprietaire(immId);
  updateCorbeilleBadge();
  saveData();
  renderCurrent();
  showToast(immData.nom + ' restauré ✓', 'green');
}

// ── PREVIEW SYSTEM FOR LETTRES & PLAINTES ─────────────────────────────────────
let _previewCallback = null;

function showPreviewModal(title, htmlContent, downloadCallback) {
  _previewCallback = downloadCallback;
  document.getElementById('preview-title').textContent = title;
  document.getElementById('preview-dl-btn').onclick = function() {
    closeModals();
    setTimeout(_previewCallback, 200);
  };
  var rb = document.getElementById('rapport-preview-html') || document.getElementById('rapport-content');
  if(rb) rb.innerHTML = htmlContent;
  document.getElementById('modal-rapport').classList.add('open');
}

function previewMiseEnDemeure(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  const im = DATA.immeubles.find(i => i.id === l.iid);
  const today = new Date().toLocaleDateString('fr-FR');
  const moisDus = Math.round((l.reste||0) / (l.loyer||1) * 10) / 10;

  const html = `
    <div style="font-family:serif;max-width:680px;margin:0 auto;padding:24px;color:#222;font-size:14px;line-height:1.8;">
      <div style="text-align:right;margin-bottom:32px;color:#555;font-size:13px;">
        ${im ? im.ville : ''}, le ${today}
      </div>
      <div style="margin-bottom:24px;">
        <strong>${im ? im.nom : ''}</strong><br>
        ${im ? im.ville + (im.quartier ? ' - ' + im.quartier : '') : ''}
      </div>
      <div style="margin-bottom:24px;">
        <strong>${l.nom}</strong><br>
        Local ${l.appt || '–'}
      </div>
      <h3 style="text-align:center;text-transform:uppercase;text-decoration:underline;margin:32px 0 24px;font-size:15px;">
        MISE EN DEMEURE DE PAYER
      </h3>
      <p>Monsieur/Madame <strong>${l.nom}</strong>,</p>
      <p>Nous vous mettons en demeure de procéder au règlement de votre loyer impayé d'un montant de <strong>${l.reste ? l.reste.toLocaleString('fr-FR') : 0} FCFA</strong>, représentant environ <strong>${moisDus} mois</strong> de loyer.</p>
      <p>Malgré nos relances, ce montant demeure impayé à ce jour. Vous êtes donc sommé(e) de régler cette somme dans un délai de <strong>8 jours</strong> à compter de la réception de ce courrier.</p>
      <p>À défaut de paiement dans ce délai, nous nous verrons dans l\'obligation d\'engager les procédures judiciaires nécessaires pour recouvrer notre dû, ce qui entraînera des frais supplémentaires à votre charge.</p>
      <p>Dans l\'espoir d\'un règlement amiable, nous vous prions d\'agréer, Monsieur/Madame, l\'expression de nos salutations distinguées.</p>
      <div style="margin-top:48px;text-align:right;">
        <p>Le Propriétaire / La Gérance</p>
        <p style="margin-top:32px;">___________________________</p>
        <p style="font-size:12px;color:#888;">Signature et cachet</p>
      </div>
    </div>`;

  showPreviewModal('📄 Mise en demeure — ' + l.nom, html, () => genDocxMiseEnDemeure(locId));
}

function previewPlainte(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  const im = DATA.immeubles.find(i => i.id === l.iid);
  const today = new Date().toLocaleDateString('fr-FR');

  const html = `
    <div style="font-family:serif;max-width:680px;margin:0 auto;padding:24px;color:#222;font-size:14px;line-height:1.8;">
      <div style="text-align:right;margin-bottom:32px;color:#555;font-size:13px;">
        ${im ? im.ville : ''}, le ${today}
      </div>
      <div style="margin-bottom:24px;font-size:13px;">
        À Monsieur/Madame le/la Président(e) du Tribunal<br>
        du lieu de situation de l'immeuble
      </div>
      <h3 style="text-align:center;text-transform:uppercase;text-decoration:underline;margin:32px 0 24px;font-size:15px;">
        PLAINTE POUR LOYERS IMPAYÉS
      </h3>
      <p>J'ai l\'honneur de porter à votre connaissance les faits suivants :</p>
      <p>Je soussigné(e), propriétaire de l\'immeuble sis à <strong>${im ? im.ville + (im.quartier ? ' - ' + im.quartier : '') : ''}</strong>, déclare que M./Mme <strong>${l.nom}</strong>, occupant le local <strong>${l.appt || '–'}</strong>, est redevable d\'une somme de <strong>${(l.reste||0).toLocaleString('fr-FR')} FCFA</strong> au titre de loyers impayés.</p>
      <p>Malgré plusieurs mises en demeure restées sans effet, le susmentionné(e) refuse de s'acquitter de ses obligations contractuelles.</p>
      <p>En conséquence, je sollicite votre intervention pour :</p>
      <ul>
        <li>Condamner M./Mme ${l.nom} au paiement de la somme de <strong>${(l.reste||0).toLocaleString('fr-FR')} FCFA</strong></li>
        <li>Prononcer la résiliation du bail</li>
        <li>Ordonner l'expulsion sous astreinte</li>
      </ul>
      <div style="margin-top:48px;">
        <p>Fait à ${im ? im.ville : ''}, le ${today}</p>
        <p style="margin-top:32px;">___________________________</p>
        <p style="font-size:12px;color:#888;">Signature du requérant</p>
      </div>
    </div>`;

  showPreviewModal('⚖️ Plainte — ' + l.nom, html, () => genDocxPlainte(locId));
}

function supprimerPaiement(payId) {
  const p = DATA.paiements.find(x => x.id === payId);
  if (!p) return;
  const l = DATA.locataires.find(x => x.id === p.locId);
  const nom = l ? l.nom : 'locataire';
  if (!confirm('Supprimer ce paiement de ' + p.montant.toLocaleString('fr-FR') + ' FCFA pour ' + nom + ' ?')) return;
  DATA.paiements = DATA.paiements.filter(x => x.id !== payId);
  // Recalculate reste for locataire
  if (l) {
    const totalPaye = DATA.paiements.filter(x => x.locId === l.id && x.type !== 'caution').reduce((s,x) => s+x.montant, 0);
    const moisPasses = Math.max(1, Math.ceil((new Date() - new Date(l.entree||Date.now())) / (1000*60*60*24*30)));
    l.reste = Math.max(0, l.loyer * moisPasses - totalPaye);
  }
  saveData();
  renderCurrent();
  showToast('Paiement supprimé ✓');
}

// ── ASSISTANT IA v2 — connecté à l'API Anthropic ──
let _aiHistory = [];

function openAIAssistant() { toggleAIChat(); }

function toggleAIChat() {
  const panel = document.getElementById('ai-chat-panel');
  if (!panel) return;
  const isOpen = panel.style.display === 'flex';
  panel.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) setTimeout(() => document.getElementById('ai-input')?.focus(), 120);
}

function sendAIMessage() {
  const input = document.getElementById('ai-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  _addAIBubble('user', msg);
  _callAnthropicAI(msg);
}

function aiQuickAction(type) {
  const queries = {
    'impayés':     'Donne-moi un résumé détaillé des impayés par immeuble avec les montants',
    'anomalies':   'Identifie les anomalies de paiement : locataires avec plus de 4 mois de retard',
    'performance': 'Analyse la performance globale de mon portefeuille immobilier',
    'relances':    'Quels locataires dois-je relancer en priorité cette semaine ?'
  };
  const q = queries[type] || type;
  _addAIBubble('user', q);
  _callAnthropicAI(q);
}

function _addAIBubble(role, html) {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;
  const wrap = document.createElement('div');
  if (role === 'user') {
    wrap.innerHTML = `<div class="ai-bubble-user">${html}</div>`;
  } else {
    wrap.className = 'ai-msg-bot';
    wrap.innerHTML = `<div class="ai-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L17 21H7l1.3-6A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/><circle cx="9" cy="9" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="9" r="1" fill="#fff" stroke="none"/></svg></div><div class="ai-bubble-bot">${html}</div>`;
  }
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function _addAITyping() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return null;
  const wrap = document.createElement('div');
  wrap.className = 'ai-msg-bot';
  wrap.id = 'ai-typing-indicator';
  wrap.innerHTML = `<div class="ai-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L17 21H7l1.3-6A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/></svg></div><div class="ai-bubble-bot"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
  return wrap;
}

function _buildDataContext() {
  const role = SESSION ? SESSION.role : 'admin';
  const now  = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const plan = (typeof MONETISATION !== 'undefined') ? (MONETISATION.plan || 'FREE').toUpperCase() : 'FREE';

  // ── Locataire : ses données personnelles uniquement ──
  if (role === 'locataire') {
    const l = DATA.locataires.find(x => x.id === SESSION.locId);
    if (!l) return 'DONNÉES : Locataire introuvable';
    const im   = DATA.immeubles.find(i => i.id === l.iid);
    const pays = (DATA.paiements || []).filter(p => p.locId === l.id).sort((a,b) => new Date(b.date)-new Date(a.date));
    const totalPaye = pays.reduce((s,p)=>s+p.montant,0);
    const dernier = pays[0] ? new Date(pays[0].date).toLocaleDateString('fr-FR')+' — '+pays[0].montant.toLocaleString('fr-FR')+' FCFA' : 'Aucun enregistré';
    const histo = pays.slice(0,3).map(p=>`  ${new Date(p.date).toLocaleDateString('fr-FR')} : ${p.montant.toLocaleString('fr-FR')} FCFA`).join('\n') || '  Aucun';
    return `DATE : ${dateStr}

DONNÉES LOCATAIRE :
Nom : ${l.nom}
Local : ${l.appt||'–'} | Immeuble : ${im?im.nom:'–'}${im&&im.ville?' ('+im.ville+')':''}
Loyer mensuel : ${l.loyer.toLocaleString('fr-FR')} FCFA
Situation : ${l.reste>0 ? '⚠️ IMPAYÉ — '+l.reste.toLocaleString('fr-FR')+' FCFA ('+Math.round(l.reste/l.loyer)+' mois)' : '✅ À jour'}
Caution versée : ${(l.caution||0).toLocaleString('fr-FR')} FCFA
Dernier paiement : ${dernier}
Historique (3 derniers paiements) :
${histo}
Total cumulé payé : ${totalPaye.toLocaleString('fr-FR')} FCFA`;
  }

  // ── Propriétaire : ses immeubles uniquement ──
  if (role === 'proprietaire') {
    const immsIds = SESSION.immeubles || [];
    const imms = DATA.immeubles.filter(i => immsIds.includes(i.id));
    const detail = imms.map(im => {
      const locs = DATA.locataires.filter(l => l.s !== 'libre' && l.iid === im.id);
      const imp  = locs.filter(l => (l.reste||0) > 0);
      const totalLoyers = locs.reduce((s,l)=>s+l.loyer,0);
      const totalImpImm  = imp.reduce((s,l)=>s+l.reste,0);
      const lignes = imp.sort((a,b)=>b.reste-a.reste)
        .map(l=>`    • ${l.nom} (${l.appt||'?'}) : ${l.reste.toLocaleString('fr-FR')} FCFA — ${Math.round(l.reste/l.loyer)} mois`).join('\n') || '    Aucun impayé';
      return `${im.nom}${im.ville?' ('+im.ville+')':''} :
  ${locs.length} locataires | Loyers cumulés : ${totalLoyers.toLocaleString('fr-FR')} FCFA/mois
  Impayés : ${imp.length} locataires — ${totalImpImm.toLocaleString('fr-FR')} FCFA
${lignes}`;
    }).join('\n\n');
    const totalLocs = imms.reduce((s,im)=>s+DATA.locataires.filter(l=>l.s!=='libre'&&l.iid===im.id).length,0);
    const totalImpAll = DATA.locataires.filter(l=>immsIds.includes(l.iid)).reduce((s,l)=>s+Math.max(0,l.reste||0),0);
    return `DATE : ${dateStr}

DONNÉES PROPRIÉTAIRE :
Immeubles : ${imms.length} | Locataires actifs : ${totalLocs}
Total impayés : ${totalImpAll.toLocaleString('fr-FR')} FCFA

DÉTAIL PAR IMMEUBLE :
${detail}`;
  }

  // ── Admin / Gestionnaire / Comptable : données complètes ──
  const actifs   = DATA.locataires.filter(l => l.s !== 'libre');
  const libres   = DATA.locataires.filter(l => l.s === 'libre');
  const totalImp = actifs.reduce((s,l)=>s+Math.max(0,l.reste||0),0);
  const nbImp    = actifs.filter(l=>(l.reste||0)>0).length;
  const taux     = actifs.length ? Math.round((actifs.length-nbImp)/actifs.length*100) : 0;

  const critiques = actifs.filter(l=>l.loyer>0&&l.reste>=l.loyer*3)
    .sort((a,b)=>b.reste-a.reste).slice(0,8)
    .map(l=>{const im=DATA.immeubles.find(i=>i.id===l.iid);return `  • ${l.nom} (${im?im.nom.split(' ')[0]:'?'} ${l.appt||''}) : ${l.reste.toLocaleString('fr-FR')} FCFA — ${Math.round(l.reste/l.loyer)} mois`;}).join('\n');

  const parImm = DATA.immeubles.map(im=>{
    const locs=DATA.locataires.filter(l=>l.iid===im.id&&l.s!=='libre');
    const imp=locs.filter(l=>(l.reste||0)>0);
    const commission = im.commissionType==='pct'?`${im.commissionValeur}%`:`${(im.commissionValeur||0).toLocaleString('fr-FR')} FCFA`;
    return `  • ${im.nom}${im.ville?' ('+im.ville+')':''} : ${locs.length} loc., ${imp.length} impayés, ${imp.reduce((s,l)=>s+l.reste,0).toLocaleString('fr-FR')} FCFA dus | Commission: ${commission}`;
  }).join('\n');

  const moisCourant=now.getMonth(), annee=now.getFullYear();
  const paiementsMois=(DATA.paiements||[]).filter(p=>{const d=new Date(p.date);return d.getMonth()===moisCourant&&d.getFullYear()===annee;});
  const totalMois=paiementsMois.reduce((s,p)=>s+p.montant,0);

  return `DATE : ${dateStr} | PLAN : ${plan}

DONNÉES GLOBALES :
${DATA.immeubles.length} immeubles | ${actifs.length} locataires actifs | ${libres.length} locaux libres
Taux de recouvrement : ${taux}%
Impayés totaux : ${totalImp.toLocaleString('fr-FR')} FCFA sur ${nbImp} locataires
Encaissements ce mois (${now.toLocaleDateString('fr-FR',{month:'long'})}) : ${totalMois.toLocaleString('fr-FR')} FCFA (${paiementsMois.length} versements)

PAR IMMEUBLE :
${parImm}

LOCATAIRES CRITIQUES (≥3 mois) :
${critiques||'  Aucun'}`;
}

async function _callAnthropicAI(userMsg) {
  const btn   = document.getElementById('ai-send-btn');
  const input = document.getElementById('ai-input');
  if (btn)   btn.disabled   = true;
  if (input) input.disabled = true;
  const typing = _addAITyping();
  _aiHistory.push({ role: 'user', content: userMsg });
  if (_aiHistory.length > 20) _aiHistory = _aiHistory.slice(-20);
  try {
    const role = SESSION ? SESSION.role : 'admin';
    const nom  = SESSION ? SESSION.nom  : 'Utilisateur';
    let systemPrompt;
    if (role === 'locataire') {
      systemPrompt = `Tu es l'assistant IA de ImmoGest. Tu parles à ${nom}, locataire.
Tu n'as accès qu'aux données de CE locataire. Tu ne connais pas les autres locataires.
Tu peux : expliquer sa situation, conseiller sur la régularisation d'un impayé, expliquer les délais et procédures, répondre aux questions sur son bail et ses paiements.
Sois bienveillant, clair et pratique. Réponds en français avec du HTML simple (strong, br). 150 mots max.

${_buildDataContext()}`;
    } else if (role === 'proprietaire') {
      systemPrompt = `Tu es l'assistant IA de ImmoGest pour ${nom}, propriétaire.
Tu n'as accès qu'aux données de SES immeubles. Tu ne connais pas les autres propriétaires.
Tu peux : analyser ses impayés, suggérer des actions de recouvrement, analyser la performance de ses biens, conseiller sur la gestion locative.
Sois direct et actionnable. Réponds en français avec du HTML simple. 200 mots max.

${_buildDataContext()}`;
    } else if (role === 'comptable') {
      systemPrompt = `Tu es l'assistant IA de ImmoGest pour ${nom}, comptable du Cabinet CRAA.
Tu as accès à toutes les données financières du portefeuille.
Tu peux : analyser les flux d'encaissements, calculer les commissions, identifier les anomalies comptables, préparer des synthèses financières.
Sois précis et chiffré. Réponds en français avec du HTML simple. 300 mots max.

${_buildDataContext()}`;
    } else {
      const roleLabel = role === 'gestionnaire' ? 'gestionnaire' : 'administrateur';
      systemPrompt = `Tu es l'assistant IA de ImmoGest pour ${nom}, ${roleLabel} du Cabinet CRAA au Cameroun.
Tu as accès à toutes les données du portefeuille immobilier en temps réel.
Tu peux : analyser les impayés, identifier des tendances, suggérer des priorités d'action, générer des synthèses, conseiller sur la stratégie de recouvrement.
Sois concis, actionnable et base-toi sur les données réelles ci-dessous. HTML simple (strong, br, ul/li). 300 mots max.

${_buildDataContext()}`;
    }
    const resp = await fetch('https://immogest1.fofefranklin57.workers.dev/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt, messages: _aiHistory, max_tokens: 600 })
    });
    if (typing) typing.remove();
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || 'AI indisponible');
    const answer = (data.content && data.content[0] && data.content[0].text) || 'Désolé, pas de réponse.';
    _aiHistory.push({ role: 'assistant', content: answer });
    _addAIBubble('assistant', answer);
  } catch(e) {
    if (typing) typing.remove();
    _addAIBubble('assistant', _localFallback(userMsg));
  } finally {
    if (btn)   btn.disabled   = false;
    if (input) { input.disabled = false; input.focus(); }
  }
}

function _localFallback(query) {
  const q    = query.toLowerCase();
  const role = SESSION ? SESSION.role : 'admin';

  // ── Locataire : sa situation uniquement ──
  if (role === 'locataire') {
    const l = DATA.locataires.find(x => x.id === SESSION.locId);
    if (!l) return 'Impossible de trouver vos informations.';
    const im = DATA.immeubles.find(i => i.id === l.iid);
    if (l.reste > 0) {
      const nbMois = Math.round(l.reste / l.loyer);
      return `📋 <strong>Votre situation</strong><br>Local : ${l.appt||'–'} — ${im?im.nom:'–'}<br>Loyer mensuel : <strong>${l.loyer.toLocaleString('fr-FR')} FCFA</strong><br>⚠️ Solde dû : <strong>${l.reste.toLocaleString('fr-FR')} FCFA</strong> (${nbMois} mois)<br><br>Pour régulariser, contactez le Cabinet CRAA par WhatsApp.`;
    }
    return `✅ <strong>Votre situation</strong><br>Local : ${l.appt||'–'} — ${im?im.nom:'–'}<br>Loyer : <strong>${l.loyer.toLocaleString('fr-FR')} FCFA/mois</strong><br>Situation : <strong>À jour ✓</strong>`;
  }

  // ── Propriétaire : ses immeubles uniquement ──
  if (role === 'proprietaire') {
    const immsIds = SESSION.immeubles || [];
    const locs = DATA.locataires.filter(l => l.s !== 'libre' && immsIds.includes(l.iid));
    const imp  = locs.filter(l => (l.reste||0) > 0);
    const totalImp = imp.reduce((s,l)=>s+l.reste,0);
    const taux = locs.length ? Math.round((locs.length-imp.length)/locs.length*100) : 0;
    if (q.includes('impay') || q.includes('relance')) {
      return `⚠️ <strong>Impayés — vos immeubles</strong><br>${imp.length} locataires | ${totalImp.toLocaleString('fr-FR')} FCFA<br><br>${imp.sort((a,b)=>b.reste-a.reste).slice(0,6).map(l=>`• ${l.nom} : ${l.reste.toLocaleString('fr-FR')} FCFA`).join('<br>')}`;
    }
    return `📊 <strong>Vos immeubles</strong><br>${locs.length} locataires actifs | Recouvrement : <strong>${taux}%</strong><br>Impayés : <strong>${totalImp.toLocaleString('fr-FR')} FCFA</strong> (${imp.length} loc.)`;
  }

  // ── Admin / Gestionnaire / Comptable : tout ──
  const actifs   = DATA.locataires.filter(l => l.s !== 'libre');
  const totalImp = actifs.reduce((s,l)=>s+Math.max(0,l.reste||0),0);
  const nbImp    = actifs.filter(l=>(l.reste||0)>0).length;
  const taux     = actifs.length ? Math.round((actifs.length-nbImp)/actifs.length*100) : 0;
  if (q.includes('impay') || q.includes('relance')) {
    const byImm = DATA.immeubles.map(im=>{const locs=DATA.locataires.filter(l=>l.iid===im.id&&(l.reste||0)>0);return{nom:im.nom.split(' ')[0],total:locs.reduce((s,l)=>s+l.reste,0),nb:locs.length};}).filter(x=>x.nb>0).sort((a,b)=>b.total-a.total);
    return `⚠️ <strong>Impayés : ${fmtShort(totalImp)}</strong> sur ${nbImp} locataires<br><br>${byImm.map(x=>`• ${x.nom} : ${fmtShort(x.total)} (${x.nb} loc.)`).join('<br>')}`;
  }
  if (q.includes('anomal') || q.includes('critiqu')) {
    const a = actifs.filter(l=>l.loyer>0&&l.reste>=l.loyer*4);
    return a.length ? `🚨 <strong>${a.length} cas critiques (≥4 mois) :</strong><br>${a.sort((x,y)=>y.reste-x.reste).slice(0,6).map(l=>`⚠️ ${l.nom} : ${fmtShort(l.reste)}`).join('<br>')}` : '✅ Aucune anomalie critique.';
  }
  if (q.includes('performa') || q.includes('taux') || q.includes('résumé') || q.includes('resume') || q.includes('bilan')) {
    const now2=new Date();
    const paiementsMois=(DATA.paiements||[]).filter(p=>{const d=new Date(p.date);return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear();});
    return `📈 <strong>Performance globale</strong><br>• ${actifs.length} locataires actifs<br>• Recouvrement : <strong>${taux}%</strong><br>• Impayés : <strong>${fmtShort(totalImp)}</strong> (${nbImp} loc.)<br>• Encaissements ce mois : <strong>${fmtShort(paiementsMois.reduce((s,p)=>s+p.montant,0))}</strong>`;
  }
  return `📊 <strong>Résumé ImmoGest</strong><br>• ${actifs.length} locataires | Recouvrement : <strong>${taux}%</strong><br>• Impayés : <strong>${fmtShort(totalImp)} FCFA</strong> sur ${nbImp} loc.`;
}

function toggleActionMenu(btn) {
  // Close all other open menus
  document.querySelectorAll('.action-dropdown.open').forEach(d => {
    if (d !== btn.nextElementSibling) d.classList.remove('open');
  });
  btn.nextElementSibling.classList.toggle('open');
  // Stop propagation so document click handler can close it
  event.stopPropagation();
}

// Close all action menus on click outside
document.addEventListener('click', function() {
  document.querySelectorAll('.action-dropdown.open').forEach(d => d.classList.remove('open'));
});

function envoyerAccesWhatsApp(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l || !l.pin) return;
  const im = DATA.immeubles.find(i => i.id === l.iid);
  const appUrl = window.location.href.split('?')[0];
  const msg = encodeURIComponent(
    'Bonjour ' + l.nom + ' 👋\n\n' +
    'Votre accès ImmoGest est prêt !\n\n' +
    '📱 Identifiant : ' + (l.tel || 'voir gestionnaire') + '\n' +
    '🔑 PIN : ' + l.pin + '\n' +
    '🏢 Immeuble : ' + (im ? im.nom : '') + ' — Local ' + (l.appt || '') + '\n\n' +
    '🔗 Connectez-vous sur :\n' + appUrl + '\n\n' +
    'Vous pouvez changer votre PIN après connexion.\n' +
    '_ImmoGest — Gestion Immobilière_'
  );
  const waNum = (l.whatsapp || l.tel || '').replace(/[^0-9+]/g, '');
  const waUrl = waNum
    ? 'https://wa.me/' + (waNum.startsWith('+') ? waNum.slice(1) : (waNum.startsWith('237') ? waNum : '237' + waNum)) + '?text=' + msg
    : 'https://wa.me/?text=' + msg;
  window.open(waUrl, '_blank');
}

function reinitialiserPIN(locId) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  if (!confirm('Réinitialiser le PIN de ' + l.nom + ' ?')) return;
  l.pin = String(Math.floor(1000 + Math.random() * 9000));
  l.firstLogin = true;
  l.pinResetRequested = false;
  saveData();
  showToast('PIN réinitialisé ✓', 'green');
  setTimeout(() => {
    if (confirm('Envoyer le nouveau PIN à ' + l.nom + ' via WhatsApp ?')) {
      envoyerAccesWhatsApp(locId);
    }
  }, 300);
}

function changerPINLocataire(locId, newPin) {
  const l = DATA.locataires.find(x => x.id === locId);
  if (!l) return;
  l.pin = newPin;
  l.firstLogin = false;
  saveData();
  showToast('PIN modifié avec succès ✓', 'green');
}

function demanderReinitialisationPIN(tel) {
  const l = DATA.locataires.find(x => x.tel === tel && x.s !== 'libre');
  if (!l) {
    showToast('Numéro non trouvé', 'red');
    return;
  }
  l.pinResetRequested = true;
  saveData();
  showToast('Demande envoyée à votre gestionnaire ✓', 'green');
  document.getElementById('modal-pin-reset').classList.remove('open');
}

function showPINChangeSuggestion(locId) {
  const modal = document.getElementById('modal-pin-suggest');
  if (!modal) return;
  modal.dataset.locId = locId;
  modal.classList.add('open');
}

function confirmChangePIN() {
  const modal = document.getElementById('modal-pin-suggest');
  const locId = parseInt(modal.dataset.locId);
  modal.classList.remove('open');
  openModalChangePIN(locId);
}

function openModalChangePIN(locId) {
  const modal = document.getElementById('modal-change-pin');
  if (!modal) return;
  modal.dataset.locId = locId;
  // Clear inputs
  ['new-pin1','new-pin2','new-pin3','new-pin4'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  modal.classList.add('open');
}

function saveNewPIN() {
  const modal = document.getElementById('modal-change-pin');
  const locId = parseInt(modal.dataset.locId);
  const newPin = ['new-pin1','new-pin2','new-pin3','new-pin4']
    .map(id => document.getElementById(id).value).join('');
  if (newPin.length !== 4 || !/^[0-9]{4}$/.test(newPin)) {
    showToast('Entrez un PIN de 4 chiffres', 'red');
    return;
  }
  changerPINLocataire(locId, newPin);
  modal.classList.remove('open');
}

// ============================================================
// PORTAIL PROPRIÉTAIRE
// ============================================================


function renderPortailProprietaire(immeubles, tab) {
  const modal = document.getElementById('modal-portail-proprietaire');
  if (!modal) return;
  
  const today = new Date();
  const moisActuel = today.getMonth();
  const anneeActuelle = today.getFullYear();
  const MNOMS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  const MNOMS_L = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  // Global stats across all owner's immeubles
  const allLocs = DATA.locataires.filter(l => immeubles.some(im => im.id === l.iid) && l.s !== 'libre');
  const totalLoyers = allLocs.reduce((s,l) => s + l.loyer, 0);
  const totalImpayés = allLocs.reduce((s,l) => s + (l.reste||0), 0);
  const nbImpayés = allLocs.filter(l => (l.reste||0) > 0).length;
  const paysMonth = DATA.paiements.filter(p => {
    const byDate = p.date && new Date(p.date).getMonth()===moisActuel && new Date(p.date).getFullYear()===anneeActuelle;
    const byMois = p.moisC===moisActuel && p.anneeC===anneeActuelle;
    return allLocs.some(l=>l.id===p.locId) && (byDate||byMois) && p.type!=='caution';
  });
  const encaisséMois = paysMonth.reduce((s,p) => s+p.montant, 0);
  const tauxRecouvrement = totalLoyers > 0 ? Math.round(encaisséMois/totalLoyers*100) : 0;

  const tabs = [
    {id:'dashboard', label:'📊 Tableau de bord'},
    {id:'locataires', label:'👥 Locataires'},
    {id:'encaissements', label:'💰 Encaissements'},
    {id:'rapports', label:'📄 Rapports'},
  ];

  let html = `
  <div style="display:flex;flex-direction:column;height:100%;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1A6B45 0%,#0E6AAF 100%);color:#fff;padding:16px 20px;flex-shrink:0;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:16px;font-weight:700;">🏢 Portail Propriétaire</div>
          <div style="font-size:12px;opacity:0.8;margin-top:2px;">${immeubles.length} immeuble(s) · ${MNOMS_L[moisActuel]} ${anneeActuelle}</div>
        </div>
        <button onclick="document.getElementById('modal-portail-proprietaire').classList.remove('open')" 
          style="background:rgba(255,255,255,0.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>
      <!-- Tabs -->
      <div style="display:flex;gap:4px;margin-top:14px;overflow-x:auto;">
        ${tabs.map(t => `
          <button onclick="renderPortailProprietaire(${JSON.stringify(immeubles).replace(/"/g,"'")}, '${t.id}')"
            style="padding:7px 14px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;white-space:nowrap;background:${tab===t.id?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.15)'};color:${tab===t.id?'#1A6B45':'#fff'};">
            ${t.label}
          </button>`).join('')}
      </div>
    </div>

    <!-- Content -->
    <div id="proprio-portal-content" style="flex:1;overflow-y:auto;padding:16px;background:var(--bg);">`;

  // ── TAB: DASHBOARD ──────────────────────────────────────────────────────
  if (tab === 'dashboard') {
    html += `
      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;">
        <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Loyers/mois</div>
          <div style="font-size:22px;font-weight:800;color:var(--accent);margin-top:4px;">${fmtShort(totalLoyers)}</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Encaissé ${MNOMS[moisActuel]}</div>
          <div style="font-size:22px;font-weight:800;color:var(--green);margin-top:4px;">${fmtShort(encaisséMois)}</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Impayés cumulés</div>
          <div style="font-size:22px;font-weight:800;color:var(--red);margin-top:4px;">${fmtShort(totalImpayés)}</div>
          <div style="font-size:10px;color:var(--text3);">${nbImpayés} locataire(s)</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Recouvrement</div>
          <div style="font-size:22px;font-weight:800;color:${tauxRecouvrement>=80?'var(--green)':tauxRecouvrement>=50?'var(--yellow)':'var(--red)'};margin-top:4px;">${tauxRecouvrement}%</div>
        </div>
      </div>

      <!-- Immeubles cards -->
      <div style="font-size:13px;font-weight:700;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Mes immeubles</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
        ${immeubles.map(im => {
          const locs = DATA.locataires.filter(l => l.iid===im.id && l.s!=='libre');
          const libres = DATA.locataires.filter(l => l.iid===im.id && l.s==='libre').length;
          const imImpayés = locs.filter(l=>(l.reste||0)>0).length;
          const imLoyers = locs.reduce((s,l)=>s+l.loyer,0);
          return `<div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-left:4px solid ${im.col};">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${im.nom}</div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:10px;">📍 ${im.ville}${im.quartier?' · '+im.quartier:''}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
              <div style="background:var(--bg2);border-radius:6px;padding:6px;">
                <div style="color:var(--text3);">Locataires</div>
                <div style="font-weight:700;">${locs.length} <span style="color:var(--text3);font-weight:400;">(${libres} libre)</span></div>
              </div>
              <div style="background:var(--bg2);border-radius:6px;padding:6px;">
                <div style="color:var(--text3);">Impayés</div>
                <div style="font-weight:700;color:${imImpayés>0?'var(--red)':'var(--green)'};">${imImpayés}</div>
              </div>
              <div style="background:var(--bg2);border-radius:6px;padding:6px;grid-column:span 2;">
                <div style="color:var(--text3);">Loyers/mois</div>
                <div style="font-weight:700;color:var(--accent);">${fmtShort(imLoyers)} FCFA</div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // ── TAB: LOCATAIRES ────────────────────────────────────────────────────
  else if (tab === 'locataires') {
    html += `
      <div style="font-size:13px;font-weight:700;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">${allLocs.length} Locataires actifs</div>
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:var(--bg2);">
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:600;">Local</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:600;">Nom</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:600;">Immeuble</th>
              <th style="padding:10px 12px;text-align:right;color:var(--text3);font-weight:600;">Loyer</th>
              <th style="padding:10px 12px;text-align:center;color:var(--text3);font-weight:600;">Statut</th>
              <th style="padding:10px 12px;text-align:right;color:var(--text3);font-weight:600;">Reste dû</th>
            </tr>
          </thead>
          <tbody>
            ${allLocs.map((l,i) => {
              const im = DATA.immeubles.find(x=>x.id===l.iid);
              const isPaid = (l.reste||0) === 0;
              return `<tr style="border-top:1px solid var(--border);background:${i%2===0?'#fff':'#fafafa'};">
                <td style="padding:10px 12px;">${localBadge(l.appt)}</td>
                <td style="padding:10px 12px;font-weight:600;">${l.nom}</td>
                <td style="padding:10px 12px;color:var(--text3);">${im?im.nom:'–'}</td>
                <td style="padding:10px 12px;text-align:right;font-family:var(--mono);">${fmt(l.loyer)}</td>
                <td style="padding:10px 12px;text-align:center;">
                  <span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:${isPaid?'var(--green-bg)':'var(--red-bg)'};color:${isPaid?'var(--green)':'var(--red)'};">
                    ${isPaid?'✓ À jour':'⚠ Impayé'}
                  </span>
                </td>
                <td style="padding:10px 12px;text-align:right;font-family:var(--mono);color:${(l.reste||0)>0?'var(--red)':'var(--green)'};">
                  ${(l.reste||0)>0?fmt(l.reste):'–'}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ── TAB: ENCAISSEMENTS ─────────────────────────────────────────────────
  else if (tab === 'encaissements') {
    const allPays = DATA.paiements
      .filter(p => allLocs.some(l=>l.id===p.locId))
      .sort((a,b) => b.date.localeCompare(a.date))
      .slice(0, 50);
    html += `
      <div style="font-size:13px;font-weight:700;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Derniers versements</div>
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:var(--bg2);">
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:600;">Date</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:600;">Locataire</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:600;">Immeuble</th>
              <th style="padding:10px 12px;text-align:center;color:var(--text3);font-weight:600;">Type</th>
              <th style="padding:10px 12px;text-align:right;color:var(--text3);font-weight:600;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${allPays.map((p,i) => {
              const l = DATA.locataires.find(x=>x.id===p.locId);
              const im = l ? DATA.immeubles.find(x=>x.id===l.iid) : null;
              return `<tr style="border-top:1px solid var(--border);background:${i%2===0?'#fff':'#fafafa'};">
                <td style="padding:10px 12px;font-family:var(--mono);color:var(--text3);">${p.date?p.date.split('-').reverse().join('/'):'–'}</td>
                <td style="padding:10px 12px;font-weight:600;">${l?l.nom:'–'}</td>
                <td style="padding:10px 12px;color:var(--text3);">${im?im.nom:'–'}</td>
                <td style="padding:10px 12px;text-align:center;">
                  <span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:${p.type==='caution'?'var(--purple-bg)':'var(--green-bg)'};color:${p.type==='caution'?'var(--purple)':'var(--green)'};">${p.type}</span>
                </td>
                <td style="padding:10px 12px;text-align:right;font-weight:700;font-family:var(--mono);color:var(--green);">${fmt(p.montant)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ── TAB: RAPPORTS ──────────────────────────────────────────────────────
  else if (tab === 'rapports') {
    html += `
      <div style="font-size:13px;font-weight:700;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Télécharger les rapports</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${immeubles.map(im => `
          <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:13px;">${im.nom}</div>
              <div style="font-size:11px;color:var(--text3);">📍 ${im.ville}</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button onclick="window._rptIid=${im.id};window._rptMois=${moisActuel};window._rptAnnee=${anneeActuelle};document.getElementById('modal-portail-proprietaire').classList.remove('open');setTimeout(()=>previewRapportMensuel(${im.id}),200)" 
                style="padding:7px 12px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">
                👁 Aperçu
              </button>
              <button onclick="window._rptIid=${im.id};window._rptMois=${moisActuel};window._rptAnnee=${anneeActuelle};document.getElementById('modal-portail-proprietaire').classList.remove('open');setTimeout(()=>genDocxRapportMensuel(${im.id}),200)" 
                style="padding:7px 12px;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">
                📊 .docx
              </button>
            </div>
          </div>`).join('')}
        <!-- Fiches de suivi -->
        <div style="font-size:13px;font-weight:700;color:var(--text2);margin-top:8px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Fiches de suivi</div>
        ${allLocs.map(l => {
          const im = DATA.immeubles.find(x=>x.id===l.iid);
          return `<div style="background:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;font-size:12px;">${l.nom}</div>
              <div style="font-size:11px;color:var(--text3);">${im?im.nom:''} · Local ${l.appt||'–'}</div>
            </div>
            <button onclick="document.getElementById('modal-portail-proprietaire').classList.remove('open');setTimeout(()=>ouvrirFicheSuivi(${l.id}),200)" 
              style="padding:6px 12px;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">
              📋 Fiche
            </button>
          </div>`;
        }).join('')}
      </div>`;
  }

  html += `</div></div>`;
  
  const modalInner = modal.querySelector('.modal');
  if (modalInner) {
    modalInner.innerHTML = html;
  }
}

function openPortailProprietaire() {
  const immeubles = getVisibleImmeubles ? getVisibleImmeubles() : DATA.immeubles;
  renderPortailProprietaire(immeubles, 'dashboard');
  document.getElementById('modal-portail-proprietaire').classList.add('open');
  // OneSignal: associer le propriétaire
  if (typeof loginOneSignal === 'function' && SESSION && SESSION.role === 'proprietaire') {
    loginOneSignal('pro_' + SESSION.userId, { role: 'proprietaire' });
    setTimeout(requestNotificationPermission, 2000);
  }
}

function closePortailProprietaire() {
  document.getElementById('modal-portail-proprietaire').classList.remove('open');
}

window.addEventListener('DOMContentLoaded', () => {
  loadUsers();
  loadSession(); // DEPLOY17: SESSION restauré avant loadData pour que can() soit opérationnel
  _purgeUsersIndiv(); // Retirer gestionnaire/comptable si mode individuel
  loadData();
  // Slideshow
  var _asi=0; var _asl=document.querySelectorAll('.aslide');
  if(_asl.length>1) setInterval(function(){_asl[_asi].style.opacity='0';_asi=(_asi+1)%_asl.length;_asl[_asi].style.opacity='1';},4000);
  window._authRole='admin';
  purgerCorbeilleAuto();
  // Close modal on overlay click
  document.addEventListener('click', hideCtxMenu);
  document.addEventListener('scroll', hideCtxMenu);
  document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', e => { if(e.target===o) closeModals(); });
  });
  // If session exists, skip login
  if (SESSION) {
    document.getElementById('auth-screen').style.display = 'none';
    // Show AI button for all logged-in users
    var aib = document.getElementById('ai-float-btn');
    if (aib) aib.style.display = 'flex';
    // If locataire, open portail directly
    if (SESSION && SESSION.role === 'locataire') {
      document.getElementById('app-shell').style.display = 'flex';
      initApp();
      setTimeout(() => openPortailLocataire(), 300);
    } else if (SESSION && SESSION.role === 'proprio') {
      document.getElementById('app-shell').style.display = 'flex';
      initApp();
      setTimeout(() => openPortailProprietaire(), 300);
    } else {
      document.getElementById('app-shell').style.display = 'flex';
      initApp();
      updateCorbeilleBadge();
    }
  } else {
    var as = document.getElementById('auth-screen');
    if(as) as.style.display = 'flex';
    // Verifie si un portail est demande dans l'URL
    checkPortailParam();
  }
  // else show auth screen (already visible by default)
});

