const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateLatestMacYml(zipPath, version) {
  const zipBuffer = fs.readFileSync(zipPath);
  const sha512 = crypto.createHash('sha512').update(zipBuffer).digest('base64');
  const fileName = path.basename(zipPath);
  const releaseDate = new Date().toISOString();
  const yaml = [
    `version: ${version}`,
    'files:',
    `  - url: ${fileName}`,
    `    sha512: ${sha512}`,
    `    size: ${zipBuffer.length}`,
    `path: ${fileName}`,
    `sha512: ${sha512}`,
    `releaseDate: '${releaseDate}'`,
    '',
  ].join('\n');
  const ymlPath = path.join(path.dirname(zipPath), 'latest-mac.yml');
  fs.writeFileSync(ymlPath, yaml);
  return ymlPath;
}

module.exports = { generateLatestMacYml };

if (require.main === module) {
  const zipPath = process.argv[2];
  const version = process.argv[3];
  if (!zipPath || !version) {
    console.error('Usage: node scripts/generate-latest-mac-yml.js <zip-path> <version>');
    process.exit(1);
  }
  process.stdout.write(`${generateLatestMacYml(zipPath, version)}\n`);
}
