# Specificațiile care se pot introduce în profilul SOP

Citite din `index.html` (editorul de profil, secțiunile 1–8) și din schema `qpcr-sop-profile/1`.
**103 specificații**, fiecare cu un exemplu de configurare. Lista completă, rând cu rând, în
`SPECIFICATII_SOP.csv`.

Exemplele urmează profilul SC_ / SOP-06 acolo unde acesta are o valoare; în rest sunt valori
plauzibile, de pornire. Nu sunt valori validate — fiecare trebuie înlocuită cu cea din procedura
dumneavoastră.

## De ce este nevoie ca să funcționeze

Pagina pornește de la un profil complet, cu valori implicite, deci nimic nu este blocat.
Ca profilul să însemne ceva pentru laboratorul dumneavoastră, minimul este:

1. **Identitatea** — nume și versiune (secțiunea 1), pentru că apar în fiecare export.
2. **Cel puțin o regulă de țintă** cu prag Cq (secțiunea 2).
3. **Controalele** — cel puțin NTC și un control pozitiv, cu tiparul de nume folosit în laborator
   (secțiunea 3). Fără o regulă de control pozitiv, graficele de metodă și de operator rămân goale.
4. **Replicatele** — minim pe probă și câte trebuie detectate pentru un pozitiv (secțiunea 4).
5. **Acceptarea rulării** — ce se respinge și ce se marchează pentru verificare (secțiunea 5).

Restul are valori implicite și se schimbă numai dacă laboratorul are alte cerințe.

## Toate specificațiile

### 1 · Identitatea procedurii — 11

| câmp | ce se introduce | valori permise | implicit | **exemplu** | oblig. |
|---|---|---|---|---|---|
| `name` | Numele profilului; apare în fiecare export. | — | Generic qPCR (MIQE-style defaults) | "SC screening — SOP-06 laboratory default" | da |
| `version` | Versiunea profilului; apare în fiecare export. | — | 1.0 | "1.0" | da |
| `author` | Cine a scris sau a aprobat profilul. | — | (gol) | "A. Analyst" | nu |
| `assay` | Denumirea metodei de analiză. | — | (gol) | "GMO screening SOP-06 (35S / T-NOS cu referință HMG sau LEC)" | nu |
| `lab.name` | Numele laboratorului. | — | (gol) | "Laboratorul de biologie moleculară" | nu |
| `lab.analyst` | Analistul implicit. | — | (gol) | "A. Analyst" | nu |
| `effective` | Data de la care se aplică profilul. | — | (gol) | "2026-01-15" | nu |
| `notes` | Observații libere. | — | text implicit de avertizare | "Profil implicit pentru experimentele SC_. Doar verificare, până la confirmarea deciziilor de acceptare." | nu |
| `locked` | Blochează profilul: câmpurile devin needitabile. | adevărat / fals | fals | false (fals) cât timp se lucrează la el; true după aprobare | nu |
| `schema` | Versiunea schemei; scrisă de pagină. | qpcr-sop-profile/1 | qpcr-sop-profile/1 | "qpcr-sop-profile/1" | automat |
| `sha256` | Amprenta profilului; recalculată la fiecare modificare. | — | (calculat) | "339bff478cf7575d…" (calculat de pagină) | automat |

### 2 · Ținte, praguri Cq și zona de semnal tardiv — 6

| câmp | ce se introduce | valori permise | implicit | **exemplu** | oblig. |
|---|---|---|---|---|---|
| `targets[].match` | Tiparul de nume al țintei. Rândurile se încearcă de sus în jos; se aplică primul care se potrivește. | nume, listă cu \|, joker * și ?, sau expresie regulată /…/i | * | "HMG\|hmgA\|LEC\|Le1" pentru referințe; "35S\|P35S\|CaMV P-35S\|T-NOS\|T-nos\|TNOS" pentru ținte; "*" pentru restul | da |
| `targets[].kind` | Felul țintei: automat, țintă, genă de referință, control intern / de inhibiție. | auto · target · reference · ic | auto | "reference" pentru HMG / LEC, "target" pentru 35S / T-NOS | da |
| `targets[].cqMax` | Cq peste acest prag = nedetectat. | — | 40 | 40 | da |
| `targets[].cqLate` | Cq mediu peste această valoare primește verdictul de semnal tardiv. | — | (gol) | 36 la referință, 38 la țintă | nu |
| `targets[].quantMin` | Cantitate sub acest prag primește verdictul de semnal tardiv / valoare mică. | — | (gol) | gol la screening calitativ; 0,005 la cuantificare | nu |
| `targets[].lateOutcome` | Verdictul dat în zona tardivă sau sub cantitatea minimă. | Inconclusive · Repeat · Positive | Inconclusive | "Inconclusive" la referință, "Repeat" la țintă | da |

