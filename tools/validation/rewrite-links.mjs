// noinspection UnnecessaryContinueJS
import fs from 'fs'
import {readdir} from "node:fs/promises";
import path from "path";
import {exec} from "child_process";
import pLimit from 'p-limit';

// make sure you have docxtools installed. https://github.com/coderthoughts/docxtools

// Then mount the Sharepoint folder using OneDrive and set the sourceDirectory variable below.

// ### configuration ###
const sourceDirectory = `/Users/wingeier/Library/CloudStorage/OneDrive-Adobe/24life`;
const outputDir = `./24life-rewritten`;
const redirects = await loadRedirects("main--24life--hlxsites.hlx.page");
const baseUrlForRelativePaths = "https://main--24life--hlxsites.hlx.page/";
const limitConcurrency = pLimit(15);
// ###  end of configuration ###

requireNodeVersion(20);

let files = (await readdir(sourceDirectory, {recursive: true}))
  .filter((file) => file.endsWith(".docx"))
  .filter((file) => !file.startsWith("24life/drafts/"))

function is24LifeSite(url) {
  return url.hostname.includes("24life.com") ||
    url.hostname.includes("24life--hlxsites.hlx.page")
    || url.hostname.includes("24life--hlxsites.hlx.live");

}

function createLinkWithPath(link, pathname) {
  const newLink = new URL(link, baseUrlForRelativePaths);
  newLink.pathname = pathname;
  newLink.hostname = "main--24life--hlxsites.hlx.page";
  newLink.protocol = "https";
  return newLink;
}

