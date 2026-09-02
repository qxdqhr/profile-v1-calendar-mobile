const { withAppBuildGradle } = require('expo/config-plugins');

const KEYSTORE_LOADER = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
`;

const RELEASE_SIGNING_CONFIG = `        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`;

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') return mod;

    let contents = mod.modResults.contents;
    if (contents.includes('keystorePropertiesFile')) return mod;

    contents = contents.replace(
      /(\ndef jscFlavor[^\n]*\n)\nandroid \{/,
      `$1\n${KEYSTORE_LOADER}\nandroid {`,
    );

    contents = contents.replace(
      /(signingConfigs \{\s*debug \{[\s\S]*?\n        \}\s*)\}/,
      `$1${RELEASE_SIGNING_CONFIG}\n    }`,
    );

    contents = contents.replace(
      /release \{\s*\n\s*\/\/ Caution! In production, you need to generate your own keystore file\.\s*\n\s*\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\s*\n\s*signingConfig signingConfigs\.debug/,
      'release {\n            signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug',
    );

    mod.modResults.contents = contents;
    return mod;
  });
}

module.exports = withAndroidReleaseSigning;
