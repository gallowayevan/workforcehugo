---
title: Rate per 10,000 Population Over Time, Metro and Rural, North Carolina
date: 2020-06-17
author: Evan Galloway
draft: false
teaserText: >-
  See how different health professions have grown over time.
teaserImage: /images/thumbnails/md_metro_nonmetro_line_chart_1979-2018.jpg
keywords: [physicians, metropolitan, urban, rural, per capita]
javascript: [/js/d3.v5.min.js,/js/d3-array.v2.min.js,/js/saveSvgAsPng.js, main.js]
---
<div class="notification">Choose a health profession below to see the change in the number of professionals per 10,000 population over time for metropolitan and rural counties in North Carolina. You can the download an image (.png) or a vector graphics file (.svg).</div>
<div class="field"><label class="label">Select a profession</label><div class="control select"><select id="profession-select"></select></div></div>
<div id="viz"></div>
<button class="button" id="download-image">Download Image</button>
<button class="button" id="download-svg">Download SVG</button>