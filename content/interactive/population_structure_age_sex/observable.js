import { Runtime, Inspector } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
import define from "https://api.observablehq.com/d/c1d3c4f1953054c7.js?v=3";
(new Runtime).module(define, name => {
    if (name === "viewof selectedProfession") return Inspector.into("#observablehq-457a583f .observablehq-viewof-selectedProfession")();
    if (name === "viewof layout") return Inspector.into("#observablehq-457a583f .observablehq-viewof-layout")();
    if (name === "chart") return Inspector.into("#observablehq-457a583f .observablehq-chart")();
    if (name === "update") return Inspector.into("#observablehq-457a583f .observablehq-update")();
});