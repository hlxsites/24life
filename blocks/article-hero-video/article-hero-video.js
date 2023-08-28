import { getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const data = readBlockConfig(block);
  // Get the image element from the block before we clear it
  const picture = block.querySelector('picture');
  block.innerText = '';

  const over900px = window.matchMedia('(min-width: 900px)');
  // create boolean to indicate if we have a video
  let hasVideo = false;
  // create video container
  const videoContainer = document.createElement('div');
  videoContainer.classList.add('article-hero-video-element-container');
  // create overlay container
  const overlayContainer = document.createElement('div');
  overlayContainer.classList.add('article-hero-video-overlay-container');

  function buildVideo() {
    if (isYoutubeVideo(data?.video)) {
      videoContainer.append(buildIframe(data?.video));
    } else {
      // mp4 video
      videoContainer.append(buildVideoTag(data?.video));
    }
    // add overlay div to avoid clicks on video
    overlayContainer.append(addVideoOverlay());
  }

  if (data?.video) {
    hasVideo = true;
    if (over900px.matches) {
      buildVideo();
    }
  }
  block.append(videoContainer);
  block.append(overlayContainer);

  // add change event listener
  over900px.addEventListener('change', (e) => {
    if (e.matches) {
      // check if we have existing iframe in video container
      if (videoContainer.querySelector('iframe')) {
        return;
      }
      buildVideo();
    } else {
      videoContainer.innerHTML = '';
      overlayContainer.innerHTML = '';
    }
  });

  function addVideoOverlay() {
    // create overlay div if it doesn't exist
    const overlay = document.createElement('div');
    overlay.classList.add('article-hero-video-overlay');
    return overlay;
  }

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
  // get section from metadata
  section.innerText = getMetadata('section');

  const title = document.createElement('h1');
  title.classList.add('article-hero-video-title');
  title.innerText = data?.title.trim();

  const author = document.createElement('h6');
  author.classList.add('article-hero-video-author');
  author.innerText = `By ${getMetadata('authors')?.trim()}`;

  titleContainer.append(section);
  titleContainer.append(title);
  titleContainer.append(author);
  block.append(titleContainer);
}

/**
 * Build a video tag for an MP4 video
 * @param url {string} URL of the video
 * @returns {HTMLVideoElement} video element
 */
function buildVideoTag(url) {
  // Create video element
  const video = document.createElement('video');
  video.style.width = '100%';
  video.style.height = '100%';
  video.classList.add('article-hero-video-element');
  video.setAttribute('preload', 'auto');
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');

  // Create source element for MP4
  const sourceMp4 = document.createElement('source');
  sourceMp4.setAttribute('src', url);
  sourceMp4.setAttribute('type', 'video/mp4');

  // Append source to video
  video.appendChild(sourceMp4);
  return video;
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
  iframe.classList.add('article-hero-video-element');
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

/**
 * Check if a URL is a YouTube video
 * @param url {string}
 * @returns {boolean} true if the URL is a YouTube video
 */
function isYoutubeVideo(url) {
  return url.includes('youtube.com/watch?v=')
    || url.includes('youtube.com/embed/')
    || url.includes('youtu.be/')
    || url.includes('youtube-nocookie.com/embed/');
}
