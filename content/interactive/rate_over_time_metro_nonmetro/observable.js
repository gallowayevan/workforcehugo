import { Runtime, Inspector } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
import define from "https://api.observablehq.com/d/76c497a14f28a935.js?v=3";
(new Runtime).module(define, name => {
    if (name === "viewof selectedProfessions") return Inspector.into("#observablehq-457a58 .observablehq-viewof-selectedProfessions")();
    if (name === "charts") return Inspector.into("#observablehq-457a58 .observablehq-charts")();
    if (name === "note") return Inspector.into("#observablehq-457a58 .observablehq-note")();


});

