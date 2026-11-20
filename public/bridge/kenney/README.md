# Optional CC0 props

`world.ts` loads Kenney Nature Kit GLBs from this folder. List the files that exist in
`manifest.json`; an empty list means procedural-only (no 404 requests, no console noise).

```json
[
  "tree_oak",
  "tree_default",
  "tree_fat",
  "plant_bush",
  "hedge",
  "lantern",
  "cart",
  "stall-red",
  "banner-red",
  "windmill",
  "canoe"
]
```

Use the names from the `KENNEY` array in `src/videos/bridge/world.ts` (trees, hedges,
flowers, lantern, cart, stalls, banners, windmill, canoe), without `.glb`.
Missing entries are skipped, so the film still renders with procedural buildings,
vegetation and paint.
