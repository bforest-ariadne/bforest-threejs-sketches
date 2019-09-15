const budo = require('budo');
const browserify = require('browserify');
const path = require('path');

// a utility that attaches shader reloading capabilities to budo
const attachShaderReload = require('./budo-attach');

// root source
const entry = require.resolve('../');

// You could add more transforms here if you like
const transforms = [
  'babelify',
  'glslify'
];

var liveOpts = {
  // For faster development, re-bundle the LiveReload client
  // on each request
  cache: false,
  // Include source mapping in the LiveReload client
  debug: true,
  // Expose LiveReload client to window.require('budo-livereload')
  expose: true,
  // Additional script(s) to include after the LiveReload client
  // include: require.resolve('./live-client.js')
}

var privateKey = path.resolve(__dirname, './sslcert2/server.key');
var certificate = path.resolve(__dirname, `./sslcert2/server.cer`);

// during development
module.exports.dev = function () {
  const args = [ entry ].concat(process.argv.slice(2));
  const app = budo.cli(args, {
    dir: path.resolve(__dirname, '../app'),
    serve: 'bundle.js',
    live: false,
    cert: certificate,
    key: privateKey,
    browserify: {
      transform: transforms.concat([ 'shader-reload/transform' ])
    }
  });
  if (app) attachShaderReload(app);
  return app;
};

// create a file for production
module.exports.bundle = function () {
  const bundler = browserify(entry, {
    fullPaths: process.env.DISC === '1'
  });

  // add common transforms
  transforms.forEach(t => bundler.transform(t));

  // add production transforms
  return bundler
    .transform('loose-envify', { global: true })
    .transform('unreachable-branch-transform', { global: true })
    .bundle();
};

if (!module.parent) {
  if (process.env.NODE_ENV === 'production') {
    module.exports.bundle().pipe(process.stdout);
  } else {
    module.exports.dev();
  }
}