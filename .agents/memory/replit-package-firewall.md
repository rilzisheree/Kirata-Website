---
name: Replit package firewall fallback
description: What to try when a workspace package archive is blocked by the managed registry.
---

When `pnpm install` fails with `ERR_PNPM_FETCH_403` for a package archive, check whether that package has a newer release and update its direct parent within the existing compatibility range. Retry the normal workspace install; do not route around the managed registry.

**Why:** A dependency archive in this workspace was denied by the managed registry, while updating its parent to a newer compatible release allowed the standard install to complete.

**How to apply:** Check the blocked package's latest release and dependency parent before attempting another install or changing registry configuration.