// processing files in parallel
await Promise.all(files.map(async (file) => {
  await (limitConcurrency(async () => {
    const sourceFilePath = path.join(sourceDirectory, file);
    const outputFilePath = path.join(outputDir, file);

    if (sourceFilePath !== outputFilePath && fs.existsSync(outputFilePath)) {
      console.log(`skipped, ${outputFilePath} already exists`)
      return;
    }

    const links = await getAllLinks(sourceFilePath);
    for (let link of links) {
      const url = new URL(link, baseUrlForRelativePaths);

      // ### Add your transformations here ###

      // fetch redirects.json and apply them.
      if (is24LifeSite(url)
          && redirects[url.pathname]) {
          const newLink = new URL(link, baseUrlForRelativePaths);
          newLink.pathname = redirects[url.pathname];
          newLink.hostname = "main--24life--hlxsites.hlx.page";
          newLink.protocol = "https";
        if(newLink.toString() !== url.toString()) {
          await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
          continue; // apply only one rewrite for each link
        }
      }
      // same as above, but also try with a trailing slash
      if (is24LifeSite(url)
          && redirects[url.pathname + "/"] ) {
          const newLink = new URL(link, baseUrlForRelativePaths);
          newLink.pathname = redirects[url.pathname + "/"];
          newLink.hostname = "main--24life--hlxsites.hlx.page";
          newLink.protocol = "https";
          if(newLink.toString() !== url.toString()) {
            await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
            continue; // apply only one rewrite for each link
          }
      }

      // add /24life prefix to all links
      if (is24LifeSite(url) && !url.pathname.startsWith("/24life")) {
        const newLink = new URL(link, baseUrlForRelativePaths);
        newLink.pathname = "/24life" + newLink.pathname;
        newLink.hostname = "main--24life--hlxsites.hlx.page";
        newLink.protocol = "https";
        await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
        continue; // apply only one rewrite for each link
      }

      if (is24LifeSite(url) && url.pathname.includes('%E2%80%9D')) {
        const newLink = new URL(link, baseUrlForRelativePaths);
        newLink.pathname = url.pathname.replaceAll('%E2%80%9D', '');
        newLink.hostname = "main--24life--hlxsites.hlx.page";
        newLink.protocol = "https";
        await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
        continue; // apply only one rewrite for each link
      }

      if(link==="https://main--24life--hlxsites.hlx.page/24life/Library/Containers/com.microsoft.Word/Data/Downloads/ryanserhant.com") {
        await changeLink(sourceFilePath, outputFilePath, link, "https://ryanserhant.com/");
      }

      if(url.pathname.startsWith("/24life/author/rory-j") || url.pathname.startsWith("/24life/author/rory-o")) {
        const newLink = createLinkWithPath(link, "/24life/author/rory-oconnor");
        if(newLink.toString() !== url.toString()) {
          await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
          continue; // apply only one rewrite for each link
        }
      }

      if(url.pathname.startsWith("/24life/author/dr.")) {
        const newLink = createLinkWithPath(link, "/24life/author/kelly-starrett");
        if(newLink.toString() !== url.toString()) {
          await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
          continue; // apply only one rewrite for each link
        }
      }
      if(url.pathname.startsWith("/24life/author/robert-%22")) {
        const newLink = createLinkWithPath(link, "/24life/author/robert-cappuccio");
        if(newLink.toString() !== url.toString()) {
          await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
          continue; // apply only one rewrite for each link
        }
      }

      if (is24LifeSite(url) && [
        "/24life/fitness/2018/body-gone-bbarreless",
        "/24life/fitness/2018/bring-2017-on-strong",
        "/24life/fitness/2018/jump-your-bones-and-work-that-skeleton-for-lifelong-health",
        "/24life/fitness/2018/movement-basics-for-a-healthier-2017",
        "/24life/fitness/2018/seven-workout-trends-youll-see-in-2017",
        "/24life/fitness/2019/spartan-total-body-conditioning",
        "/24life/fitness/2019/tabata-kickstart",
        "/24life/fitness/2020/seven-self-care-stretches-before-bed",
        "/24life/fitness/2021/short-circuit-fat-burn",
        "/24life/focus/2018/alex-carneiro-raises-a-goal",
        "/24life/focus/2018/excuse-busters",
        "/24life/focus/2018/kwik-success-goals-from-the-heart-with-jim-kwik",
        "/24life/focus/2018/motivation-mastery",
        "/24life/focus/2019/naveen-jain-says-the-sky-is-not-the-limit-when-it-comes-to-well-being",
        "/24life/focus/2019/spartan-more-than-a-race",
        "/24life/focus/2019/spartan-up",
        "/24life/focus/2020/a-fitness-coach-and-social-influencers-three-tips-for-healthier-self-talk",
        "/24life/focus/2020/kelly-mcgonigal-on-falling-back-in-love-with-movement",
        "/24life/focus/2020/new-year-new-advice-from-top-social-media-fitness-influencers",
        "/24life/focus/2020/sophia-amoruso-wants-women-to-own-their-career",
        "/24life/fuel/2018/crack-the-diet-code",
        "/24life/fuel/2018/fitness-in-the-kitchen-with-jorge-cruise",
        "/24life/fuel/2018/heres-what-happens-when-you-eat-in-silence",
        "/24life/fuel/2020/5-easy-ways-to-save-money-in-2020",
        "/24life/fuel/2020/unpack-your-excuses-for-success-with-nick-routson",
        "/24life/fuel/2020/what-does-a-plant-based-diet-really-mean",
        "/24life/fuel/2021/mini-trifles-for-two",
        "/24life/recover/2018/get-back-into-your-body",
        "/24life/recover/2018/reset-your-body-for-a-fresh-start",
        "/24life/recover/2019/busting-through-barriers-with-spartan-adaptive-athlete-misty-diaz",
      ].includes(url.pathname)) {
        // these are invalid, find correct mapping
        const lastPart = url.pathname.split("/").pop();
        const newLink = new URL(link, baseUrlForRelativePaths);
        const newPathName = `/24life/${lastPart}/`;
        if(redirects[newPathName]) {
          newLink.pathname = redirects[newPathName];
          newLink.hostname = "main--24life--hlxsites.hlx.page";
          newLink.protocol = "https";
          if(newLink.toString() !== url.toString()) {
            await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
            continue; // apply only one rewrite for each link
          }
        } else {
          console.log("--- warn: no alternative found for " + url.pathname)
        }



      }

      // if (siteHostnames.includes(url.hostname) && url.pathname.startsWith("/24life/authors/")) {
      //   const newLink = new URL(link, baseUrlForRelativePaths);
      //   newLink.pathname = newLink.pathname.replace("/24life/authors/", "/24life/author/");
      //   newLink.hostname = "main--24life--hlxsites.hlx.page";
      //   newLink.protocol = "https";
      //   await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
      //   continue; // apply only one rewrite for each link
      // }

      const youtubeVideoId  = getYoutubeVideoId(link);
      if(link.includes("https://www.youtube.com/embed/") && youtubeVideoId){
        const newLink = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
        if(newLink !== url.toString()) {
          await changeLink(sourceFilePath, outputFilePath, link, newLink);
          await changeText(sourceFilePath, outputFilePath, link, newLink);
          continue; // apply only one rewrite for each link
        }
      }

      // add more link rewrites here

    }

  }));
}));

