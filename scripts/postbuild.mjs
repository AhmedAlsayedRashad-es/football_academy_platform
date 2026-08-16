import fs from "fs";

const p = "dist/public/index.html";
let h = fs.readFileSync(p, "utf8");
h = h.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>\n/, "");
fs.writeFileSync(p, h);
console.log("Removed stale main.tsx script tag");
