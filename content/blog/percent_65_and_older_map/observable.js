import { Runtime, Inspector } from "https://unpkg.com/@observablehq/runtime@4/dist/runtime.js";
import define from "https://api.observablehq.com/@gallowayevan/percent-65-and-older-north-carolina.js?v=3";

const renders = {
    "viewof year": "#viewof-year",
    "map": "#map",
};

for (let i in renders)
    renders[i] = document.querySelector(renders[i]);

const runtime = new Runtime();
const main = runtime.module(define, name => {
    if (renders[name]) {
        return new Inspector(renders[name]);
    }
});