(async function () {
    if (!Array.prototype.flat) {
        Object.defineProperty(Array.prototype, 'flat', {
            configurable: true,
            value: function flat() {
                var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

                return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
                    if (Array.isArray(cur)) {
                        acc.push.apply(acc, flat.call(cur, depth - 1));
                    } else {
                        acc.push(cur);
                    }

                    return acc;
                }, []) : Array.prototype.slice.call(this);
            },
            writable: true
        });
    }

    //Get list of available professions
    const professions = (await d3.csv(
        "https://data-dept-healthworkforce.cloudapps.unc.edu/data/specialties.csv"
        , d => (d.id = d.id.padStart(3, '0'), d))).filter(({ specialty, profession, id }) => specialty == profession & id != "136" & id != "137").sort(sortByString("profession"));
    const professionMap = new Map(professions.map(d => [d.id, d]));

    //Default selected profession
    const defaultSelected = professions[Math.round(Math.random() * (professions.length - 1))].id;
    //Populate profession select box.
    const professionSelect = document.getElementById("profession-select");
    const selectFragment = document.createDocumentFragment();
    selectFragment.appendChild(new Option("Select a profession", "000"));
    professions.forEach(({ id, profession }) => selectFragment.appendChild(new Option(profession, id, id == defaultSelected, id == defaultSelected)));
    professionSelect.appendChild(selectFragment);

    //Add event handlers
    professionSelect.addEventListener("change", handleProfessionSelect);
    document.getElementById("download-image").addEventListener("click", downloadImage);
    document.getElementById("download-svg").addEventListener("click", downloadSvg);


    //Get metro/nonmetro lookup
    const cbsaLookup = new Map((await d3.json(
        "/data/cbsaLookup.json"
    )).map(d => [+d[0], new Map(d[1])]));
    const cbsaYearCut = cut(Array.from(cbsaLookup, d => d[0]).sort((a, b) => b - a));

    // const logoGroup = (await d3.svg("/images/assets/sheps_health_workforce_nc_small.svg")).firstChild;
    const logoSpec = await (await fetch("/images/assets/logo.json")).json()
    console.log(logoSpec)
    const logoFrag = document.createDocumentFragment();
    logoSpec.forEach(function ({ fill, paths }) {
        const newGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        newGroup.setAttribute("fill", fill);
        paths.forEach(function (p) {
            const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            newPath.setAttribute("d", p)
            newGroup.appendChild(newPath);
        })
        logoFrag.appendChild(newGroup);
    })
    console.log(logoFrag);

    //Load first one
    handleProfessionSelect(defaultSelected);

    //Get data on select
    function handleProfessionSelect(e) {

        const id = e.target ? e.target.value : e; //If event get id from event handler, otherwise just assume e is the id.

        if (id != "000") {
            d3.csv(
                `https://data-dept-healthworkforce.cloudapps.unc.edu/data/region/spec${id}.csv`,
                function (d) {
                    if (d.type == "ahec" || d.type == "state" || d.type == "medicaid")
                        return null;
                    return {
                        county: d.region,
                        year: +d.year,
                        total: +d.total,
                        population: +d.population,
                        rate: +d.providerRate,
                        metro: cbsaLookup.get(cbsaYearCut(+d.year)).get(d.region.toUpperCase())
                    };
                }
            ).then((d) => (d.id = id, d)).then(render);
        }
    }

    function render(data) {

        const currentProfessionObject = professionMap.get(data.id);


        const transformedData = d3
            .rollups(
                data,
                v => ({
                    total: d3.sum(v, e => e.total),
                    population: d3.sum(v, e => e.population),
                    rate: (d3.sum(v, e => e.total) / d3.sum(v, e => e.population)) * 10000
                }),
                d => d.year,
                d => d.metro
            )
            .map(d => ({
                Year: d[0],
                Metropolitan: d[1][0][1].rate,
                Nonmetropolitan: d[1][1][1].rate
            }));
        const yearExtent = d3.extent(transformedData, d => d.Year);

        const lines = [
            transformedData.map(d => ({ year: d.Year, value: d.Metropolitan })),
            transformedData.map(d => ({ year: d.Year, value: d.Nonmetropolitan }))
        ];

        const ruralColor = "#2ca02c";
        const metroColor = "#ff7f0e";


        const width = 960;
        const height = 600;
        const margin = ({ top: 90, right: 60, bottom: 150, left: 40 });

        const svg = d3.select("#viz")
            .selectAll(".chart")
            .data([{ id: data.id }], d => d.id)
            .join("svg")
            .attr("class", "chart")
            .attr("width", width)
            .attr("height", height);


        const x = d3
            .scaleLinear()
            .domain(d3.extent(transformedData, d => d.Year))
            .range([margin.left, width - margin.right]);
        const xAxis = g =>
            g.attr("transform", `translate(0,${height - margin.bottom})`).call(
                d3
                    .axisBottom(x)
                    .tickSizeOuter(0)
                    .ticks(14)
                    .tickFormat(d => d)
            )
        const y = d3
            .scaleLinear()
            .domain([0, d3.max(lines.flat(), d => d.value)])
            .nice()
            .range([height - margin.bottom, margin.top]);
        const yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSizeInner(-width + margin.right + margin.left))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("dx", -20)
                .attr("dy", -20)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text("Rate per 10,000 Population"))
            .call(g => g.selectAll(".tick line").attr("stroke", "#c4c4c4"))
        const line = d3
            .line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.year))
            .y(d => y(d.value));
        const area = d3
            .area()
            .x(d => x(d.Year))
            .y0(d => y(d.Metropolitan))
            .y1(d => y(d.Nonmetropolitan))
            .curve(d3.curveMonotoneX);


        svg.append("g").call(xAxis);

        svg.append("g").call(yAxis);

        svg.selectAll(".tick text").attr("font-size", 14);
        svg
            .append("path")
            .datum(transformedData)
            .attr("fill", "#ececec")
            .attr("opacity", 0.7)
            .attr("d", area);
        svg
            .selectAll(".lines")
            .data(lines)
            .join("path")
            .attr("class", "lines")
            .attr("fill", "none")
            .attr("stroke", (d, i) => (i == 1 ? ruralColor : metroColor)) //Need to fix this. Shouldn't be position based!
            .attr("stroke-width", 3)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-dasharray", (d, i) => (i == 1 ? 10 : 0))
            .attr("d", line);



        svg
            .selectAll(".labels")
            .data(
                lines
                    .flat()
                    .filter(d => d.year == x.domain()[1])
            )
            .join("text")
            .attr("fill", (d, i) => (i == 1 ? ruralColor : metroColor))
            .text(
                (d, i) => (i == 1 ? "Rural" : "Metro")
            )
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("dx", 3)
            .attr("dy", 5)
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.value));

        svg.append("text")
            .attr("transform", `translate(${width / 2} ${height - margin.bottom + 40})`)
            .attr("text-anchor", "middle")
            .attr("fill", "#4a4a4a")
            .attr("font-weight", "bold")
            .text("Year");

        svg.append("text")
            .attr("transform", `translate(5 40)`)
            .attr("font-size", 18)
            .attr("fill", "#333")
            .text(`${currentProfessionObject.display_name.replace(" - All", "s")} per 10,000 Population, ${yearExtent.join(" - ")}, North Carolina`)

        svg.append("g").attr("transform", `translate(${width - 290} ${height - 80})`).node().appendChild(logoFrag);

        svg.node().appendChild(createSVGtext({ text: note, fontSize: 10, maxCharsPerLine: 120 })).setAttribute("transform", `translate(10 ${height - 80})`)

        svg
            .selectAll("text")
            .attr(
                "font-family",
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
            );

    }

    function downloadImage() {
        saveSvgAsPng(document.getElementById("viz").querySelector("svg"), "rate_over_time.png", { scale: 2, backgroundColor: "#ffffff" });
    }

    function downloadSvg() {
        saveSvg(document.getElementById("viz").querySelector("svg"), "rate_over_time.svg");
    }

    function cut(cuts) {
        //cuts must be reverse sorted   
        return (value) => {
            for (let i = 0; i < cuts.length; i++) {
                if (value >= cuts[i]) {
                    return cuts[i];
                    break;
                }
            }

            return undefined;
        }

    }

    function sortByString(stringProp) {
        return (a, b) => {
            const strA = a[stringProp].toUpperCase();
            const strB = b[stringProp].toUpperCase();
            if (strA < strB) {
                return -1;
            }
            if (strA > strB) {
                return 1;
            }

            return 0;
        }
    };

    function createSVGtext(config = {}) {

        let { text, x = 0, y = 0,
            fontSize = 14, fill = '#333',
            textAnchor = "left",
            maxCharsPerLine = 65,
            lineHeight = 1.3 } = config;

        if (typeof config == "string") text = config;

        let svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgText.setAttributeNS(null, 'x', x);
        svgText.setAttributeNS(null, 'y', y);
        svgText.setAttributeNS(null, 'font-size', fontSize);
        svgText.setAttributeNS(null, 'fill', fill);
        svgText.setAttributeNS(null, 'text-anchor', textAnchor);

        let words = text.trim().split(/\s+/).reverse(),
            word,
            dy = 0,
            lineNumber = 0,
            line = [];

        while (word = words.pop()) {

            line.push(word);
            let testLineLength = line.join(" ").length;

            if (testLineLength > maxCharsPerLine) {
                line.pop();

                let svgTSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                svgTSpan.setAttributeNS(null, 'x', x);
                svgTSpan.setAttributeNS(null, 'dy', dy + "em");

                let tSpanTextNode = document.createTextNode(line.join(" "));
                svgTSpan.appendChild(tSpanTextNode);
                svgText.appendChild(svgTSpan);

                line = [word];
                dy = lineHeight;
            }
        }

        let svgTSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
        svgTSpan.setAttributeNS(null, 'x', x);
        svgTSpan.setAttributeNS(null, 'dy', dy + "em");

        let tSpanTextNode = document.createTextNode(line.join(" "));
        svgTSpan.appendChild(tSpanTextNode);
        svgText.appendChild(svgTSpan);

        return svgText;
    }

    const note = `Notes: Data include active, licensed providers in practice in North Carolina as of October 31 of each year. Data are derived from licensure files provided by each profession's licensing board. Population census data and estimates are downloaded from the North Carolina Office of State Budget and Management and are based on US Census data. Source: North Carolina Health Professions Data System, Program on Health Workforce Research and Policy, The Cecil G. Sheps Center for Health Services Research, University of North Carolina at Chapel Hill. Created ${new Date().toLocaleString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric"
    })} at ${window.location.href}.`
})();