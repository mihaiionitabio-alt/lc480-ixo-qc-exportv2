# Secțiunile 1–5 ale profilului SOP, cu valorile folosite în pagină

Fiecare valoare de mai jos este cea pe care `index.html` o produce el însuși: profilul implicit
`SOP_PRESETS.sc()`, care pornește din `sopBase()` și suprascrie o parte din câmpuri. Coloana
**sursa** spune care dintre cele două a stabilit valoarea. Nu am inventat nimic aici.

**54 câmpuri.** Același conținut, rând cu rând, în `SOP_1-5_VALORI_HTML.csv`.

## 1 · Identitatea procedurii — 11

| câmp | ce este | valoarea din pagină | sursa |
|---|---|---|---|
| `name` | numele profilului | SC screening — SOP-06 laboratory default | `SOP_PRESETS.sc()` |
| `version` | versiunea | 1.0 | `SOP_PRESETS.sc()` |
| `assay` | metoda de analiză | GMO screening SOP-06 (35S / T-NOS with HMG or LEC reference) | `SOP_PRESETS.sc()` |
| `notes` | observații | Laboratory default for SC_ experiments. Review-only until the approved SOP owner confirms acceptance decisions and the comparison direction in section 6.2 c5. | `SOP_PRESETS.sc()` |
| `author` | autor / aprobator | (gol) | `sopBase()` |
| `lab.name` | laboratorul | (gol) | `sopBase()` |
| `lab.analyst` | analistul | (gol) | `sopBase()` |
| `effective` | în vigoare de la | (gol) | `sopBase()` |
| `locked` | profil blocat | false | `sopBase()` |
| `schema` | schema | qpcr-sop-profile/1 | `sopBase()` |
| `sha256` | amprenta | calculată la fiecare modificare | `pagina` |

## 2 · Ținte, praguri Cq și zona de semnal tardiv — 3

| câmp | ce este | valoarea din pagină | sursa |
|---|---|---|---|
| `targets[0]` | regula 1 | match=HMG\|hmgA\|LEC\|Le1 · kind=reference · cqMax=40 · cqLate=36 · quantMin=(gol) · lateOutcome=Inconclusive | `SOP_PRESETS.sc()` |
| `targets[1]` | regula 2 | match=35S\|P35S\|CaMV P-35S\|T-NOS\|T-nos\|TNOS · kind=target · cqMax=40 · cqLate=38 · quantMin=(gol) · lateOutcome=Repeat | `SOP_PRESETS.sc()` |
| `targets[2]` | regula 3 | match=* · kind=target · cqMax=40 · cqLate=38 · quantMin=(gol) · lateOutcome=Repeat | `SOP_PRESETS.sc()` |

## 3 · Controale — 13

