(async function () {

    const professionList =
        [['RT', "Respiratory Therapist"],
        ['RN', "Registered Nurse"],
        ['PYP', "Psychologist"],
        ['PYA', "Psychological Associate"],
        ['PTS', "Physical Therapist"],
        ['PTA', "Physical Therapist Assistant"],
        ['POD', "Podiatrist"],
        ['PA', "Physician Assistant"],
        ['OTS', "Occupational Therapist"],
        ['OTA', "Occupational Therapy Assistant"],
        ['OPM', "Optometrist"],
        ['MD', "Physician"],
        ['LPN', "Licensed Practical Nurse"],
        ['DHG', "Dental Hygienist"],
        ['DDS', "Dentist"],
        ['CHI', "Chiropractor"]].sort((a, b) => d3.ascending(a[1], b[1]));
    const professionListMap = new Map(professionList);

    //Default selected profession
    const defaultSelected = professionList[Math.round(Math.random() * (professionList.length - 1))][0];
    //Populate profession select box.
    const professionSelect = document.getElementById("profession-select");
    const selectFragment = document.createDocumentFragment();
    professionList.forEach(([id, profession]) => selectFragment.appendChild(new Option(profession, id, id == defaultSelected, id == defaultSelected)));
    professionSelect.appendChild(selectFragment);

    //Add event handlers
    professionSelect.addEventListener("change", handleProfessionSelect);

    const kdeData = await d3.csv("kde.csv", d3.autoType);
    const descriptiveData = d3.group(await d3.csv("descriptives.csv", d3.autoType), d => d.profession);
    const logoSpec = await d3.json("/images/assets/logo.json");

    const chart = densityChart("#viz");

    function handleProfessionSelect(e) {
        chart(e.target.value);
    }

    //Initiate
    chart(defaultSelected);

    function densityChart(targetSelector) {
        const width = 960;
        const height = 540;
        const margin = ({ top: 90, right: 10, bottom: 150, left: 80 });

        const svg = d3.select(targetSelector)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("font", "14px sans-serif");

        const chartBody = svg.append("g").attr("class", "chart-body");

        const colors = { nonmetro: "#408941", metro: "#12719e" };


        const x = d3
            .scaleLinear()
            .domain([25, 85])
            .range([margin.left, width - margin.right]);

        const xAxis = d3.axisBottom(x);
        const xAxisG = svg
            .append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis);
        //X axis label
        svg.append("text")
            .attr("transform", `translate(${width / 2} ${height - margin.bottom + 40})`)
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .text("Age");

        const y = d3
            .scaleLinear()
            .domain([0, 100])
            .range([height - margin.bottom, margin.top]);
        const yAxis = d3.axisLeft(y);
        const yAxisG = svg
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis);
        yAxisG.select(".domain").attr("display", "none");



        const area = d3
            .area()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(d.x);
            })
            .y0(y(0))
            .y1(function (d) {
                return y(d.freq);
            });




        const clip = svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .style("pointer-events", "none")
            .append("rect")
            .attr("transform", `translate(${margin.left} 0)`)
            .attr("width", width - margin.right - margin.left)
            .attr("height", height);

        chartBody.attr("clip-path", "url(#clip)");


        //Draw logo
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
        svg.append("g").attr("transform", `translate(${width - 290} ${height - margin.bottom + 50})`).node().appendChild(logoFrag);

        //Add note and source
        const note = `Notes: Data include active, licensed providers in practice in North Carolina as of October 31, 2018. Data are derived from licensure files provided by each profession's licensing board. Metropolitan or rural (non-metropolitan) county status was defined using US Office of Management and Budget Core Based Statistical Areas (CBSAs). Non-metropolitan counties include micropolitan counties and non-CBSAs. The August 2017 version of the delineation file was used for this analysis. Source: North Carolina Health Professions Data System, Program on Health Workforce Research and Policy, The Cecil G. Sheps Center for Health Services Research, University of North Carolina at Chapel Hill. Created ${new Date().toLocaleString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric"
        })} at ${window.location.href}.`
        svg.node().appendChild(createSVGtext({ text: note, fontSize: 10, maxCharsPerLine: 125 })).setAttribute("transform", `translate(10 ${height - margin.bottom + 60})`)


        svg
            .append("text")
            .attr("transform", `translate(5 65)`)
            .attr("text-anchor", "start")
            .text(`Group mean indicated by dotted line.`);

        function chart(professionCode) {
            const duration = 1000;
            const t = d3.transition()
                .duration(duration);

            const xMax = d3.min(descriptiveData.get(professionCode), d => d.max_age);
            const xMin = d3.max(descriptiveData.get(professionCode), d => d.min_age);

            //Get kde for current profession
            const filteredKde = kdeData.filter(d => d.profession == professionCode);
            const groupedKde = d3.groups(filteredKde, d => d.metro);

            x.domain([xMin, xMax]);
            xAxisG.transition(t).call(xAxis);

            y.domain([0, d3.max(filteredKde, d => d.freq)]);
            yAxisG.transition(t).call(yAxis);
            //Y axis label
            svg.selectAll(".y-axis-label").data([professionCode], d => d).join("text")
                .attr("transform", `translate(${margin.left - 50} ${(height - margin.bottom - margin.top) / 2 + margin.top}) rotate(270)`)
                .attr("class", "axis-label y-axis-label")
                .attr("text-anchor", "middle")
                .text(`Number of ${professionListMap.get(professionCode)}s`);


            chartBody
                .selectAll(".areas")
                .data(groupedKde, d => d[0])
                .join("path")
                .attr("class", "areas")
                .attr("fill", d => colors[d[0]])
                .attr("opacity", 0.4)
                .transition(t)
                .attr("d", d => area(d[1]));

            chartBody
                .selectAll(".mean-line")
                .data(descriptiveData.get(professionCode), d => d.metro)
                .join("line")
                .attr("class", "mean-line")
                .attr("y1", margin.top)
                .attr("y2", height - margin.bottom)
                .attr("stroke", d => colors[d.metro])
                .attr("stroke-width", 3)
                .attr("stroke-dasharray", 4)
                .transition(t)
                .attr("x1", d => x(d.avg_age))
                .attr("x2", d => x(d.avg_age));

            chartBody
                .selectAll(".mean-text")
                .data(descriptiveData.get(professionCode), d => d.metro)
                .join("text")
                .attr("class", "mean-text")
                .attr("text-anchor", "middle")
                .attr("dy", "-5")
                .attr("fill", d => colors[d.metro])
                .property("_current", d => d.avg_age)
                .transition(t)
                .attr("transform", d => `translate(${x(d.avg_age)} ${margin.top})`)
                .textTween(function (d) {
                    const i = d3.interpolateRound(this._current, d.avg_age);
                    return function (t) { console.log(t, i(t)); return this._current = i(t); };
                });




            //Chart title
            svg.selectAll(".chart-title").data([professionCode], d => d).join("text")
                .attr("class", "chart-title")
                .attr("transform", `translate(5 40)`)
                .text(`Age Distribution of ${professionListMap.get(professionCode)} s, Metropolitan vs Rural Counties, North Carolina, 2018`)

        }
        return chart;




        // g.append("text")
        //     .attr("x", x(65))
        //     .attr("text-anchor", "middle")
        //     .attr("y", y(filtered.ruralMax))
        //     .attr("dy", -4)
        //     .attr("font-weight", 600)
        //     .attr("fill", colors[0])
        //     .text(`Non - Metro(N = ${ filtered.rural.length.toLocaleString() })`);

        // g.append("text")
        //     .attr("x", x(60))
        //     .attr("text-anchor", "middle")
        //     .attr("y", y(85))
        //     .attr("font-weight", 600)
        //     .attr("fill", colors[1])
        //     .text(`Metro(N = ${ filtered.metro.length.toLocaleString() })`);




    }

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




})();
