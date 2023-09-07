/*  fetches existing franklin documents and stores them in a folder structure.
    I use this to research existing blocks for certain content, or look for invalid patterns.
 */

import pLimit from 'p-limit';
import fetch from 'node-fetch';
import fs from "fs";
import path from "path";

const limitConcurrency = pLimit(5);
const DOMAIN = "https://main--24life--hlxsites.hlx.live";

async function main() {
    const response = await fetch("https://main--24life--hlxsites.hlx.page/articles.json?limit=9999");
    const json = await response.json();
    const urls = json.data.map(row => DOMAIN + row.path)

    await Promise.all(urls.map(async (url) => {
        await(limitConcurrency(()=>loadUrl(url)));
    }));
}


function getFolderPathAndFilename(url) {
    const prefix = `./24life`;

    const pathname = new URL(url).pathname;
    // remove trailing slash
    const withoutTrailingSlash = pathname.replace(/\/$/, '');

    const folderName = withoutTrailingSlash.substring(0, withoutTrailingSlash.lastIndexOf('/'));
    const folderPath = `${prefix}${folderName}`;

    const filename = path.basename(withoutTrailingSlash) + '.html';

    return [folderPath, filename];
}

async function createFolder(folderPath) {
    try {
        await fs.promises.mkdir(folderPath, {recursive: true});
    } catch (ignore) {
        console.log('failed to create folder: ', folderPath);
    }
}


async function loadUrl(url) {

    try {
        const [folderPath, filename] = getFolderPathAndFilename(url);
        const response = await fetch(url, {redirect: 'error'});
        if (response.ok) {

            await createFolder(folderPath);
            await response.body.pipe(fs.createWriteStream(`${folderPath}/${filename}`));
            console.log('ok: ', url);
        } else {
            console.log('failed: ', url, response.status);
        }
    } catch (e) {
        if (e.message.includes("uri requested responds with a redirect")) {
            console.log('failed (redirect): ', url);
            return;
        }
        console.log('failed: ', url, e.message);
    }
}

main();
