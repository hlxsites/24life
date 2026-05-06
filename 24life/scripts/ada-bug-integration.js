import { loadScript } from './lib-franklin.js';

await loadScript('https://a42cdn.usablenet.com/a42/24hourfitness/default/prod/cs-start', {
  id: 'usntA42start',
  async: true,
  'data-rapid': 'true',
});