### 3 · Controale — 12

| câmp | ce se introduce | valori permise | implicit | **exemplu** | oblig. |
|---|---|---|---|---|---|
| `controls[].name` | Numele controlului, așa cum apare în rapoarte. | — |  | "NTC", "Extraction blank", "415B — 35S LOD control" | da |
| `controls[].matchBy` | Potrivire după numele probei sau după rolul recunoscut (NTC, Blank, Negative control, Positive control, Calibrator, Standard). | name · role | name | "name" (după numele probei) | da |
| `controls[].match` | Tiparul care identifică godeurile controlului. | aceleași tipare ca la ținte |  | "/^NTC$/i", "/^(BLANK\|BLK)\s*EX/i", "/^415B(?=\b\|\d)/i" | da |
| `controls[].targets` | Pentru ce ținte se aplică regula. | tipar de țintă sau * | * | "*", sau "35S\|P35S\|CaMV P-35S", sau "HMG\|hmgA" | da |
| `controls[].expect` | Ce trebuie să arate: obligatoriu negativ, obligatoriu pozitiv, sau standard (fără verdict). | negative · positive · standard | negative | "negative" la NTC și martori, "positive" la controlul LOD și la referință | da |
| `controls[].cqLo` | Limita inferioară acceptată a Cq. Gol = orice detecție este acceptabilă. | — | (gol) | 29 la controlul LOD 415B; 20 la referința HMG | nu |
| `controls[].cqHi` | Limita superioară acceptată a Cq. | — | (gol) | 36 la controlul LOD 415B; 27 la referința HMG | nu |
| `controls[].minPerRun` | Câte godeuri de acest fel trebuie să existe într-o rulare. | — | 1 | 1 la NTC; 0 dacă nu este obligatoriu în fiecare rulare | da |
| `controls[].minReplicates` | Câte replicate trebuie să aibă controlul. | — | 1 | 2 la controalele de material de referință | nu |
| `controls[].purpose` | La ce servește controlul (text liber). | — | (gol) | "reaction blank", "LOD positive control", "reference amplification" | nu |
| `controls[].material` | Materialul de referință folosit. | — | (gol) | "ERM-BF415b", "ERM-BF410cp" | nu |
| `controls[].onFail` | Ce se întâmplă dacă acest control cade: rulare respinsă, marcată pentru verificare, sau necontrolat. | reject · review · off | reject | "review" cât timp profilul este în verificare; "reject" după aprobare | da |

### 4 · Replicate și control intern — 9

| câmp | ce se introduce | valori permise | implicit | **exemplu** | oblig. |
|---|---|---|---|---|---|
| `replicates.min` | Numărul minim de replicate pe probă. | — | 1 | 2 | da |
| `replicates.positiveMin` | Câte replicate trebuie detectate pentru un rezultat pozitiv (limitat la numărul de replicate existente). | — | 1 | 2 | da |
| `replicates.partialOutcome` | Verdictul când doar o parte dintre replicate sunt detectate. | Positive · Negative · Inconclusive · Repeat · Invalid | Inconclusive | "Repeat" | da |
| `replicates.maxSd` | Abaterea standard maximă acceptată între replicate. | — | 0,5 | 0,5 | da |
| `replicates.sdOutcome` | Verdictul când se depășește abaterea standard. „flag” = doar se semnalează, verdictul rămâne. | Positive · Negative · Inconclusive · Repeat · Invalid · flag | Repeat | "Repeat" | da |
| `ic.referenceCq` | Cq de referință fix pentru controlul intern. Gol = se folosește mediana rulării. | — | (gol) | gol (se folosește mediana rulării); 28,4 dacă urmăriți o referință fixă | nu |
| `ic.maxShift` | Abaterea maximă a controlului intern, în cicluri. | — | 2 | 2 | da |
| `ic.shiftOutcome` | Verdictul unui negativ cu control intern deplasat (inhibiție). | Positive · Negative · Inconclusive · Repeat · Invalid | Inconclusive | "Inconclusive" | da |
| `ic.missingOutcome` | Verdictul când controlul intern sau referința nu se detectează. | Positive · Negative · Inconclusive · Repeat · Invalid · flag | Invalid | "Invalid" | da |

