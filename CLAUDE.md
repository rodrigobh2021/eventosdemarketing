# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`eventos_mkt` is a Next.js 16 marketing events application built with React 19 and TypeScript. It uses the App Router and Tailwind CSS v4. Currently in initial scaffold state (created via `create-next-app`).

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

No test framework is configured yet.

## Architecture

- **Next.js App Router** with all routes under `src/app/`
- **React Server Components** by default (add `"use client"` only when needed)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — uses `@import "tailwindcss"` syntax and `@theme` blocks for design tokens (not the v3 `@tailwind` directives)
- **ESLint 9 flat config** with `eslint-config-next` (Core Web Vitals + TypeScript rules)
- **TypeScript strict mode** enabled
- **Path alias**: `@/*` maps to `src/*` (e.g., `import Foo from "@/components/Foo"`)
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font/google` with CSS variables
- **Package manager**: npm
