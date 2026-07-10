# WCO Bot

A Discord bot for a football/futsal + roleplay community server. Built with **discord.js v14** and **PostgreSQL**, deployable to **Railway**.

## Features included in this starter

- `/team register` / `/team add` / `/team remove` / `/team roster` — team & roster management
- `/matchup` — schedule a match between two registered teams
- `/score` — update live scores, mark a match final (auto-updates matches_played)
- `/stats` — view a player's goals, assists, MVPs, matches played

This is a foundation — the other features discussed (verification, tickets, leaderboards, points economy, trivia, etc.) can be added as additional files in `src/commands/`.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN` and `CLIENT_ID` — from the [Discord Developer Portal](https://discord.com/developers/applications)
   - `GUILD_ID` — your server's ID (optional, for instant command updates during dev)
   - `DATABASE_URL` — your local or hosted Postgres connection string

3. Register slash commands:
   ```bash
   npm run deploy-commands
   ```

4. Start the bot:
   ```bash
   npm start
   ```

## Deploying to Railway

1. Push this project to a GitHub repo.
2. In Railway, create a **New Project** → **Deploy from GitHub repo** → select your repo.
3. Add a **PostgreSQL** plugin to the project (Railway auto-generates `DATABASE_URL` and injects it into your bot's environment — no manual copying needed).
4. In your bot service's **Variables** tab, add:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID` (optional)
5. Railway will run `npm start` automatically using the `start` script in `package.json`.
6. Run `npm run deploy-commands` once (locally, or via Railway's shell) to register your slash commands with Discord.

The bot creates its own database tables automatically on first boot (see `src/db.js`), so no manual migrations are needed.

## Discord bot permissions/intents needed

When creating the bot in the Developer Portal, make sure:
- **Server Members Intent** is enabled (under Bot → Privileged Gateway Intents)
- The bot is invited with the `applications.commands` and `bot` scopes, with at minimum `Send Messages` and `Embed Links` permissions

## Adding more commands

Drop a new file in `src/commands/` following the same pattern as `stats.js` (export `data` as a `SlashCommandBuilder` and an async `execute(interaction)` function). It'll be auto-loaded by both `index.js` and `deploy-commands.js` — just re-run `npm run deploy-commands` after adding one.
