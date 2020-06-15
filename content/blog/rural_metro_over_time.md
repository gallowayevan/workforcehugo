---
title: >-
  How has the supply of health professionals changed over time in rural and
  metro areas?
date: 2018-03-25T00:00:00.000Z
author: Evan Galloway
draft: true
teaserText: >-
  How has the supply of health professionals changed over time in rural and
  metro areas?
teaserImage: /images/thumbnails/county_physician_beeswarm.jpg
keywords: [rural, nonmetro, interactive, longitudinal]
aliases:
  - /rural_metro_over_time
---


<input name="professionSelect" placeholder="Search for a health profession" id="professionSelect"/>
<div id="chart"></div>
<div id="table"></div>
 
<script src="../javascript/d3.min.js"></script>
<script src="https://d3js.org/d3-array.v2.min.js"></script>
<script src="../javascript/awesomplete.min.js"></script>
<!-- <script src="../javascript/autocomplete.min.js"></script> -->

 <script > 

 const omb_metro_map_2015 = new Map([["ALAMANCE","metro"],["ALEXANDER","metro"],["ALLEGHANY","nonmetro"],["ANSON","nonmetro"],["ASHE","nonmetro"],["AVERY","nonmetro"],["BEAUFORT","nonmetro"],["BERTIE","nonmetro"],["BLADEN","nonmetro"],["BRUNSWICK","metro"],["BUNCOMBE","metro"],["BURKE","metro"],["CABARRUS","metro"],["CALDWELL","metro"],["CAMDEN","nonmetro"],["CARTERET","nonmetro"],["CASWELL","nonmetro"],["CATAWBA","metro"],["CHATHAM","metro"],["CHEROKEE","nonmetro"],["CHOWAN","nonmetro"],["CLAY","nonmetro"],["CLEVELAND","nonmetro"],["COLUMBUS","nonmetro"],["CRAVEN","metro"],["CUMBERLAND","metro"],["CURRITUCK","metro"],["DARE","nonmetro"],["DAVIDSON","metro"],["DAVIE","metro"],["DUPLIN","nonmetro"],["DURHAM","metro"],["EDGECOMBE","metro"],["FORSYTH","metro"],["FRANKLIN","metro"],["GASTON","metro"],["GATES","metro"],["GRAHAM","nonmetro"],["GRANVILLE","nonmetro"],["GREENE","nonmetro"],["GUILFORD","metro"],["HALIFAX","nonmetro"],["HARNETT","nonmetro"],["HAYWOOD","metro"],["HENDERSON","metro"],["HERTFORD","nonmetro"],["HOKE","metro"],["HYDE","nonmetro"],["IREDELL","metro"],["JACKSON","nonmetro"],["JOHNSTON","metro"],["JONES","metro"],["LEE","nonmetro"],["LENOIR","nonmetro"],["LINCOLN","metro"],["MCDOWELL","nonmetro"],["MACON","nonmetro"],["MADISON","metro"],["MARTIN","nonmetro"],["MECKLENBURG","metro"],["MITCHELL","nonmetro"],["MONTGOMERY","nonmetro"],["MOORE","nonmetro"],["NASH","metro"],["NEW HANOVER","metro"],["NORTHAMPTON","nonmetro"],["ONSLOW","metro"],["ORANGE","metro"],["PAMLICO","metro"],["PASQUOTANK","nonmetro"],["PENDER","metro"],["PERQUIMANS","nonmetro"],["PERSON","metro"],["PITT","metro"],["POLK","nonmetro"],["RANDOLPH","metro"],["RICHMOND","nonmetro"],["ROBESON","nonmetro"],["ROCKINGHAM","metro"],["ROWAN","metro"],["RUTHERFORD","nonmetro"],["SAMPSON","nonmetro"],["SCOTLAND","nonmetro"],["STANLY","nonmetro"],["STOKES","metro"],["SURRY","nonmetro"],["SWAIN","nonmetro"],["TRANSYLVANIA","nonmetro"],["TYRRELL","nonmetro"],["UNION","metro"],["VANCE","nonmetro"],["WAKE","metro"],["WARREN","nonmetro"],["WASHINGTON","nonmetro"],["WATAUGA","nonmetro"],["WAYNE","metro"],["WILKES","nonmetro"],["WILSON","nonmetro"],["YADKIN","metro"],["YANCEY","nonmetro"]]);
 
   d3.csv("https://data-dept-healthworkforce.cloudapps.unc.edu/data/specialties.csv", d3.autoType)
    .then(populateSelect)


    function populateSelect(data){
      const optionsMap = new Map(data.map(d=>[currProfessionName(d), d.id]));
        const options = data.map(d=>currProfessionName(d))
        const input = document.getElementById("professionSelect");
      
//         const myComponent = new AutoComplete({
//   target: document.querySelector('.content'),
//   data: { 
//     name: 'professionSelect',
//     itemStart: 1,
//     items: options,
//     minChar: 1,
//     fromStart: false
//   }
// })
        new Awesomplete(input, {
                minChars: 1,
                maxItems: 10,
                autoFirst: true,
                list: options
            });

        input.addEventListener("awesomplete-select", professionChanged);

      function professionChanged(selected){
      
      const currValue = optionsMap.get(selected.text.value);
      loadData(currValue)
    }

            function currProfessionName(currObject) {
  return currObject.profession == currObject.specialty
        ? currObject.profession
        : `${currObject.profession} - ${currObject.display_name}`
}
    }

    function loadData(id){
const dataLoaded = d3.csv(
  `https://data-dept-healthworkforce.cloudapps.unc.edu/data/region/spec${id.toString().padStart(
    3,
    "0"
  )}.csv`,
  function(e) {
    if (e.type != "county") return null;
    return {
          county: e.region,
          year: e.year,
          total: e.total,
          population: e.population,
          metro: omb_metro_map_2015.get(e.region.toUpperCase())
        };
  }
).then(function(data){
  return d3.rollup(
  data,
  function(v) {
    const population = d3.sum(v, e => e.population);
    const total = d3.sum(v, e => e.total);
    const rate = (total / population) * 10000;
    return {
      population: population,
      total: total,
      rate: rate
    };
  },
  d => d.metro,
  d => d.year
)
})
dataLoaded.then(drawChart);
dataLoaded.then(drawTable);
    }

    function drawTable(data){
     const rows = mapToObj(data).map(function(d){
  const newObj = {};
  d.children.forEach(function(e){
  newObj[e.name] = e.children
  })
  newObj["Metro"] = d.name.toUpperCase();
return newObj
});

      d3.select("#table").select("table").remove();
      const table = d3.select('#table')
        .append('table');

        table.append('thead').append('tr')
   .selectAll('th')
   .data(Object.keys(rows[0])).enter()
   .append('th')
   .attr('class', d=>d)
   .text(d=>d);
const format = d3.format(".2f")
table.append('tbody')
   .selectAll('tr')
   .data(rows).enter()
   .append('tr')
   .selectAll('td')
   .data(function(d,i){
     
     return Object.keys(d).map(e=>d[e])
   }).enter()
   .append('td')
   .html(d=>format(d.rate))
   .attr('class', d=>d);
       
        
    }

    function drawChart(countyGroups){

const width = 960;
const height = 450;
d3.select("#chart").selectAll("svg").remove()
const svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height);