| câmp | ce este | valoarea din pagină | sursa |
|---|---|---|---|
| `controls[ntc]` | NTC | match=/^NTC$/i · targets=* · expect=negative · cqLo=(gol) · cqHi=(gol) · minPerRun=0 · minReplicates=1 · matchBy=name · onFail=review · purpose=reaction blank | `SOP_PRESETS.sc()` |
| `controls[extr]` | Extraction blank | match=/^(BLANK\|BLK)\s*EX/i · targets=* · expect=negative · cqLo=(gol) · cqHi=(gol) · minPerRun=0 · minReplicates=1 · matchBy=name · onFail=review · purpose=extraction process blank | `SOP_PRESETS.sc()` |
| `controls[grind]` | Grinding / environment blank | match=/^(BLANK\|BLK)\s*MAC/i · targets=* · expect=negative · cqLo=(gol) · cqHi=(gol) · minPerRun=0 · minReplicates=1 · matchBy=name · onFail=review · purpose=grinding/environment blank | `SOP_PRESETS.sc()` |
| `controls[cn-maize]` | Negative maize — target | match=/^(CN\|NC)\s+PORUMB\b/i · targets=35S\|P35S\|CaMV P-35S\|T-NOS\|T-nos\|TNOS · expect=negative · cqLo=(gol) · cqHi=(gol) · minPerRun=0 · minReplicates=1 · matchBy=name · onFail=review · purpose=negative matrix control | `SOP_PRESETS.sc()` |
| `controls[cn-maize-ref]` | Negative maize — HMG reference | match=/^(CN\|NC)\s+PORUMB\b/i · targets=HMG\|hmgA · expect=positive · cqLo=20 · cqHi=27 · minPerRun=0 · minReplicates=1 · matchBy=name · onFail=review · purpose=reference amplification | `SOP_PRESETS.sc()` |
| `controls[cn-soy]` | Negative soy — target | match=/^(CN\|NC)\s+SOIA\b/i · targets=35S\|P35S\|CaMV P-35S\|T-NOS\|T-nos\|TNOS · expect=negative · cqLo=(gol) · cqHi=(gol) · minPerRun=0 · minReplicates=1 · matchBy=name · onFail=review · purpose=negative matrix control | `SOP_PRESETS.sc()` |
| `controls[cn-soy-ref]` | Negative soy — LEC reference | match=/^(CN\|NC)\s+SOIA\b/i · targets=LEC\|Le1 · expect=positive · cqLo=20 · cqHi=27 · minPerRun=0 · minReplicates=1 · matchBy=name · onFail=review · purpose=reference amplification | `SOP_PRESETS.sc()` |
| `controls[crm-415b-35s]` | 415B — 35S LOD control | match=/^415B(?=\b\|\d)/i · targets=35S\|P35S\|CaMV P-35S · expect=positive · cqLo=29 · cqHi=36 · minPerRun=0 · minReplicates=2 · matchBy=name · onFail=review · purpose=LOD positive control · material=ERM-BF415b | `SOP_PRESETS.sc()` |
| `controls[crm-415b-tnos]` | 415B — T-NOS LOD control | match=/^415B(?=\b\|\d)/i · targets=T-NOS\|T-nos\|TNOS · expect=positive · cqLo=29 · cqHi=36 · minPerRun=0 · minReplicates=2 · matchBy=name · onFail=review · purpose=LOD positive control · material=ERM-BF415b | `SOP_PRESETS.sc()` |
| `controls[crm-415b-hmg]` | 415B — HMG reference | match=/^415B(?=\b\|\d)/i · targets=HMG\|hmgA · expect=positive · cqLo=20 · cqHi=27 · minPerRun=0 · minReplicates=2 · matchBy=name · onFail=review · purpose=reference amplification · material=ERM-BF415b | `SOP_PRESETS.sc()` |
| `controls[crm-410cp-35s]` | 410CP — 35S LOD control | match=/^410CP(?=\b\|\d)/i · targets=35S\|P35S\|CaMV P-35S · expect=positive · cqLo=29 · cqHi=36 · minPerRun=0 · minReplicates=2 · matchBy=name · onFail=review · purpose=LOD positive control · material=ERM-BF410cp | `SOP_PRESETS.sc()` |
| `controls[crm-410cp-tnos]` | 410CP — T-NOS LOD control | match=/^410CP(?=\b\|\d)/i · targets=T-NOS\|T-nos\|TNOS · expect=positive · cqLo=29 · cqHi=36 · minPerRun=0 · minReplicates=2 · matchBy=name · onFail=review · purpose=LOD positive control · material=ERM-BF410cp | `SOP_PRESETS.sc()` |
| `controls[crm-410cp-lec]` | 410CP — LEC reference | match=/^410CP(?=\b\|\d)/i · targets=LEC\|Le1 · expect=positive · cqLo=20 · cqHi=27 · minPerRun=0 · minReplicates=2 · matchBy=name · onFail=review · purpose=reference amplification · material=ERM-BF410cp | `SOP_PRESETS.sc()` |

