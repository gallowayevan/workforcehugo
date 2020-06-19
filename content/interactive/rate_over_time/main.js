(async function () {
    //Get list of available professions
    const professions = (await d3.csv(
        "https://data-dept-healthworkforce.cloudapps.unc.edu/data/specialties.csv"
    )).filter(({ specialty, profession }) => specialty == profession).sort((a, b) => sortByString("profession"));
    const professionMap = new Map(professions.map(d => [d.id.padStart(3, '0'), d]));

    //Track selected profession
    //Populate profession select box.
    const professionSelect = document.getElementById("profession-select");
    const selectFragment = document.createDocumentFragment();
    selectFragment.appendChild(new Option("Select a profession", "000"));
    professions.forEach(({ id, profession }) => selectFragment.appendChild(new Option(profession, id.padStart(3, '0'))));
    professionSelect.appendChild(selectFragment);

    //Add event handler
    professionSelect.addEventListener("change", handleProfessionSelect);

    //Get metro/nonmetro lookup
    const cbsaLookup = new Map((await d3.json(
        "/data/cbsaLookup.json"
    )).map(d => [+d[0], new Map(d[1])]));
    const cbsaYearCut = cut(Array.from(cbsaLookup, d => d[0]).sort((a, b) => b - a));

    //Get data on select
    function handleProfessionSelect(e) {
        if (e.target.value != "000") {
            d3.csv(
                `https://data-dept-healthworkforce.cloudapps.unc.edu/data/region/spec${e.target.value}.csv`,
                function (d) {
                    if (d.type == "ahec" || d.type == "state" || d.type == "medicaid")
                        return null;
                    return {
                        county: d.region,
                        year: +d.year,
                        total: +d.total,
                        population: +d.population,
                        rate: +d.providerRate,
                        metroStatus: cbsaLookup.get(cbsaYearCut(+d.year)).get(d.region.toUpperCase())
                    };
                }
            ).then((d) => (d.id = e.target.value, d)).then(render);
        }
    }

    function render(data) {

        const currentProfessionObject = professionMap.get(data.id);

        const spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            title: `${currentProfessionObject.display_name} per 10,000 Population, North Carolina`,
            width: 650,
            height: 400,
            data: { values: data },
            mark: {
                type: "line",
                point: true,
                interpolate: "monotone"
            },
            encoding: {
                x: { field: "year", type: "ordinal" },
                y: { aggregate: "sum", field: "population", type: "quantitative" },
                color: { field: "metroStatus", type: "nominal" }
            }
        };
        console.log(spec.data)
        vegaEmbed('#vis', spec);
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
})();