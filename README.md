# Streets of Türkiye

Streets of Türkiye 3D exploration platform.

## Application

The deployable Next.js application is in `app/`. Shared source content and asset manifests remain at repository root.

## Local development

```bash
cd app
npm ci
npm run dev
```

Open `http://localhost:3000/map`.

## Quality gate

```bash
cd app
npm run gate
```

## Vercel settings

- Framework Preset: Next.js
- Root Directory: `app`
- Enable: **Include source files outside of the Root Directory in the Build Step**
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave empty / framework default

The outside-root setting is required because the build synchronizes `../content` and reads `../asset-manifests`.
