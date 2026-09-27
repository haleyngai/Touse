import os, zlib, struct

def make_png(size, bg_rgb=(217, 133, 42)):
    w = h = size
    cx = w // 2
    bar_h   = max(1, int(h * 0.10))
    bar_y   = int(h * 0.22)
    bar_x0  = int(w * 0.25)
    bar_x1  = int(w * 0.75)
    stem_w  = max(1, int(w * 0.10))
    stem_x0 = cx - stem_w // 2
    stem_x1 = cx + stem_w // 2
    stem_y0 = bar_y
    stem_y1 = int(h * 0.78)

    rows = []
    for y in range(h):
        row = [0]  # PNG filter byte
        for x in range(w):
            in_bar  = (bar_y <= y < bar_y + bar_h) and (bar_x0 <= x < bar_x1)
            in_stem = (stem_y0 <= y < stem_y1)      and (stem_x0 <= x < stem_x1)
            if in_bar or in_stem:
                row += [255, 255, 255]
            else:
                row += list(bg_rgb)
        rows.append(bytes(row))

    raw        = b''.join(rows)
    compressed = zlib.compress(raw, 9)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr_data = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', ihdr_data)
        + chunk(b'IDAT', compressed)
        + chunk(b'IEND', b'')
    )

os.makedirs('web/public/icons', exist_ok=True)
for size in [192, 512]:
    data = make_png(size)
    path = f'web/public/icons/icon-{size}.png'
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Created {path} ({len(data)} bytes)')
