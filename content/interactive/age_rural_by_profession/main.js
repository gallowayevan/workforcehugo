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
        const margin = ({ top: 90, right: 10, bottom: 50, left: 40 });

        const labelsFill = "#898989";
        const opacity = 0.4;

        const svg = d3.select(targetSelector)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("font", "14px sans-serif");

        const chartBody = svg.append("g").attr("class", "chart-body");

        const colors = { nonmetro: "#408941", metro: "#12719e" };


        const x = d3
            .scaleLinear()
            .range([margin.left, width - margin.right]);

        const xAxis = d3.axisBottom(x);
        const xAxisG = svg
            .append("g")
            .attr("transform", `translate(0,${height - margin.top})`)
            .call(xAxis);

        const y = d3
            .scaleLinear()
            .range([height - margin.top, margin.top]);

        const yAxis = d3.axisLeft(y);
        const yAxisG = svg
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis);

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


        const t = d3.transition()
            .duration(1000)
            .ease(d3.easeLinear);

        const clip = svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .style("pointer-events", "none")
            .append("rect")
            .attr("transform", `translate(${margin.left} ${margin.top})`)
            .attr("width", width - margin.right - margin.left)
            .attr("height", height - margin.top - margin.bottom);

        chartBody.attr("clip-path", "url(#clip)");

        function chart(professionCode) {
            const xMax = d3.max(descriptiveData.get(professionCode), d => d.max_age);
            const xMin = d3.min(descriptiveData.get(professionCode), d => d.min_age);

            //Get kde for current profession
            const filteredKde = kdeData.filter(d => d.profession == professionCode);
            const groupedKde = d3.groups(filteredKde, d => d.metro);
            console.log(filteredKde)
            console.log(xMin, xMax)

            x.domain([xMin, xMax]);
            xAxisG.transition(t).call(xAxis);

            y.domain([0, d3.max(filteredKde, d => d.freq)]);
            yAxisG.transition(t).call(yAxis);

            chartBody
                .selectAll(".areas")
                .data(groupedKde, d => d[0])
                .join("path")
                .attr("class", "areas")
                .attr("fill", d => colors[d[0]])
                .attr("opacity", opacity)
                .transition(t)
                .attr("d", d => area(d[1]));

        }
        return chart;


        //     const x = d3
        //         .scaleLinear()
        //         .domain([25, 80])
        //         .range([margin.left, width - margin.right])



        // const yAxis = g =>
        //     g
        //         .attr("transform", `translate(${margin.left},0)`)
        //         .call(d3.axisLeft(y).tickValues(d3.range(0, 140, 20)));

        // g.append("g").call(yAxis);

        // g.append("g").call(xAxis);



        // const g = svg
        //     .append("g")
        //     .attr("transform", (d, i) => `translate(0,${margin.top})`);

        // const labelsFill = "#898989";
        // const opacity = 0.4;

        // const y = d3
        //     .scaleLinear()
        //     .domain([0, Math.max(filtered.ruralMax, filtered.metroMax)])
        //     .range([height - margin.bottom - margin.top, 0]);

        // const area = d3
        //     .area()
        //     .curve(d3.curveBasis)
        //     .x(function (d) {
        //         return x(d[0]);
        //     })
        //     .y0(height - margin.bottom - margin.top)
        //     .y1(function (d) {
        //         return y(d[1]);
        //     });

        // g.append("path")
        //     .attr("fill", colors[1])
        //     .attr("d", area(filtered.metroKDE))
        //     .attr("opacity", opacity);

        // g.append("path")
        //     .attr("fill", colors[0])
        //     .attr("d", area(filtered.ruralKDE))
        //     .attr("opacity", opacity);

        // g.append("text")
        //     .attr("x", x(65))
        //     .attr("text-anchor", "middle")
        //     .attr("y", y(filtered.ruralMax))
        //     .attr("dy", -4)
        //     .attr("font-weight", 600)
        //     .attr("fill", colors[0])
        //     .text(`Non-Metro (N = ${filtered.rural.length.toLocaleString()})`);

        // g.append("text")
        //     .attr("x", x(60))
        //     .attr("text-anchor", "middle")
        //     .attr("y", y(85))
        //     .attr("font-weight", 600)
        //     .attr("fill", colors[1])
        //     .text(`Metro (N = ${filtered.metro.length.toLocaleString()})`);

        // g.append("text")
        //     .attr("x", x(25))
        //     .attr("dx", -15)
        //     .attr("text-anchor", "middle")
        //     .attr("y", 0)
        //     .attr("dy", -15)
        //     .attr("fill", labelsFill)
        //     .attr("font-weight", 600)
        //     .text("Count");

        // g.append("text")
        //     .attr("x", width / 2)
        //     .attr("text-anchor", "middle")
        //     .attr("y", height - margin.bottom - margin.top + 40)
        //     .attr("fill", labelsFill)
        //     .attr("font-weight", 600)
        //     .text("Age");

        // g.append("g")
        //     .selectAll("line")
        //     .data([filtered.ruralMean, filtered.metroMean])
        //     .join("line")
        //     .attr("y1", 0)
        //     .attr("y2", height - margin.bottom - margin.top)
        //     .attr("x1", d => x(d))
        //     .attr("x2", d => x(d))
        //     .attr("stroke", (d, i) => colors[i])
        //     .attr("stroke-width", 3)
        //     .attr("stroke-dasharray", 4);



        // svg.selectAll(".tick text").attr("fill", labelsFill);
        // svg.selectAll(".tick line").attr("stroke", labelsFill);
        // svg.selectAll(".domain").attr("stroke", "none");

        // svg
        //     .append("text")
        //     .attr("y", 20)
        //     .attr("x", 0)
        //     .attr("font-size", 20)
        //     .attr("text-anchor", "start")
        //     .text(
        //         `Age Distribution of ${titleCase(
        //             professions.get(filtered.name)
        //         )}, Metropolitan vs. Non-Metropolitan, North Carolina, 2018`
        //     );

        // svg
        //     .append("text")
        //     .attr("y", 40)
        //     .attr("x", 0)
        //     .attr("text-anchor", "start")
        //     .attr("fill", labelsFill)
        //     .text(`Group mean indicated by dotted line.`);



    }

})();
