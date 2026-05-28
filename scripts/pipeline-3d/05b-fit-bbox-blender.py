# scripts/pipeline-3d/05b-fit-bbox-blender.py
# Path 2 fix: non-uniform scale to the locked spec bounding box.
# Use when the upstream image-to-3D engine produced a near-cubic mesh
# but the locked spec calls for an oblong pebble (1.10 x 0.64 x 0.22).
# Texture coords follow the geometry, so the materials map cleanly to
# the new aspect ratio.
#
# Usage:
#   blender --background --python 05b-fit-bbox-blender.py -- INPUT.glb OUTPUT.glb

import bpy
import sys
import os

argv = sys.argv
argv = argv[argv.index("--") + 1:] if "--" in argv else []
if len(argv) < 2:
    print("Usage: blender --background --python 05b-fit-bbox-blender.py -- <input.glb> <output.glb>")
    sys.exit(1)
src, dst = argv[0], argv[1]

print(f"=== loading {src} ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
if not meshes:
    print("No meshes found.")
    sys.exit(1)

bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
module = bpy.context.active_object

# Center on the spec origin (center-bottom, +Y up)
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
module.location = (0, 0, 0)

dims = module.dimensions
print(f"Current dims: x={dims.x:.3f}, y={dims.y:.3f}, z={dims.z:.3f}")

# Spec bounding box, non-uniform. The spec orientation is:
#   X = long axis  (1.10)
#   Y = mid axis   (0.64)
#   Z = short axis (0.22)
target_x, target_y, target_z = 1.10, 0.64, 0.22

# Identify the current axes ordered by length
import math
axes = sorted(
    [(dims.x, 0), (dims.y, 1), (dims.z, 2)],
    key=lambda t: -t[0],
)
long_axis = axes[0][1]
mid_axis = axes[1][1]
short_axis = axes[2][1]
print(f"Current axes ordered long->short: idx_long={long_axis}, idx_mid={mid_axis}, idx_short={short_axis}")

# Permute axes so long -> X, mid -> Y, short -> Z. Apply via rotation matrix.
# Build a 3x3 permutation as a rotation if it's a proper rotation, otherwise
# accept it as a reflection-free reorientation by also flipping one axis as needed.
import mathutils
basis = [None, None, None]
basis[0] = [0, 0, 0]
basis[0][long_axis] = 1
basis[1] = [0, 0, 0]
basis[1][mid_axis] = 1
basis[2] = [0, 0, 0]
basis[2][short_axis] = 1

# Build a 3x3 matrix whose columns are the new axes expressed in current axes
m = mathutils.Matrix((
    (basis[0][0], basis[1][0], basis[2][0]),
    (basis[0][1], basis[1][1], basis[2][1]),
    (basis[0][2], basis[1][2], basis[2][2]),
))
# If determinant is -1, flip the Z column so it becomes a proper rotation
if m.determinant() < 0:
    m[0][2] *= -1
    m[1][2] *= -1
    m[2][2] *= -1
# Inverse maps current basis -> new basis when applied to vertex positions
rot = m.transposed().to_4x4()
module.matrix_world = rot @ module.matrix_world
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
dims2 = module.dimensions
print(f"After reorient: x={dims2.x:.3f}, y={dims2.y:.3f}, z={dims2.z:.3f}")

# Now scale to the spec bounding box
sx = target_x / max(dims2.x, 1e-6)
sy = target_y / max(dims2.y, 1e-6)
sz = target_z / max(dims2.z, 1e-6)
print(f"Non-uniform scale factors: x={sx:.3f}, y={sy:.3f}, z={sz:.3f}")
module.scale = (sx, sy, sz)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"After fit: x={module.dimensions.x:.3f}, y={module.dimensions.y:.3f}, z={module.dimensions.z:.3f}")

# Triangulate and recompute normals after the squash
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.quads_convert_to_tris(quad_method='BEAUTY', ngon_method='BEAUTY')
bpy.ops.object.mode_set(mode='OBJECT')

mesh = module.data
tris_after = len(mesh.polygons)
print(f"Triangles: {tris_after}")

# Decimate if we somehow ended up over budget (we should not, but defensive)
if tris_after > 30000:
    ratio = 28000 / tris_after
    dec = module.modifiers.new(name='Decimate', type='DECIMATE')
    dec.ratio = ratio
    dec.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier='Decimate')
    print(f"Decimated to: {len(module.data.polygons)}")

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

size_kb = os.path.getsize(dst) / 1024
print(f"Final size: {size_kb:.1f} KB")
print(f"Triangle budget under 30k: {'yes' if len(module.data.polygons) <= 30000 else 'NO'}")
print(f"Size budget under 800 KB: {'yes' if size_kb <= 800 else 'NO'}")
print("Bbox-fit complete.")
