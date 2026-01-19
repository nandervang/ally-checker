# Deployment & CI/CD Guide

This guide outlines the continuous integration (CI) and continuous deployment (CD) architecture for the Ally Checker project.

## Architecture Overview

- **Frontend**: React (Vite) hosted on Netlify.
- **Backend**: Serverless functions hosted on Netlify Functions (`netlify/functions`).
- **Database**: Supabase (PostgreSQL).
- **CI/CD**: GitHub Actions for validation; Netlify for production deployment.

## Continuous Integration (CI)

We use **GitHub Actions** to ensure code quality before deployment. The workflow is defined in `.github/workflows/ci.yml`.

### Workflow Stages

The `CI` workflow triggers on `push` and `pull_request` events to the `main` branch.

#### 1. Validate Job
Runs on `ubuntu-latest` using **Bun**.
- **Lint**: Checks code style using ESLint (`bun run lint`).
  - *Note: Currently configured with `continue-on-error: true` as we work through existing lint warnings.*
- **Build**: Verifies the project builds successfully (`bun run build`).
- **Unit Tests**: Runs Vitest unit tests (`bun run test:run`).

#### 2. E2E Job
Runs in parallel with validation.
- **Setup**: Installs Playwright browsers.
- **Test**: Runs end-to-end tests (`bun run test:e2e`) to verify critical user flows (e.g., Audit execution, Result rendering, Lightbox interaction).

## Continuous Deployment (CD)

Production deployment is handled by **Netlify**.

### Configuration (`netlify.toml`)

- **Build Command**: `bun run build`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`
- **Node Version**: 20
- **Bun Version**: 1.3

### Deployment Trigger
- **Automatic**: Netlify is connected to the GitHub repository. Pushes to `main` (after passing CI) automatically trigger a production build and deploy.
- **Manual**: Can be triggered via Netlify Dashboard or CLI.

## Production Environment Setup

To run the application in production, the following Environment Variables must be configured in the Netlify Dashboard.

### Required Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Server-side only) |
| `GEMINI_API_KEY` | Google Gemini API Key for the AI Agent |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | For Claude models (optional) |
| `OPENAI_API_KEY` | For GPT models (optional) |
| `REPORT_SERVICE_KEY` | Custom secret for securing internal endpoints |

**Reference**: See [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md) for detailed instructions on retrieving and setting these keys.

## Scripts Reference

- `bun run build`: Builds the frontend and backend assets.
- `bun run test:e2e`: Runs E2E tests locally (requires dev server running).
- `bun run lint`: local lint check.
