---
title: Comparison of the Growth in Different Health Professions
date: 2020-06-04T00:00:00.000Z
author: Evan Galloway
draft: true
teaserText: Compare the growth of different health professions.
teaserImage: interactive_growth_comparison.jpg
keywords: []
aliases:
  - /interactive_growth_comparison
---


<div class="section">
<div class="container" id="observablehq-e7ffe015" >
<div class="observablehq-viewof-professionSelect" ></div>
  <div class="observablehq-viewof-variable" ></div>
  <div class="observablehq-chart"></div>
  
</div>
</div>
<script type="module">
  import {Runtime, Inspector} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
  import define from "https://api.observablehq.com/@gallowayevan/comparison-of-growth-of-health-professions-north-carolina/3.js?v=3";
  (new Runtime).module(define, name => {
    if (name === "viewof variable") return Inspector.into("#observablehq-e7ffe015 .observablehq-viewof-variable")();
    if (name === "chart") return Inspector.into("#observablehq-e7ffe015 .observablehq-chart")();
    if (name === "viewof professionSelect") return Inspector.into("#observablehq-e7ffe015 .observablehq-viewof-professionSelect")();
  });
</script>