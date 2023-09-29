// noinspection UnnecessaryContinueJS
import fs from 'fs'
import {readdir} from "node:fs/promises";
import path from "path";
import {exec, execSync} from "child_process";
import pLimit from 'p-limit';

const shell = (cmd) => execSync(cmd, {encoding: 'utf8'});

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
    // .filter((file) => file.startsWith("magazine"))

// processing files in parallel
await Promise.all(files.map(async (file) => {
    await(limitConcurrency(async () => {
        const sourceFilePath = path.join(sourceDirectory, file);
        const outputFilePath = path.join(outputDir, file);

        if (sourceFilePath !== outputFilePath && fs.existsSync(outputFilePath)) {
            console.log(`skipped ${sourceFilePath} because ${outputFilePath} already exists`)
            return;
        }

        const links = await getAllLinks(sourceFilePath);
        for (let link of links) {
            const url = new URL(link, baseUrlForRelativePaths);
            // ### Add your transformations here ###

            // fetch redirects.json and apply them.
            const siteHostnames = ["www.24life.com", "main--24life--hlxsites.hlx.page", "main--24life--hlxsites.hlx.live"];
            if (siteHostnames.includes(url.hostname)
                && redirects[url.pathname]) {
                const newLink = new URL(link, baseUrlForRelativePaths);
                newLink.pathname = redirects[url.pathname];
                newLink.hostname = "main--24life--hlxsites.hlx.page";
                newLink.protocol = "https";
                await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
                continue; // apply only one rewrite for each link
            }
            // same as above, but also try with a trailing slash
            if (siteHostnames.includes(url.hostname)
                && redirects[url.pathname + "/"] ) {
                const newLink = new URL(link, baseUrlForRelativePaths);
                newLink.pathname = redirects[url.pathname + "/"];
                newLink.hostname = "main--24life--hlxsites.hlx.page";
                newLink.protocol = "https";
                await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
                continue; // apply only one rewrite for each link
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
  return  output.split("\n")
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
