import * as pagefind from "pagefind";

const { index } = await pagefind.createIndex();

const resp = await fetch('https://main--24life--hlxsites.hlx.page/query-index.json?limit=9999');
const json = await resp.json();
for (let item of json.data) {
  await index.addCustomRecord({
    meta: {
      title: item.title,
      section: item.section,
    },
    url: item.path,
    content: item.description + " " + item.content,
    language: "en",
  });
}

await index.writeFiles({
  outputPath: "pagefind"
});