### 5 · Acceptarea rulării — 17

| câmp | ce se introduce | valori permise | implicit | **exemplu** | oblig. |
|---|---|---|---|---|---|
| `run.integrity` | Ce se face când suma de control a fișierului nu se verifică. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | reject | "reject" | da |
| `run.runState` | Ce se face când rularea nu s-a încheiat. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | reject | "reject" | da |
| `run.controlsMissing` | Ce se face când lipsește un control obligatoriu. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | reject | "review" în faza de verificare; "reject" după aprobare | da |
| `run.controlsFail` | Acțiunea de rezervă când un control cade; în mod normal se dă per control, la „If it fails”. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | reject | "review" în faza de verificare; "reject" după aprobare | nu |
| `run.stdCurve` | Ce se face când curba standard iese din limite. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | review | "review" | da |
| `run.minR2` | R² minim acceptat pentru curba standard. | — | 0,98 | 0,98 | da |
| `run.effMin` | Eficiența minimă acceptată. | — | 90 | 90 | da |
| `run.effMax` | Eficiența maximă acceptată. | — | 110 | 110 | da |
| `run.minLogs` | Domeniul dinamic minim al curbei standard. | — | 3 | 3 | da |
| `run.ntcGap` | Distanța minimă, în cicluri, între NTC și proba cea mai apropiată. | — | 3 | 3 | da |
| `run.ntcGapAction` | Ce se face când distanța este prea mică. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | review | "review" | da |
| `run.editDelayHours` | Câte ore sunt acceptate între sfârșitul rulării și ultima modificare. | — | 72 | 72 | da |
| `run.editAction` | Ce se face la modificări ulterioare. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | review | "review" | da |
| `run.calibration` | Ce se face când calibrarea a expirat. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | review | "review" | da |
| `run.maxZoneSpread` | Diferența maximă acceptată între zonele blocului. | — | 1,5 | 1,5 | da |
| `run.zoneAction` | Ce se face când se depășește. | reject (respinge rularea) · review (marchează pentru verificare) · off (nu verifica) | review | "review" | da |
| `run.invalidRunOverrides` | Dacă o rulare respinsă înlocuiește toate verdictele probelor. | adevărat / fals | adevărat | false în faza de verificare; true după aprobare | da |

### 6 · Verdicte, culori și formulare de raport — 30

Zece verdicte, fiecare cu etichetă, culoare și frază de raport.
Substituenți: `{sample} {target} {cq} {sd} {det} {n} {cutoff} {reason} {outcome} {run}`.

| verdict | etichetă | culoare | frază de raport |
|---|---|---|---|
| `Positive` — Pozitiv | "Detectat" | `#dc2626` | "{target} detectat (Cq mediu {cq}; {det}/{n} replicate)" |
| `Negative` — Negativ | "Nedetectat" | `#64748b` | "{target} nedetectat ({n} replicate; prag Cq {cutoff})" |
| `Inconclusive` — Neconcludent | "Neconcludent" | `#d97706` | "{target} neconcludent: {reason}" |
| `Repeat` — De repetat | "De repetat" | `#7c3aed` | "{target}: de repetat — {reason}" |
| `Invalid` — Invalid | "Rezultat invalid" | `#111827` | "{target}: invalid — {reason}" |
| `Invalid run` — Rulare invalidă | "Rulare invalidă" | `#9f1239` | "Rulare neacceptată — {reason}" |
| `Control pass` — Control acceptat | "Control acceptat" | `#16a34a` | "{sample} / {target}: control acceptat" |
| `Control fail` — Control căzut | "Control căzut" | `#e11d48` | "{sample} / {target}: control CĂZUT — {reason}" |
| `Standard` — Standard | "Standard" | `#0891b2` | "{sample} / {target}: standard" |
| `Not interpreted` — Neinterpretat | "Neinterpretat" | `#cbd5e1` | "{target}: neinterpretat" |

