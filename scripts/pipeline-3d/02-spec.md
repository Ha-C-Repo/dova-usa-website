# 02-spec.md: locked render spec (Matthew approved 2026-05-28)

This is the source-of-truth for everything generated downstream. Do not deviate without re-approval.

## Module dimensions

- Bounding box (Blender units): 110 × 64 × 22 mm
- Three.js scale equivalent: 1.10 × 0.64 × 0.22
- Origin at center-bottom, +Y up, +Z back

## Materials

- Body paint: dark navy (#1A2E4A ± 5%), automotive clearcoat metallic, sheen 0.25
- Top bezel: anisotropic brushed metal (#AAB4C2 base)
- Vent slots: dark recessed plastic (#06101E), matte
- Cable: black flexible plastic (#0C0F14), semi-matte
- Cyan emissive accent: #00C8E8 on the front-edge wordmark stripe

## Required surface detail

| Detail | Location | Why |
|---|---|---|
| Brushed bezel ring | Top face perimeter, ~3 mm inset | Industrial cue |
| 5 vent slots | Rear half of top face, parallel, each ~3 × 30 × 1 mm | Hardware authenticity |
| DOVA wordmark | Engraved on top face, near front, very subtle | Brand mark |
| Cyan accent stripe | Front edge of top face, ~22 × 2 mm | Power/state indicator |
| Parting line | Longitudinal seam along both sides where housing halves meet | Manufacturing realism |
| Cable strain-relief nub | Back face, ~10 × 8 mm cylinder | Real-device cue |
| Cable extension | 6 mm diameter, ~30 mm length, exits from nub | Visible in scene |
| OBD-II connector | Bottom face, SAE J1962 trapezoid, 16-pin layout (just slot positions, no chips) | Matches the dashboard slab |
| Body corner fillet | 8-segment bevel, ~3 mm radius | Premium feel |

## Required absences (disclosure boundary)

- No antennas
- No OEM emblems or vehicle make logos
- No readable text other than the engraved "DOVA" wordmark
- No QR codes, no barcodes
- No anything that reads as a claim term ("authorize", "cloud", "verified", patent numbers)

## Output technical requirements

- Format: glTF 2.0 binary (.glb)
- Geometry: triangulated, normals re-computed, < 30,000 tris
- Compression: Draco level 7
- Textures: 1024² PNG, ideally KTX2 BasisU
- Total file size: under 800 KB
- Single material, PBR-MetallicRoughness workflow

## Reference style for AI generation

- Studio-product photography aesthetic
- Three-quarter view as the primary prompt
- Soft key light from upper-left, cyan rim from back-right
- Dark gradient background (charcoal to navy)
- No motion blur, no depth-of-field, sharp focus throughout
- "Apple keynote product reveal" energy, not "gaming peripheral"