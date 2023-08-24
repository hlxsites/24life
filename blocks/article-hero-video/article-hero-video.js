import { getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const data = readBlockConfig(block);
  // Get the image element from the block before we clear it
  const picture = block.querySelector('picture');
  block.innerText = '';

  const over900px = window.matchMedia('(min-width: 900px)');
  // create boolean to indicate if we have a video
  let hasVideo = false;
  // create video container named article-hero-video
  const videoContainer = document.createElement('div');
  videoContainer.classList.add('article-hero-video-iframe-container');
  if (data?.video) {
    hasVideo = true;
    if (over900px.matches) {
      videoContainer.append(buildIframe(data?.video));
    }
  }
  block.append(videoContainer);

  // add change event listener
  over900px.addEventListener('change', (e) => {
    if (e.matches) {
      // check if we have existing iframe in video container
      if (videoContainer.querySelector('iframe')) {
        return;
      }
      videoContainer.append(buildIframe(data?.video));
    } else {
      videoContainer.innerHTML = '';
      // remove overlay div
      block.querySelector('.article-hero-video-overlay').remove();
    }
  });

  // add overlay div to avoid clicks on video
  const overlay = document.createElement('div');
  overlay.classList.add('article-hero-video-overlay');
  block.append(overlay);

  // create image container div
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('article-hero-video-image-container');
  picture.classList.add('article-hero-video-image');
  imageContainer.append(picture);
  if (!hasVideo) {
    imageContainer.style.display = 'unset';
  }
  // append image container to block
  block.append(imageContainer);

  const titleContainer = document.createElement('div');
  titleContainer.classList.add('article-hero-video-title-container');

  const section = document.createElement('h4');
  section.classList.add('article-hero-video-section');
  section.innerText = getMetadata('section');

  const title = document.createElement('h1');
  title.classList.add('article-hero-video-title');
  title.innerText = data?.title.trim();

  const author = document.createElement('h6');
  author.classList.add('article-hero-video-author');
  author.innerText = `By ${data?.author.trim()}`;

  titleContainer.append(section);
  titleContainer.append(title);
  titleContainer.append(author);
  block.append(titleContainer);
}

/**
 * Build an iframe for a YouTube video
 * https://developers.google.com/youtube/iframe_api_reference
 * https://developers.google.com/youtube/youtube_player_demo
 * @param url
 * @returns {HTMLIFrameElement}
 */
function buildIframe(url) {
  const youtubeVideoId = getYoutubeVideoId(url);
  const iframe = document.createElement('iframe');
  iframe.classList.add('article-hero-video-iframe');
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&controls=0&mute=1&loop=1&playlist=${youtubeVideoId}&rel=0&playsinline=1&modestbranding=1&cc_load_policy=1&disablekb=1&enablejsapi=1&loop=1&color=white&iv_load_policy=3`;
  iframe.title = 'YouTube video player';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;';
  iframe.allowfullscreen = true;
  iframe.frameborder = '0';
  return iframe;
}

function getYoutubeVideoId(url) {
  let youtubeVideoId = '';
  if (url.includes('youtube.com/watch?v=')) {
    youtubeVideoId = new URL(url).searchParams.get('v');
  } else if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
    youtubeVideoId = new URL(url).pathname.split('/').pop();
  }
  return youtubeVideoId;
}
