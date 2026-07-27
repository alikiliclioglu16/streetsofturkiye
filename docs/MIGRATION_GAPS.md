# Legacy migration gap report

Cities processed: 3

## Stops with no commissioned 3D asset (4)
- istanbul · bazaar · The Grand Bazaar
- istanbul · simit · The Simit Cart
- nevsehir · balloon · Hot Air Balloon Ride
- nevsehir · loom · Turkish Carpet Weavers

## Collectibles not in the asset manifest (4)
- istanbul · collectible_istanbul_a_mosaic_lamp · "a mosaic lamp"
- istanbul · collectible_istanbul_a_warm_simit · "a warm simit"
- nevsehir · collectible_nevsehir_a_ball_of_rainbow_wool · "a ball of rainbow wool"
- nevsehir · collectible_nevsehir_a_mini_balloon · "a mini balloon"

## Cities below the two-question standard (1)
- gaziantep has 1 question(s), standard is 2

## Always true for migrated content
- Every fact carries `editorialStatus: "legacy-unverified"`.
- Turkish is null throughout; the prototype is English only.
- Positions, bounds and camera anchors are generated, not authored.
