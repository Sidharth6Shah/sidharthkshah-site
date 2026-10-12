"""
Builds public/protein.json, the data behind the homepage protein.

Structure: PDB 4ZUO, acetylpolyamine amidohydrolase (a bacterial enzyme
in the histone deacetylase family) bound to a hydroxamate inhibitor (XS6)
and a zinc ion in each of its two active sites.

Usage:
  curl -o /tmp/4ZUO.pdb https://files.rcsb.org/download/4ZUO.pdb
  python3 scripts/build-protein.py /tmp/4ZUO.pdb

Output (all coordinates centred, aligned to their main axes, scaled to a
unit sphere and stored as integers x1000):
  segments: smooth backbone curves (Catmull-Rom through the C-alpha atoms),
            one per unbroken stretch of chain, each point tagged with its
            secondary structure: H = helix, E = sheet strand, C = loop
  ligand:   inhibitor atoms plus bonds (pairs of atom indices)
  zinc:     zinc ion positions
"""
import json, sys
import numpy as np

SUBDIV = 5  # curve points per residue


def secondary_structure(lines):
    ss = {}
    for line in lines:
        if line.startswith("HELIX "):
            chain, a, b = line[19], int(line[21:25]), int(line[33:37])
            for r in range(a, b + 1):
                ss[(chain, r)] = "H"
        elif line.startswith("SHEET "):
            chain, a, b = line[21], int(line[22:26]), int(line[33:37])
            for r in range(a, b + 1):
                ss[(chain, r)] = "E"
    return ss


def catmull_rom(points, n):
    p = np.vstack([points[0], points, points[-1]])
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(
                0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                       + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            )
    out.append(points[-1])
    return np.array(out)


def main(path, out="public/protein.json"):
    lines = open(path).read().splitlines()
    ss = secondary_structure(lines)

    ca = {}  # chain -> list of (resnum, xyz)
    lig, zinc = [], []
    for line in lines:
        rec = line[:6].strip()
        if rec not in ("ATOM", "HETATM") or line[16] not in (" ", "A"):
            continue
        name, resn, chain = line[12:16].strip(), line[17:20].strip(), line[21]
        xyz = np.array([float(line[30:38]), float(line[38:46]), float(line[46:54])])
        if rec == "ATOM" and name == "CA":
            ca.setdefault(chain, []).append((int(line[22:26]), xyz))
        elif rec == "HETATM" and resn == "XS6" and not name.startswith("H"):
            lig.append(xyz)
        elif rec == "HETATM" and resn == "ZN":
            zinc.append(xyz)

    # Split chains wherever residues are missing
    segments = []
    for chain, res in sorted(ca.items()):
        cur = [res[0]]
        for prev, nxt in zip(res, res[1:]):
            if np.linalg.norm(nxt[1] - prev[1]) > 4.3:
                segments.append((chain, cur)); cur = []
            cur.append(nxt)
        segments.append((chain, cur))

    # Shared centring / alignment / scaling, from the backbone
    all_ca = np.array([x for _, seg in segments for _, x in seg])
    centre = all_ca.mean(axis=0)
    _, _, vt = np.linalg.svd(all_ca - centre, full_matrices=False)
    tf = lambda a: (np.asarray(a) - centre) @ vt.T
    scale = np.linalg.norm(tf(all_ca), axis=1).max()
    enc = lambda a: np.round(tf(a) / scale * 1000).astype(int).flatten().tolist()

    out_segments = []
    for chain, seg in segments:
        if len(seg) < 2:
            continue
        pts = np.array([x for _, x in seg])
        curve = catmull_rom(pts, SUBDIV)
        codes = [ss.get((chain, r), "C") for r, _ in seg]
        curve_ss = "".join(codes[min(i // SUBDIV, len(codes) - 1)] for i in range(len(curve)))
        out_segments.append({"chain": chain, "ss": curve_ss, "p": enc(curve)})

    lig = np.array(lig)
    bonds = []
    for i in range(len(lig)):
        for j in range(i + 1, len(lig)):
            if np.linalg.norm(lig[i] - lig[j]) < 1.75:
                bonds += [i, j]

    data = {
        "source": "PDB 4ZUO",
        "segments": out_segments,
        "ligand": {"p": enc(lig), "bonds": bonds},
        "zinc": enc(np.array(zinc)),
    }
    with open(out, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    n = sum(len(s["ss"]) for s in out_segments)
    print(f"wrote {out}: {len(out_segments)} segments, {n} curve points, "
          f"{len(lig)} ligand atoms, {len(bonds)//2} bonds, {len(zinc)} zinc")


if __name__ == "__main__":
    main(sys.argv[1])
