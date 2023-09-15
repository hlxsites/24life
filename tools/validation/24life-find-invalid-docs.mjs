/*  looks for bad patterns in the final franklin output.
 */

import fs from 'fs/promises'
import path from "path";

async function main() {
    // astrisk close together, see https://github.com/adobe/helix-importer/issues/217
    // might false-positive match for "F***" and "sh**"
    await checkForString(new RegExp("\\*[^*]{0,10}\\*"));
    // comments
    await checkForString("<!--");
    await checkForString("-->");

    // image links to the old site. videos need to be upload with slack bot, pdfs added to sharepoint.
    await checkForString("twentyfourlife.wpenginepowered");

    // vimeo links need to be removed if invalid.
    await checkForString("player.vimeo.com");

    // blocks that are not rendered:
    await checkForString("Columns</th>");
    await checkForString("By 24Life ");
    await checkForString("null ");
}

async function searchFilesInDirectoryAsync(dir, searchText) {
    const files = await fs.readdir(dir);
    const searchResults = await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);

            if (stats.isDirectory()) {
                return searchFilesInDirectoryAsync(filePath, searchText);
            } else if (stats.isFile()) {
                const content = await fs.readFile(filePath, 'utf-8');
                return content.match(searchText) ? filePath : null;
            }
        })
    );

    return searchResults.flat().filter((result) => result !== null);
}


async function checkForString(searchText) {
    const folderPath = `./24life`;

    const searchResults = await searchFilesInDirectoryAsync(folderPath, searchText);
    const withoutHtml = searchResults.map((result) => result.replace(".html", ""));
    const filenameOnly = withoutHtml.map((result) => path.basename(result));
    console.log();
    console.log(`### ${searchText} (${filenameOnly.length})###`);
    if (filenameOnly.length) {
        console.log("preview:", withoutHtml.map((result) => `https://main--24life--hlxsites.hlx.page${result.substring(6)}`).join("\n"));
        console.log()
        console.log("reference:", filenameOnly.map((result) => `https://www.24life.com/${result}/`).join("\n"));
        console.log()
    }
}

main();
