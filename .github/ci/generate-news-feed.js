import { Feed } from 'feed';
import fs from 'fs';
import fetch from 'node-fetch';

/**
 * @type {FeedConfig[]}
 */
const feeds = [
  {
    title: '24life Updates',
    targetFile: `../../feed.xml`,
    source: 'https://main--24life--hlxsites.hlx.page/articles.json',  
    siteRoot: "https://www.24life.com",
    link:	"https://www.24life.com/feed/",
    language:	"en",
    description:	"24life.com updates"
  } 
]


const limit = "1000";

/**
 * @typedef {Object} FeedConfig
 * @property {string} title
 * @property {string} description
 * @property {string} link
 * @property {string} siteRoot
 * @property {string} targetFile
 * @property {string} source
 * @property {string} language
 */


/**
 * @typedef {Object} Post
 * @property {string} title
 * @property {string} summary
 * @property {string} path
 * @property {string} publicationDate
 * @property {string} template
 */

/**
 * @param feed {FeedConfig}
 * @return {Promise<void>}
 */
async function createFeed(feed) {
  const allPosts = await fetchBlogPosts(feed);
  console.log(`found ${allPosts.length} posts`);


  const newestPost = allPosts
    .map((post) => new Date(post.publicationDate * 1000))
    .reduce((maxDate, date) => (date > maxDate ? date : maxDate), new Date(0));

  const atomFeed = new Feed({
    title: feed.title,
    description: feed.description,
    id: feed.link,
    link: feed.link,
    updated: newestPost,
    generator: 'AEM Project Franklin News feed generator (GitHub action)',
    language: feed.language,
  });

  allPosts.forEach((post) => {
    const link = feed.siteRoot + post.path;
    atomFeed.addItem({
      title: post.title,
      id: link,
      link,
      content: post.summary,
      date: new Date(post.publishDate * 1000),
      published: new Date(post.publishDate * 1000),
    });
  });

  fs.writeFileSync(feed.targetFile, atomFeed.atom1());
  console.log('wrote file to ', feed.targetFile);
}

/**
 * @param feed {FeedConfig}
 * @return {Promise<Post[]>}
 */
async function fetchBlogPosts(feed) {
  let offset = 0;
  const allPosts = [];

  while (true) {
    const api = new URL(feed.source);
    api.searchParams.append('offset', JSON.stringify(offset));
    api.searchParams.append('limit', limit);
    const response = await fetch(api, {});
    const result = await response.json();

    allPosts.push(...result.data);

    if (result.offset + result.limit < result.total) {
      // there are more pages
      offset = result.offset + result.limit;
    } else {
      break;
    }
  }
  return allPosts;
}

for (const feed of feeds) {
  createFeed(feed)
    .catch((e) => console.error(e));

}
