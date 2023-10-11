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
const baseUrl = "https://main--24life--hlxsites.hlx.live"; // without trailing slash, must be .live domain
const limitConcurrency = pLimit(5);
function isLocalLink(url) {
  return url.hostname.includes("24life--hlxsites.hlx.page")
    || url.hostname.includes("24life--hlxsites.hlx.live");
}
// ###  end of configuration ###

requireNodeVersion(20);

let files = (await readdir(sourceDirectory, {recursive: true}))
  .filter((file) => file.endsWith(".docx"))
  .filter((file) => !file.startsWith("24life/drafts/"))

// processing files in parallel
await Promise.all(files.map(async (file) => {
  await (limitConcurrency(async () => {
    const sourceFilePath = path.join(sourceDirectory, file);

    const links = await getAllLinks(sourceFilePath);
    for (let link of links) {
      const url = new URL(link, baseUrl);

      // fetch redirects.json and apply them.
      if (isLocalLink(url)) {

        if(url.pathname.includes("/media_")){
          const response = await fetch(baseUrl + url.pathname);
          if (! response.ok) {
            console.log("---")
            console.log(sourceFilePath)
            console.log(` 404: ${url.pathname} `)
          }
        } else if(url.pathname.startsWith("/24life/category")){
          // ignore
        } else if (!fileExists(url.pathname)) {
          console.log("---")
          console.log(sourceFilePath)
          console.log(` 404: ${url.pathname} `)
        }
      }
    }
  }));
}));


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

function fileExists(pathname) {
  return fs.existsSync(path.join(sourceDirectory, pathname)) ||
    fs.existsSync(path.join(sourceDirectory, pathname + ".docx"));
}

