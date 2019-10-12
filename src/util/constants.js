const toneMappingOptions = {
  None: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Uncharted2: THREE.Uncharted2ToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping
};

const resolutionOptions = {
  '240': 240,
  '360': 360,
  '480': 480,
  '720': 720,
  '1080': 1080
};

module.exports = { toneMappingOptions, resolutionOptions };
