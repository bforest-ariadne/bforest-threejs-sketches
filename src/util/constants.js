const toneMappingOptions = {
  None: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Uncharted2: THREE.Uncharted2ToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping
};

const SIDE_A = 'a';
const SIDE_B = 'b';

module.exports = { toneMappingOptions, SIDE_A, SIDE_B };