async function changeLink(sourceFilePath, outputFilePath, link, newLink) {
  function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
  }


  console.log(`---\n${sourceFilePath}: \nchanging ${link} to ${newLink}`)

  const outputParentDir = outputFilePath.substring(0, outputFilePath.lastIndexOf("/"));
  const tempFile = `${outputFilePath}.tmp`;

  fs.mkdirSync(outputParentDir, {recursive: true});

  if (!fs.existsSync(outputFilePath)) {
    fs.copyFileSync(sourceFilePath, outputFilePath);
  }

  // make temp copy, to support in-place replacement of files.
  fs.copyFileSync(outputFilePath, tempFile);

  const command = `docxtools '${tempFile}' replace-links '^${escapeRegex(link)}$' '${(newLink)}' '${outputFilePath}'`;
  console.debug(command)
  console.log(await execShellCommand(command))
  fs.unlinkSync(tempFile);
}

async function changeText(sourceFilePath, outputFilePath, sourceText, newText) {
  function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
  }


  console.log(`---\n${sourceFilePath}: \nchanging ${sourceText} to ${newText}`)

  const outputParentDir = outputFilePath.substring(0, outputFilePath.lastIndexOf("/"));
  const tempFile = `${outputFilePath}.tmp`;

  fs.mkdirSync(outputParentDir, {recursive: true});

  if (!fs.existsSync(outputFilePath)) {
    fs.copyFileSync(sourceFilePath, outputFilePath);
  }

  // make temp copy, to support in-place replacement of files.
  fs.copyFileSync(outputFilePath, tempFile);

  const command = `docxtools '${tempFile}' _replace '^${escapeRegex(sourceText)}$' '${(newText)}' '${outputFilePath}'`;
  console.debug(command)
  console.log(await execShellCommand(command))
  fs.unlinkSync(tempFile);
}

async function loadRedirects(domain) {
  const resp = await fetch("https://" + domain + "/redirects.json?limit=9999")
  const json = await resp.json()
  const redirects = {}
  for (const row of json.data) {
    redirects[row.source] = row.destination;
  }
  return redirects;
}


async function getAllLinks(filePath) {
  const output = await execShellCommand(`docxtools '${filePath}' links `);
  return output.split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      return line.split(": ").pop()
    });
}

function requireNodeVersion(version) {
  const [major] = process.versions.node.split('.').map(Number)
  if (major < version) {
    console.error("node version 20 or higher required")
    process.exit(1)
  }
}

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

export function getYoutubeVideoId(url) {
  const link = url.replaceAll("\\_", "_");
  if (link.includes('youtube.com/watch?v=')) {
    return new URL(link).searchParams.get('v');
  }
  if (link.includes('youtube.com/embed/') || link.includes('youtu.be/')) {
    return new URL(link).pathname.split('/').pop();
  }
  return null;
}
