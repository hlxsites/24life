import { loadScript, sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

/**
 * Load the launch library applicable to the domain
 */
async function loadAdobeLaunch() {
  const isProd = window.location.hostname === 'www.24hourfitness.com';
  const launchProd = 'https://assets.adobedtm.com/57921990a5e5/01b20556a634/launch-EN899f16b777754991924d45661d0c60bb.min.js';
  const launchStaging = 'https://assets.adobedtm.com/57921990a5e5/01b20556a634/launch-EN1720538a14c5448383dbc3a400a4f55a-staging.min.js';
  await loadScript(isProd ? launchProd : launchStaging, {
    type: 'text/javascript',
    charset: 'UTF-8',
    async: true,
  });
}

await loadAdobeLaunch();
