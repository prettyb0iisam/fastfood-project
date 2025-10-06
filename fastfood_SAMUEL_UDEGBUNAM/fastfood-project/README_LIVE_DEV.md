Live development

Prerequisiti
- Node.js >= 18
- Estensione VS Code: Live Server (Ritwick Dey)

Backend (porta 3000)
Esegui dalla root del progetto:

```bash
npm run dev
```

Il backend parte con nodemon su http://localhost:3000.

Frontend con Live Server (porta 5500)
1. Apri la root in VS Code.
2. Con l'estensione Live Server installata, apri `frontend/pagine/restaurants/restaurants.html` e scegli "Open with Live Server".
3. Vai a http://127.0.0.1:5500/pagine/restaurants/restaurants.html

Proxy API
Le richieste a /api vengono inoltrate automaticamente a http://localhost:3000/api grazie a .vscode/settings.json.

Note
- Se compaiono errori CORS, consenti l'origine http://127.0.0.1:5500 nel backend.
- In DevTools -> Network abilita "Disable cache" per vedere subito le modifiche a CSS/JS.

