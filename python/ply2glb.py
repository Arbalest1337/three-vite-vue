# ply_to_glb.py
# 将含球谐颜色系数的二进制 PLY 点云转换为带顶点色和其他属性的 GLB 文件

import numpy as np
import os
from plyfile import PlyData
from pygltflib import (
    GLTF2,
    Scene,
    Node,
    Mesh,
    Primitive,
    Buffer,
    BufferView,
    Accessor,
    Asset,
)

COMPONENT_TYPE_FLOAT = 5126
COMPONENT_TYPE_UINT8 = 5121
SH_C0 = 0.28209479177387814


def read_ply(ply_path):
    ply = PlyData.read(ply_path)
    v = ply["vertex"]
    coords = np.stack([v["x"], v["y"], v["z"]], axis=-1).astype(np.float32)
    sh0 = np.stack([v["f_dc_0"], v["f_dc_1"], v["f_dc_2"]], axis=-1).astype(np.float32)
    opacity = np.array(v["opacity"]).astype(np.float32)
    scale = np.stack([v["scale_0"], v["scale_1"], v["scale_2"]], axis=-1).astype(
        np.float32
    )
    rotation = np.stack(
        [v["rot_0"], v["rot_1"], v["rot_2"], v["rot_3"]], axis=-1
    ).astype(np.float32)
    f_rest = [
        np.stack([v[f"f_rest_{i*3+j}"] for j in range(3)], axis=-1).astype(np.float32)
        for i in range(15)
    ]
    return coords, sh0, opacity, scale, rotation, f_rest


def compute_rgb(sh_coeffs, fast=False):
    colors = 0.5 + SH_C0 * sh_coeffs
    colors = np.clip(colors, 0.0, 1.0)
    if fast:
        colors = (colors * 255).astype(np.uint8)
    else:
        colors = colors.astype(np.float32)
    return colors


def to_bytes(arr: np.ndarray) -> bytes:
    return arr.tobytes()


def to_native_float_list(arr):
    return [float(x) for x in arr]


def build_glb(
    coords, colors, opacity, scale, rotation, f_rest_list, out_path, use_lighting, fast
):
    gltf = GLTF2(
        asset=Asset(version="2.0"),
        scenes=[Scene(nodes=[0])],
        nodes=[Node(mesh=0)],
        meshes=[Mesh(primitives=[])],
    )

    attr_arrays = [coords, colors, opacity.reshape(-1, 1)]
    if use_lighting:
        attr_arrays += [scale, rotation] + f_rest_list

    attr_bytes = [to_bytes(arr) for arr in attr_arrays]
    buf_bytes = b"".join(attr_bytes)
    buffer = Buffer(byteLength=len(buf_bytes))
    gltf.buffers = [buffer]
    views = []
    offset = 0
    for b in attr_bytes:
        views.append(BufferView(buffer=0, byteOffset=offset, byteLength=len(b)))
        offset += len(b)
    gltf.bufferViews = views

    def acc(
        view_idx,
        count,
        type_,
        ref_data=None,
        component_type=COMPONENT_TYPE_FLOAT,
        normalized=False,
    ):
        return Accessor(
            bufferView=view_idx,
            byteOffset=0,
            componentType=component_type,
            count=count,
            type=type_,
            normalized=normalized,
            max=(
                to_native_float_list(ref_data.max(axis=0))
                if ref_data is not None and not normalized
                else None
            ),
            min=(
                to_native_float_list(ref_data.min(axis=0))
                if ref_data is not None and not normalized
                else None
            ),
        )

    accessors = [
        acc(0, len(coords), "VEC3", coords),
        acc(
            1,
            len(colors),
            "VEC3",
            colors,
            COMPONENT_TYPE_UINT8 if fast else COMPONENT_TYPE_FLOAT,
            fast,
        ),
        acc(2, len(opacity), "SCALAR"),
    ]
    prim_attrs = {"POSITION": 0, "COLOR_0": 1, "_OPACITY": 2}

    if use_lighting:
        accessors.append(acc(3, len(scale), "VEC3", scale))
        accessors.append(acc(4, len(rotation), "VEC4", rotation))
        prim_attrs["_SCALE"] = 3
        prim_attrs["_ROTATION"] = 4
        for i, fr in enumerate(f_rest_list):
            accessors.append(acc(5 + i, len(fr), "VEC3", fr))
            prim_attrs[f"_FREST{i}"] = 5 + i

    gltf.accessors = accessors
    prim = Primitive(attributes=prim_attrs, mode=0)
    gltf.meshes[0].primitives.append(prim)

    gltf.set_binary_blob(buf_bytes)
    gltf.convert_buffers(BufferFormat.BINARYBLOB)
    gltf.save_binary(out_path)
    print(f"✅ 已保存 GLB 文件: {out_path}")


if __name__ == "__main__":
    import argparse
    from pygltflib.utils import BufferFormat

    parser = argparse.ArgumentParser(
        description="PLY 转 GLB 点云工具（带颜色和可选光照数据）"
    )
    parser.add_argument("input_ply", help="输入 PLY 文件路径")
    parser.add_argument("output_glb", help="输出 GLB 文件路径")
    parser.add_argument("--lighting", action="store_true", help="是否包含光影相关属性")
    parser.add_argument(
        "--fast",
        action="store_true",
        help="是否启用瘦身优化（颜色转uint8，移除float高精度）",
    )
    args = parser.parse_args()

    coords, sh0, opacity, scale, rotation, f_rest_list = read_ply(args.input_ply)
    colors = compute_rgb(sh0, args.fast)
    build_glb(
        coords,
        colors,
        opacity,
        scale,
        rotation,
        f_rest_list,
        args.output_glb,
        args.lighting,
        args.fast,
    )
