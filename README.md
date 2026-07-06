# CSS module scoped-name mismatch in `astro dev` under the Lightning CSS transformer

## Summary

With `vite.css.transformer: "lightningcss"`, a React component that imports a
CSS module and is rendered through Astro's content-collection render path
(`getCollection` + `render()` → `<Content />`) renders unstyled in `astro dev`.

The class the component puts on the element and the selector in the emitted
stylesheet get different scoped-name hashes, so no rule matches:

```
element:            <div class="_1sGP9G_box">
injected <style>:   ._18izFG_box { … }     ← Astro-collected (no data-vite-dev-id)
```

Production builds (`astro build`) are correct; the mismatch is dev-only.

## Reproduction

```
npm install
npm run dev
# open http://localhost:4321/getting-started
```

Expected: a 3-column purple grid. Actual: unstyled (the grid CSS never applies).

Confirm from the served HTML: the `class="…_box"` on the `<div>` does not match
the `.…_box` selector inside the inlined `<style>`.

All three of these are required to reproduce the problem:

- `vite.css.transformer: "lightningcss"` (see `astro.config.mjs`)
- a framework component (React here) that does `import styles from
  "./x.module.css"` and applies `styles.*`—a plain `.astro` component importing
  the same module does _not_ reproduce it
- the component rendered via a content collection (`src/content.config.ts` +
  `src/pages/[...slug].astro` calling `render()`), which routes the module's CSS through
  Astro's server-side style propagation. Rendering the same component from a plain
  `src/pages/*.mdx` or `*.astro` page does _not_ reproduce it (Vite's dev HMR injects the
  style with a matching hash instead).

This is a dev-only bug: `astro build` does not reproduce it.

## Root cause

Lightning CSS derives a CSS-module's scoped-name hash purely from the filename
string it is handed, not the file content. It is path-sensitive (`x.module.css`,
`a/x.module.css`, and `/abs/a/x.module.css` all hash differently).

In `astro dev` the module is compiled twice, in two module graphs that resolve
it to different id strings:

1. The framework component's `import styles from "./x.module.css"` (produces the
   class-name map that lands in `class=`), and
2. Astro's server-side CSS collection for the content-rendered page (produces
   the inlined `<style>` — it has _no_ `data-vite-dev-id`, unlike Vite's
   HMR-injected styles).

Vite passes the raw `filename` (`removeDirectQuery(id)`) to Lightning CSS
without normalizing it, so the two graphs' differing id strings yield two
different hashes and the class names never line up. Vite's default transformer
computes the scoped name from a normalized, cleaned id, so both graphs agree —
which is why `transformer: "postcss"` is consistent. A production build has a
single canonical CSS pipeline, so there is nothing to diverge.

The fix may belong in Vite (normalize the `filename` handed to Lightning CSS for
CSS-module hashing, the way the default transformer's hasher already does);
Astro could also reuse a single compilation across the render + style-collection
paths.

## Environment

- astro 7.0.6
- vite 8.1.3
- lightningcss 1.32.0
- @astrojs/react 6.x, @astrojs/mdx 7.x
- node v24.18.0, Linux
