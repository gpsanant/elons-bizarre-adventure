# Elon's Bizarre Adventure

A turn-based strategy game where Elon Musk has crash-landed on Mars. Inspired by Civilization/Alpha Centauri-style gameplay.

## Play Now

[**Play Elon's Bizarre Adventure in your browser**](https://playable-in-browser-app-phbfmyvl.devinapps.com) -- no download or setup required!

## Features

- **Tiled Map**: Randomly generated Mars terrain with sand, dust, and crater tiles
- **Resources**: ~10% of tiles contain collectible Rocks
- **Unit Control**: Move Elon Musk across the map (WASD / Arrow keys or click adjacent tiles)
- **Resource Gathering**: Collect Rocks from resource tiles (G key or Gather button)
- **Turn-Based Loop**: Take actions, end turn (E / Enter key or End Turn button), repeat

## Controls

| Key | Action |
|-----|--------|
| W / Arrow Up | Move up |
| S / Arrow Down | Move down |
| A / Arrow Left | Move left |
| D / Arrow Right | Move right |
| G | Gather resource |
| E / Enter | End turn |

You can also click adjacent tiles to move and use the sidebar buttons.

## Architecture

- `index.html` - Game page structure and UI layout
- `style.css` - Visual styling (Mars theme)
- `game.js` - Game engine: map generation, rendering, movement, resource gathering, turn management
- `Dockerfile` - nginx-based container for serving the static game

## Deployment

The browser-playable version auto-updates whenever a pull request is merged to `main`. No manual deployment steps are required for routine code changes.

### Automatic Deployment (CI/CD)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) handles continuous deployment:

1. A pull request is opened and reviewed. The CI workflow (`.github/workflows/ci.yml`) validates the Docker build on every PR.
2. Once the PR is merged to `main`, the deploy workflow triggers automatically.
3. The workflow builds a Docker image tagged with the commit SHA, pushes it to the Fly.io registry, and triggers a deploy.
4. Concurrency control ensures only one deployment runs at a time, preventing conflicts.

Players accessing the [browser version](https://playable-in-browser-app-phbfmyvl.devinapps.com) will always see the latest code from `main` without any manual intervention.

> **Note:** Changes that only modify files under `.github/` are excluded from triggering a deploy, since they do not affect the game itself.

### GitHub Pages (optional)

Since the game is plain HTML/CSS/JS, it can also be deployed via GitHub Pages:

1. Go to **Settings > Pages** in the repository.
2. Under **Source**, select **Deploy from a branch**.
3. Choose the `main` branch and `/ (root)` folder, then click **Save**.

The game will be accessible at `https://<owner>.github.io/elons-bizarre-adventure/`.

### Local Development (Docker)

You can also serve the game locally via Docker:

```bash
docker build -t elons-bizarre-adventure .
docker run -p 8080:80 elons-bizarre-adventure
```

Then open http://localhost:8080 in your browser.
