# Better Tahoma

A modern application for managing and controlling Somfy Tahoma devices.

## Overview

Fullstack monorepo for Somfy device management with a modern web interface.

## Structure

### Apps

- **web** - Main React app with TanStack Router
- **fumadocs** - Project documentation
- **server** - Backend server with Hono & tRPC

### Packages

- **api** - tRPC routes
- **auth** - Authentication (Better Auth)
- **db** - Database schemas (Drizzle ORM)
- **somfy** - Somfy API client
- **config** - Shared configuration
- **types** - Shared TypeScript types
- **env** - Environment validation

## Getting Started

```bash
bun install
bun dev
```

## Tech Stack

- React, TanStack Router, Vite
- Hono, tRPC
- LibSQL, Drizzle ORM
- Better Auth
- shadcn/ui, Tailwind CSS
- Turborepo, Biome

---

## Roadmap

### Upcoming

- [ ] Use the full API from overkiz to interact with the user's account and devices
- [ ] Auth with better-auth
- [ ] Start a scene configured from the app
- [ ] User settings (be able to reset the app, change themes, etc.)
- [ ] Improve UI/UX with more components and better design
- [ ] Get the room color from the api (not that usefull but nice to have)

### In Progress

- [x] Implement device control features (open/close, set position, etc.)
- [x] Sidebar fully functional with navigation
- [x] Basic device listing and status display with rooms
