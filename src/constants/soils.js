// Van Genuchten "A" coefficients for the Mini Disk Infiltrometer
// at 2 cm suction (Zhang, 1997; Decagon Devices user's manual).
export const SOIL_TEXTURES = [
  { texture: 'Sand', a: 1.73 },
  { texture: 'Loamy Sand', a: 2.43 },
  { texture: 'Sandy Loam', a: 3.91 },
  { texture: 'Loam', a: 6.27 },
  { texture: 'Silt', a: 8.71 },
  { texture: 'Silt Loam', a: 7.93 },
  { texture: 'Sandy Clay Loam', a: 3.24 },
  { texture: 'Clay Loam', a: 6.64 },
  { texture: 'Silty Clay Loam', a: 8.51 },
  { texture: 'Sandy Clay', a: 4.09 },
  { texture: 'Silty Clay', a: 6.36 },
  { texture: 'Clay', a: 4.3 },
];

export const SOIL_MAP = Object.fromEntries(
  SOIL_TEXTURES.map((s) => [s.texture, s.a]),
);

export const DEFAULT_SOIL = 'Loam';
