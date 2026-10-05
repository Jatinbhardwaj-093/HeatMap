const { execSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName === 'darwin') {
    const appPath = path.join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`
    );
    console.log('Ad-hoc deep signing app bundle with sealed resources at:', appPath);
    try {
      execSync(`codesign --force --deep -s - "${appPath}"`, { stdio: 'inherit' });
    } catch (err) {
      console.warn('Ad-hoc signing warning:', err.message);
    }
  }
};
