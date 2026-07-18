# Quaternius 적 프레임 → 가로 스트립 조립(idle/hit/attack) → assets/units/enemy/<key>/
import os
from PIL import Image

SRC = r"D:/.CODE/AXdata/axdata_05/_qenemy"
DST = r"D:/.CODE/AXdata/axdata_01/axdata_01/assets/units/enemy"
FRAME = 128
NFR = 16
KEYS = ["demon", "greendemon", "cthulhu", "cyclops", "yeti", "alien"]

def build(key, state):
    frames = []
    for i in range(NFR):
        p = os.path.join(SRC, f"{key}_{state}_{i:02d}.png")
        if not os.path.exists(p):
            return None, p
        frames.append(Image.open(p).convert("RGBA").resize((FRAME, FRAME), Image.LANCZOS))
    strip = Image.new("RGBA", (FRAME*NFR, FRAME), (0, 0, 0, 0))
    for i, im in enumerate(frames):
        strip.paste(im, (i*FRAME, 0))
    return strip, None

missing, made = [], 0
for key in KEYS:
    outdir = os.path.join(DST, key)
    os.makedirs(outdir, exist_ok=True)
    for state in ("idle", "hit", "attack"):
        strip, miss = build(key, state)
        if strip is None:
            missing.append((key, state, miss)); continue
        strip.save(os.path.join(outdir, f"{key}_{state}.png"))
        made += 1

print(f"생성 스트립: {made}개 (기대 {len(KEYS)*3})")
if missing:
    print("누락:")
    for k, s, p in missing:
        print("  ", k, s, "->", os.path.basename(p))
else:
    print("누락 없음")
