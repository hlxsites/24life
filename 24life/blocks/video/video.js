import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Decorate a MP4 video block
 * @param block
 * @returns {Promise<void>}
 */
export default async function decorate(block) {
  const poster = block.querySelector('picture img');
  const link = block.querySelector('a');
  if (!link) {
    // no link, so no video
    return;
  }
  const video = document.createElement('video');
  video.classList.add('video');
  if (poster && poster.src) {
    video.poster = poster.src;
  }
  video.preload = 'auto';
  video.controls = true;
  video.src = link.href;

  // create container for play button
  const playButtonContainer = document.createElement('div');
  playButtonContainer.classList.add('play-button-container');
  // add icon-play-btn svg image
  playButtonContainer.innerHTML = '<span class="icon icon-play-btn"></span>';
  decorateIcons(playButtonContainer);
  block.append(playButtonContainer);

  // create overlay on video so play, pause and end events can be captured
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');
  block.append(overlay);

  // when overlay is clicked anywhere, toggle between play & pause.
  // Hide play button when video is playing
  // Show play button when video is paused
  overlay.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playButtonContainer.classList.add('hide');
    } else {
      video.pause();
      playButtonContainer.classList.remove('hide');
    }
  });

  // show play button when video ends
  video.addEventListener('ended', () => {
    playButtonContainer.classList.remove('hide');
  });

  // add video to block
  link.replaceWith(video);
}