### 7 · Setări de grafic — 3

| câmp | ce se introduce | valori permise | implicit | **exemplu** | oblig. |
|---|---|---|---|---|---|
| `graphs.showCutoffs` | Desenează liniile de prag Cq. | adevărat / fals | adevărat | true | nu |
| `graphs.showLate` | Desenează liniile de semnal tardiv. | adevărat / fals | adevărat | true | nu |
| `graphs.showSdLimit` | Desenează limita abaterii standard. | adevărat / fals | adevărat | true | nu |

### 8 · Grafice de control (per grafic, din panoul de control) — 15

| câmp | ce se introduce | valori permise | implicit | **exemplu** | oblig. |
|---|---|---|---|---|---|
| `controlCharts[id].enabled` | Dacă graficul este folosit. | adevărat / fals | adevărat | true | nu |
| `controlCharts[id].type` | Tipul de grafic de control. | i · ewma · cusum · trend · xbars · p · u · c · funnel | (implicit al graficului) | "i" la B-H1; "ewma" la B-H8; "trend" la B-H4 | nu |
| `controlCharts[id].x` | Ce se pune pe axa X. | order · date · hours · cycles | order | "date" la B-H1 și A-H3; "hours" la B-O11 | nu |
| `controlCharts[id].phase1` | Câte rulări formează linia de bază. | — | 20 | 20 | nu |
| `controlCharts[id].lambda` | Ponderea memoriei pentru EWMA. | — | 0,2 | 0,2 | nu |
| `controlCharts[id].L` | Lățimea limitelor EWMA, în sigma. | — | 2,7 | 2,7 | nu |
| `controlCharts[id].k` | Pragul de referință CUSUM. | — | 0,5 | 0,5 | nu |
| `controlCharts[id].h` | Intervalul de decizie CUSUM. | — | 4 | 4 | nu |
| `controlCharts[id].specLo` | Limita de specificație inferioară, dacă laboratorul o are. | gol = fără limită | (gol) | 4,3 la viteza de încălzire (B-H1) | nu |
| `controlCharts[id].specHi` | Limita de specificație superioară. | gol = fără limită | (gol) | 5,58 la viteza de încălzire (B-H1) | nu |
| `controlCharts[id].warnAhead` | Cu câte rulări înainte se avertizează la tendință. | — | 10 | 10 | nu |
| `controlCharts[id].baseFrom` | De la ce rulare începe linia de bază (de exemplu după un service). | — | (gol) | "2025-05-12" — linie de bază nouă după service | nu |
| `controlCharts[id].trendFit` | Pe ce interval se ajustează dreapta de tendință. | phase1 · all | phase1 | "phase1" | nu |
| `controlCharts[id].rules.r2..r5` | Regulile Western Electric 2–5, pe lângă regula 3σ. | adevărat / fals | toate adevărate | toate adevărate; r4 și r5 oprite la graficele care urmează compoziția plăcii | nu |
| `controlCharts[id].action` | Ce se întâmplă la o alarmă. | review · off | review | "review" | nu |

## Două lucruri de știut

- `run.controlsFail` există în schemă, dar nu are câmp propriu în formular: acțiunea la un control
  căzut se dă per control, la „If it fails”, iar valoarea din `run` rămâne doar rezervă.
- Secțiunea 8 nu se completează în editorul de profil: fiecare grafic de control se configurează pe
  pagina lui din panoul de control, iar setările se salvează în profil sub `controlCharts` și îi
  schimbă suma SHA-256.
