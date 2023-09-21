/*  looks for bad links in the final franklin output.
 */
import {JSDOM} from "jsdom";

import fs from 'fs/promises'
import {readdir} from "node:fs/promises";

const [major, minor, patch] = process.versions.node.split('.').map(Number)
if (major < 20) {
    console.error("node version 20 or higher required")
    process.exit(1)
}


const redirects = await loadRedirects();
const allIssues = {}

const dir = `./24life`;
let htmlFiles = (await readdir(dir, {recursive: true}))
    .filter((file) => file.endsWith(".html"))
    .map((file) => dir + "/" + file)
// htmlFiles = htmlFiles.slice(0, 400)

await Promise.all(htmlFiles.map(async (file) => validateFile(file)));

// print result
Object.keys(allIssues).forEach((key) => {
    console.log("https://main--24life--hlxsites.hlx.page" + key);
    console.log(allIssues[key]);
});


function hasRedirect(url) {
    return !!getRedirect(url);
}
function getRedirect(url) {
    return redirects[new URL(url).pathname];
}
function getRedirectFullUrl(url) {
    const result = getRedirect(url);
    if(result) {
        return "https://main--24life--hlxsites.hlx.page" + result;
    }
}

async function validateFile(filePath) {
    const issues = []

    const content = await fs.readFile(filePath, 'utf-8');
    const dom = new JSDOM(content);
    const links = dom.window.document.querySelectorAll('a[href]');
    for (let link of links) {
        // console.log(link.href, link.textContent)
        if (link.href.startsWith("https://www.24life.com")) {
            issues.push({link: link.href, text: link.textContent, redirect: getRedirectFullUrl(link.href)})
        }
        if (link.href.includes("twentyfourlife.wpenginepowered")) {
            issues.push({link: link.href, text: link.textContent})
        }
        if (link.href.includes(".hlx.")) {
            if (link.href.matches(new RegExp("/(focus|fitness|fuel|recover)[/][0-9]{4}[/].+"))) {
                // correct links
            } else if (!hasRedirect(link.href)) {
                issues.push({link: link.href, text: link.textContent})
            }
        }
    }
    if (issues.length) {
        allIssues[filePath.replace("./24life/", "/").replace(".html", "")] = issues;
    }
}

async function loadRedirects() {
    const redirects = {}
    const resp = await fetch("https://main--24life--hlxsites.hlx.page/redirects.json?limit=9999")
    const json = await resp.json()
    for (const row of json.data) {
        redirects[row.source] = row.destination;
    }
    return redirects;
}