const margin = ({ top: 40, right: 100, bottom: 30, left: 40 });


const x = d3
  .scaleLinear()
  .domain(d3.extent(Array.from(countyGroups.get("metro").keys())))
  .range([margin.left, width - margin.right]);

  const y = d3
  .scaleLinear()
  .domain([
    0,
    Math.max(
      d3.max(
        Array.from(countyGroups.get("metro"), d => ({
          year: d[0],
          rate: d[1].rate
        })),
        d => d.rate
      ),
      d3.max(
        Array.from(countyGroups.get("nonmetro"), d => ({
          year: d[0],
          rate: d[1].rate
        })),
        d => d.rate
      )
    )
  ])
  .nice()
  .range([height - margin.bottom, margin.top]);

  const xAxis = g =>
  g.attr("transform", `translate(0,${height - margin.bottom})`).call(
    d3
      .axisBottom(x)
      .tickValues(d3.extent(Array.from(countyGroups.get("nonmetro").keys())))
      .tickFormat(d3.format(""))
      .tickSizeOuter(0)
  )

  const yAxis = g =>
  g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSizeInner(-width + margin.right + margin.left))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").attr("stroke", "#bdbdbd"))
    .call(g =>
      g
        .select(".tick:last-of-type text")
        .clone()
        .attr("x", -30)
        .attr("dy", -15)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Rate per 10,000 population")
    )

const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.rate))

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const rural = Array.from(countyGroups.get("nonmetro"), d => ({
    year: d[0],
    rate: d[1].rate
  }));
  const metro = Array.from(countyGroups.get("metro"), d => ({
    year: d[0],
    rate: d[1].rate
  }));

  svg
    .append("path")
    .datum(rural)
    .attr("fill", "none")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 3)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);

  svg
    .append("path")
    .datum(metro)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 3)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);

  svg
    .selectAll("ruralAnnotation")
    .data(rural)
    .enter()
    .append("text")
    .attr("x", d => x(d.year) + 15)
    .attr("y", d => y(d.rate) - 10)
    .text((d, i) =>
      i == 0 || i == rural.length - 1 ? d3.format(".3r")(d.rate) : ""
    )
    .attr("text-anchor", "middle")
    .attr("font-size", 14);

  svg
    .selectAll("metroAnnotation")
    .data(metro)
    .enter()
    .append("text")
    .attr("x", d => x(d.year) + 15)
    .attr("y", d => y(d.rate) - 10)
    .text((d, i) =>
      i == 0 || i == metro.length - 1 ? d3.format(".3r")(d.rate) : ""
    )
    .attr("text-anchor", "middle")
    .attr("font-size", 14);


    }

    function mapToObj(map) {
  if (map instanceof Map) {
    return Array.from(map).map(([key, val]) => ({name:key, children:mapToObj(val)}));
  }
  return map;
}


            </script>