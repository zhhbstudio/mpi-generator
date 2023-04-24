import fs from "fs";
import cheerio from "cheerio";

/** 微信开放文档 服务端文档首页 */
const BASE_URL = "https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/";
const FILE_NAME = "apiList.js";

async function main() {
  try {
    const html = await fetch(BASE_URL);
    const text = await html.text();
    const $ = cheerio.load(text);
    const apiList = {};
    const apiDocs = $("a[href^='./'][href$='.html']").toArray();

    const apiPromises = apiDocs.map(async (elem) => {
      const docAddr = $(elem).attr("href").replace("./", "");
      const { name, method, url, doc } = await getApiAddr(BASE_URL + docAddr);
      apiList[elem.firstChild.data] = { name, doc, method, url };
      return apiContentGenerator(elem.firstChild.data, apiList[elem.firstChild.data]);
    });

    const apiContents = await Promise.all(apiPromises);
    const fileContent = "/** 小程序服务端接口列表 */\nexport default mpi = {" + apiContents.join("") + "}";
    fs.writeFileSync(FILE_NAME, fileContent);
    fs.writeFileSync(FILE_NAME + "on", JSON.stringify(apiList, null, 2));
    console.log("Done!");
  } catch (err) {
    console.error(err);
  }
}

function apiContentGenerator(api, { doc, name, method, url }) {
  return `
  /** 
   * {@link ${doc} ${name}}
   * 
   * ${method}
   */
  ${api}: "${url}",
  `;
}

async function getApiAddr(apiDoc) {
  const html = await fetch(apiDoc);
  const text = await html.text();
  const $ = cheerio.load(text);
  const apiName = $("#docContent h1").attr("id");
  const callMethod = $("#docContent #HTTPS-调用").next().text();
  let [httpMethod, apiUrl] = callMethod.replace("\n", "").split(" ");
  apiUrl = apiUrl.replace(/\?.*/, "");
  return {
    name: apiName,
    method: httpMethod.toLowerCase(),
    url: apiUrl,
    doc: apiDoc,
  };
}

main();
