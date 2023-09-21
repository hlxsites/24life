/*  looks for bad links in the final franklin output.
 */
import {JSDOM} from "jsdom";
import fs from 'fs/promises'
import {readdir} from "node:fs/promises";
import readline from "readline";
import path from "path";
import {exec} from "child_process";

const mountDirectory = `/Users/wingeier/Library/CloudStorage/OneDrive-Adobe/24life`;
const outputDir = `./24life-rewritten`;
const dir = `./24life`;

requireNode20();

const redirects = await loadRedirects();

/**
 * @param url
 * @returns {string|undefined} return the url to change to, or null if no change is required
 */
function linkMapping(url) {
    if (url.includes("//magazine.24life.com/")) {
        // e.g. http://magazine.24life.com/vol3iss6/play-full-out--summer-fresh-anywhere-26V6-883JI.html
        // http://magazine.24life.com/vol3iss11
        const volume = url.match(/vol([0-9]+)iss[0-9]+/)[1];
        const issue = url.match(/vol[0-9]+iss([0-9]+)/)[1];
        if (!volume || !issue) throw new Error("volume or issue not found");
        return `https://main--24life--hlxsites.hlx.page/magazine/volume-${volume}-issue-${issue}`
    }

    if (url.includes("//www.24life.com/?s=")) {
        return "https://main--24life--hlxsites.hlx.page/search?s=" + new URL(url).searchParams.get("s");
    }
    if (url.startsWith("http") && url.includes("24life.com/")) {
        let redirectFullUrl = getRedirectFullUrl(url);
        if (!redirectFullUrl && !url.endsWith("/")) {
            // assume the same pathname also exists on the new site
            redirectFullUrl = "https://main--24life--hlxsites.hlx.page" + new URL(url).pathname
        }
        return redirectFullUrl;
    }
    if(url.includes('24life--hlxsites.hlx') || url.startsWith('/')) {
        // internal link
        const urlObj = new URL(url, "https://main--24life--hlxsites.hlx.page/");
        const pathname = urlObj.pathname;
        const isValidHelixPage = Object.values(redirects).includes(pathname);
        const redirect = getRedirectFullUrl(url);
        if(!isValidHelixPage && redirect){
            return redirect;
        }
    }
}

function validateLink(url) {
    if (!url.includes("//www.24life.com/?s=")
        && url.includes("?") && !url.endsWith("?") && (url.includes("24life.com") || url.includes(".hlx."))) {
        return "url includes ?";
    }
    if (url.endsWith("'")) {
        return "url ends with '"
    }
    if (url.includes("twentyfourlife.wpenginepowered")) {
        return "url includes twentyfourlife.wpenginepowered"
    }
    if (url.includes(".hlx.")) {
        if (url.matches(new RegExp("/(focus|fitness|fuel|recover)[/][0-9]{4}[/].+"))) {
            // correct links
        } else {
            if (getRedirectFullUrl(url)) {
                // if there is a redirect, we will rely on that. We are not changing all the links at this moment.
            } else {
                return "no redirect found for hlx link";
            }
        }
    }
}

async function main() {
    const {allLinkChanges, allLinkWarnings} = await findLinksToChange();

    if (!Object.keys(allLinkChanges).length && !Object.keys(allLinkWarnings).length) {
        console.log("no issues found");
        process.exit(0);
    }

    console.log("----")
    console.log("Warnings:")
    for (const key of Object.keys(allLinkWarnings)) {
        console.log("https://main--24life--hlxsites.hlx.page" + key);
        console.log(allLinkWarnings[key]);
    }

    console.log("----")
    console.log("Changes:")
    for (const key of Object.keys(allLinkChanges)) {
        console.log("https://main--24life--hlxsites.hlx.page" + key);
        console.log(allLinkChanges[key]);
    }

    console.log("----")
    console.log("all link changes:")
    Object.values(allLinkChanges).flatMap((issues) => issues).forEach((issue) => {
        console.log(issue.link, "→", issue.newurl);
    });

    // rewrite docx files
    await userConfirmToContinue(`Do you want to change ${Object.keys(allLinkChanges).length} files? (y/N)`);
    await fs.mkdir(outputDir, {recursive: true});
    for (const file of Object.keys(allLinkChanges)) {
        await rewriteDocx(file, outputDir, allLinkChanges[file]);
    }
    console.log("rewriting changed files in ", outputDir)

    console.log("urls: ", Object.keys(allLinkChanges).map((key) => "https://main--24life--hlxsites.hlx.page" + key).join("\n"));
    console.log("files: ", Object.keys(allLinkChanges).map((key) => "./24life" + key + ".html").join(" "));

    process.exit(0);
}

