import { Runtime, Inspector } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
import define from "https://api.observablehq.com/@gallowayevan/population-structure-for-north-carolina-psychologists-20.js?v=3";
(new Runtime).module(define, name => {
    if (name === "viewof layout") return Inspector.into("#observablehq-5a27acf5 .observablehq-viewof-layout")();
    if (name === "chart") return Inspector.into("#observablehq-5a27acf5 .observablehq-chart")();
    if (name === "update") return Inspector.into("#observablehq-5a27acf5 .observablehq-update")();
});
