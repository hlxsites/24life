

export default async function decorate(doc) {
  const firstContent = doc.querySelector('main .section .default-content-wrapper')
  firstContent.before(createSocialMediaButtons());

  const lastContent = doc.querySelector('main .section:last-child .default-content-wrapper');
  firstContent.after(createSocialMediaButtons());
}


function createSocialMediaButtons() {
  const socialMediaButtons = document.createElement('div')
  socialMediaButtons.innerHTML = `
  <ul class="article-social-media-buttons">
      <li>
          <a class="" target="_blank" href="https://twitter.com/share?url=" onclick="return ebor_tweet_21622()">
              <span class="icon icon-twitter-alt"></span>
          </a>
      </li>
      <li>
          <a class="btn btn-sm btn-icon" target="_blank" href="http://www.facebook.com/share.php?u=" onclick="return ebor_fb_like_21622()">
              <span class="icon icon-facebook"></span>
          </a>
      </li>
      <li>
          <a class="btn btn-sm btn-icon" target="_blank" href="http://pinterest.com/pin/create/button/?url=" onclick="return ebor_pin_21622()">
              <span class="icon icon-pinterest"></span>
          </a>
      </li>
  </ul>`;
  socialMediaButtons.querySelectorAll('a').forEach(a => {
    a.href += window.location.href;
  });
  return socialMediaButtons;
}
