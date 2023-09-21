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
const allIssues = {}

let htmlFiles = (await readdir(dir, {recursive: true}))
    .filter((file) => file.endsWith(".html"))
    .map((file) => dir + "/" + file)

await Promise.all(htmlFiles.map(async (file) => validateFile(file)));

// print result
if (!Object.keys(allIssues).length) {
    console.log("no issues found");
    process.exit(0);
}

Object.keys(allIssues).forEach((key) => {
    console.log("https://main--24life--hlxsites.hlx.page" + key);
    console.log(allIssues[key]);
});
console.log("total issues:", Object.keys(allIssues).length);
Object.values(allIssues).flatMap((issues) => issues).forEach((issue) => {
    console.log(issue.link, "→", issue.redirect);
});


// ask user for confirmation
const answer = await new Promise(resolve => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(`Do you want to rewrite the urls for ${Object.keys(allIssues).length} issues? (y/N)`, resolve)
})
if (answer !== "y") {
    console.log("aborting")
    process.exit(0);
}

// create output directory
await fs.mkdir(outputDir, {recursive: true});


// rewrite urls
for (const file of Object.keys(allIssues)) {
    await rewriteDocx(file);
}
console.log("rewriting changed files in ", outputDir)

console.log("urls: ", Object.keys(allIssues).map((key) => "https://main--24life--hlxsites.hlx.page" + key).join("\n"));
console.log("files: ", Object.keys(allIssues).map((key) => "./24life" + key + ".html").join(" "));

process.exit(0);


async function rewriteDocx(file) {
    const filePath = path.join(mountDirectory, file + ".docx");
    const targetFilePath = path.join(outputDir, file + ".docx");

    // copy file to target, so it can be modified multiple times without overwriting the original
    const parentDir = targetFilePath.substring(0, targetFilePath.lastIndexOf("/"));
    await fs.mkdir(parentDir, {recursive: true});
    await fs.copyFile(filePath, targetFilePath);
    let anyChanges = false;
    for (const link of allIssues[file]) {
        if (link.redirect) {
            await fs.copyFile(targetFilePath, `${targetFilePath}.tmp.docx`);
            const command = `docxtools "${targetFilePath}.tmp.docx" replace-links "${link.link}" "${link.redirect}" "${targetFilePath}"`;
            console.debug(command)
            console.log(await execShellCommand(command))
            await fs.unlink(`${targetFilePath}.tmp.docx`);
            anyChanges = true;
        } else {
            console.log("--")
            console.log(file)
            console.log("skipping", link.link, "because no redirect found")
        }
    }
    if (!anyChanges) {
        await fs.unlink(targetFilePath);
    }
}

function hasRedirect(url) {
    return !!getRedirect(url);
}

function getRedirect(url) {
    return redirects[new URL(url).pathname] || redirects[new URL(url).pathname + "/"];
}

function getRedirectFullUrl(url) {
    const result = getRedirect(url);
    if (result) {
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
        if (link.href.startsWith("http") && link.href.includes("24life.com/")) {
            const redirectFullUrl = getRedirectFullUrl(link.href);
            if (!redirectFullUrl) {
                // assume the same pathname still exists
                return "https://main--24life--hlxsites.hlx.page" + new URL(link.href).pathname
            }
            issues.push({link: link.href, text: link.textContent, redirect: redirectFullUrl})
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
