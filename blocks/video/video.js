import { decorateIcons } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  // create container for play button
  const playButtonContainer = document.createElement('div');
  playButtonContainer.classList.add('play-button-container');
  // create svg element
  playButtonContainer.innerHTML = '<span class="icon icon-play-btn"></span>';
  await decorateIcons(playButtonContainer);
  block.append(playButtonContainer);

  const poster = block.querySelector('picture img');
  const link = block.querySelector('a');
  const video = document.createElement('video');
  video.classList.add('video');
  video.width = 1170;
  video.height = 658;
  video.poster = poster.src;
  video.preload = 'auto';
  video.controls = true;
  video.src = link.href;

  // create overlay on video so play, pause and end events can be captured
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');
  block.append(overlay);

  // when overlay is clicked anywhere play or pause video. Hide play button when video is playing
  // show play button when video is paused
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

  // show play button when video is paused
  video.addEventListener('pause', () => {
    playButtonContainer.classList.remove('hide');
  });

  link.replaceWith(video);
}