## 4 · Replicate și control intern — 10

| câmp | ce este | valoarea din pagină | sursa |
|---|---|---|---|
| `replicates.min` | replicate minime pe probă | 2 | `SOP_PRESETS.sc()` |
| `replicates.positiveMin` | replicate detectate pentru un pozitiv | 2 | `SOP_PRESETS.sc()` |
| `replicates.partialOutcome` | verdict la detecție parțială | Repeat | `SOP_PRESETS.sc()` |
| `replicates.maxSd` | abaterea standard maximă (Cq) | 0.5 | `SOP_PRESETS.sc()` |
| `replicates.sdOutcome` | verdict la depășirea abaterii | Repeat | `SOP_PRESETS.sc()` |
| `replicates.by_role` | replicate pe rol (câmp suplimentar, nu apare în formular) | sample=2 · positive control=2 · calibrator=2 · negative control=1 · NTC=1 · blank=1 | `SOP_PRESETS.sc()` |
| `ic.referenceCq` | Cq de referință fix pentru controlul intern | (gol) — se folosește mediana rulării | `sopBase()` |
| `ic.maxShift` | abaterea maximă a controlului intern (cicluri) | 2 | `sopBase()` |
| `ic.shiftOutcome` | verdict la negativ cu control intern deplasat | Inconclusive | `sopBase()` |
| `ic.missingOutcome` | verdict când controlul intern nu se detectează | Invalid | `sopBase()` |

## 5 · Acceptarea rulării — 17

| câmp | ce este | valoarea din pagină | sursa |
|---|---|---|---|
| `run.integrity` | suma de control a fișierului cade | reject | `sopBase()` |
| `run.runState` | rulare neterminată | reject | `sopBase()` |
| `run.controlsMissing` | lipsește un control obligatoriu | review | `SOP_PRESETS.sc()` |
| `run.controlsFail` | un control cade (rezervă; normal se dă per control) | review | `SOP_PRESETS.sc()` |
| `run.stdCurve` | curba standard în afara limitelor | review | `sopBase()` |
| `run.minR2` | R² minim | 0.98 | `sopBase()` |
| `run.effMin` | eficiență minimă (%) | 90 | `sopBase()` |
| `run.effMax` | eficiență maximă (%) | 110 | `sopBase()` |
| `run.minLogs` | domeniu dinamic minim (log10) | 3 | `sopBase()` |
| `run.ntcGap` | distanța minimă NTC – probă (cicluri) | 3 | `sopBase()` |
| `run.ntcGapAction` | distanța NTC prea mică | review | `sopBase()` |
| `run.editDelayHours` | ore maxime până la ultima modificare | 72 | `sopBase()` |
| `run.editAction` | modificat ulterior / creat după rulare | review | `sopBase()` |
| `run.calibration` | calibrare expirată (QuantStudio) | review | `sopBase()` |
| `run.maxZoneSpread` | diferența maximă între zonele blocului (°C) | 1.5 | `sopBase()` |
| `run.zoneAction` | diferența depășită | review | `sopBase()` |
| `run.invalidRunOverrides` | rulare respinsă → toate probele „Rulare invalidă” | false | `SOP_PRESETS.sc()` |

## De reținut

- Cele 13 controale sunt construite în pagină de o funcție ajutătoare, deci toate au
  `matchBy=name`, `minPerRun=0` și `onFail=review`. `minPerRun=0` înseamnă că prezența nu este
  impusă; `onFail=review` înseamnă că profilul este încă în regim de verificare.
- `replicates.by_role` și câmpurile de metodă (`method`, `procedure`, `interpretation`,
  `materials`, `sample_id`) există în profil, dar nu au câmp în formular: se editează din JSON.
- Secțiunile 6–8 (verdicte și culori, setări de grafic, grafice de control) rămân pe valorile
  implicite ale paginii — `sc()` nu le atinge.
