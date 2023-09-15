import {existsSync} from 'node:fs';
import {readdir} from 'node:fs/promises';
import {execSync} from "child_process";

// brew install ffmpeg

const mountDirectory = `/Users/wingeier/Library/CloudStorage/OneDrive-Adobe/24life`;

async function main() {

    const movFiles = (await readdir(mountDirectory, {recursive: true}))
        .filter((file) => file.endsWith(".mov"))
        .map((file) => mountDirectory + "/" + file)
    for (let movFile of movFiles) {
        const mp4File = movFile.replace(".mov", ".mp4");
        if (existsSync(mp4File)) {
            console.log(`skipped ${movFile} because ${mp4File} already exists`)
        } else {
            try {
                const command = `ffmpeg -i "${movFile}" "${mp4File}"`;
                console.log(command)
                execSync(command)
            } catch (e) {
                console.log(e.message);
                throw new Error("ffmpeg failed");
            }
            console.log(`converted ${movFile} to ${mp4File}`)
        }
    }

}


main();
