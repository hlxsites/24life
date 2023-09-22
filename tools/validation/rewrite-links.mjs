// noinspection UnnecessaryContinueJS
import {JSDOM} from "jsdom";
import fs from 'fs'
import {readdir} from "node:fs/promises";
import path from "path";
import {exec, execSync} from "child_process";
import pLimit from 'p-limit';
const shell = (cmd) => execSync(cmd, {encoding: 'utf8'});

// configuration
const sourceDirectory = `/Users/wingeier/Library/CloudStorage/OneDrive-Adobe/24life`;
const outputDir = `./24life-rewritten`;
const redirects = await loadRedirects("main--24life--hlxsites.hlx.page");
const limitConcurrency = pLimit(5);

requireNodeVersion(20);
checkToolsInstalled(['pandoc', 'docxtools']);

let files = (await readdir(sourceDirectory, {recursive: true}))
    .filter((file) => file.endsWith(".docx"))

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
            console.log(file)
            const url = new URL(link, "https://main--24life--hlxsites.hlx.page/");
            // rewrite some of the links

            // fetch redirects.json and apply them.
            const siteHostnames = ["www.24life.com", "main--24life--hlxsites.hlx.page", "main--24life--hlxsites.hlx.live"];
            if (siteHostnames.includes(url.hostname)
                && redirects[url.pathname]) {
                const newLink = new URL(link, "https://main--24life--hlxsites.hlx.page/");
                newLink.pathname = redirects[url.pathname];
                newLink.hostname = "main--24life--hlxsites.hlx.page";
                newLink.protocol = "https";
                await changeLink(sourceFilePath, outputFilePath, link, newLink.toString());
                continue; // apply only one rewrite for each link
            }

            // add more link rewrites here

        }

    }));
}));

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


async function getAllLinks(filePath) {
    // read docx, transform to html, parse html dom
    // Note: with https://github.com/coderthoughts/docxtools/issues/3 the pandoc step could be skipped.
    const html = await execShellCommand(`pandoc ${filePath} -t html5`)
    const dom = new JSDOM(html);
    return [...dom.window.document.querySelectorAll('a[href]')]
        .map((link) => link.href);
}

function checkToolsInstalled(executables) {
    function executableIsAvailable(name) {
        try {
            shell(`which ${name}`);
            return true
        } catch (error) {
            return false
        }
    }

    for (let name of executables) {
        if (!executableIsAvailable(name)) {
            console.error(`Please install ${name} first.`);
            process.exit(1);
        }
    }
}

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
