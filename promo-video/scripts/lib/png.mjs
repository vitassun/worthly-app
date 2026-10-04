/**
 * Minimal PNG reader/writer.
 *
 * The QA scripts need to look at real rendered pixels. Remotion's own renderer
 * keeps its browser API private, and driving Chrome from Node is fragile here,
 * so the analysis reads the PNGs directly instead. Only what the renderer
 * actually emits is supported: 8-bit, non-interlaced, greyscale / RGB / RGBA.
 */
import zlib from "node:zlib";

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export const decodePng = (buffer) => {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error("not a PNG file");
  }

  let offset = 8;
  let header = null;
  let palette = null;
  const idat = [];

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        bitDepth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === "PLTE") {
      palette = Buffer.from(body);
    } else if (type === "IDAT") {
      idat.push(Buffer.from(body));
    } else if (type === "IEND") {
      break;
    }
  }

  if (!header) throw new Error("PNG has no IHDR chunk");
  if (header.bitDepth !== 8) throw new Error(`unsupported bit depth ${header.bitDepth}`);
  if (header.interlace !== 0) throw new Error("interlaced PNGs are not supported");

  const channels = CHANNELS[header.colorType];
  if (!channels) throw new Error(`unsupported colour type ${header.colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = header;
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);

  let cursor = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[cursor];
    cursor += 1;
    const source = raw.subarray(cursor, cursor + stride);
    cursor += stride;
    const line = pixels.subarray(y * stride, (y + 1) * stride);
    const previous = y === 0 ? null : pixels.subarray((y - 1) * stride, y * stride);

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = previous ? previous[x] : 0;
      const c = previous && x >= channels ? previous[x - channels] : 0;
      const value = source[x];
      let out;
      switch (filter) {
        case 0:
          out = value;
          break;
        case 1:
          out = value + a;
          break;
        case 2:
          out = value + b;
          break;
        case 3:
          out = value + ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          out = value + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default:
          throw new Error(`unknown PNG filter ${filter} on row ${y}`);
      }
      line[x] = out & 0xff;
    }
  }

  if (header.colorType === 3) {
    if (!palette) throw new Error("indexed PNG has no PLTE chunk");
    const rgb = Buffer.alloc(width * height * 3);
    for (let index = 0; index < width * height; index++) {
      const entry = pixels[index] * 3;
      rgb[index * 3] = palette[entry];
      rgb[index * 3 + 1] = palette[entry + 1];
      rgb[index * 3 + 2] = palette[entry + 2];
    }
    return { width, height, channels: 3, data: rgb };
  }

  if (channels === 1 || channels === 2) {
    const rgb = Buffer.alloc(width * height * 3);
    for (let index = 0; index < width * height; index++) {
      const grey = pixels[index * channels];
      rgb[index * 3] = grey;
      rgb[index * 3 + 1] = grey;
      rgb[index * 3 + 2] = grey;
    }
    return { width, height, channels: 3, data: rgb };
  }

  return { width, height, channels, data: pixels };
};

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, body) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
};

/** Writes an 8-bit RGB PNG. Rows use filter 0; the sheet is flat colour so it compresses well. */
export const encodePng = ({ width, height, data }) => {
  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

/** Area-average downscale — keeps small type legible on the contact sheet. */
export const resizeArea = (source, sourceWidth, sourceHeight, targetWidth, targetHeight) => {
  const out = Buffer.alloc(targetWidth * targetHeight * 3);
  const scaleX = sourceWidth / targetWidth;
  const scaleY = sourceHeight / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    const y0 = Math.floor(y * scaleY);
    const y1 = Math.min(sourceHeight, Math.max(y0 + 1, Math.ceil((y + 1) * scaleY)));
    for (let x = 0; x < targetWidth; x++) {
      const x0 = Math.floor(x * scaleX);
      const x1 = Math.min(sourceWidth, Math.max(x0 + 1, Math.ceil((x + 1) * scaleX)));
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let sy = y0; sy < y1; sy++) {
        let index = (sy * sourceWidth + x0) * 3;
        for (let sx = x0; sx < x1; sx++) {
          r += source[index];
          g += source[index + 1];
          b += source[index + 2];
          index += 3;
          count += 1;
        }
      }
      const target = (y * targetWidth + x) * 3;
      out[target] = Math.round(r / count);
      out[target + 1] = Math.round(g / count);
      out[target + 2] = Math.round(b / count);
    }
  }

  return out;
};

/** Nearest-neighbour scale-up, used to render a legible label into the sheet. */
export const blit = (target, targetWidth, source, sourceWidth, sourceHeight, x0, y0) => {
  for (let y = 0; y < sourceHeight; y++) {
    for (let x = 0; x < sourceWidth; x++) {
      const from = (y * sourceWidth + x) * 3;
      const to = ((y0 + y) * targetWidth + (x0 + x)) * 3;
      target[to] = source[from];
      target[to + 1] = source[from + 1];
      target[to + 2] = source[from + 2];
    }
  }
};

export const fill = (target, targetWidth, x0, y0, width, height, [r, g, b]) => {
  for (let y = y0; y < y0 + height; y++) {
    for (let x = x0; x < x0 + width; x++) {
      const to = (y * targetWidth + x) * 3;
      target[to] = r;
      target[to + 1] = g;
      target[to + 2] = b;
    }
  }
};
