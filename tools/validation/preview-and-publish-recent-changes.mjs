import fs from 'fs'
import {readdir} from "node:fs/promises";
import path from "path";
import readline from "readline";

// ### configuration ###
const sourceDirectory = `/Users/wingeier/Library/CloudStorage/OneDrive-Adobe/24life`;
const maxAgeMinutes = 90;

requireNodeVersion(20);

const repo = "24life";

async function getAdminStatus(file) {
    const r = await fetch("https://admin.hlx.page/status/hlxsites/" + repo + "/main/" + file)
    return await r.json();
}

const filesWithStatus = await Promise.all((await readdir(sourceDirectory, {recursive: true}))
    .filter((file) => file.endsWith(".docx"))
    .map((file) => {
        const lastModifiedTs = fs.statSync(path.join(sourceDirectory, file)).mtimeMs;
        const lastModified = new Date(0); // The 0 there is the key, which sets the date to the epoch
        lastModified.setUTCSeconds(lastModifiedTs / 1000);

        return {file: file.replace(".docx", ""), lastModified};
    })
    .filter(({file, lastModified}) => {
        const diffMinutes = (new Date().getTime() - lastModified.getTime()) / 1000 / 60;
        return diffMinutes < maxAgeMinutes;
    })
    .map(async ({file, lastModified}) => {
        const json = await adminAction("status", file, "GET");
        return {
            file,
            pendingPreview: hasPendingChanges(json, "preview"),
            pendingLive: hasPendingChanges(json, "live"),
            json
        };
    })
)

const pendingPreview = filesWithStatus.filter(({ pendingPreview}) => pendingPreview)
if(pendingPreview.length) {
    console.log("pending preview: ", pendingPreview.map(({file}) => file))
    await userConfirmToContinue("Preview? (y/n) ");
    for (let {file} of pendingPreview) {
        const json = await adminAction("preview", file, "POST");
        if(json.preview.status === 200) {
            console.log("previewed: ", file)
        } else {
            console.log("failed to preview: ", file)
        }
    }
}


const pendingLive = filesWithStatus.filter(({pendingLive}) => pendingLive)
if(pendingLive.length) {
    console.log("pending live: ", pendingLive.map(({file}) => file))
    await userConfirmToContinue("Publish? (y/n) ");
    for (let {file} of pendingLive) {
        const json = await adminAction("live", file, "POST");
        if(json.live.status === 200) {
            console.log("published: ", file)
        } else {
            console.log("failed to publish: ", file)
        }
    }
}

console.log("done")

function hasPendingChanges(json, previewOrLive) {
    if(!json[previewOrLive] || json[previewOrLive].status !== 200) {
        return true
    }
    const sourceTime = new Date(json[previewOrLive].sourceLastModified);
    const updatedTime = new Date(json[previewOrLive].lastModified);
    return sourceTime.getTime() > updatedTime.getTime();
}

function requireNodeVersion(version) {
    const [major] = process.versions.node.split('.').map(Number)
    if (major < version) {
        console.error("node version 20 or higher required")
        process.exit(1)
    }
}

async function userConfirmToContinue(question) {
    let rl;
    const answer = await new Promise(resolve => {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, resolve)
    })
    if (answer !== "y") {
        console.log("aborting")
        process.exit(0);
    }
    rl.close();
}

async function adminAction(action, file, method = "GET") {
    const r = await fetch("https://admin.hlx.page/" + action + "/hlxsites/" + repo + "/main/" + file, {
        method,
    })
    return await r.json();
}
