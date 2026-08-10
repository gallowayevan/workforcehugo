---
type: interactive
title: Download Data
javascript: [/js/d3-dsv.v1.min.js, /js/d3-fetch.v1.min.js, /js/d3-array.v2.min.js, main.js]
---
<div id="download-api-error" class="notification is-warning" hidden>The data service is temporarily unavailable, so the download forms below will not work. Please try again later.</div>
<div class="box">
<p class="subtitle">Health Professionals Over Time for Selected County</p>
{{< figure src="/images/posts/value_over_time_for_county.png" >}}
<form id="downloadForm1">
<fieldset class="field">
  <legend class="is-sr-only">Measure</legend>
  <div class="control">
    <label class="radio">
      <input type="radio" name="rateOrTotal1" value="total" checked>
      Total
    </label>
    <label class="radio">
      <input type="radio" name="rateOrTotal1" value="provider_rate">
      Rate per 10K
    </label>
  </div>
</fieldset>
<div class="field">
  <label class="label" for="county-select">County</label>
  <div class="control">
    <div class="select">
      <select id="county-select">
      </select>
    </div>
  </div>
</div>
<div class="field">
  <div class="control">
    <button class="button is-info" type="submit">Download Data</button>
  </div>
</div>
</form>

</div>

<div class="box">
<p class="subtitle">Selected Health Professional Over Time by County</p>
{{< figure src="/images/posts/county_by_year_example.png" >}}
<form id="downloadForm2">
<fieldset class="field">
  <legend class="is-sr-only">Measure</legend>
  <div class="control">
    <label class="radio">
      <input type="radio" name="rateOrTotal2" value="total" checked>
      Total
    </label>
    <label class="radio">
      <input type="radio" name="rateOrTotal2" value="provider_rate">
      Rate per 10K
    </label>
  </div>
</fieldset>
<div class="field">
  <label class="label" for="profession-select">Profession</label>
  <div class="control">
    <div class="select">
      <select id="profession-select">
      </select>
    </div>
  </div>
</div>
<div class="field">
  <div class="control">
    <button class="button is-info" type="submit">Download Data</button>
  </div>
</div>
</form>

</div>

<div class="box">
<p class="subtitle">Health Professionals by Selected Geography for Selected Year</p>
{{< figure src="/images/posts/county_by_profession_example.png" >}}
<form id="downloadForm3">
<div class="field">
  <label class="label" for="year-select">Year</label>
  <div class="control">
    <div class="select">
      <select id="year-select">
      </select>
    </div>
  </div>
</div>

<fieldset class="field">
  <legend class="is-sr-only">Measure</legend>
  <div class="control">
    <label class="radio">
      <input type="radio" name="rateOrTotal3" value="total" checked>
      Total
    </label>
    <label class="radio">
      <input type="radio" name="rateOrTotal3" value="provider_rate">
      Rate per 10K
    </label>
  </div>
</fieldset>
<div class="field">
  <label class="label" for="region-select">Geography Type</label>
  <div class="control">
    <div class="select">
      <select id="region-select">
      <option value="county">County</option><option value="ahec">AHEC</option><option value="medicaid">Medicaid Region</option>
      </select>
    </div>
  </div>
</div>
<div class="field">
  <div class="control">
    <button class="button is-info" type="submit">Download Data</button>
  </div>
</div>
</form>

</div>

Data include active, licensed health professionals practicing in North Carolina as of October 31 of each data year. County counts are based on primary practice location. Some providers may practice in additional locations not shown in primary practice location counts. Population census data and estimates are downloaded from the North Carolina Office of State Budget and Management and are based on US Census data.

Source: North Carolina Health Professions Data System, Program on Health Workforce Research and Policy, Cecil G. Sheps Center for Health Services Research, University of North Carolina at Chapel Hill.

The North Carolina Health Professions Data System (HPDS) collects and disseminates descriptive data on selected licensed health professionals in North Carolina. With annual files dating back to 1979, the HPDS is the oldest continuous state health workforce data system in the country.

The HPDS is maintained by the Program on Health Workforce Research and Policy at the Cecil G. Sheps Center for Health Services Research at the University of North Carolina at Chapel Hill, in collaboration with the North Carolina Area Health Education Centers Program (AHEC), and the state’s independent health professional licensing boards. Ongoing financial support is provided by the NC AHEC Program Office and the Office of the Provost at the University of North Carolina at Chapel Hill. Although the NC HPDS maintains the data system, the data remain the property of their respective licensing board.
