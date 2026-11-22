// Build js/member-data.js from data/member-portfolio.json
// Usage: node scripts/build-member-data.js
// (The browser cannot fetch() a local .json file when the site is opened as file://,
//  so the same data is embedded in a .js file, like js/sample-data.js.)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const members = JSON.parse(fs.readFileSync(path.join(root, "data", "member-portfolio.json"), "utf8"));

const header = fs.readFileSync(path.join(__dirname, "member-data.template.js"), "utf8");
const out = header.replace("/*__MEMBER_DATA__*/[]", JSON.stringify(members, null, 2));

fs.writeFileSync(path.join(root, "js", "member-data.js"), out);
console.log("updated js/member-data.js with " + members.length + " member portfolios");
