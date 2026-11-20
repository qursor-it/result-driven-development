# Manifesto RDD

Bernardo Manfriani, Gianmarco Ferruzzi — novembre 2026

1. **Il risultato è il prodotto, il codice è un sottoprodotto.** Il codice si può buttare e rigenerare; il risultato no.
2. **Ogni risultato è osservabile dall'esterno.** Se per verificarlo bisogna leggere il codice, non è ancora un risultato.
3. **Nessun risultato senza evidenza.** "Funziona" vale solo con una prova riproducibile allegata.
4. **Chi costruisce non certifica.** Builder e Witness sono separati; il Witness non vede il codice né il contesto del Builder.
5. **Si approva il potere, non il codice.** L'umano rivede le capability (rete, file, dati, permessi), negate per default.
6. **I risultati hanno soglie, non solo pass/fail.** Tempo, passi, costo, tasso di successo: ogni risultato ha un budget.
7. **Un risultato non osservato in produzione è un'ipotesi.** I risultati decadono e vanno ri-osservati di continuo.
8. **Le decisioni vivono nel repository.** ADR, contratti, evidenze e ledger sono la memoria del progetto, non le persone né le sessioni degli agenti.
