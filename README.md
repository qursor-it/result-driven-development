# RDD — Result Driven Development

> Lo sviluppatore non risponde più del codice che viene scritto, ma del risultato atteso.

RDD è un framework di sviluppo pensato per un mondo in cui il codice lo scrivono gli agenti.
Non è Test Driven Development e non è Spec Driven Development: l'unità di verità non è il test
né la spec, ma **il risultato osservato**.

L'umano approva tre cose sole:

1. il **Result Contract** — cosa deve accadere, osservabile dall'esterno, con soglie;
2. le **capability** — cosa il software può toccare (rete, file, dati, permessi), negato tutto il resto;
3. l'**Evidence** — la prova raccolta da un Witness indipendente dal Builder.

Il codice è un sottoprodotto: rigenerabile, non revisionato riga per riga.

Autori: **Bernardo Manfriani** e **Gianmarco Ferruzzi** (Qursor).

## Cosa c'è

| Percorso | Cosa |
|---|---|
| `MANIFESTO.md` | gli otto principi |
| `spec/RDD.md` | il metodo, normativo |
| `spec/result-contract.schema.json` | schema del Result Contract |
| `spec/evidence.schema.json` | schema dell'Evidence Bundle |
| `adr/` | 12 decisioni fondative (Proposed: le accettano solo gli umani) |
| `results/examples/` | contract di esempio (CLI, Aleph, browser) |
| `pilots/` | i due piloti: Aleph e Witness |
| `AGENTS.md` | regole per gli agenti che costruiscono RDD |
| `TASKS.md` | task ordinati in milestone |
| `PROGRESS.md` | diario scritto dagli agenti |

La documentazione per gli agenti è in inglese, come in Aleph: costa meno token e i modelli la seguono meglio.
README e manifesto sono per noi.

## RDD a confronto

| Metodo | Unità di verità | L'umano rivede | Chi verifica |
|---|---|---|---|
| TDD | test unitario | codice | chi ha scritto il codice |
| BDD | scenario Given/When/Then | scenari e codice | suite di accettazione |
| SDD (Spec Kit) | spec.md | piano e diff | revisore umano |
| ODD (Hive) | outcome di un agente a runtime | output dell'agente | il framework dell'agente |
| **RDD** | **Result Contract** | **evidenza e capability** | **Witness separato dal Builder** |

## Ciclo di vita

```
1 Dichiara (Owner) → 2 Approva [gate 1] → 3 Costruisci (Builder) → 4 Osserva (Witness)
                                               ↑                         │ osservato
                                               │ smentito/inconcludente  ↓
                                          6 Watch (prod) ←──────── 5 Accetta [gate 2]
```

Tre verdetti: **observed**, **refuted**, **inconclusive**.
Il gate 2 è automatico se tutte le soglie sono osservate e nessuna capability cambia.

## Piloti

- **Aleph** (`qursor-it/aleph`): un linguaggio il cui sorgente non è pensato per umani, con capability
  negate per default ed esempi eseguiti al check. È già quasi RDD; manca il contract a livello di programma.
- **Witness** (`qursor-it/qursor-qa-tester`): QA autonomo nel browser. Diventa il Witness `browser` di RDD:
  invece di generare test Playwright da mantenere, ri-osserva il Result Contract a ogni build.
