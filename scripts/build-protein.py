"""
Builds public/protein.json, the point cloud behind the homepage protein.

Structure: PDB 4ZUO, acetylpolyamine amidohydrolase (a bacterial enzyme
in the histone deacetylase family) bound to a hydroxamate inhibitor (XS6).

Usage:
  curl -o /tmp/4ZUO.pdb https://files.rcsb.org/download/4ZUO.pdb
  python3 scripts/build-protein.py /tmp/4ZUO.pdb

Keeps backbone atoms (N, CA, C, O) plus CB for each residue, and every
inhibitor atom. Coordinates are centred, aligned to their main axes,
scaled to fit a unit sphere and stored as integers (x1000).
Point kinds: 0 = chain A, 1 = chain B, 2 = inhibitor.
"""
import json, sys
import numpy as np

KEEP = {"N", "CA", "C", "O", "CB"}

def main(path, out="public/protein.json"):
    pts, kinds = [], []
    for line in open(path):
        rec = line[:6].strip()
        if rec not in ("ATOM", "HETATM"):
            continue
        name, resn, chain = line[12:16].strip(), line[17:20].strip(), line[21]
        if line[16] not in (" ", "A"):  # skip alternate locations
            continue
        xyz = [float(line[30:38]), float(line[38:46]), float(line[46:54])]
        if rec == "ATOM" and name in KEEP:
            pts.append(xyz); kinds.append(0 if chain == "A" else 1)
        elif rec == "HETATM" and resn == "XS6":
            pts.append(xyz); kinds.append(2)
    p = np.array(pts)
    p -= p.mean(axis=0)
    # Align to principal axes so the longest axis is horizontal
    _, _, vt = np.linalg.svd(p, full_matrices=False)
    p = p @ vt.T
    p /= np.linalg.norm(p, axis=1).max()
    data = {
        "source": "PDB 4ZUO",
        "n": len(p),
        "p": np.round(p * 1000).astype(int).flatten().tolist(),
        "k": kinds,
    }
    with open(out, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print(f"wrote {out}: {len(p)} points, {sum(k == 2 for k in kinds)} inhibitor atoms")

if __name__ == "__main__":
    main(sys.argv[1])
