In-browser prototype using sql.js (SQLite compiled to WebAssembly).

Below is a minimal HTML + JS example you can copy into a local file to experiment. It uses the `sql.js` CDN and creates a small `users` table in memory.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>sql.js demo</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js"></script>
  </head>
  <body>
    <pre id="out"></pre>
    <script>
      initSqlJs({ locateFile: filename => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/' + filename }).then(SQL => {
        const db = new SQL.Database();
        db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, email TEXT);");
        db.run("INSERT INTO users (username, email) VALUES (?, ?)", ['alice', 'alice@example.com']);
        const res = db.exec("SELECT id, username, email FROM users;");
        document.getElementById('out').textContent = JSON.stringify(res, null, 2);

        // To persist, you can export the DB to binary and store it in IndexedDB/localStorage.
        const binaryArray = db.export(); // Uint8Array
        // Save binaryArray using IndexedDB wrapper (idb-keyval) or similar.
      });
    </script>
  </body>
</html>
```

Notes:
- `sql.js` runs fully client-side. To persist the DB between page loads, save the exported Uint8Array to IndexedDB.
- For full apps, consider using a small API server for authentication and persistent storage instead of client-only SQL.