async function rewriteDocx(file, outputDir, changes) {
    const filePath = path.join(mountDirectory, file + ".docx");
    const targetFilePath = path.join(outputDir, file + ".docx");
    function escapeRegex(string) {
        return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // copy file to target, so it can be modified multiple times
    const parentDir = targetFilePath.substring(0, targetFilePath.lastIndexOf("/"));
    await fs.mkdir(parentDir, {recursive: true});
    await fs.copyFile(filePath, targetFilePath);
    for (const link of changes) {
        if (link.newurl) {
            await fs.copyFile(targetFilePath, `${targetFilePath}.tmp.docx`);
            const command = `docxtools '${targetFilePath}.tmp.docx' replace-links '^${escapeRegex(link.link)}$' '${(link.newurl)}' '${targetFilePath}'`;
            // console.debug(command)
            console.log(await execShellCommand(command))
            await fs.unlink(`${targetFilePath}.tmp.docx`);
        } else {
            throw new Error("no newurl found")
        }
    }
}

function getRedirectFullUrl(url) {
    const origUrl = new URL(url, "https://main--24life--hlxsites.hlx.page");
    const pathname =  origUrl.pathname;
    const redirect = redirects[pathname] || redirects[pathname + "/"];
    if (redirect) {
        const newUrl = new URL("https://main--24life--hlxsites.hlx.page" + redirect);
        newUrl.search = origUrl.search;
        newUrl.hash = origUrl.hash;
        return newUrl.toString();
    }
}

async function getAllLinks(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const dom = new JSDOM(content);
    return dom.window.document.querySelectorAll('a[href]');
}

async function validateLinks(links, key, allLinkChanges, allLinkWarnings) {
    const linkChanges = []
    const linkWarnings = []
    for (let link of links) {

        const warning = validateLink(link.href);
        if (warning) {
            linkWarnings.push({link: link.href, text: link.textContent, warning});
        }

        if (!warning) {
            // only change links if there is no warning
            const newurl = linkMapping(link.href);
            if (newurl) {
                linkChanges.push({link: link.href, text: link.textContent, newurl});
            }
        }
    }

    if (linkChanges.length) {
        allLinkChanges[key] = linkChanges;
    }
    if (linkWarnings.length) {
        allLinkWarnings[key] = linkWarnings;
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

function requireNode20() {
    const [major, minor, patch] = process.versions.node.split('.').map(Number)
    if (major < 20) {
        console.error("node version 20 or higher required")
        process.exit(1)
    }
}


async function userConfirmToContinue(question) {
    const answer = await new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, resolve)
    })
    if (answer !== "y") {
        console.log("aborting")
        process.exit(0);
    }
}


async function findLinksToChange() {
    const allLinkChanges = {}
    const allLinkWarnings = {}

    let htmlFiles = (await readdir(dir, {recursive: true}))
        .filter((file) => file.endsWith(".html"))
        .map((file) => dir + "/" + file)

    htmlFiles = ["./24life/fitness/2019/the-universal-warm-up-and-cool-down.html"];

    await Promise.all(htmlFiles.map(async (file) => {
        const key = file.replace("./24life/", "/").replace(".html", "");
        const links = await getAllLinks(file);
        return validateLinks(links, key, allLinkChanges, allLinkWarnings);
    }));

    return {allLinkChanges, allLinkWarnings};
}


await main();
