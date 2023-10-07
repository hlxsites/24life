import { loadScript, sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

/**
 * Load the launch library applicable to the domain dev, staging, or production.
 */
async function loadAdobeLaunch() {
  // Stage
  let url = 'https://assets.adobedtm.com/57921990a5e5/01b20556a634/launch-EN1720538a14c5448383dbc3a400a4f55a-staging.min.js';
  if (window.location.hostname === 'www.24hourfitness.com') {
    // PROD
    url = 'https://assets.adobedtm.com/57921990a5e5/01b20556a634/launch-EN899f16b777754991924d45661d0c60bb.min.js';
  } else if (window.location.host.includes('localhost')) {
    // DEV
    url = 'https://assets.adobedtm.com/57921990a5e5/01b20556a634/launch-EN95eda61e2ae9436886ce63d7d3dcb671-development.min.js';
  }
  await loadScript(url, {
    type: 'text/javascript',
    charset: 'UTF-8',
    async: true,
  });
}

await loadAdobeLaunch();
