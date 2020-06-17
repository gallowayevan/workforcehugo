import { Runtime, Inspector } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
import define from "https://api.observablehq.com/@gallowayevan/counties-by-rate-per-10k-of-physicians-north-carolina-year/2.js?v=3";
(new Runtime).module(define, name => {
    if (name === "title") return Inspector.into("#observablehq-a60a8aa1 .observablehq-title")();
    if (name === "explain") return Inspector.into("#observablehq-a60a8aa1 .observablehq-explain")();
    if (name === "beeswarm") return Inspector.into("#observablehq-a60a8aa1 .observablehq-beeswarm")();
    if (name === "viewof year") return Inspector.into("#observablehq-a60a8aa1 .observablehq-viewof-year")();
    if (name === "chart") return Inspector.into("#observablehq-a60a8aa1 .observablehq-chart")();
    if (name === "dispatch") return Inspector.into("#observablehq-a60a8aa1 .observablehq-dispatch")();
    if (name === "style") return Inspector.into("#observablehq-a60a8aa1 .observablehq-style")();
});
