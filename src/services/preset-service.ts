import { createSeededRandom } from "../utils/random";

export type VisualEffectPreset = {
  id: string;
  name: string;
  baseColorHex: string;
  particleIntensity: number;
  cameraShake: number;
  bgShader: string;
};

export type PresetSelection = {
  selected: VisualEffectPreset;
  list: VisualEffectPreset[];
};

export function buildPresets(colorHex: string, seed: number): PresetSelection {
  const rng = createSeededRandom(seed);
  const baseIntensity = Number((0.6 + rng() * 0.35).toFixed(2));
  const presets: VisualEffectPreset[] = [
    {
      id: "color-primary",
      name: "Primary Pulse",
      baseColorHex: colorHex,
      particleIntensity: baseIntensity,
      cameraShake: Number((0.05 + rng() * 0.15).toFixed(2)),
      bgShader: "pulse",
    },
    {
      id: "color-wave",
      name: "Wave Cascade",
      baseColorHex: colorHex,
      particleIntensity: Number(
        (baseIntensity * (0.8 + rng() * 0.4)).toFixed(2),
      ),
      cameraShake: Number((0.02 + rng() * 0.1).toFixed(2)),
      bgShader: "wave",
    },
    {
      id: "color-spectrum",
      name: "Spectrum Burst",
      baseColorHex: colorHex,
      particleIntensity: Number(
        (baseIntensity * (0.9 + rng() * 0.2)).toFixed(2),
      ),
      cameraShake: Number((0.08 + rng() * 0.12).toFixed(2)),
      bgShader: "sparkle",
    },
  ];

  if (presets.length > 10) {
    presets.length = 10;
  }

  const selected =
    presets[
      presets.reduce(
        (maxIndex, preset, index, arr) =>
          preset.particleIntensity > arr[maxIndex].particleIntensity
            ? index
            : maxIndex,
        0,
      )
    ];

  return { selected, list: presets };
}
