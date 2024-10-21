(async function () {
  const rootOfApi = "http://localhost:1313";
  //  const rootOfApi = "https://hpdsdatanode-dept-healthworkforce.apps.cloudapps.unc.edu"

  //Populate county select box.
  const countyList = [
    "Alamance",
    "Alexander",
    "Alleghany",
    "Anson",
    "Ashe",
    "Avery",
    "Beaufort",
    "Bertie",
    "Bladen",
    "Brunswick",
    "Buncombe",
    "Burke",
    "Cabarrus",
    "Caldwell",
    "Camden",
    "Carteret",
    "Caswell",
    "Catawba",
    "Chatham",
    "Cherokee",
    "Chowan",
    "Clay",
    "Cleveland",
    "Columbus",
    "Craven",
    "Cumberland",
    "Currituck",
    "Dare",
    "Davidson",
    "Davie",
    "Duplin",
    "Durham",
    "Edgecombe",
    "Forsyth",
    "Franklin",
    "Gaston",
    "Gates",
    "Graham",
    "Granville",
    "Greene",
    "Guilford",
    "Halifax",
    "Harnett",
    "Haywood",
    "Henderson",
    "Hertford",
    "Hoke",
    "Hyde",
    "Iredell",
    "Jackson",
    "Johnston",
    "Jones",
    "Lee",
    "Lenoir",
    "Lincoln",
    "Macon",
    "Madison",
    "Martin",
    "McDowell",
    "Mecklenburg",
    "Mitchell",
    "Montgomery",
    "Moore",
    "Nash",
    "New Hanover",
    "Northampton",
    "Onslow",
    "Orange",
    "Pamlico",
    "Pasquotank",
    "Pender",
    "Perquimans",
    "Person",
    "Pitt",
    "Polk",
    "Randolph",
    "Richmond",
    "Robeson",
    "Rockingham",
    "Rowan",
    "Rutherford",
    "Sampson",
    "Scotland",
    "Stanly",
    "Stokes",
    "Surry",
    "Swain",
    "Transylvania",
    "Tyrrell",
    "Union",
    "Vance",
    "Wake",
    "Warren",
    "Washington",
    "Watauga",
    "Wayne",
    "Wilkes",
    "Wilson",
    "Yadkin",
    "Yancey",
  ];
  const countySelect = document.getElementById("county-select");
  const countySelectFragment = document.createDocumentFragment();
  countyList.forEach((d) => countySelectFragment.appendChild(new Option(d)));
  countySelect.appendChild(countySelectFragment);

  //Get professions list and populate select
  const professions = (await d3.csv(`${rootOfApi}/specialties.csv`)).sort(
    (a, b) => d3.ascending(a.profession, b.profession)
  );
  const professionsDisplayMap = new Map(
    professions.map((d) => [d.id.padStart(3, "0"), d.display_name])
  );
  const professionSelect = document.getElementById("profession-select");
  const professionSelectFragment = document.createDocumentFragment();
  professions.forEach(({ id, profession, specialty, display_name }) =>
    professionSelectFragment.appendChild(
      new Option(
        profession == specialty
          ? profession
          : `${profession} - ${display_name}`,
        id
      )
    )
  );
  professionSelect.appendChild(professionSelectFragment);

  //Add event handlers
  document
    .getElementById("downloadForm1")
    .addEventListener("submit", formDownload1);
  document
    .getElementById("downloadForm2")
    .addEventListener("submit", formDownload2);
  document
    .getElementById("downloadForm3")
    .addEventListener("submit", formDownload3);

  async function formDownload1(e) {
    event.preventDefault();
    const county = document.getElementById("county-select").value;
    const rateOrTotal = Array.from(
      document.getElementsByName("rateOrTotal1"),
      (d) => [d.checked, d.value]
    ).filter((d) => d[0])[0][1];

    const professionsData = (
      await d3.json(
        `${rootOfApi}/api/supply?region=${county}&profession_id=${professions
          .filter((d) => d.profession == d.specialty)
          .map((d) => d.id.padStart(3, "0"))}`
      )
    ).map((d) => ({
      profession: professionsDisplayMap.get(d.profession_id),
      ...d,
    }));

    const professions_over_time_by_county = d3
      .groups(professionsData, (d) => d.profession)
      .map(function (d) {
        let newRow = { Profession: d[0] };
        d[1].forEach(function (e) {
          newRow[e.year] = e[rateOrTotal];
        });
        return newRow;
      })
      .sort((a, b) => d3.ascending(a.Profession, b.Profession));

    const yearExtent = d3.extent(
      professions_over_time_by_county
        .map((d) =>
          d3.extent(
            Object.keys(d)
              .map((e) => +e)
              .filter((e) => e != "Profession")
          )
        )
        .flat()
    );

    const download = [
      d3.csvFormat(professions_over_time_by_county, [
        "Profession",
        ...d3.range(yearExtent[0], yearExtent[1] + 1),
      ]),
    ];

    const filename = `Health_Professions_${getRateOrTotalText(
      rateOrTotal
    )}_${county}_County.csv`;

    triggerDownload(download, filename);
  }

  async function formDownload2(e) {
    event.preventDefault();
    const professionElement = document.getElementById("profession-select");
    const professionId = professionElement.value;
    const professionName = Array.from(professionElement.children, (d) => [
      d.textContent,
      +d.value,
    ]).filter((d) => +professionId == d[1])[0][0];
    const rateOrTotal = Array.from(
      document.getElementsByName("rateOrTotal2"),
      (d) => [d.checked, d.value]
    ).filter((d) => d[0])[0][1];

    const professionals = (
      await d3.json(
        `${rootOfApi}/api/supply?type=county,state&profession_id=${professionId.padStart(3, "0")}`
      )
    ).map(function (d) {
        return {
          county: d.region,
          year: +d.year,
          total: +d.total,
          population: +d.population,
          provider_rate: +d.provider_rate,
        };
      });

    const county_by_year = d3
      .groups(professionals, (d) => d.county)
      .map(function (d) {
        let newRow = { County: d[0] };
        d[1].forEach(function (e) {
          newRow[e.year] = e[rateOrTotal];
        });
        return newRow;
      });
    const yearExtent = d3.extent(professionals, (d) => d.year);
    const download = [
      d3.csvFormat(county_by_year, [
        "County",
        ...d3.range(yearExtent[0], yearExtent[1] + 1),
      ]),
    ];
    const filename = `NC_${professionName
      .split(" ")
      .join("")}_${getRateOrTotalText(rateOrTotal)}_${yearExtent.join(
      "_"
    )}.csv`;

    triggerDownload(download, filename);
  }

  async function formDownload3(e) {
    event.preventDefault();
    const region = document.getElementById("region-select").value;
    const year = document.getElementById("year-select").value;
    const rateOrTotal = Array.from(
      document.getElementsByName("rateOrTotal3"),
      (d) => [d.checked, d.value]
    ).filter((d) => d[0])[0][1];

    const professionsData = (
        await d3.json(
          `${rootOfApi}/api/supply?type=${region}&year=${year}&profession_id=${professions
            .filter((d) => d.profession == d.specialty)
            .map((d) => d.id.padStart(3, "0"))}`
        )
      ).map((d) => ({
        profession: professionsDisplayMap.get(d.profession_id),
        ...d,
      }));
console.log(professionsData)
    const professions_by_county = d3
      .groups(
        professionsData,
        (d) => d.region
      )
      .map(function (d) {
        let columns = { County: d[0], Population: +d[1][0].population };
        let profColumns = d[1].reduce(function (acc, curr) {
          acc[curr.profession] = +curr[rateOrTotal];
          return acc;
        }, {});

        return Object.assign(columns, profColumns);
      });

    const download = [d3.csvFormat(professions_by_county)];
    const filename = `HPDS_professions_${getRateOrTotalText(
      rateOrTotal
    )}_${year}.csv`;
    triggerDownload(download, filename);
  }

  function triggerDownload(download, filename) {
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(
        new Blob([download], { type: "text/csv;charset=utf-8;" }),
        filename
      );
    } else {
      var uri = "data:attachment/csv;charset=utf-8," + encodeURI(download);
      var downloadLink = document.createElement("a");
      downloadLink.href = uri;
      downloadLink.download = filename;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }


  function getRateOrTotalText(rateOrTotal) {
    return rateOrTotal == "provider_rate" ? "Rate_per_10k" : "Total";
  }
})();
