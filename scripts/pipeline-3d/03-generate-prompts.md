# 03-generate-prompts.md: reference plate prompts for Google AI Studio

Free, in our paid stack (Google Premium). Generate four orthographic plates, drop them into `assets/models/references/`. They become inputs to the AI 3D pipeline.

## Open: https://aistudio.google.com/app/prompts/new_chat (or Gemini Image)

Pick: `gemini-2.5-flash-image-preview` (Nano Banana) or any current image model.

## Prompt 1 of 4 - THREE-QUARTER HERO VIEW (primary reference)

```
Studio product photography render of a small modern vehicle access module.
Bounding shape: rounded rectangular pebble, 110 mm long, 64 mm wide, 22 mm tall.
Body material: dark navy automotive paint with subtle metallic clearcoat, color #1A2E4A.
Top face: inset matte plate with a brushed aluminum bezel ring around its perimeter.
Five thin recessed ventilation slots on the rear half of the top face, parallel,
each about 3 mm wide and 30 mm long. A thin cyan-glowing accent stripe across the
front edge of the top face, color #00C8E8. A subtle engraved "DOVA" wordmark near
the front of the top plate, very fine, no other text. Longitudinal parting line
where the two housing halves meet on each side. Black flexible plastic cable
exits the back face from a cylindrical strain relief nub. Bottom face has the
SAE J1962 OBD-II trapezoidal female connector, 16 pin layout (just slot positions).
Body corners are softly filleted with about a 3 mm radius bevel.

Three-quarter view from upper front-right, soft key light from upper-left, cyan
rim light from back-right, charcoal-to-navy gradient background, sharp focus,
no depth of field, no motion blur. Apple keynote product reveal aesthetic.
No antennas. No OEM logos. No vehicle make markings. No QR codes. No words
other than the engraved "DOVA" wordmark. No people, no hands, no environment
beyond the studio backdrop.

Output: 1024x1024, photorealistic, PBR-style materials, 8K-quality detail.
```

## Prompt 2 of 4 - TOP-DOWN ORTHOGRAPHIC

```
Same vehicle access module as before, top-down orthographic view directly above.
Same dimensions, same brushed bezel ring around the top face perimeter, same
5 recessed ventilation slots on the rear half, same cyan accent stripe across
the front edge, same engraved DOVA wordmark near front.

Pure orthographic projection, no perspective distortion. Even soft lighting
from above (no harsh shadows). Pure dark gradient backdrop. Sharp focus.

Output: 1024x1024, accurate proportions, photorealistic, top-down only.
```

## Prompt 3 of 4 - FRONT ORTHOGRAPHIC

```
Same vehicle access module as before. Now show the front face directly, head-on,
orthographic. Visible: longitudinal parting line on the sides, the cyan accent
stripe wrapping just over the top front edge, the slightly filleted corners,
the bottom edge of the OBD-II connector recess visible on the underside.

Pure orthographic projection, no perspective, no distortion. Soft front lighting,
even shadow distribution. Dark gradient backdrop.

Output: 1024x1024, accurate proportions, photorealistic, front view only.
```

## Prompt 4 of 4 - SIDE ORTHOGRAPHIC

```
Same vehicle access module as before. Now show the long side directly, profile
view, orthographic. Visible: the longitudinal parting line running the full length,
the body's bevel curve along top and bottom edges, the cable strain relief nub
exiting the back face, the cable extension trailing about 30 mm. The cyan stripe
visible as a thin line wrapping just over the top front corner.

Pure orthographic, no perspective. Soft side lighting from upper-left. Dark
gradient backdrop. Sharp focus.

Output: 1024x1024, accurate proportions, photorealistic, side view only.
```

## After generation

1. Save each output as `assets/models/references/dova-module-{angle}.png`:
   - `dova-module-3q.png` (three-quarter, primary)
   - `dova-module-top.png`
   - `dova-module-front.png`
   - `dova-module-side.png`
2. Inspect for spec compliance (check 02-spec.md before saving). Re-roll any that show OEM logos, antennas, vehicle markings, or any extra text.
3. Once all four are saved, run `04-generate-glb.ps1`.

## Why four views

Hunyuan3D 2.1 and Unique3D both accept a single image, but quality jumps significantly with multi-view conditioning. The top-down view tells the AI exactly where the vent slots go. The side view nails the cable exit. The front view tells it where the OBD-II connector slot sits.