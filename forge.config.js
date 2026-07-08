const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { generateLatestMacYml } = require('./scripts/generate-latest-mac-yml.js');

const shouldSign = Boolean(
  process.env.APPLE_ID &&
  process.env.APPLE_APP_SPECIFIC_PASSWORD &&
  process.env.APPLE_TEAM_ID
);
const isLocalBuild = process.env.SUPASLASH_LOCAL_BUILD === '1';

module.exports = {
  packagerConfig: {
    name: 'SupaSlash',
    appBundleId: 'com.champkiddesign.supaslash',
    icon: './assets/icon',
    asar: true,
    ...(shouldSign ? {
      osxSign: {
        identity: process.env.APPLE_SIGNING_IDENTITY || 'Developer ID Application',
        'hardened-runtime': true,
        'gatekeeper-assess': false,
        entitlements: './entitlements.plist',
        'entitlements-inherit': './entitlements.plist',
      },
      osxNotarize: {
        tool: 'notarytool',
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID,
      },
    } : {}),
  },
  rebuildConfig: {},
  makers: [
    ...(isLocalBuild ? [] : [{
      name: '@electron-forge/maker-dmg',
      config: {
        title: 'SupaSlash',
        format: 'ULFO',
      },
    }]),
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'champkiddesign',
          name: 'supaslash',
        },
        draft: false,
        prerelease: true,
      },
    },
  ],
  hooks: {
    postMake: async (_forgeConfig, makeResults) => {
      for (const result of makeResults) {
        const zipArtifact = result.artifacts.find((artifact) => (
          artifact.endsWith('.zip') && artifact.includes('darwin')
        ));
        if (!zipArtifact) continue;

        const ymlPath = generateLatestMacYml(zipArtifact, result.packageJSON.version);
        if (!result.artifacts.includes(ymlPath)) {
          result.artifacts.push(ymlPath);
        }
      }
      return makeResults;
    },
  },
};
