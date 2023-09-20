import { getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';
import { getYoutubeVideoId } from '../../scripts/scripts.js';

export default function decorate(block) {
  const data = readBlockConfig(block);
  // Get the image element from the block before we clear it
  const picture = block.querySelector('picture');
  block.innerText = '';

  const over900px = window.matchMedia('(min-width: 900px)');

  // create image
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');
  picture.querySelector('img').classList.add('fallback-image');
  imageContainer.append(picture);
  block.append(imageContainer);

  const videoContainer = document.createElement('div');
  videoContainer.classList.add('video-container');

  function buildVideo() {
    if (isYoutubeVideo(data.video)) {
      videoContainer.append(buildIframe(data.video, block));
    } else {
      // mp4 video
      videoContainer.append(buildVideoTag(data.video));
    }
  }

  if (data.video) {
    block.classList.add('has-video');
    if (over900px.matches) {
      buildVideo();
    }
  }
  block.append(videoContainer);

  // add overlay div to avoid clicks on video
  const overlay = document.createElement('div');
  overlay.classList.add('overlay-catch-clicks');
  block.append(overlay);

  // We don't want to load the video on smaller screens. Make sure to delete or add
  // the markup when the screen size changes
  over900px.addEventListener('change', (e) => {
    if (e.matches) {
      if (videoContainer.querySelector('iframe, video')) {
        return;
      }
      buildVideo();
    } else {
      videoContainer.innerHTML = '';
    }
  });

  const titleContainer = document.createElement('div');
  titleContainer.classList.add('title-container');

  const section = document.createElement('h4');
  section.classList.add('article-hero-video-section');
  // get section from metadata
  section.innerText = getMetadata('section');

  const title = document.createElement('h1');
  title.classList.add('article-hero-video-title');
  title.innerText = data?.title.trim();

  const authorLinks = document.createElement('h6');
  authorLinks.classList.add('authors');
  authorLinks.append('By ');
  getMetadata('authors').trim().split(',').forEach((author, index) => {
    const authorLink = document.createElement('a');
    authorLink.href = `/author/${toClassName(author)}`;
    authorLink.textContent = author;
    if (index > 0) {
      authorLinks.append(' and ');
    }
    authorLinks.append(authorLink);
  });

  titleContainer.append(section);
  titleContainer.append(title);
  titleContainer.append(authorLinks);
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

  // Set boolean attributes
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.setAttribute('muted', 'true');

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
