const fs = require('fs-extra')
const execa = require('execa')
const path = require('path')
const readPkg = require('read-pkg')
const { info, loading } = require('prettycli')
const latestVersion = require('latest-version')

const { version } = readPkg.sync(path.resolve(__dirname, '../package.json'))

const directories = ['core/tokens', 'core/babel-preset', 'core/components']

/* copy root version to all dependencies */
directories.forEach(directory => {
  const packageJSONPath = directory + '/package.json'
  let content = fs.readJsonSync(packageJSONPath)
  content.version = version

  /* components should import the same version of tokens */
  if (directory === 'core/components') {
    content.dependencies['@auth0/cosmos-tokens'] = version
  }

  /* scripts should import the same version of preset */
  if (directory === 'internal/cosmos-scripts') {
    content.dependencies['@auth0/babel-preset-cosmos'] = version
  }

  fs.writeJsonSync(packageJSONPath, content, { spaces: 2 })
})
info('PRE-BUILD', 'Copied root version to all packages')

/* create dist folder */
fs.removeSync('dist')
info('PRE-BUILD', 'Removed dist folder')
fs.mkdirsSync('dist')
info('PRE-BUILD', 'Created dist folder')

/* copy all packages for publishing */
// directories.forEach(directory => {
//   fs.copySync(directory, directory.replace('core', 'dist').replace('internal', 'dist'))
// })
// info('BUILD', 'Copied files to dist')


/* transpile tokens */
const presetPath = path.resolve(__dirname, '../dist/babel-preset/packages.js --extensions .ts')
try {
  loading('BUILD: TOKENS', 'Transpiling...')
  // execa.shellSync(`./node_modules/.bin/babel --presets=${presetPath} core/tokens -d dist/tokens`)
  execa.shellSync(`./node_modules/.bin/tsc --project ./core/tokens/`)
  info('BUILD: TOKENS', 'Done')
} catch (err) {
  console.log(err)
  process.exit(1)
}



/* transpile components */
try {
  loading('BUILD: COMPONENTS', 'Transpiling...')
  execa.shellSync(`./node_modules/.bin/tsc --project ./core/components/`)
  info('BUILD: COMPONENTS', 'Done')
} catch (err) {
  console.log(err)
  process.exit(1)
}

try {
  loading('BUILD: TYPEDEFS', 'Generating type definitions...')
  execa.shellSync(
    `./node_modules/.bin/tsc --declaration  --emitDeclarationOnly --allowJs false --project ./core/components/`
  )
  info('BUILD: TYPEDEFS', 'Done')
} catch (err) {
  console.log(err)
  process.exit(1)
}
