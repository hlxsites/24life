// /*
//  * Embed Block
//  * Show videos and social posts directly on your page
//  * https://www.hlx.live/developer/block-collection/embed
//  */

// import { loadScript, loadCSS } from '../../scripts/lib-franklin.js';

// export default function decorate(block) {
//   const link = block.querySelector('a').href;
//   block.textContent = '';

//   const observer = new IntersectionObserver((entries) => {
//     if (entries.some((e) => e.isIntersecting)) {
//       observer.disconnect();
//       loadEmbed(block, link);
//     }
//   });
//   observer.observe(block);
// }

// const loadEmbed = (block, link) => {
//   if (block.classList.contains('embed-is-loaded')) {
//     return;
//   }

//   const EMBEDS_CONFIG = [
//     {
//       match: ['youtube', 'youtu.be'],
//       embed: embedYoutube,
//     },
//   ];

//   const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
//   console.log(link);
//   const url = new URL(link);
//   console.log(url);
//   const isLite = block.classList.contains('lite');

//   if (config) {
//     block.innerHTML = config.embed(url, isLite);
//     block.classList = `block embed embed-${config.match[0]}`;
//   }
//   block.classList.add('embed-is-loaded');
// };

// const embedYoutube = (url, isLite) => {
//   const usp = new URLSearchParams(url.search);
//   let suffix = '';
//   let vid = usp.get('v');
//   const autoplayParam = usp.get('autoplay');
//   const mutedParam = usp.get('muted');

//   if (autoplayParam && mutedParam) {
//     suffix += `&autoplay=${autoplayParam}&muted=${mutedParam}`;
//   } else if (autoplayParam) {
//     suffix += `&autoplay=${autoplayParam}&muted=1`;
//   } else if (mutedParam) {
//     suffix += `&muted=${mutedParam}`;
//   }

//   const embed = url.pathname;
//   if (url.origin.includes('youtu.be')) {
//     [, vid] = url.pathname.split('/');
//   }

//   let embedHTML;

//   if (isLite) {
//     console.log(embed);
//     const embedSplit = embed.split('/');
//     console.log(embedSplit);
//     embedHTML = `
//       <lite-youtube videoid=${vid || embedSplit[embedSplit.length - 1]}>
//         <a href="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" class="lty-playbtn" title="Play Video">
//       </a>
//       </lite-youtube>`;
//     loadCSS(`${window.hlx.codeBasePath}/blocks/embed/lite-yt-embed.css`);
//     loadScript(`${window.hlx.codeBasePath}/blocks/embed/lite-yt-embed.js`);
//   } else {
//     embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
//         <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
//         allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
//       </div>`;
//   }

//   return embedHTML;
// };
