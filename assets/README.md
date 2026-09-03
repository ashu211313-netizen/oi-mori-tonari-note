# Local image assets

Place personally supplied, locally licensed images in the matching domain folder. Use the stable entity id as the filename, for example `fish/fish-shark.webp`, then run `pnpm run sync:images`.

Supported formats are WebP, PNG, JPEG, and AVIF. The importer never downloads remote images. Optional alt/source notes can be added to `image-manifest.json`; otherwise Japanese entity names provide runtime alt text and the source type remains `user_supplied_local`.

Expansion folders use the checked-in stable ids shown in the app and generated data, for example `items/item-kagu01-001.webp`, `residents/resident-001.webp`, or `gyroids/gyroid-001.webp`. NPC and facility images follow the readable ids such as `npcs/npc-tsunekichi.webp` and `facilities/facility-museum.webp`. Real registered images remain zero until a user-owned/local asset is placed here; the sync command never fetches images from the internet.
