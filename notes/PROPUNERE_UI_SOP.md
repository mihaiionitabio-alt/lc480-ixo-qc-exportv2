# Configurarea SOP — o propunere de interfață

## Ce face configurarea grea acum

Din cele 103 specificații numărate în editorul actual:

| problemă | cifra |
|---|---|
| câmpuri în formular, pe 8 secțiuni deschise una câte una | 103 |
| tipare de potrivire scrise de mână, ca expresii regulate | 16 (3 ținte + 13 controale) |
| câmpuri care repetă aceeași alegere *respinge / verifică / nu verifica* | 12 |
| câmpuri fără niciun răspuns până la salvare (nu se vede ce se potrivește) | toate |
| câmpuri care nu au deloc formular și se editează în JSON | 6 |

Cel mai costisitor este al doilea rând. `/^(BLANK|BLK)\s*EX/i` se scrie corect din prima doar
dacă omul știe deja sintaxa; o greșeală nu dă eroare, ci pur și simplu nu se potrivește nimic,
iar graficele rămân goale fără să spună de ce.

## Propunerea, în trei idei

**1. Profilul se construiește din rulările încărcate, nu de la zero.** Pagina citește deja numele
de probe, țintele și rolurile din fiecare fișier. Ecranul de controale le grupează, arată de câte
ori apare fiecare grup, iar utilizatorul alege doar rolul dintr-o listă. Tiparul se scrie singur și
rămâne editabil. Lângă fiecare rând, numărul de godeuri care se potrivesc, recalculat la fiecare
tastă: o greșeală de tipar se vede imediat, ca „0 potriviri”.

**2. Un singur regim în loc de douăsprezece alegeri.** Cele 12 reguli de acceptare primesc trei
regimuri — *Verificare*, *Rutină*, *Strict* — care le completează odată. Fiecare regulă poate fi
schimbată separat, iar coloana „schimbat de mine” arată exact ce s-a abătut de la regim.

**3. Efectul se vede înainte de salvare.** O bară permanentă jos spune ce devin rulările încărcate
cu profilul de acum: acceptate, de verificat, respinse. Pe fiecare regulă, câte rulări o declanșează.
La final, un rezumat cu ce se schimbă față de versiunea salvată, efectul pe rulări, noua sumă
SHA-256 și verificările rămase de completat.

## Cele trei ecrane

| # | ecran | ce rezolvă |
|---|---|---|
| 1 | Controale, din numele găsite | scrierea tiparelor și ferestrele Cq, pe un singur ecran |
| 2 | Cât de strict judecă o rulare | cele 12 alegeri repetitive, printr-un regim |
| 3 | Ce se schimbă | verificarea înainte de salvare și trasabilitatea |

## Ce nu se schimbă

Schema `qpcr-sop-profile/1` rămâne aceeași — interfața scrie exact aceleași câmpuri, deci profilele
existente se deschid mai departe, iar editarea în JSON rămâne disponibilă pentru cele 6 câmpuri
fără formular. Valorile Cq stocate, verdictele aparatului și curbele nu sunt atinse de nimic din
ceea ce se propune aici.

## Ce ar mai merita adăugat, dar nu apare în mockup

- Un buton „compară cu profilul aprobat” care arată diferențele față de o versiune de referință.
- Import al listei de controale dintr-un tabel, pentru laboratoarele care o țin deja în Excel.
- Avertisment la salvare dacă o țintă din rulările încărcate nu are nicio regulă care să o prindă.

**Notă:** cifrele din mockup (55 de rulări, 41 acceptate, 110 godeuri NTC) sunt din setul
demonstrativ LC-DEMO-02, ca ilustrație. Nu sunt măsurători dintr-un laborator.
