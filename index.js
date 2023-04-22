import fs from "fs";
import cheerio from "cheerio";

/** 微信开放文档 服务端文档首页 */
const BASE_URL = "https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/";
const file = "apiList.js";

async function main() {
  const html = await fetch(BASE_URL);
  const text = await html.text();
  const reg = /<tr><td><a href=\"([^"]*)">([A-Za-z]+)<\/a><\/td>/g;
  const matched = text.matchAll(reg);
  const apiList = {};
  let fileContent = "/** 小程序服务端接口列表 */\nexport default mpi = {";
  for (const match of matched) {
    const docAddr = match[1].replace("./", "");
    const { name, method, url, doc } = await getApiAddr(docAddr);
    apiList[match[2]] = { name, doc, method, url };

    fileContent += apiContentGenerator(match[2], apiList[match[2]]);
  }
  fileContent += "}";
  fs.writeFileSync(file, fileContent);
  fs.writeFileSync(file + "on", JSON.stringify(apiList, null, 2));
  console.log("Done!");
}

function apiContentGenerator(api,{doc,name,method,url}) {
  return `
  /** 
   * {@link ${doc} ${name}}
   * 
   * ${method}
   */
  ${api}: "${url}",
  `
}

async function getApiAddr(docAddr) {
  // 接口文档地址
  const apiDoc = BASE_URL + docAddr;

  const html = await fetch(apiDoc);
  const text = await html.text();

  const $ = cheerio.load(text);
  // 接口名称
  const apiName = $("#docContent h1").attr("id");
  // 接口请求方式、地址
  const callMethod = $("#docContent #HTTPS-调用").next().text();
  let [httpMethod, apiUrl] = callMethod.replace("\n", "").split(" ");
  apiUrl = apiUrl.replace(/\?.*/, "");
  return {
    name: apiName,
    method: httpMethod.toLocaleLowerCase(),
    url: apiUrl,
    doc: apiDoc,
  };
}

main();
