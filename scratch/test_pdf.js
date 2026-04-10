import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

console.log("Is PDFParse a function?", typeof pdf.PDFParse === "function");

if (typeof pdf.PDFParse === "function") {
    // Try to use it
    const dataBuffer = Buffer.from("%PDF-1.4..."); // dummy buffer
    try {
        pdf.PDFParse(dataBuffer).then(() => console.log("Success calling PDFParse")).catch(e => console.log("Expected fail but function exists"));
    } catch(e) {
        console.log("Immediate fail:", e.message);
    }
}
