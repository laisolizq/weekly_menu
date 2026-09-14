## App Url

https://laisolizq.github.io/weekly_menu/

## Local usage

To use the full app, including adding and syncing recipes:

1. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

2. Start Django:

   ```bash
   cd backend
   source .venv/bin/activate
   python manage.py runserver 0.0.0.0:8000
   ```

3. Start the frontend:

   ```bash
   npm run dev
   ```

From a mobile device connected to the same Wi-Fi, open:

```text
http://192.168.1.146:5173
```

The GitHub Pages version can be used outside home, but **adding recipes is disabled** because the local backend is not available.
