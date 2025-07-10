import numpy as np
from plyfile import PlyData, PlyElement
import argparse
import open3d as o3d


def read_ply_and_compute_colors(ply_path):
    ply = PlyData.read(ply_path)
    v = ply["vertex"]
    coords = np.stack([v["x"], v["y"], v["z"]], axis=-1).astype(np.float32)
    sh_coeffs = np.stack([v["f_dc_0"], v["f_dc_1"], v["f_dc_2"]], axis=-1).astype(
        np.float32
    )

    SH_C0 = 0.28209479177387814
    colors = 0.5 + SH_C0 * sh_coeffs
    colors = np.clip(colors, 0, 1)
    colors = (colors * 255).astype(np.uint8)

    opacity = np.array(v["opacity"]).astype(np.float32)
    scale = np.stack([v["scale_0"], v["scale_1"], v["scale_2"]], axis=-1).astype(
        np.float32
    )
    rotation = np.stack(
        [v["rot_0"], v["rot_1"], v["rot_2"], v["rot_3"]], axis=-1
    ).astype(np.float32)

    f_rest_list = []
    try:
        for i in range(45):
            f_rest_list.append(v[f"f_rest_{i}"])
        f_rest = np.stack(f_rest_list, axis=-1).astype(np.float32)
    except KeyError:
        f_rest = None

    return coords, colors, opacity, scale, rotation, f_rest


def denoise_points(coords, nb_neighbors=20, std_ratio=2.0):
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(coords)
    cl, ind = pcd.remove_statistical_outlier(
        nb_neighbors=nb_neighbors, std_ratio=std_ratio
    )
    print(f"降噪前: {len(coords)} 点，降噪后: {len(ind)} 点")
    return np.asarray(cl.points), ind


def write_full_ply(coords, colors, opacity, scale, rotation, f_rest, out_path):
    vertex_count = coords.shape[0]

    dtype = [
        ("x", "f4"),
        ("y", "f4"),
        ("z", "f4"),
        ("red", "u1"),
        ("green", "u1"),
        ("blue", "u1"),
        ("opacity", "f4"),
        ("scale_0", "f4"),
        ("scale_1", "f4"),
        ("scale_2", "f4"),
        ("rot_0", "f4"),
        ("rot_1", "f4"),
        ("rot_2", "f4"),
        ("rot_3", "f4"),
    ]

    if f_rest is not None:
        dtype += [(f"f_rest_{i}", "f4") for i in range(45)]

    vertex_all = np.zeros(vertex_count, dtype=dtype)

    vertex_all["x"] = coords[:, 0]
    vertex_all["y"] = coords[:, 1]
    vertex_all["z"] = coords[:, 2]
    vertex_all["red"] = colors[:, 0]
    vertex_all["green"] = colors[:, 1]
    vertex_all["blue"] = colors[:, 2]
    vertex_all["opacity"] = opacity
    vertex_all["scale_0"] = scale[:, 0]
    vertex_all["scale_1"] = scale[:, 1]
    vertex_all["scale_2"] = scale[:, 2]
    vertex_all["rot_0"] = rotation[:, 0]
    vertex_all["rot_1"] = rotation[:, 1]
    vertex_all["rot_2"] = rotation[:, 2]
    vertex_all["rot_3"] = rotation[:, 3]

    if f_rest is not None:
        for i in range(45):
            vertex_all[f"f_rest_{i}"] = f_rest[:, i]

    el = PlyElement.describe(vertex_all, "vertex")
    PlyData([el], text=False).write(out_path)
    print(f"✅ 已保存扩展属性PLY: {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="从PLY生成带颜色和属性的新PLY文件")
    parser.add_argument("input_ply", help="输入 PLY 文件路径")
    parser.add_argument("output_ply", help="输出 PLY 文件路径")
    parser.add_argument(
        "--with_shader", action="store_true", help="是否保留 f_rest_0 ~ f_rest_44 属性"
    )
    parser.add_argument("--denoise", action="store_true", help="是否执行降噪处理")
    parser.add_argument("--nb_neighbors", type=int, default=200, help="降噪邻域数量")
    parser.add_argument("--std_ratio", type=float, default=2.0, help="降噪标准差阈值")
    args = parser.parse_args()

    coords, colors, opacity, scale, rotation, f_rest = read_ply_and_compute_colors(
        args.input_ply
    )

    if args.denoise:
        coords_filtered, keep_indices = denoise_points(
            coords, args.nb_neighbors, args.std_ratio
        )
        coords = coords_filtered
        colors = colors[keep_indices]
        opacity = opacity[keep_indices]
        scale = scale[keep_indices]
        rotation = rotation[keep_indices]
        if args.with_shader and f_rest is not None:
            f_rest = f_rest[keep_indices]
        else:
            f_rest = None
    elif not args.with_shader:
        f_rest = None

    write_full_ply(coords, colors, opacity, scale, rotation, f_rest, args.output_ply)
