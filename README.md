# The Ninth Rite

Run `Start-Prototype.cmd` and open the local URL it prints. The game is served at `/`.

Node.js 22 or newer is required. The local server uses the verified v1.9 catalog in `work/ninth-math-v19.1/`. The `work/` directory is ignored by Git, so the catalog must be available locally before starting the server. Set `NINTH_USE_GENERATOR=1` for an uncalibrated play-credit preview.

The game contains a six-column cluster board, cascading wins, Blood and Offering progression, bonus rites, and win celebrations. See [the prototype notes](prototype/README.md) for the game rules and math tools.

To run the automated checks:

```powershell
cd prototype
npm ci
npm test
```
