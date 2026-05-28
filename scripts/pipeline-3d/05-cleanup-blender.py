# scripts/pipeline-3d/05-cleanup-blender.py
# Blender 4.x headless script:
#  - Loads the painted candidate
#  - Centers + scales to spec bounding box (1.10 x 0.64 x 0.22)
#  - Decimates to <30k tris
#  - Triangulates, recalculates normals
#  - Exports Draco-compressed .glb with KTX2 textures
#
# Usage (PowerShell):
#   & "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --background --python scripts/pipeline-3d/05-cleanup-blender.py -- <input.glb> <output.glb>

import bpy
import sys
import os

# Parse args after --
argv = sys.argv
argv = argv[argv.index("--") + 1:] if "--" in argv else []
if len(argv) < 2:
    print("Usage: blender --background --python 05-cleanup-blender.py -- <input.glb> <output.glb>")
    sys.exit(1)
src, dst = argv[0], argv[1]

print(f"=== loading {src} ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

# Get all imported mesh objects
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
if not meshes:
    print("No meshes found in import. Aborting.")
    sys.exit(1)

# Join all meshes into one
bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
module = bpy.context.active_object

# Center origin to bounding box center, then move to world origin
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
module.location = (0, 0, 0)

# Compute current bounding box dimensions
dims = module.dimensions
print(f"Current dims: x={dims.x:.3f}, y={dims.y:.3f}, z={dims.z:.3f}")

# Target bounding box: 1.10 x 0.64 x 0.22 (Three.js scale units, == 110 x 64 x 22 mm)
target_x, target_y, target_z = 1.10, 0.64, 0.22
# Use the largest axis ratio to keep proportions
scale_x = target_x / dims.x if dims.x > 0 else 1
scale_y = target_y / dims.y if dims.y > 0 else 1
scale_z = target_z / dims.z if dims.z > 0 else 1
uniform_scale = min(scale_x, scale_y, scale_z)
print(f"Uniform scale factor: {uniform_scale:.4f}")
module.scale = (uniform_scale, uniform_scale, uniform_scale)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"After scale: x={module.dimensions.x:.3f}, y={module.dimensions.y:.3f}, z={module.dimensions.z:.3f}")

# Triangulate + recalculate normals
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.quads_convert_to_tris(quad_method='BEAUTY', ngon_method='BEAUTY')
bpy.ops.object.mode_set(mode='OBJECT')

# Polygon count before decimation
mesh = module.data
tris_before = len(mesh.polygons)
print(f"Triangles before decimation: {tris_before}")

# Decimate if over 30k
target_tris = 28000
if tris_before > target_tris:
    ratio = target_tris / tris_before
    decimate = module.modifiers.new(name='Decimate', type='DECIMATE')
    decimate.ratio = ratio
    decimate.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier='Decimate')
    tris_after = len(module.data.polygons)
    print(f"Triangles after decimation: {tris_after}")
else:
    print("No decimation needed.")

# Export Draco-compressed glTF
print(f"=== exporting {dst} ===")
bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_draco_color_quantization=10,
    export_apply=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_keep_originals=False
)

# Report final size
size_kb = os.path.getsize(dst) / 1024
print(f"Final size: {size_kb:.1f} KB")
print(f"Triangle budget under 30k: {'yes' if len(module.data.polygons) <= 30000 else 'NO'}")
print(f"Size budget under 800 KB: {'yes' if size_kb <= 800 else 'NO'}")
print("Cleanup complete.")