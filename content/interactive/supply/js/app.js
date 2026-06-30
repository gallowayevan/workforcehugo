(() => {
  // node_modules/d3-dsv/src/dsv.js
  var EOL = {};
  var EOF = {};
  var QUOTE = 34;
  var NEWLINE = 10;
  var RETURN = 13;
  function objectConverter(columns) {
    return new Function("d", "return {" + columns.map(function(name, i) {
      return JSON.stringify(name) + ": d[" + i + '] || ""';
    }).join(",") + "}");
  }
  function customConverter(columns, f) {
    var object = objectConverter(columns);
    return function(row, i) {
      return f(object(row), i, columns);
    };
  }
  function inferColumns(rows) {
    var columnSet = /* @__PURE__ */ Object.create(null), columns = [];
    rows.forEach(function(row) {
      for (var column in row) {
        if (!(column in columnSet)) {
          columns.push(columnSet[column] = column);
        }
      }
    });
    return columns;
  }
  function pad(value, width) {
    var s = value + "", length = s.length;
    return length < width ? new Array(width - length + 1).join(0) + s : s;
  }
  function formatYear(year) {
    return year < 0 ? "-" + pad(-year, 6) : year > 9999 ? "+" + pad(year, 6) : pad(year, 4);
  }
  function formatDate(date) {
    var hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds(), milliseconds = date.getUTCMilliseconds();
    return isNaN(date) ? "Invalid Date" : formatYear(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2) + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z" : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z" : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z" : "");
  }
  function dsv_default(delimiter) {
    var reFormat = new RegExp('["' + delimiter + "\n\r]"), DELIMITER = delimiter.charCodeAt(0);
    function parse(text, f) {
      var convert, columns, rows = parseRows(text, function(row, i) {
        if (convert) return convert(row, i - 1);
        columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
      });
      rows.columns = columns || [];
      return rows;
    }
    function parseRows(text, f) {
      var rows = [], N = text.length, I = 0, n = 0, t, eof = N <= 0, eol = false;
      if (text.charCodeAt(N - 1) === NEWLINE) --N;
      if (text.charCodeAt(N - 1) === RETURN) --N;
      function token() {
        if (eof) return EOF;
        if (eol) return eol = false, EOL;
        var i, j = I, c;
        if (text.charCodeAt(j) === QUOTE) {
          while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE) ;
          if ((i = I) >= N) eof = true;
          else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
          else if (c === RETURN) {
            eol = true;
            if (text.charCodeAt(I) === NEWLINE) ++I;
          }
          return text.slice(j + 1, i - 1).replace(/""/g, '"');
        }
        while (I < N) {
          if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
          else if (c === RETURN) {
            eol = true;
            if (text.charCodeAt(I) === NEWLINE) ++I;
          } else if (c !== DELIMITER) continue;
          return text.slice(j, i);
        }
        return eof = true, text.slice(j, N);
      }
      while ((t = token()) !== EOF) {
        var row = [];
        while (t !== EOL && t !== EOF) row.push(t), t = token();
        if (f && (row = f(row, n++)) == null) continue;
        rows.push(row);
      }
      return rows;
    }
    function preformatBody(rows, columns) {
      return rows.map(function(row) {
        return columns.map(function(column) {
          return formatValue(row[column]);
        }).join(delimiter);
      });
    }
    function format2(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
    }
    function formatBody(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return preformatBody(rows, columns).join("\n");
    }
    function formatRows(rows) {
      return rows.map(formatRow).join("\n");
    }
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(value) {
      return value == null ? "" : value instanceof Date ? formatDate(value) : reFormat.test(value += "") ? '"' + value.replace(/"/g, '""') + '"' : value;
    }
    return {
      parse,
      parseRows,
      format: format2,
      formatBody,
      formatRows,
      formatRow,
      formatValue
    };
  }

  // node_modules/d3-dsv/src/csv.js
  var csv = dsv_default(",");
  var csvParse = csv.parse;
  var csvParseRows = csv.parseRows;
  var csvFormat = csv.format;
  var csvFormatBody = csv.formatBody;
  var csvFormatRows = csv.formatRows;
  var csvFormatRow = csv.formatRow;
  var csvFormatValue = csv.formatValue;

  // src/config.js
  var rootApi = "https://hpdsdatanode-dept-healthworkforce.apps.cloudapps.unc.edu/";

  // src/api.js
  async function loadSpecialties() {
    const res = await fetch(rootApi + "specialties.csv");
    if (!res.ok) throw new Error("Failed to load specialties.csv");
    const rows = csvParse(await res.text());
    return rows.map((d) => ({
      name: d.display_name.replace(/_/g, " "),
      code: d.id,
      profession: d.profession.replace(/_/g, " "),
      specialty: d.specialty.replace(/_/g, " ")
    }));
  }
  async function loadSupply(code) {
    const id = String(code).padStart(3, "0");
    const res = await fetch(rootApi + "api/supply?profession_id=" + id);
    if (!res.ok) throw new Error("Network response was not ok");
    return res.json();
  }
  async function loadGeo() {
    const names = [
      "ncMap",
      "ahec",
      "medicaid",
      "ruralRoots",
      "layers",
      "physicianGroups"
    ];
    const results = await Promise.all(
      names.map(
        (n) => fetch(`./data/${n}.json`).then((r) => {
          if (!r.ok) throw new Error(`Failed to load data/${n}.json`);
          return r.json();
        })
      )
    );
    const [ncMap, ahec, medicaid, ruralRoots, layers, physicianGroups] = results;
    return { ncMap, ahec, medicaid, ruralRoots, layers, physicianGroups };
  }

  // node_modules/d3-array/src/ascending.js
  function ascending(a, b) {
    return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  // node_modules/d3-array/src/descending.js
  function descending(a, b) {
    return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  // node_modules/d3-array/src/bisector.js
  function bisector(f) {
    let compare1, compare2, delta;
    if (f.length !== 2) {
      compare1 = ascending;
      compare2 = (d, x2) => ascending(f(d), x2);
      delta = (d, x2) => f(d) - x2;
    } else {
      compare1 = f === ascending || f === descending ? f : zero;
      compare2 = f;
      delta = f;
    }
    function left(a, x2, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x2, x2) !== 0) return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a[mid], x2) < 0) lo = mid + 1;
          else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function right(a, x2, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x2, x2) !== 0) return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a[mid], x2) <= 0) lo = mid + 1;
          else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function center(a, x2, lo = 0, hi = a.length) {
      const i = left(a, x2, lo, hi - 1);
      return i > lo && delta(a[i - 1], x2) > -delta(a[i], x2) ? i - 1 : i;
    }
    return { left, center, right };
  }
  function zero() {
    return 0;
  }

  // node_modules/d3-array/src/number.js
  function number(x2) {
    return x2 === null ? NaN : +x2;
  }
  function* numbers(values, valueof) {
    if (valueof === void 0) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          yield value;
        }
      }
    } else {
      let index2 = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index2, values)) != null && (value = +value) >= value) {
          yield value;
        }
      }
    }
  }

  // node_modules/d3-array/src/bisect.js
  var ascendingBisect = bisector(ascending);
  var bisectRight = ascendingBisect.right;
  var bisectLeft = ascendingBisect.left;
  var bisectCenter = bisector(number).center;
  var bisect_default = bisectRight;

  // node_modules/d3-array/src/count.js
  function count(values, valueof) {
    let count2 = 0;
    if (valueof === void 0) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          ++count2;
        }
      }
    } else {
      let index2 = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index2, values)) != null && (value = +value) >= value) {
          ++count2;
        }
      }
    }
    return count2;
  }

  // node_modules/d3-array/src/extent.js
  function extent(values, valueof) {
    let min2;
    let max2;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null) {
          if (min2 === void 0) {
            if (value >= value) min2 = max2 = value;
          } else {
            if (min2 > value) min2 = value;
            if (max2 < value) max2 = value;
          }
        }
      }
    } else {
      let index2 = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index2, values)) != null) {
          if (min2 === void 0) {
            if (value >= value) min2 = max2 = value;
          } else {
            if (min2 > value) min2 = value;
            if (max2 < value) max2 = value;
          }
        }
      }
    }
    return [min2, max2];
  }

  // node_modules/d3-array/src/fsum.js
  var Adder = class {
    constructor() {
      this._partials = new Float64Array(32);
      this._n = 0;
    }
    add(x2) {
      const p = this._partials;
      let i = 0;
      for (let j = 0; j < this._n && j < 32; j++) {
        const y2 = p[j], hi = x2 + y2, lo = Math.abs(x2) < Math.abs(y2) ? x2 - (hi - y2) : y2 - (hi - x2);
        if (lo) p[i++] = lo;
        x2 = hi;
      }
      p[i] = x2;
      this._n = i + 1;
      return this;
    }
    valueOf() {
      const p = this._partials;
      let n = this._n, x2, y2, lo, hi = 0;
      if (n > 0) {
        hi = p[--n];
        while (n > 0) {
          x2 = hi;
          y2 = p[--n];
          hi = x2 + y2;
          lo = y2 - (hi - x2);
          if (lo) break;
        }
        if (n > 0 && (lo < 0 && p[n - 1] < 0 || lo > 0 && p[n - 1] > 0)) {
          y2 = lo * 2;
          x2 = hi + y2;
          if (y2 == x2 - hi) hi = x2;
        }
      }
      return hi;
    }
  };

  // node_modules/internmap/src/index.js
  var InternMap = class extends Map {
    constructor(entries, key = keyof) {
      super();
      Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key } });
      if (entries != null) for (const [key2, value] of entries) this.set(key2, value);
    }
    get(key) {
      return super.get(intern_get(this, key));
    }
    has(key) {
      return super.has(intern_get(this, key));
    }
    set(key, value) {
      return super.set(intern_set(this, key), value);
    }
    delete(key) {
      return super.delete(intern_delete(this, key));
    }
  };
  function intern_get({ _intern, _key }, value) {
    const key = _key(value);
    return _intern.has(key) ? _intern.get(key) : value;
  }
  function intern_set({ _intern, _key }, value) {
    const key = _key(value);
    if (_intern.has(key)) return _intern.get(key);
    _intern.set(key, value);
    return value;
  }
  function intern_delete({ _intern, _key }, value) {
    const key = _key(value);
    if (_intern.has(key)) {
      value = _intern.get(key);
      _intern.delete(key);
    }
    return value;
  }
  function keyof(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  // node_modules/d3-array/src/identity.js
  function identity(x2) {
    return x2;
  }

  // node_modules/d3-array/src/group.js
  function group(values, ...keys) {
    return nest(values, identity, identity, keys);
  }
  function nest(values, map3, reduce, keys) {
    return function regroup(values2, i) {
      if (i >= keys.length) return reduce(values2);
      const groups2 = new InternMap();
      const keyof2 = keys[i++];
      let index2 = -1;
      for (const value of values2) {
        const key = keyof2(value, ++index2, values2);
        const group2 = groups2.get(key);
        if (group2) group2.push(value);
        else groups2.set(key, [value]);
      }
      for (const [key, values3] of groups2) {
        groups2.set(key, regroup(values3, i));
      }
      return map3(groups2);
    }(values, 0);
  }

  // node_modules/d3-array/src/sort.js
  function compareDefined(compare = ascending) {
    if (compare === ascending) return ascendingDefined;
    if (typeof compare !== "function") throw new TypeError("compare is not a function");
    return (a, b) => {
      const x2 = compare(a, b);
      if (x2 || x2 === 0) return x2;
      return (compare(b, b) === 0) - (compare(a, a) === 0);
    };
  }
  function ascendingDefined(a, b) {
    return (a == null || !(a >= a)) - (b == null || !(b >= b)) || (a < b ? -1 : a > b ? 1 : 0);
  }

  // node_modules/d3-array/src/array.js
  var array = Array.prototype;
  var slice = array.slice;
  var map = array.map;

  // node_modules/d3-array/src/constant.js
  function constant(x2) {
    return () => x2;
  }

  // node_modules/d3-array/src/ticks.js
  var e10 = Math.sqrt(50);
  var e5 = Math.sqrt(10);
  var e2 = Math.sqrt(2);
  function tickSpec(start, stop, count2) {
    const step = (stop - start) / Math.max(0, count2), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
    let i1, i2, inc;
    if (power < 0) {
      inc = Math.pow(10, -power) / factor;
      i1 = Math.round(start * inc);
      i2 = Math.round(stop * inc);
      if (i1 / inc < start) ++i1;
      if (i2 / inc > stop) --i2;
      inc = -inc;
    } else {
      inc = Math.pow(10, power) * factor;
      i1 = Math.round(start / inc);
      i2 = Math.round(stop / inc);
      if (i1 * inc < start) ++i1;
      if (i2 * inc > stop) --i2;
    }
    if (i2 < i1 && 0.5 <= count2 && count2 < 2) return tickSpec(start, stop, count2 * 2);
    return [i1, i2, inc];
  }
  function ticks(start, stop, count2) {
    stop = +stop, start = +start, count2 = +count2;
    if (!(count2 > 0)) return [];
    if (start === stop) return [start];
    const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count2) : tickSpec(start, stop, count2);
    if (!(i2 >= i1)) return [];
    const n = i2 - i1 + 1, ticks2 = new Array(n);
    if (reverse) {
      if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) / -inc;
      else for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) * inc;
    } else {
      if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) / -inc;
      else for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) * inc;
    }
    return ticks2;
  }
  function tickIncrement(start, stop, count2) {
    stop = +stop, start = +start, count2 = +count2;
    return tickSpec(start, stop, count2)[2];
  }
  function tickStep(start, stop, count2) {
    stop = +stop, start = +start, count2 = +count2;
    const reverse = stop < start, inc = reverse ? tickIncrement(stop, start, count2) : tickIncrement(start, stop, count2);
    return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
  }

  // node_modules/d3-array/src/nice.js
  function nice(start, stop, count2) {
    let prestep;
    while (true) {
      const step = tickIncrement(start, stop, count2);
      if (step === prestep || step === 0 || !isFinite(step)) {
        return [start, stop];
      } else if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
      }
      prestep = step;
    }
  }

  // node_modules/d3-array/src/threshold/sturges.js
  function thresholdSturges(values) {
    return Math.max(1, Math.ceil(Math.log(count(values)) / Math.LN2) + 1);
  }

  // node_modules/d3-array/src/bin.js
  function bin() {
    var value = identity, domain = extent, threshold2 = thresholdSturges;
    function histogram(data) {
      if (!Array.isArray(data)) data = Array.from(data);
      var i, n = data.length, x2, step, values = new Array(n);
      for (i = 0; i < n; ++i) {
        values[i] = value(data[i], i, data);
      }
      var xz = domain(values), x05 = xz[0], x12 = xz[1], tz = threshold2(values, x05, x12);
      if (!Array.isArray(tz)) {
        const max2 = x12, tn = +tz;
        if (domain === extent) [x05, x12] = nice(x05, x12, tn);
        tz = ticks(x05, x12, tn);
        if (tz[0] <= x05) step = tickIncrement(x05, x12, tn);
        if (tz[tz.length - 1] >= x12) {
          if (max2 >= x12 && domain === extent) {
            const step2 = tickIncrement(x05, x12, tn);
            if (isFinite(step2)) {
              if (step2 > 0) {
                x12 = (Math.floor(x12 / step2) + 1) * step2;
              } else if (step2 < 0) {
                x12 = (Math.ceil(x12 * -step2) + 1) / -step2;
              }
            }
          } else {
            tz.pop();
          }
        }
      }
      var m = tz.length, a = 0, b = m;
      while (tz[a] <= x05) ++a;
      while (tz[b - 1] > x12) --b;
      if (a || b < m) tz = tz.slice(a, b), m = b - a;
      var bins = new Array(m + 1), bin2;
      for (i = 0; i <= m; ++i) {
        bin2 = bins[i] = [];
        bin2.x0 = i > 0 ? tz[i - 1] : x05;
        bin2.x1 = i < m ? tz[i] : x12;
      }
      if (isFinite(step)) {
        if (step > 0) {
          for (i = 0; i < n; ++i) {
            if ((x2 = values[i]) != null && x05 <= x2 && x2 <= x12) {
              bins[Math.min(m, Math.floor((x2 - x05) / step))].push(data[i]);
            }
          }
        } else if (step < 0) {
          for (i = 0; i < n; ++i) {
            if ((x2 = values[i]) != null && x05 <= x2 && x2 <= x12) {
              const j = Math.floor((x05 - x2) * step);
              bins[Math.min(m, j + (tz[j] <= x2))].push(data[i]);
            }
          }
        }
      } else {
        for (i = 0; i < n; ++i) {
          if ((x2 = values[i]) != null && x05 <= x2 && x2 <= x12) {
            bins[bisect_default(tz, x2, 0, m)].push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : constant(_), histogram) : value;
    };
    histogram.domain = function(_) {
      return arguments.length ? (domain = typeof _ === "function" ? _ : constant([_[0], _[1]]), histogram) : domain;
    };
    histogram.thresholds = function(_) {
      return arguments.length ? (threshold2 = typeof _ === "function" ? _ : constant(Array.isArray(_) ? slice.call(_) : _), histogram) : threshold2;
    };
    return histogram;
  }

  // node_modules/d3-array/src/max.js
  function max(values, valueof) {
    let max2;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null && (max2 < value || max2 === void 0 && value >= value)) {
          max2 = value;
        }
      }
    } else {
      let index2 = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index2, values)) != null && (max2 < value || max2 === void 0 && value >= value)) {
          max2 = value;
        }
      }
    }
    return max2;
  }

  // node_modules/d3-array/src/min.js
  function min(values, valueof) {
    let min2;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null && (min2 > value || min2 === void 0 && value >= value)) {
          min2 = value;
        }
      }
    } else {
      let index2 = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index2, values)) != null && (min2 > value || min2 === void 0 && value >= value)) {
          min2 = value;
        }
      }
    }
    return min2;
  }

  // node_modules/d3-array/src/quickselect.js
  function quickselect(array2, k, left = 0, right = Infinity, compare) {
    k = Math.floor(k);
    left = Math.floor(Math.max(0, left));
    right = Math.floor(Math.min(array2.length - 1, right));
    if (!(left <= k && k <= right)) return array2;
    compare = compare === void 0 ? ascendingDefined : compareDefined(compare);
    while (right > left) {
      if (right - left > 600) {
        const n = right - left + 1;
        const m = k - left + 1;
        const z = Math.log(n);
        const s = 0.5 * Math.exp(2 * z / 3);
        const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
        const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
        const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
        quickselect(array2, k, newLeft, newRight, compare);
      }
      const t = array2[k];
      let i = left;
      let j = right;
      swap(array2, left, k);
      if (compare(array2[right], t) > 0) swap(array2, left, right);
      while (i < j) {
        swap(array2, i, j), ++i, --j;
        while (compare(array2[i], t) < 0) ++i;
        while (compare(array2[j], t) > 0) --j;
      }
      if (compare(array2[left], t) === 0) swap(array2, left, j);
      else ++j, swap(array2, j, right);
      if (j <= k) left = j + 1;
      if (k <= j) right = j - 1;
    }
    return array2;
  }
  function swap(array2, i, j) {
    const t = array2[i];
    array2[i] = array2[j];
    array2[j] = t;
  }

  // node_modules/d3-array/src/quantile.js
  function quantile(values, p, valueof) {
    values = Float64Array.from(numbers(values, valueof));
    if (!(n = values.length) || isNaN(p = +p)) return;
    if (p <= 0 || n < 2) return min(values);
    if (p >= 1) return max(values);
    var n, i = (n - 1) * p, i0 = Math.floor(i), value0 = max(quickselect(values, i0).subarray(0, i0 + 1)), value1 = min(values.subarray(i0 + 1));
    return value0 + (value1 - value0) * (i - i0);
  }
  function quantileSorted(values, p, valueof = number) {
    if (!(n = values.length) || isNaN(p = +p)) return;
    if (p <= 0 || n < 2) return +valueof(values[0], 0, values);
    if (p >= 1) return +valueof(values[n - 1], n - 1, values);
    var n, i = (n - 1) * p, i0 = Math.floor(i), value0 = +valueof(values[i0], i0, values), value1 = +valueof(values[i0 + 1], i0 + 1, values);
    return value0 + (value1 - value0) * (i - i0);
  }

  // node_modules/d3-array/src/median.js
  function median(values, valueof) {
    return quantile(values, 0.5, valueof);
  }

  // node_modules/d3-array/src/merge.js
  function* flatten(arrays) {
    for (const array2 of arrays) {
      yield* array2;
    }
  }
  function merge(arrays) {
    return Array.from(flatten(arrays));
  }

  // node_modules/d3-array/src/range.js
  function range(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
    var i = -1, n = Math.max(0, Math.ceil((stop - start) / step)) | 0, range2 = new Array(n);
    while (++i < n) {
      range2[i] = start + i * step;
    }
    return range2;
  }

  // src/text/labels.js
  var medicaidRegionName = /* @__PURE__ */ new Map([
    ["Medicaid Region 1", "Western NC (1)"],
    ["Medicaid Region 2", "Northwest / Triad (2)"],
    ["Medicaid Region 3", "Southcentral / Charlotte (3)"],
    ["Medicaid Region 4", "Piedmont / Triangle (4)"],
    ["Medicaid Region 5", "Southeast / Wilmington (5)"],
    ["Medicaid Region 6", "Eastern NC (6)"]
  ]);
  var ruralRootsLabels = {
    "Medicaid Region 1": "Region 1 (Impact Health)",
    "Medicaid Region 2": "Region 2 (Trillium Health Resources)",
    "Medicaid Region 3": "Region 3 (Vaya Health)",
    "Medicaid Region 4": "Region 4 (UNC Health)",
    "Medicaid Region 5": "Region 5 (Trillium Health Resources)",
    "Medicaid Region 6": "Region 6 (Access East)"
  };
  var ruralRootsShort = {
    "Region 1 (Impact Health)": "Impact (1)",
    "Region 2 (Trillium Health Resources)": "Trillium (2)",
    "Region 3 (Vaya Health)": "Vaya (3)",
    "Region 4 (UNC Health)": "UNC (4)",
    "Region 5 (Trillium Health Resources)": "Trillium (5)",
    "Region 6 (Access East)": "Access (6)"
  };
  var variableLabels = {
    provider_rate: "Rate per 10,000 Population",
    total: "Total",
    percent_female: "Percent Female",
    percent_age: "Percent 65 or Older",
    percent_underrepresented: "Percent Underrepresented Minority",
    percent_race_na: "Percent Missing Race"
  };
  var variableUnitText = {
    provider_rate: "per 10,000 population",
    percent_female: "female",
    percent_age: "65 or older",
    percent_underrepresented: "underrepresented minority",
    percent_race_na: "missing race",
    total: "total"
  };

  // src/state.js
  var state = {
    specialty: {
      name: "Name",
      code: "Code",
      profession: "Profession",
      specialty: "Specialty"
    },
    region: "North Carolina",
    variables: [],
    variable: "provider_rate",
    year: 2017,
    data: [],
    loadFailed: false,
    aggregationLevel: "county",
    yearExtent: [2e3, 2017],
    medians: { county: [], ahec: [], medicaid: [], ruralroots: [] },
    dataLoaded: false,
    scaleYear: 2017,
    medicaidRegions: false,
    layers: [],
    // array of { value, label }
    geo: null,
    // { ncMap, ahec, medicaid, ruralRoots, layers, physicianGroups }
    specialtiesAll: []
    // full specialties.csv rows (for the profession/specialty selects)
  };
  var listeners = /* @__PURE__ */ new Set();
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function emit() {
    for (const fn of listeners) fn(state);
  }
  function getState() {
    return state;
  }
  function setGeo(geo) {
    state.geo = geo;
  }
  function setSpecialties(list) {
    state.specialtiesAll = list;
  }
  async function changeSpecialty(specialtyObject) {
    state.specialty = specialtyObject;
    state.dataLoaded = false;
    emit();
    try {
      const raw = await loadSupply(specialtyObject.code);
      state.loadFailed = false;
      let data = raw;
      let yearMin = 4e3;
      let yearMax = 0;
      let medicaidRegions = false;
      data.forEach(function(d) {
        d.total = +d.total;
        d.year = +d.year;
        d.provider_rate = +d.provider_rate;
        if (d.type == "medicaid") medicaidRegions = true;
        yearMax = d.year > yearMax ? d.year : yearMax;
        yearMin = d.year < yearMin ? d.year : yearMin;
      });
      if ((state.specialty.profession == "Physician" || state.specialty.profession == "Physician Assistant") && state.specialty.profession != state.specialty.specialty) {
        data = data.filter((e) => e.year >= 2013);
      }
      if (state.specialty.profession == "Physician") {
        data = data.filter((e) => e.year != 2020 && e.year != 2021);
      }
      const ruralRootsRows = data.filter((d) => d.type == "medicaid").map(
        (d) => Object.assign({}, d, {
          type: "ruralroots",
          region: ruralRootsLabels[d.region] || d.region
        })
      );
      data = data.concat(ruralRootsRows);
      const yearRange = range(yearMin, yearMax + 1);
      const medianFor = (type) => yearRange.map((d) => ({
        year: d,
        value: median(
          data,
          (e) => e.year == d && e.type == type ? e.total : NaN
        )
      }));
      state.medians = {
        county: medianFor("county"),
        ahec: medianFor("ahec"),
        medicaid: medianFor("medicaid"),
        ruralroots: medianFor("medicaid")
        // identical groupings
      };
      state.medicaidRegions = medicaidRegions;
      state.data = data;
      state.year = yearMax;
      state.scaleYear = yearMax;
      state.yearExtent = [yearMin, yearMax];
      updateVariables();
      state.dataLoaded = true;
      emit();
    } catch (error) {
      state.loadFailed = true;
      console.error("There was a problem with the fetch operation:", error);
      emit();
    }
  }
  function setRegion(region) {
    state.region = region;
    updateVariables();
    emit();
  }
  function changeRegion(region) {
    state.region = state.region != region ? region : "North Carolina";
    updateVariables();
    emit();
  }
  function changeAggregation(newLevel) {
    state.region = "North Carolina";
    state.aggregationLevel = newLevel;
    updateVariables();
    emit();
  }
  function changeYear(year) {
    state.year = +year;
    emit();
  }
  function changeVariable(variable) {
    if (state.variable != variable) {
      state.variable = variable;
      emit();
    }
  }
  function updateLayers(layers) {
    state.layers = layers;
    emit();
  }
  function getDataByVariableForCurrentRegion(variable) {
    return state.data.filter((d) => d.region == state.region).map((d) => ({ year: d.year, value: d[variable] }));
  }
  function getDataByVariableForNorthCarolina(variable) {
    if (variable != "total") {
      return state.data.filter((d) => d.region == "North Carolina").map((d) => ({ year: d.year, value: d[variable] }));
    }
    return state.medians[state.aggregationLevel] || state.medians.medicaid;
  }
  function updateVariables() {
    const defaultArray = [
      "provider_rate",
      "total",
      "percent_female",
      "percent_age",
      "percent_underrepresented",
      "percent_race_na"
    ];
    const testData = state.data.filter((d) => d.region == state.region);
    state.variables = defaultArray.filter(function(el) {
      return testData.filter(
        (d) => d[el] === null || d[el] < 0 || !d.hasOwnProperty(el)
      ).length == 0;
    });
    if (state.variables.indexOf(state.variable) == -1) {
      state.variable = "provider_rate";
    }
  }

  // node_modules/d3-geo/src/math.js
  var epsilon = 1e-6;
  var epsilon2 = 1e-12;
  var pi = Math.PI;
  var halfPi = pi / 2;
  var quarterPi = pi / 4;
  var tau = pi * 2;
  var degrees = 180 / pi;
  var radians = pi / 180;
  var abs = Math.abs;
  var atan = Math.atan;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var sin = Math.sin;
  var sign = Math.sign || function(x2) {
    return x2 > 0 ? 1 : x2 < 0 ? -1 : 0;
  };
  var sqrt = Math.sqrt;
  function acos(x2) {
    return x2 > 1 ? 0 : x2 < -1 ? pi : Math.acos(x2);
  }
  function asin(x2) {
    return x2 > 1 ? halfPi : x2 < -1 ? -halfPi : Math.asin(x2);
  }

  // node_modules/d3-geo/src/noop.js
  function noop() {
  }

  // node_modules/d3-geo/src/stream.js
  function streamGeometry(geometry, stream) {
    if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
      streamGeometryType[geometry.type](geometry, stream);
    }
  }
  var streamObjectType = {
    Feature: function(object, stream) {
      streamGeometry(object.geometry, stream);
    },
    FeatureCollection: function(object, stream) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) streamGeometry(features[i].geometry, stream);
    }
  };
  var streamGeometryType = {
    Sphere: function(object, stream) {
      stream.sphere();
    },
    Point: function(object, stream) {
      object = object.coordinates;
      stream.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
    },
    LineString: function(object, stream) {
      streamLine(object.coordinates, stream, 0);
    },
    MultiLineString: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) streamLine(coordinates[i], stream, 0);
    },
    Polygon: function(object, stream) {
      streamPolygon(object.coordinates, stream);
    },
    MultiPolygon: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) streamPolygon(coordinates[i], stream);
    },
    GeometryCollection: function(object, stream) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) streamGeometry(geometries[i], stream);
    }
  };
  function streamLine(coordinates, stream, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    stream.lineStart();
    while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
    stream.lineEnd();
  }
  function streamPolygon(coordinates, stream) {
    var i = -1, n = coordinates.length;
    stream.polygonStart();
    while (++i < n) streamLine(coordinates[i], stream, 1);
    stream.polygonEnd();
  }
  function stream_default(object, stream) {
    if (object && streamObjectType.hasOwnProperty(object.type)) {
      streamObjectType[object.type](object, stream);
    } else {
      streamGeometry(object, stream);
    }
  }

  // node_modules/d3-geo/src/cartesian.js
  function spherical(cartesian2) {
    return [atan2(cartesian2[1], cartesian2[0]), asin(cartesian2[2])];
  }
  function cartesian(spherical2) {
    var lambda = spherical2[0], phi = spherical2[1], cosPhi = cos(phi);
    return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
  }
  function cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cartesianCross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function cartesianAddInPlace(a, b) {
    a[0] += b[0], a[1] += b[1], a[2] += b[2];
  }
  function cartesianScale(vector, k) {
    return [vector[0] * k, vector[1] * k, vector[2] * k];
  }
  function cartesianNormalizeInPlace(d) {
    var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l, d[1] /= l, d[2] /= l;
  }

  // node_modules/d3-geo/src/compose.js
  function compose_default(a, b) {
    function compose(x2, y2) {
      return x2 = a(x2, y2), b(x2[0], x2[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x2, y2) {
      return x2 = b.invert(x2, y2), x2 && a.invert(x2[0], x2[1]);
    };
    return compose;
  }

  // node_modules/d3-geo/src/rotation.js
  function rotationIdentity(lambda, phi) {
    if (abs(lambda) > pi) lambda -= Math.round(lambda / tau) * tau;
    return [lambda, phi];
  }
  rotationIdentity.invert = rotationIdentity;
  function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
    return (deltaLambda %= tau) ? deltaPhi || deltaGamma ? compose_default(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma)) : rotationLambda(deltaLambda) : deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma) : rotationIdentity;
  }
  function forwardRotationLambda(deltaLambda) {
    return function(lambda, phi) {
      lambda += deltaLambda;
      if (abs(lambda) > pi) lambda -= Math.round(lambda / tau) * tau;
      return [lambda, phi];
    };
  }
  function rotationLambda(deltaLambda) {
    var rotation = forwardRotationLambda(deltaLambda);
    rotation.invert = forwardRotationLambda(-deltaLambda);
    return rotation;
  }
  function rotationPhiGamma(deltaPhi, deltaGamma) {
    var cosDeltaPhi = cos(deltaPhi), sinDeltaPhi = sin(deltaPhi), cosDeltaGamma = cos(deltaGamma), sinDeltaGamma = sin(deltaGamma);
    function rotation(lambda, phi) {
      var cosPhi = cos(phi), x2 = cos(lambda) * cosPhi, y2 = sin(lambda) * cosPhi, z = sin(phi), k = z * cosDeltaPhi + x2 * sinDeltaPhi;
      return [
        atan2(y2 * cosDeltaGamma - k * sinDeltaGamma, x2 * cosDeltaPhi - z * sinDeltaPhi),
        asin(k * cosDeltaGamma + y2 * sinDeltaGamma)
      ];
    }
    rotation.invert = function(lambda, phi) {
      var cosPhi = cos(phi), x2 = cos(lambda) * cosPhi, y2 = sin(lambda) * cosPhi, z = sin(phi), k = z * cosDeltaGamma - y2 * sinDeltaGamma;
      return [
        atan2(y2 * cosDeltaGamma + z * sinDeltaGamma, x2 * cosDeltaPhi + k * sinDeltaPhi),
        asin(k * cosDeltaPhi - x2 * sinDeltaPhi)
      ];
    };
    return rotation;
  }

  // node_modules/d3-geo/src/circle.js
  function circleStream(stream, radius, delta, direction, t02, t12) {
    if (!delta) return;
    var cosRadius = cos(radius), sinRadius = sin(radius), step = direction * delta;
    if (t02 == null) {
      t02 = radius + direction * tau;
      t12 = radius - step / 2;
    } else {
      t02 = circleRadius(cosRadius, t02);
      t12 = circleRadius(cosRadius, t12);
      if (direction > 0 ? t02 < t12 : t02 > t12) t02 += direction * tau;
    }
    for (var point2, t = t02; direction > 0 ? t > t12 : t < t12; t -= step) {
      point2 = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)]);
      stream.point(point2[0], point2[1]);
    }
  }
  function circleRadius(cosRadius, point2) {
    point2 = cartesian(point2), point2[0] -= cosRadius;
    cartesianNormalizeInPlace(point2);
    var radius = acos(-point2[1]);
    return ((-point2[2] < 0 ? -radius : radius) + tau - epsilon) % tau;
  }

  // node_modules/d3-geo/src/clip/buffer.js
  function buffer_default() {
    var lines = [], line;
    return {
      point: function(x2, y2, m) {
        line.push([x2, y2, m]);
      },
      lineStart: function() {
        lines.push(line = []);
      },
      lineEnd: noop,
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      },
      result: function() {
        var result = lines;
        lines = [];
        line = null;
        return result;
      }
    };
  }

  // node_modules/d3-geo/src/pointEqual.js
  function pointEqual_default(a, b) {
    return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
  }

  // node_modules/d3-geo/src/clip/rejoin.js
  function Intersection(point2, points, other, entry) {
    this.x = point2;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function rejoin_default(segments, compareIntersection2, startInside, interpolate, stream) {
    var subject = [], clip = [], i, n;
    segments.forEach(function(segment) {
      if ((n2 = segment.length - 1) <= 0) return;
      var n2, p0 = segment[0], p1 = segment[n2], x2;
      if (pointEqual_default(p0, p1)) {
        if (!p0[2] && !p1[2]) {
          stream.lineStart();
          for (i = 0; i < n2; ++i) stream.point((p0 = segment[i])[0], p0[1]);
          stream.lineEnd();
          return;
        }
        p1[0] += 2 * epsilon;
      }
      subject.push(x2 = new Intersection(p0, segment, null, true));
      clip.push(x2.o = new Intersection(p0, null, x2, false));
      subject.push(x2 = new Intersection(p1, segment, null, false));
      clip.push(x2.o = new Intersection(p1, null, x2, true));
    });
    if (!subject.length) return;
    clip.sort(compareIntersection2);
    link(subject);
    link(clip);
    for (i = 0, n = clip.length; i < n; ++i) {
      clip[i].e = startInside = !startInside;
    }
    var start = subject[0], points, point2;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      stream.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (i = 0, n = points.length; i < n; ++i) stream.point((point2 = points[i])[0], point2[1]);
          } else {
            interpolate(current.x, current.n.x, 1, stream);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (i = points.length - 1; i >= 0; --i) stream.point((point2 = points[i])[0], point2[1]);
          } else {
            interpolate(current.x, current.p.x, -1, stream);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      stream.lineEnd();
    }
  }
  function link(array2) {
    if (!(n = array2.length)) return;
    var n, i = 0, a = array2[0], b;
    while (++i < n) {
      a.n = b = array2[i];
      b.p = a;
      a = b;
    }
    a.n = b = array2[0];
    b.p = a;
  }

  // node_modules/d3-geo/src/polygonContains.js
  function longitude(point2) {
    return abs(point2[0]) <= pi ? point2[0] : sign(point2[0]) * ((abs(point2[0]) + pi) % tau - pi);
  }
  function polygonContains_default(polygon, point2) {
    var lambda = longitude(point2), phi = point2[1], sinPhi = sin(phi), normal = [sin(lambda), -cos(lambda), 0], angle = 0, winding = 0;
    var sum = new Adder();
    if (sinPhi === 1) phi = halfPi + epsilon;
    else if (sinPhi === -1) phi = -halfPi - epsilon;
    for (var i = 0, n = polygon.length; i < n; ++i) {
      if (!(m = (ring = polygon[i]).length)) continue;
      var ring, m, point0 = ring[m - 1], lambda0 = longitude(point0), phi0 = point0[1] / 2 + quarterPi, sinPhi0 = sin(phi0), cosPhi0 = cos(phi0);
      for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
        var point1 = ring[j], lambda1 = longitude(point1), phi1 = point1[1] / 2 + quarterPi, sinPhi1 = sin(phi1), cosPhi1 = cos(phi1), delta = lambda1 - lambda0, sign2 = delta >= 0 ? 1 : -1, absDelta = sign2 * delta, antimeridian = absDelta > pi, k = sinPhi0 * sinPhi1;
        sum.add(atan2(k * sign2 * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)));
        angle += antimeridian ? delta + sign2 * tau : delta;
        if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
          var arc = cartesianCross(cartesian(point0), cartesian(point1));
          cartesianNormalizeInPlace(arc);
          var intersection = cartesianCross(normal, arc);
          cartesianNormalizeInPlace(intersection);
          var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
          if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
            winding += antimeridian ^ delta >= 0 ? 1 : -1;
          }
        }
      }
    }
    return (angle < -epsilon || angle < epsilon && sum < -epsilon2) ^ winding & 1;
  }

  // node_modules/d3-geo/src/clip/index.js
  function clip_default(pointVisible, clipLine, interpolate, start) {
    return function(sink) {
      var line = clipLine(sink), ringBuffer = buffer_default(), ringSink = clipLine(ringBuffer), polygonStarted = false, polygon, segments, ring;
      var clip = {
        point: point2,
        lineStart,
        lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point2;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = merge(segments);
          var startInside = polygonContains_default(polygon, start);
          if (segments.length) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            rejoin_default(segments, compareIntersection, startInside, interpolate, sink);
          } else if (startInside) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            interpolate(null, null, 1, sink);
            sink.lineEnd();
          }
          if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          sink.polygonStart();
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
          sink.polygonEnd();
        }
      };
      function point2(lambda, phi) {
        if (pointVisible(lambda, phi)) sink.point(lambda, phi);
      }
      function pointLine(lambda, phi) {
        line.point(lambda, phi);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point2;
        line.lineEnd();
      }
      function pointRing(lambda, phi) {
        ring.push([lambda, phi]);
        ringSink.point(lambda, phi);
      }
      function ringStart() {
        ringSink.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringSink.lineEnd();
        var clean = ringSink.clean(), ringSegments = ringBuffer.result(), i, n = ringSegments.length, m, segment, point3;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          if ((m = segment.length - 1) > 0) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            for (i = 0; i < m; ++i) sink.point((point3 = segment[i])[0], point3[1]);
            sink.lineEnd();
          }
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(validSegment));
      }
      return clip;
    };
  }
  function validSegment(segment) {
    return segment.length > 1;
  }
  function compareIntersection(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon : halfPi - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon : halfPi - b[1]);
  }

  // node_modules/d3-geo/src/clip/antimeridian.js
  var antimeridian_default = clip_default(
    function() {
      return true;
    },
    clipAntimeridianLine,
    clipAntimeridianInterpolate,
    [-pi, -halfPi]
  );
  function clipAntimeridianLine(stream) {
    var lambda0 = NaN, phi0 = NaN, sign0 = NaN, clean;
    return {
      lineStart: function() {
        stream.lineStart();
        clean = 1;
      },
      point: function(lambda1, phi1) {
        var sign1 = lambda1 > 0 ? pi : -pi, delta = abs(lambda1 - lambda0);
        if (abs(delta - pi) < epsilon) {
          stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          stream.point(lambda1, phi0);
          clean = 0;
        } else if (sign0 !== sign1 && delta >= pi) {
          if (abs(lambda0 - sign0) < epsilon) lambda0 -= sign0 * epsilon;
          if (abs(lambda1 - sign1) < epsilon) lambda1 -= sign1 * epsilon;
          phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          clean = 0;
        }
        stream.point(lambda0 = lambda1, phi0 = phi1);
        sign0 = sign1;
      },
      lineEnd: function() {
        stream.lineEnd();
        lambda0 = phi0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
    var cosPhi0, cosPhi1, sinLambda0Lambda1 = sin(lambda0 - lambda1);
    return abs(sinLambda0Lambda1) > epsilon ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1) - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0)) / (cosPhi0 * cosPhi1 * sinLambda0Lambda1)) : (phi0 + phi1) / 2;
  }
  function clipAntimeridianInterpolate(from, to, direction, stream) {
    var phi;
    if (from == null) {
      phi = direction * halfPi;
      stream.point(-pi, phi);
      stream.point(0, phi);
      stream.point(pi, phi);
      stream.point(pi, 0);
      stream.point(pi, -phi);
      stream.point(0, -phi);
      stream.point(-pi, -phi);
      stream.point(-pi, 0);
      stream.point(-pi, phi);
    } else if (abs(from[0] - to[0]) > epsilon) {
      var lambda = from[0] < to[0] ? pi : -pi;
      phi = direction * lambda / 2;
      stream.point(-lambda, phi);
      stream.point(0, phi);
      stream.point(lambda, phi);
    } else {
      stream.point(to[0], to[1]);
    }
  }

  // node_modules/d3-geo/src/clip/circle.js
  function circle_default(radius) {
    var cr = cos(radius), delta = 2 * radians, smallRadius = cr > 0, notHemisphere = abs(cr) > epsilon;
    function interpolate(from, to, direction, stream) {
      circleStream(stream, radius, delta, direction, from, to);
    }
    function visible(lambda, phi) {
      return cos(lambda) * cos(phi) > cr;
    }
    function clipLine(stream) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(lambda, phi) {
          var point1 = [lambda, phi], point2, v = visible(lambda, phi), c = smallRadius ? v ? 0 : code(lambda, phi) : v ? code(lambda + (lambda < 0 ? pi : -pi), phi) : 0;
          if (!point0 && (v00 = v0 = v)) stream.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (!point2 || pointEqual_default(point0, point2) || pointEqual_default(point1, point2))
              point1[2] = 1;
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              stream.lineStart();
              point2 = intersect(point1, point0);
              stream.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              stream.point(point2[0], point2[1], 2);
              stream.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                stream.lineStart();
                stream.point(t[0][0], t[0][1]);
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
              } else {
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
                stream.lineStart();
                stream.point(t[0][0], t[0][1], 3);
              }
            }
          }
          if (v && (!point0 || !pointEqual_default(point0, point1))) {
            stream.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) stream.lineEnd();
          point0 = null;
        },
        // Rejoin first and last segments if there were intersections and the first
        // and last points were visible.
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = cartesian(a), pb = cartesian(b);
      var n1 = [1, 0, 0], n2 = cartesianCross(pa, pb), n2n2 = cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = cartesianCross(n1, n2), A = cartesianScale(n1, c1), B = cartesianScale(n2, c2);
      cartesianAddInPlace(A, B);
      var u = n1xn2, w = cartesianDot(A, u), uu = cartesianDot(u, u), t2 = w * w - uu * (cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = sqrt(t2), q = cartesianScale(u, (-w - t) / uu);
      cartesianAddInPlace(q, A);
      q = spherical(q);
      if (!two) return q;
      var lambda0 = a[0], lambda1 = b[0], phi0 = a[1], phi1 = b[1], z;
      if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;
      var delta2 = lambda1 - lambda0, polar = abs(delta2 - pi) < epsilon, meridian = polar || delta2 < epsilon;
      if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;
      if (meridian ? polar ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon ? phi0 : phi1) : phi0 <= q[1] && q[1] <= phi1 : delta2 > pi ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
        var q1 = cartesianScale(u, (-w + t) / uu);
        cartesianAddInPlace(q1, A);
        return [q, spherical(q1)];
      }
    }
    function code(lambda, phi) {
      var r = smallRadius ? radius : pi - radius, code2 = 0;
      if (lambda < -r) code2 |= 1;
      else if (lambda > r) code2 |= 2;
      if (phi < -r) code2 |= 4;
      else if (phi > r) code2 |= 8;
      return code2;
    }
    return clip_default(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi]);
  }

  // node_modules/d3-geo/src/clip/line.js
  function line_default(a, b, x05, y05, x12, y12) {
    var ax = a[0], ay = a[1], bx = b[0], by = b[1], t02 = 0, t12 = 1, dx = bx - ax, dy = by - ay, r;
    r = x05 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
      if (r < t02) return;
      if (r < t12) t12 = r;
    } else if (dx > 0) {
      if (r > t12) return;
      if (r > t02) t02 = r;
    }
    r = x12 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
      if (r > t12) return;
      if (r > t02) t02 = r;
    } else if (dx > 0) {
      if (r < t02) return;
      if (r < t12) t12 = r;
    }
    r = y05 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
      if (r < t02) return;
      if (r < t12) t12 = r;
    } else if (dy > 0) {
      if (r > t12) return;
      if (r > t02) t02 = r;
    }
    r = y12 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
      if (r > t12) return;
      if (r > t02) t02 = r;
    } else if (dy > 0) {
      if (r < t02) return;
      if (r < t12) t12 = r;
    }
    if (t02 > 0) a[0] = ax + t02 * dx, a[1] = ay + t02 * dy;
    if (t12 < 1) b[0] = ax + t12 * dx, b[1] = ay + t12 * dy;
    return true;
  }

  // node_modules/d3-geo/src/clip/rectangle.js
  var clipMax = 1e9;
  var clipMin = -clipMax;
  function clipRectangle(x05, y05, x12, y12) {
    function visible(x2, y2) {
      return x05 <= x2 && x2 <= x12 && y05 <= y2 && y2 <= y12;
    }
    function interpolate(from, to, direction, stream) {
      var a = 0, a1 = 0;
      if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoint(from, to) < 0 ^ direction > 0) {
        do
          stream.point(a === 0 || a === 3 ? x05 : x12, a > 1 ? y12 : y05);
        while ((a = (a + direction + 4) % 4) !== a1);
      } else {
        stream.point(to[0], to[1]);
      }
    }
    function corner(p, direction) {
      return abs(p[0] - x05) < epsilon ? direction > 0 ? 0 : 3 : abs(p[0] - x12) < epsilon ? direction > 0 ? 2 : 1 : abs(p[1] - y05) < epsilon ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compareIntersection2(a, b) {
      return comparePoint(a.x, b.x);
    }
    function comparePoint(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
    return function(stream) {
      var activeStream = stream, bufferStream = buffer_default(), segments, polygon, ring, x__, y__, v__, x_, y_, v_, first, clean;
      var clipStream = {
        point: point2,
        lineStart,
        lineEnd,
        polygonStart,
        polygonEnd
      };
      function point2(x2, y2) {
        if (visible(x2, y2)) activeStream.point(x2, y2);
      }
      function polygonInside() {
        var winding = 0;
        for (var i = 0, n = polygon.length; i < n; ++i) {
          for (var ring2 = polygon[i], j = 1, m = ring2.length, point3 = ring2[0], a0, a1, b0 = point3[0], b1 = point3[1]; j < m; ++j) {
            a0 = b0, a1 = b1, point3 = ring2[j], b0 = point3[0], b1 = point3[1];
            if (a1 <= y12) {
              if (b1 > y12 && (b0 - a0) * (y12 - a1) > (b1 - a1) * (x05 - a0)) ++winding;
            } else {
              if (b1 <= y12 && (b0 - a0) * (y12 - a1) < (b1 - a1) * (x05 - a0)) --winding;
            }
          }
        }
        return winding;
      }
      function polygonStart() {
        activeStream = bufferStream, segments = [], polygon = [], clean = true;
      }
      function polygonEnd() {
        var startInside = polygonInside(), cleanInside = clean && startInside, visible2 = (segments = merge(segments)).length;
        if (cleanInside || visible2) {
          stream.polygonStart();
          if (cleanInside) {
            stream.lineStart();
            interpolate(null, null, 1, stream);
            stream.lineEnd();
          }
          if (visible2) {
            rejoin_default(segments, compareIntersection2, startInside, interpolate, stream);
          }
          stream.polygonEnd();
        }
        activeStream = stream, segments = polygon = ring = null;
      }
      function lineStart() {
        clipStream.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferStream.rejoin();
          segments.push(bufferStream.result());
        }
        clipStream.point = point2;
        if (v_) activeStream.lineEnd();
      }
      function linePoint(x2, y2) {
        var v = visible(x2, y2);
        if (polygon) ring.push([x2, y2]);
        if (first) {
          x__ = x2, y__ = y2, v__ = v;
          first = false;
          if (v) {
            activeStream.lineStart();
            activeStream.point(x2, y2);
          }
        } else {
          if (v && v_) activeStream.point(x2, y2);
          else {
            var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))], b = [x2 = Math.max(clipMin, Math.min(clipMax, x2)), y2 = Math.max(clipMin, Math.min(clipMax, y2))];
            if (line_default(a, b, x05, y05, x12, y12)) {
              if (!v_) {
                activeStream.lineStart();
                activeStream.point(a[0], a[1]);
              }
              activeStream.point(b[0], b[1]);
              if (!v) activeStream.lineEnd();
              clean = false;
            } else if (v) {
              activeStream.lineStart();
              activeStream.point(x2, y2);
              clean = false;
            }
          }
        }
        x_ = x2, y_ = y2, v_ = v;
      }
      return clipStream;
    };
  }

  // node_modules/d3-geo/src/identity.js
  var identity_default = (x2) => x2;

  // node_modules/d3-geo/src/path/area.js
  var areaSum = new Adder();
  var areaRingSum = new Adder();
  var x00;
  var y00;
  var x0;
  var y0;
  var areaStream = {
    point: noop,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: function() {
      areaStream.lineStart = areaRingStart;
      areaStream.lineEnd = areaRingEnd;
    },
    polygonEnd: function() {
      areaStream.lineStart = areaStream.lineEnd = areaStream.point = noop;
      areaSum.add(abs(areaRingSum));
      areaRingSum = new Adder();
    },
    result: function() {
      var area = areaSum / 2;
      areaSum = new Adder();
      return area;
    }
  };
  function areaRingStart() {
    areaStream.point = areaPointFirst;
  }
  function areaPointFirst(x2, y2) {
    areaStream.point = areaPoint;
    x00 = x0 = x2, y00 = y0 = y2;
  }
  function areaPoint(x2, y2) {
    areaRingSum.add(y0 * x2 - x0 * y2);
    x0 = x2, y0 = y2;
  }
  function areaRingEnd() {
    areaPoint(x00, y00);
  }
  var area_default = areaStream;

  // node_modules/d3-geo/src/path/bounds.js
  var x02 = Infinity;
  var y02 = x02;
  var x1 = -x02;
  var y1 = x1;
  var boundsStream = {
    point: boundsPoint,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: noop,
    polygonEnd: noop,
    result: function() {
      var bounds = [[x02, y02], [x1, y1]];
      x1 = y1 = -(y02 = x02 = Infinity);
      return bounds;
    }
  };
  function boundsPoint(x2, y2) {
    if (x2 < x02) x02 = x2;
    if (x2 > x1) x1 = x2;
    if (y2 < y02) y02 = y2;
    if (y2 > y1) y1 = y2;
  }
  var bounds_default = boundsStream;

  // node_modules/d3-geo/src/path/centroid.js
  var X0 = 0;
  var Y0 = 0;
  var Z0 = 0;
  var X1 = 0;
  var Y1 = 0;
  var Z1 = 0;
  var X2 = 0;
  var Y2 = 0;
  var Z2 = 0;
  var x002;
  var y002;
  var x03;
  var y03;
  var centroidStream = {
    point: centroidPoint,
    lineStart: centroidLineStart,
    lineEnd: centroidLineEnd,
    polygonStart: function() {
      centroidStream.lineStart = centroidRingStart;
      centroidStream.lineEnd = centroidRingEnd;
    },
    polygonEnd: function() {
      centroidStream.point = centroidPoint;
      centroidStream.lineStart = centroidLineStart;
      centroidStream.lineEnd = centroidLineEnd;
    },
    result: function() {
      var centroid = Z2 ? [X2 / Z2, Y2 / Z2] : Z1 ? [X1 / Z1, Y1 / Z1] : Z0 ? [X0 / Z0, Y0 / Z0] : [NaN, NaN];
      X0 = Y0 = Z0 = X1 = Y1 = Z1 = X2 = Y2 = Z2 = 0;
      return centroid;
    }
  };
  function centroidPoint(x2, y2) {
    X0 += x2;
    Y0 += y2;
    ++Z0;
  }
  function centroidLineStart() {
    centroidStream.point = centroidPointFirstLine;
  }
  function centroidPointFirstLine(x2, y2) {
    centroidStream.point = centroidPointLine;
    centroidPoint(x03 = x2, y03 = y2);
  }
  function centroidPointLine(x2, y2) {
    var dx = x2 - x03, dy = y2 - y03, z = sqrt(dx * dx + dy * dy);
    X1 += z * (x03 + x2) / 2;
    Y1 += z * (y03 + y2) / 2;
    Z1 += z;
    centroidPoint(x03 = x2, y03 = y2);
  }
  function centroidLineEnd() {
    centroidStream.point = centroidPoint;
  }
  function centroidRingStart() {
    centroidStream.point = centroidPointFirstRing;
  }
  function centroidRingEnd() {
    centroidPointRing(x002, y002);
  }
  function centroidPointFirstRing(x2, y2) {
    centroidStream.point = centroidPointRing;
    centroidPoint(x002 = x03 = x2, y002 = y03 = y2);
  }
  function centroidPointRing(x2, y2) {
    var dx = x2 - x03, dy = y2 - y03, z = sqrt(dx * dx + dy * dy);
    X1 += z * (x03 + x2) / 2;
    Y1 += z * (y03 + y2) / 2;
    Z1 += z;
    z = y03 * x2 - x03 * y2;
    X2 += z * (x03 + x2);
    Y2 += z * (y03 + y2);
    Z2 += z * 3;
    centroidPoint(x03 = x2, y03 = y2);
  }
  var centroid_default = centroidStream;

  // node_modules/d3-geo/src/path/context.js
  function PathContext(context) {
    this._context = context;
  }
  PathContext.prototype = {
    _radius: 4.5,
    pointRadius: function(_) {
      return this._radius = _, this;
    },
    polygonStart: function() {
      this._line = 0;
    },
    polygonEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line === 0) this._context.closePath();
      this._point = NaN;
    },
    point: function(x2, y2) {
      switch (this._point) {
        case 0: {
          this._context.moveTo(x2, y2);
          this._point = 1;
          break;
        }
        case 1: {
          this._context.lineTo(x2, y2);
          break;
        }
        default: {
          this._context.moveTo(x2 + this._radius, y2);
          this._context.arc(x2, y2, this._radius, 0, tau);
          break;
        }
      }
    },
    result: noop
  };

  // node_modules/d3-geo/src/path/measure.js
  var lengthSum = new Adder();
  var lengthRing;
  var x003;
  var y003;
  var x04;
  var y04;
  var lengthStream = {
    point: noop,
    lineStart: function() {
      lengthStream.point = lengthPointFirst;
    },
    lineEnd: function() {
      if (lengthRing) lengthPoint(x003, y003);
      lengthStream.point = noop;
    },
    polygonStart: function() {
      lengthRing = true;
    },
    polygonEnd: function() {
      lengthRing = null;
    },
    result: function() {
      var length = +lengthSum;
      lengthSum = new Adder();
      return length;
    }
  };
  function lengthPointFirst(x2, y2) {
    lengthStream.point = lengthPoint;
    x003 = x04 = x2, y003 = y04 = y2;
  }
  function lengthPoint(x2, y2) {
    x04 -= x2, y04 -= y2;
    lengthSum.add(sqrt(x04 * x04 + y04 * y04));
    x04 = x2, y04 = y2;
  }
  var measure_default = lengthStream;

  // node_modules/d3-geo/src/path/string.js
  var cacheDigits;
  var cacheAppend;
  var cacheRadius;
  var cacheCircle;
  var PathString = class {
    constructor(digits) {
      this._append = digits == null ? append : appendRound(digits);
      this._radius = 4.5;
      this._ = "";
    }
    pointRadius(_) {
      this._radius = +_;
      return this;
    }
    polygonStart() {
      this._line = 0;
    }
    polygonEnd() {
      this._line = NaN;
    }
    lineStart() {
      this._point = 0;
    }
    lineEnd() {
      if (this._line === 0) this._ += "Z";
      this._point = NaN;
    }
    point(x2, y2) {
      switch (this._point) {
        case 0: {
          this._append`M${x2},${y2}`;
          this._point = 1;
          break;
        }
        case 1: {
          this._append`L${x2},${y2}`;
          break;
        }
        default: {
          this._append`M${x2},${y2}`;
          if (this._radius !== cacheRadius || this._append !== cacheAppend) {
            const r = this._radius;
            const s = this._;
            this._ = "";
            this._append`m0,${r}a${r},${r} 0 1,1 0,${-2 * r}a${r},${r} 0 1,1 0,${2 * r}z`;
            cacheRadius = r;
            cacheAppend = this._append;
            cacheCircle = this._;
            this._ = s;
          }
          this._ += cacheCircle;
          break;
        }
      }
    }
    result() {
      const result = this._;
      this._ = "";
      return result.length ? result : null;
    }
  };
  function append(strings) {
    let i = 1;
    this._ += strings[0];
    for (const j = strings.length; i < j; ++i) {
      this._ += arguments[i] + strings[i];
    }
  }
  function appendRound(digits) {
    const d = Math.floor(digits);
    if (!(d >= 0)) throw new RangeError(`invalid digits: ${digits}`);
    if (d > 15) return append;
    if (d !== cacheDigits) {
      const k = 10 ** d;
      cacheDigits = d;
      cacheAppend = function append3(strings) {
        let i = 1;
        this._ += strings[0];
        for (const j = strings.length; i < j; ++i) {
          this._ += Math.round(arguments[i] * k) / k + strings[i];
        }
      };
    }
    return cacheAppend;
  }

  // node_modules/d3-geo/src/path/index.js
  function path_default(projection, context) {
    let digits = 3, pointRadius = 4.5, projectionStream, contextStream;
    function path2(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        stream_default(object, projectionStream(contextStream));
      }
      return contextStream.result();
    }
    path2.area = function(object) {
      stream_default(object, projectionStream(area_default));
      return area_default.result();
    };
    path2.measure = function(object) {
      stream_default(object, projectionStream(measure_default));
      return measure_default.result();
    };
    path2.bounds = function(object) {
      stream_default(object, projectionStream(bounds_default));
      return bounds_default.result();
    };
    path2.centroid = function(object) {
      stream_default(object, projectionStream(centroid_default));
      return centroid_default.result();
    };
    path2.projection = function(_) {
      if (!arguments.length) return projection;
      projectionStream = _ == null ? (projection = null, identity_default) : (projection = _).stream;
      return path2;
    };
    path2.context = function(_) {
      if (!arguments.length) return context;
      contextStream = _ == null ? (context = null, new PathString(digits)) : new PathContext(context = _);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return path2;
    };
    path2.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path2;
    };
    path2.digits = function(_) {
      if (!arguments.length) return digits;
      if (_ == null) digits = null;
      else {
        const d = Math.floor(_);
        if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
        digits = d;
      }
      if (context === null) contextStream = new PathString(digits);
      return path2;
    };
    return path2.projection(projection).digits(digits).context(context);
  }

  // node_modules/d3-geo/src/transform.js
  function transformer(methods) {
    return function(stream) {
      var s = new TransformStream();
      for (var key in methods) s[key] = methods[key];
      s.stream = stream;
      return s;
    };
  }
  function TransformStream() {
  }
  TransformStream.prototype = {
    constructor: TransformStream,
    point: function(x2, y2) {
      this.stream.point(x2, y2);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };

  // node_modules/d3-geo/src/projection/fit.js
  function fit(projection, fitBounds, object) {
    var clip = projection.clipExtent && projection.clipExtent();
    projection.scale(150).translate([0, 0]);
    if (clip != null) projection.clipExtent(null);
    stream_default(object, projection.stream(bounds_default));
    fitBounds(bounds_default.result());
    if (clip != null) projection.clipExtent(clip);
    return projection;
  }
  function fitExtent(projection, extent2, object) {
    return fit(projection, function(b) {
      var w = extent2[1][0] - extent2[0][0], h = extent2[1][1] - extent2[0][1], k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])), x2 = +extent2[0][0] + (w - k * (b[1][0] + b[0][0])) / 2, y2 = +extent2[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;
      projection.scale(150 * k).translate([x2, y2]);
    }, object);
  }
  function fitSize(projection, size, object) {
    return fitExtent(projection, [[0, 0], size], object);
  }
  function fitWidth(projection, width, object) {
    return fit(projection, function(b) {
      var w = +width, k = w / (b[1][0] - b[0][0]), x2 = (w - k * (b[1][0] + b[0][0])) / 2, y2 = -k * b[0][1];
      projection.scale(150 * k).translate([x2, y2]);
    }, object);
  }
  function fitHeight(projection, height, object) {
    return fit(projection, function(b) {
      var h = +height, k = h / (b[1][1] - b[0][1]), x2 = -k * b[0][0], y2 = (h - k * (b[1][1] + b[0][1])) / 2;
      projection.scale(150 * k).translate([x2, y2]);
    }, object);
  }

  // node_modules/d3-geo/src/projection/resample.js
  var maxDepth = 16;
  var cosMinDistance = cos(30 * radians);
  function resample_default(project, delta2) {
    return +delta2 ? resample(project, delta2) : resampleNone(project);
  }
  function resampleNone(project) {
    return transformer({
      point: function(x2, y2) {
        x2 = project(x2, y2);
        this.stream.point(x2[0], x2[1]);
      }
    });
  }
  function resample(project, delta2) {
    function resampleLineTo(x05, y05, lambda0, a0, b0, c0, x12, y12, lambda1, a1, b1, c1, depth, stream) {
      var dx = x12 - x05, dy = y12 - y05, d2 = dx * dx + dy * dy;
      if (d2 > 4 * delta2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = sqrt(a * a + b * b + c * c), phi2 = asin(c /= m), lambda2 = abs(abs(c) - 1) < epsilon || abs(lambda0 - lambda1) < epsilon ? (lambda0 + lambda1) / 2 : atan2(b, a), p = project(lambda2, phi2), x2 = p[0], y2 = p[1], dx2 = x2 - x05, dy2 = y2 - y05, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > delta2 || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x05, y05, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, lambda2, a, b, c, x12, y12, lambda1, a1, b1, c1, depth, stream);
        }
      }
    }
    return function(stream) {
      var lambda00, x004, y004, a00, b00, c00, lambda0, x05, y05, a0, b0, c0;
      var resampleStream = {
        point: point2,
        lineStart,
        lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resampleStream.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resampleStream.lineStart = lineStart;
        }
      };
      function point2(x2, y2) {
        x2 = project(x2, y2);
        stream.point(x2[0], x2[1]);
      }
      function lineStart() {
        x05 = NaN;
        resampleStream.point = linePoint;
        stream.lineStart();
      }
      function linePoint(lambda, phi) {
        var c = cartesian([lambda, phi]), p = project(lambda, phi);
        resampleLineTo(x05, y05, lambda0, a0, b0, c0, x05 = p[0], y05 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x05, y05);
      }
      function lineEnd() {
        resampleStream.point = point2;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resampleStream.point = ringPoint;
        resampleStream.lineEnd = ringEnd;
      }
      function ringPoint(lambda, phi) {
        linePoint(lambda00 = lambda, phi), x004 = x05, y004 = y05, a00 = a0, b00 = b0, c00 = c0;
        resampleStream.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x05, y05, lambda0, a0, b0, c0, x004, y004, lambda00, a00, b00, c00, maxDepth, stream);
        resampleStream.lineEnd = lineEnd;
        lineEnd();
      }
      return resampleStream;
    };
  }

  // node_modules/d3-geo/src/projection/index.js
  var transformRadians = transformer({
    point: function(x2, y2) {
      this.stream.point(x2 * radians, y2 * radians);
    }
  });
  function transformRotate(rotate) {
    return transformer({
      point: function(x2, y2) {
        var r = rotate(x2, y2);
        return this.stream.point(r[0], r[1]);
      }
    });
  }
  function scaleTranslate(k, dx, dy, sx, sy) {
    function transform(x2, y2) {
      x2 *= sx;
      y2 *= sy;
      return [dx + k * x2, dy - k * y2];
    }
    transform.invert = function(x2, y2) {
      return [(x2 - dx) / k * sx, (dy - y2) / k * sy];
    };
    return transform;
  }
  function scaleTranslateRotate(k, dx, dy, sx, sy, alpha) {
    if (!alpha) return scaleTranslate(k, dx, dy, sx, sy);
    var cosAlpha = cos(alpha), sinAlpha = sin(alpha), a = cosAlpha * k, b = sinAlpha * k, ai = cosAlpha / k, bi = sinAlpha / k, ci = (sinAlpha * dy - cosAlpha * dx) / k, fi = (sinAlpha * dx + cosAlpha * dy) / k;
    function transform(x2, y2) {
      x2 *= sx;
      y2 *= sy;
      return [a * x2 - b * y2 + dx, dy - b * x2 - a * y2];
    }
    transform.invert = function(x2, y2) {
      return [sx * (ai * x2 - bi * y2 + ci), sy * (fi - bi * x2 - ai * y2)];
    };
    return transform;
  }
  function projectionMutator(projectAt) {
    var project, k = 150, x2 = 480, y2 = 250, lambda = 0, phi = 0, deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, alpha = 0, sx = 1, sy = 1, theta = null, preclip = antimeridian_default, x05 = null, y05, x12, y12, postclip = identity_default, delta2 = 0.5, projectResample, projectTransform, projectRotateTransform, cache, cacheStream;
    function projection(point2) {
      return projectRotateTransform(point2[0] * radians, point2[1] * radians);
    }
    function invert(point2) {
      point2 = projectRotateTransform.invert(point2[0], point2[1]);
      return point2 && [point2[0] * degrees, point2[1] * degrees];
    }
    projection.stream = function(stream) {
      return cache && cacheStream === stream ? cache : cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip(cacheStream = stream)))));
    };
    projection.preclip = function(_) {
      return arguments.length ? (preclip = _, theta = void 0, reset()) : preclip;
    };
    projection.postclip = function(_) {
      return arguments.length ? (postclip = _, x05 = y05 = x12 = y12 = null, reset()) : postclip;
    };
    projection.clipAngle = function(_) {
      return arguments.length ? (preclip = +_ ? circle_default(theta = _ * radians) : (theta = null, antimeridian_default), reset()) : theta * degrees;
    };
    projection.clipExtent = function(_) {
      return arguments.length ? (postclip = _ == null ? (x05 = y05 = x12 = y12 = null, identity_default) : clipRectangle(x05 = +_[0][0], y05 = +_[0][1], x12 = +_[1][0], y12 = +_[1][1]), reset()) : x05 == null ? null : [[x05, y05], [x12, y12]];
    };
    projection.scale = function(_) {
      return arguments.length ? (k = +_, recenter()) : k;
    };
    projection.translate = function(_) {
      return arguments.length ? (x2 = +_[0], y2 = +_[1], recenter()) : [x2, y2];
    };
    projection.center = function(_) {
      return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees, phi * degrees];
    };
    projection.rotate = function(_) {
      return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees, deltaPhi * degrees, deltaGamma * degrees];
    };
    projection.angle = function(_) {
      return arguments.length ? (alpha = _ % 360 * radians, recenter()) : alpha * degrees;
    };
    projection.reflectX = function(_) {
      return arguments.length ? (sx = _ ? -1 : 1, recenter()) : sx < 0;
    };
    projection.reflectY = function(_) {
      return arguments.length ? (sy = _ ? -1 : 1, recenter()) : sy < 0;
    };
    projection.precision = function(_) {
      return arguments.length ? (projectResample = resample_default(projectTransform, delta2 = _ * _), reset()) : sqrt(delta2);
    };
    projection.fitExtent = function(extent2, object) {
      return fitExtent(projection, extent2, object);
    };
    projection.fitSize = function(size, object) {
      return fitSize(projection, size, object);
    };
    projection.fitWidth = function(width, object) {
      return fitWidth(projection, width, object);
    };
    projection.fitHeight = function(height, object) {
      return fitHeight(projection, height, object);
    };
    function recenter() {
      var center = scaleTranslateRotate(k, 0, 0, sx, sy, alpha).apply(null, project(lambda, phi)), transform = scaleTranslateRotate(k, x2 - center[0], y2 - center[1], sx, sy, alpha);
      rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma);
      projectTransform = compose_default(project, transform);
      projectRotateTransform = compose_default(rotate, projectTransform);
      projectResample = resample_default(projectTransform, delta2);
      return reset();
    }
    function reset() {
      cache = cacheStream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return recenter();
    };
  }

  // node_modules/d3-geo/src/projection/conic.js
  function conicProjection(projectAt) {
    var phi0 = 0, phi1 = pi / 3, m = projectionMutator(projectAt), p = m(phi0, phi1);
    p.parallels = function(_) {
      return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees, phi1 * degrees];
    };
    return p;
  }

  // node_modules/d3-geo/src/projection/cylindricalEqualArea.js
  function cylindricalEqualAreaRaw(phi0) {
    var cosPhi0 = cos(phi0);
    function forward(lambda, phi) {
      return [lambda * cosPhi0, sin(phi) / cosPhi0];
    }
    forward.invert = function(x2, y2) {
      return [x2 / cosPhi0, asin(y2 * cosPhi0)];
    };
    return forward;
  }

  // node_modules/d3-geo/src/projection/conicEqualArea.js
  function conicEqualAreaRaw(y05, y12) {
    var sy0 = sin(y05), n = (sy0 + sin(y12)) / 2;
    if (abs(n) < epsilon) return cylindricalEqualAreaRaw(y05);
    var c = 1 + sy0 * (2 * n - sy0), r0 = sqrt(c) / n;
    function project(x2, y2) {
      var r = sqrt(c - 2 * n * sin(y2)) / n;
      return [r * sin(x2 *= n), r0 - r * cos(x2)];
    }
    project.invert = function(x2, y2) {
      var r0y = r0 - y2, l = atan2(x2, abs(r0y)) * sign(r0y);
      if (r0y * n < 0)
        l -= pi * sign(x2) * sign(r0y);
      return [l / n, asin((c - (x2 * x2 + r0y * r0y) * n * n) / (2 * n))];
    };
    return project;
  }
  function conicEqualArea_default() {
    return conicProjection(conicEqualAreaRaw).scale(155.424).center([0, 33.6442]);
  }

  // node_modules/d3-geo/src/projection/albers.js
  function albers_default() {
    return conicEqualArea_default().parallels([29.5, 45.5]).scale(1070).translate([480, 250]).rotate([96, 0]).center([-0.6, 38.7]);
  }

  // node_modules/d3-scale/src/init.js
  function initRange(domain, range2) {
    switch (arguments.length) {
      case 0:
        break;
      case 1:
        this.range(domain);
        break;
      default:
        this.range(range2).domain(domain);
        break;
    }
    return this;
  }

  // node_modules/d3-scale/src/ordinal.js
  var implicit = Symbol("implicit");
  function ordinal() {
    var index2 = new InternMap(), domain = [], range2 = [], unknown = implicit;
    function scale(d) {
      let i = index2.get(d);
      if (i === void 0) {
        if (unknown !== implicit) return unknown;
        index2.set(d, i = domain.push(d) - 1);
      }
      return range2[i % range2.length];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [], index2 = new InternMap();
      for (const value of _) {
        if (index2.has(value)) continue;
        index2.set(value, domain.push(value) - 1);
      }
      return scale;
    };
    scale.range = function(_) {
      return arguments.length ? (range2 = Array.from(_), scale) : range2.slice();
    };
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    scale.copy = function() {
      return ordinal(domain, range2).unknown(unknown);
    };
    initRange.apply(scale, arguments);
    return scale;
  }

  // node_modules/d3-scale/src/band.js
  function band() {
    var scale = ordinal().unknown(void 0), domain = scale.domain, ordinalRange = scale.range, r0 = 0, r1 = 1, step, bandwidth, round = false, paddingInner = 0, paddingOuter = 0, align = 0.5;
    delete scale.unknown;
    function rescale() {
      var n = domain().length, reverse = r1 < r0, start = reverse ? r1 : r0, stop = reverse ? r0 : r1;
      step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
      if (round) step = Math.floor(step);
      start += (stop - start - step * (n - paddingInner)) * align;
      bandwidth = step * (1 - paddingInner);
      if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
      var values = range(n).map(function(i) {
        return start + step * i;
      });
      return ordinalRange(reverse ? values.reverse() : values);
    }
    scale.domain = function(_) {
      return arguments.length ? (domain(_), rescale()) : domain();
    };
    scale.range = function(_) {
      return arguments.length ? ([r0, r1] = _, r0 = +r0, r1 = +r1, rescale()) : [r0, r1];
    };
    scale.rangeRound = function(_) {
      return [r0, r1] = _, r0 = +r0, r1 = +r1, round = true, rescale();
    };
    scale.bandwidth = function() {
      return bandwidth;
    };
    scale.step = function() {
      return step;
    };
    scale.round = function(_) {
      return arguments.length ? (round = !!_, rescale()) : round;
    };
    scale.padding = function(_) {
      return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
    };
    scale.paddingInner = function(_) {
      return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
    };
    scale.paddingOuter = function(_) {
      return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
    };
    scale.align = function(_) {
      return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
    };
    scale.copy = function() {
      return band(domain(), [r0, r1]).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
    };
    return initRange.apply(rescale(), arguments);
  }

  // node_modules/d3-color/src/define.js
  function define_default(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }
  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  // node_modules/d3-color/src/color.js
  function Color() {
  }
  var darker = 0.7;
  var brighter = 1 / darker;
  var reI = "\\s*([+-]?\\d+)\\s*";
  var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
  var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
  var reHex = /^#([0-9a-f]{3,8})$/;
  var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
  var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
  var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
  var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
  var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
  var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
  var named = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  };
  define_default(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor(), this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });
  function color_formatHex() {
    return this.rgb().formatHex();
  }
  function color_formatHex8() {
    return this.rgb().formatHex8();
  }
  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }
  function color_formatRgb() {
    return this.rgb().formatRgb();
  }
  function color(format2) {
    var m, l;
    format2 = (format2 + "").trim().toLowerCase();
    return (m = reHex.exec(format2)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format2)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format2)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format2)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format2)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
  }
  function rgbn(n) {
    return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
  }
  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }
  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb();
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }
  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }
  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }
  define_default(Rgb, rgb, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));
  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }
  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }
  function rgb_formatRgb() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
  }
  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }
  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }
  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }
  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }
  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl();
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255, g = o.g / 255, b = o.b / 255, min2 = Math.min(r, g, b), max2 = Math.max(r, g, b), h = NaN, s = max2 - min2, l = (max2 + min2) / 2;
    if (s) {
      if (r === max2) h = (g - b) / s + (g < b) * 6;
      else if (g === max2) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max2 + min2 : 2 - max2 - min2;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }
  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }
  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }
  define_default(Hsl, hsl, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
    }
  }));
  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }
  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
  }

  // node_modules/d3-interpolate/src/basis.js
  function basis(t12, v0, v1, v2, v3) {
    var t2 = t12 * t12, t3 = t2 * t12;
    return ((1 - 3 * t12 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t12 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
  }
  function basis_default(values) {
    var n = values.length - 1;
    return function(t) {
      var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  // node_modules/d3-interpolate/src/basisClosed.js
  function basisClosed_default(values) {
    var n = values.length;
    return function(t) {
      var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  // node_modules/d3-interpolate/src/constant.js
  var constant_default = (x2) => () => x2;

  // node_modules/d3-interpolate/src/color.js
  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }
  function exponential(a, b, y2) {
    return a = Math.pow(a, y2), b = Math.pow(b, y2) - a, y2 = 1 / y2, function(t) {
      return Math.pow(a + t * b, y2);
    };
  }
  function gamma(y2) {
    return (y2 = +y2) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y2) : constant_default(isNaN(a) ? b : a);
    };
  }
  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant_default(isNaN(a) ? b : a);
  }

  // node_modules/d3-interpolate/src/rgb.js
  var rgb_default = function rgbGamma(y2) {
    var color2 = gamma(y2);
    function rgb2(start, end) {
      var r = color2((start = rgb(start)).r, (end = rgb(end)).r), g = color2(start.g, end.g), b = color2(start.b, end.b), opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
    rgb2.gamma = rgbGamma;
    return rgb2;
  }(1);
  function rgbSpline(spline) {
    return function(colors) {
      var n = colors.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color2;
      for (i = 0; i < n; ++i) {
        color2 = rgb(colors[i]);
        r[i] = color2.r || 0;
        g[i] = color2.g || 0;
        b[i] = color2.b || 0;
      }
      r = spline(r);
      g = spline(g);
      b = spline(b);
      color2.opacity = 1;
      return function(t) {
        color2.r = r(t);
        color2.g = g(t);
        color2.b = b(t);
        return color2 + "";
      };
    };
  }
  var rgbBasis = rgbSpline(basis_default);
  var rgbBasisClosed = rgbSpline(basisClosed_default);

  // node_modules/d3-interpolate/src/numberArray.js
  function numberArray_default(a, b) {
    if (!b) b = [];
    var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
    return function(t) {
      for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
      return c;
    };
  }
  function isNumberArray(x2) {
    return ArrayBuffer.isView(x2) && !(x2 instanceof DataView);
  }

  // node_modules/d3-interpolate/src/array.js
  function genericArray(a, b) {
    var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x2 = new Array(na), c = new Array(nb), i;
    for (i = 0; i < na; ++i) x2[i] = value_default(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x2[i](t);
      return c;
    };
  }

  // node_modules/d3-interpolate/src/date.js
  function date_default(a, b) {
    var d = /* @__PURE__ */ new Date();
    return a = +a, b = +b, function(t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  // node_modules/d3-interpolate/src/number.js
  function number_default(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  // node_modules/d3-interpolate/src/object.js
  function object_default(a, b) {
    var i = {}, c = {}, k;
    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};
    for (k in b) {
      if (k in a) {
        i[k] = value_default(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  // node_modules/d3-interpolate/src/string.js
  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  var reB = new RegExp(reA.source, "g");
  function zero2(b) {
    return function() {
      return b;
    };
  }
  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }
  function string_default(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs;
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm;
        else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({ i, x: number_default(am, bm) });
      }
      bi = reB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? one(q[0].x) : zero2(b) : (b = q.length, function(t) {
      for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
      return s.join("");
    });
  }

  // node_modules/d3-interpolate/src/value.js
  function value_default(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant_default(b) : (t === "number" ? number_default : t === "string" ? (c = color(b)) ? (b = c, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a, b);
  }

  // node_modules/d3-interpolate/src/round.js
  function round_default(a, b) {
    return a = +a, b = +b, function(t) {
      return Math.round(a * (1 - t) + b * t);
    };
  }

  // node_modules/d3-scale/src/constant.js
  function constants(x2) {
    return function() {
      return x2;
    };
  }

  // node_modules/d3-scale/src/number.js
  function number2(x2) {
    return +x2;
  }

  // node_modules/d3-scale/src/continuous.js
  var unit = [0, 1];
  function identity2(x2) {
    return x2;
  }
  function normalize(a, b) {
    return (b -= a = +a) ? function(x2) {
      return (x2 - a) / b;
    } : constants(isNaN(b) ? NaN : 0.5);
  }
  function clamper(a, b) {
    var t;
    if (a > b) t = a, a = b, b = t;
    return function(x2) {
      return Math.max(a, Math.min(b, x2));
    };
  }
  function bimap(domain, range2, interpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range2[0], r1 = range2[1];
    if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
    else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
    return function(x2) {
      return r0(d0(x2));
    };
  }
  function polymap(domain, range2, interpolate) {
    var j = Math.min(domain.length, range2.length) - 1, d = new Array(j), r = new Array(j), i = -1;
    if (domain[j] < domain[0]) {
      domain = domain.slice().reverse();
      range2 = range2.slice().reverse();
    }
    while (++i < j) {
      d[i] = normalize(domain[i], domain[i + 1]);
      r[i] = interpolate(range2[i], range2[i + 1]);
    }
    return function(x2) {
      var i2 = bisect_default(domain, x2, 1, j) - 1;
      return r[i2](d[i2](x2));
    };
  }
  function copy(source, target) {
    return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
  }
  function transformer2() {
    var domain = unit, range2 = unit, interpolate = value_default, transform, untransform, unknown, clamp = identity2, piecewise, output, input;
    function rescale() {
      var n = Math.min(domain.length, range2.length);
      if (clamp !== identity2) clamp = clamper(domain[0], domain[n - 1]);
      piecewise = n > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }
    function scale(x2) {
      return x2 == null || isNaN(x2 = +x2) ? unknown : (output || (output = piecewise(domain.map(transform), range2, interpolate)))(transform(clamp(x2)));
    }
    scale.invert = function(y2) {
      return clamp(untransform((input || (input = piecewise(range2, domain.map(transform), number_default)))(y2)));
    };
    scale.domain = function(_) {
      return arguments.length ? (domain = Array.from(_, number2), rescale()) : domain.slice();
    };
    scale.range = function(_) {
      return arguments.length ? (range2 = Array.from(_), rescale()) : range2.slice();
    };
    scale.rangeRound = function(_) {
      return range2 = Array.from(_), interpolate = round_default, rescale();
    };
    scale.clamp = function(_) {
      return arguments.length ? (clamp = _ ? true : identity2, rescale()) : clamp !== identity2;
    };
    scale.interpolate = function(_) {
      return arguments.length ? (interpolate = _, rescale()) : interpolate;
    };
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    return function(t, u) {
      transform = t, untransform = u;
      return rescale();
    };
  }
  function continuous() {
    return transformer2()(identity2, identity2);
  }

  // node_modules/d3-format/src/formatDecimal.js
  function formatDecimal_default(x2) {
    return Math.abs(x2 = Math.round(x2)) >= 1e21 ? x2.toLocaleString("en").replace(/,/g, "") : x2.toString(10);
  }
  function formatDecimalParts(x2, p) {
    if (!isFinite(x2) || x2 === 0) return null;
    var i = (x2 = p ? x2.toExponential(p - 1) : x2.toExponential()).indexOf("e"), coefficient = x2.slice(0, i);
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x2.slice(i + 1)
    ];
  }

  // node_modules/d3-format/src/exponent.js
  function exponent_default(x2) {
    return x2 = formatDecimalParts(Math.abs(x2)), x2 ? x2[1] : NaN;
  }

  // node_modules/d3-format/src/formatGroup.js
  function formatGroup_default(grouping, thousands) {
    return function(value, width) {
      var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }
      return t.reverse().join(thousands);
    };
  }

  // node_modules/d3-format/src/formatNumerals.js
  function formatNumerals_default(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // node_modules/d3-format/src/formatSpecifier.js
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }
  formatSpecifier.prototype = FormatSpecifier.prototype;
  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
    this.align = specifier.align === void 0 ? ">" : specifier.align + "";
    this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === void 0 ? void 0 : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === void 0 ? "" : specifier.type + "";
  }
  FormatSpecifier.prototype.toString = function() {
    return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
  };

  // node_modules/d3-format/src/formatTrim.js
  function formatTrim_default(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".":
          i0 = i1 = i;
          break;
        case "0":
          if (i0 === 0) i0 = i;
          i1 = i;
          break;
        default:
          if (!+s[i]) break out;
          if (i0 > 0) i0 = 0;
          break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  // node_modules/d3-format/src/formatPrefixAuto.js
  var prefixExponent;
  function formatPrefixAuto_default(x2, p) {
    var d = formatDecimalParts(x2, p);
    if (!d) return prefixExponent = void 0, x2.toPrecision(p);
    var coefficient = d[0], exponent = d[1], i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n = coefficient.length;
    return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x2, Math.max(0, p + i - 1))[0];
  }

  // node_modules/d3-format/src/formatRounded.js
  function formatRounded_default(x2, p) {
    var d = formatDecimalParts(x2, p);
    if (!d) return x2 + "";
    var coefficient = d[0], exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  // node_modules/d3-format/src/formatTypes.js
  var formatTypes_default = {
    "%": (x2, p) => (x2 * 100).toFixed(p),
    "b": (x2) => Math.round(x2).toString(2),
    "c": (x2) => x2 + "",
    "d": formatDecimal_default,
    "e": (x2, p) => x2.toExponential(p),
    "f": (x2, p) => x2.toFixed(p),
    "g": (x2, p) => x2.toPrecision(p),
    "o": (x2) => Math.round(x2).toString(8),
    "p": (x2, p) => formatRounded_default(x2 * 100, p),
    "r": formatRounded_default,
    "s": formatPrefixAuto_default,
    "X": (x2) => Math.round(x2).toString(16).toUpperCase(),
    "x": (x2) => Math.round(x2).toString(16)
  };

  // node_modules/d3-format/src/identity.js
  function identity_default2(x2) {
    return x2;
  }

  // node_modules/d3-format/src/locale.js
  var map2 = Array.prototype.map;
  var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  function locale_default(locale3) {
    var group2 = locale3.grouping === void 0 || locale3.thousands === void 0 ? identity_default2 : formatGroup_default(map2.call(locale3.grouping, Number), locale3.thousands + ""), currencyPrefix = locale3.currency === void 0 ? "" : locale3.currency[0] + "", currencySuffix = locale3.currency === void 0 ? "" : locale3.currency[1] + "", decimal = locale3.decimal === void 0 ? "." : locale3.decimal + "", numerals = locale3.numerals === void 0 ? identity_default2 : formatNumerals_default(map2.call(locale3.numerals, String)), percent = locale3.percent === void 0 ? "%" : locale3.percent + "", minus = locale3.minus === void 0 ? "\u2212" : locale3.minus + "", nan = locale3.nan === void 0 ? "NaN" : locale3.nan + "";
    function newFormat(specifier, options) {
      specifier = formatSpecifier(specifier);
      var fill = specifier.fill, align = specifier.align, sign2 = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
      if (type === "n") comma = true, type = "g";
      else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
      if (zero3 || fill === "0" && align === "=") zero3 = true, fill = "0", align = "=";
      var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : ""), suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
      var formatType = formatTypes_default[type], maybeSuffix = /[defgprs%]/.test(type);
      precision = precision === void 0 ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
      function format2(value) {
        var valuePrefix = prefix, valueSuffix = suffix, i, n, c;
        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;
          var valueNegative = value < 0 || 1 / value < 0;
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
          if (trim) value = formatTrim_default(value);
          if (valueNegative && +value === 0 && sign2 !== "+") valueNegative = false;
          valuePrefix = (valueNegative ? sign2 === "(" ? sign2 : minus : sign2 === "-" || sign2 === "(" ? "" : sign2) + valuePrefix;
          valueSuffix = (type === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign2 === "(" ? ")" : "");
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }
        if (comma && !zero3) value = group2(value, Infinity);
        var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
        if (comma && zero3) value = group2(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
        switch (align) {
          case "<":
            value = valuePrefix + value + valueSuffix + padding;
            break;
          case "=":
            value = valuePrefix + padding + value + valueSuffix;
            break;
          case "^":
            value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
            break;
          default:
            value = padding + valuePrefix + value + valueSuffix;
            break;
        }
        return numerals(value);
      }
      format2.toString = function() {
        return specifier + "";
      };
      return format2;
    }
    function formatPrefix2(specifier, value) {
      var e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
      return function(value2) {
        return f(k * value2);
      };
    }
    return {
      format: newFormat,
      formatPrefix: formatPrefix2
    };
  }

  // node_modules/d3-format/src/defaultLocale.js
  var locale;
  var format;
  var formatPrefix;
  defaultLocale({
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });
  function defaultLocale(definition) {
    locale = locale_default(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  // node_modules/d3-format/src/precisionFixed.js
  function precisionFixed_default(step) {
    return Math.max(0, -exponent_default(Math.abs(step)));
  }

  // node_modules/d3-format/src/precisionPrefix.js
  function precisionPrefix_default(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
  }

  // node_modules/d3-format/src/precisionRound.js
  function precisionRound_default(step, max2) {
    step = Math.abs(step), max2 = Math.abs(max2) - step;
    return Math.max(0, exponent_default(max2) - exponent_default(step)) + 1;
  }

  // node_modules/d3-scale/src/tickFormat.js
  function tickFormat(start, stop, count2, specifier) {
    var step = tickStep(start, stop, count2), precision;
    specifier = formatSpecifier(specifier == null ? ",f" : specifier);
    switch (specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value))) specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
    }
    return format(specifier);
  }

  // node_modules/d3-scale/src/linear.js
  function linearish(scale) {
    var domain = scale.domain;
    scale.ticks = function(count2) {
      var d = domain();
      return ticks(d[0], d[d.length - 1], count2 == null ? 10 : count2);
    };
    scale.tickFormat = function(count2, specifier) {
      var d = domain();
      return tickFormat(d[0], d[d.length - 1], count2 == null ? 10 : count2, specifier);
    };
    scale.nice = function(count2) {
      if (count2 == null) count2 = 10;
      var d = domain();
      var i0 = 0;
      var i1 = d.length - 1;
      var start = d[i0];
      var stop = d[i1];
      var prestep;
      var step;
      var maxIter = 10;
      if (stop < start) {
        step = start, start = stop, stop = step;
        step = i0, i0 = i1, i1 = step;
      }
      while (maxIter-- > 0) {
        step = tickIncrement(start, stop, count2);
        if (step === prestep) {
          d[i0] = start;
          d[i1] = stop;
          return domain(d);
        } else if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
        } else {
          break;
        }
        prestep = step;
      }
      return scale;
    };
    return scale;
  }
  function linear2() {
    var scale = continuous();
    scale.copy = function() {
      return copy(scale, linear2());
    };
    initRange.apply(scale, arguments);
    return linearish(scale);
  }

  // node_modules/d3-scale/src/quantile.js
  function quantile2() {
    var domain = [], range2 = [], thresholds = [], unknown;
    function rescale() {
      var i = 0, n = Math.max(1, range2.length);
      thresholds = new Array(n - 1);
      while (++i < n) thresholds[i - 1] = quantileSorted(domain, i / n);
      return scale;
    }
    function scale(x2) {
      return x2 == null || isNaN(x2 = +x2) ? unknown : range2[bisect_default(thresholds, x2)];
    }
    scale.invertExtent = function(y2) {
      var i = range2.indexOf(y2);
      return i < 0 ? [NaN, NaN] : [
        i > 0 ? thresholds[i - 1] : domain[0],
        i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
      ];
    };
    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [];
      for (let d of _) if (d != null && !isNaN(d = +d)) domain.push(d);
      domain.sort(ascending);
      return rescale();
    };
    scale.range = function(_) {
      return arguments.length ? (range2 = Array.from(_), rescale()) : range2.slice();
    };
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    scale.quantiles = function() {
      return thresholds.slice();
    };
    scale.copy = function() {
      return quantile2().domain(domain).range(range2).unknown(unknown);
    };
    return initRange.apply(scale, arguments);
  }

  // node_modules/d3-scale/src/threshold.js
  function threshold() {
    var domain = [0.5], range2 = [0, 1], unknown, n = 1;
    function scale(x2) {
      return x2 != null && x2 <= x2 ? range2[bisect_default(domain, x2, 0, n)] : unknown;
    }
    scale.domain = function(_) {
      return arguments.length ? (domain = Array.from(_), n = Math.min(domain.length, range2.length - 1), scale) : domain.slice();
    };
    scale.range = function(_) {
      return arguments.length ? (range2 = Array.from(_), n = Math.min(domain.length, range2.length - 1), scale) : range2.slice();
    };
    scale.invertExtent = function(y2) {
      var i = range2.indexOf(y2);
      return [domain[i - 1], domain[i]];
    };
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    scale.copy = function() {
      return threshold().domain(domain).range(range2).unknown(unknown);
    };
    return initRange.apply(scale, arguments);
  }

  // node_modules/d3-time/src/interval.js
  var t0 = /* @__PURE__ */ new Date();
  var t1 = /* @__PURE__ */ new Date();
  function timeInterval(floori, offseti, count2, field) {
    function interval(date) {
      return floori(date = arguments.length === 0 ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(+date)), date;
    }
    interval.floor = (date) => {
      return floori(date = /* @__PURE__ */ new Date(+date)), date;
    };
    interval.ceil = (date) => {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };
    interval.round = (date) => {
      const d0 = interval(date), d1 = interval.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };
    interval.offset = (date, step) => {
      return offseti(date = /* @__PURE__ */ new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };
    interval.range = (start, stop, step) => {
      const range2 = [];
      start = interval.ceil(start);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range2;
      let previous;
      do
        range2.push(previous = /* @__PURE__ */ new Date(+start)), offseti(start, step), floori(start);
      while (previous < start && start < stop);
      return range2;
    };
    interval.filter = (test) => {
      return timeInterval((date) => {
        if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
      }, (date, step) => {
        if (date >= date) {
          if (step < 0) while (++step <= 0) {
            while (offseti(date, -1), !test(date)) {
            }
          }
          else while (--step >= 0) {
            while (offseti(date, 1), !test(date)) {
            }
          }
        }
      });
    };
    if (count2) {
      interval.count = (start, end) => {
        t0.setTime(+start), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count2(t0, t1));
      };
      interval.every = (step) => {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? (d) => field(d) % step === 0 : (d) => interval.count(0, d) % step === 0);
      };
    }
    return interval;
  }

  // node_modules/d3-time/src/duration.js
  var durationSecond = 1e3;
  var durationMinute = durationSecond * 60;
  var durationHour = durationMinute * 60;
  var durationDay = durationHour * 24;
  var durationWeek = durationDay * 7;
  var durationMonth = durationDay * 30;
  var durationYear = durationDay * 365;

  // node_modules/d3-time/src/day.js
  var timeDay = timeInterval(
    (date) => date.setHours(0, 0, 0, 0),
    (date, step) => date.setDate(date.getDate() + step),
    (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
    (date) => date.getDate() - 1
  );
  var timeDays = timeDay.range;
  var utcDay = timeInterval((date) => {
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  }, (start, end) => {
    return (end - start) / durationDay;
  }, (date) => {
    return date.getUTCDate() - 1;
  });
  var utcDays = utcDay.range;
  var unixDay = timeInterval((date) => {
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  }, (start, end) => {
    return (end - start) / durationDay;
  }, (date) => {
    return Math.floor(date / durationDay);
  });
  var unixDays = unixDay.range;

  // node_modules/d3-time/src/week.js
  function timeWeekday(i) {
    return timeInterval((date) => {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setDate(date.getDate() + step * 7);
    }, (start, end) => {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
    });
  }
  var timeSunday = timeWeekday(0);
  var timeMonday = timeWeekday(1);
  var timeTuesday = timeWeekday(2);
  var timeWednesday = timeWeekday(3);
  var timeThursday = timeWeekday(4);
  var timeFriday = timeWeekday(5);
  var timeSaturday = timeWeekday(6);
  var timeSundays = timeSunday.range;
  var timeMondays = timeMonday.range;
  var timeTuesdays = timeTuesday.range;
  var timeWednesdays = timeWednesday.range;
  var timeThursdays = timeThursday.range;
  var timeFridays = timeFriday.range;
  var timeSaturdays = timeSaturday.range;
  function utcWeekday(i) {
    return timeInterval((date) => {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, (start, end) => {
      return (end - start) / durationWeek;
    });
  }
  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);
  var utcSundays = utcSunday.range;
  var utcMondays = utcMonday.range;
  var utcTuesdays = utcTuesday.range;
  var utcWednesdays = utcWednesday.range;
  var utcThursdays = utcThursday.range;
  var utcFridays = utcFriday.range;
  var utcSaturdays = utcSaturday.range;

  // node_modules/d3-time/src/year.js
  var timeYear = timeInterval((date) => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setFullYear(date.getFullYear() + step);
  }, (start, end) => {
    return end.getFullYear() - start.getFullYear();
  }, (date) => {
    return date.getFullYear();
  });
  timeYear.every = (k) => {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval((date) => {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };
  var timeYears = timeYear.range;
  var utcYear = timeInterval((date) => {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, (start, end) => {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, (date) => {
    return date.getUTCFullYear();
  });
  utcYear.every = (k) => {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval((date) => {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };
  var utcYears = utcYear.range;

  // node_modules/d3-time-format/src/locale.js
  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }
  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }
  function newDate(y2, m, d) {
    return { y: y2, m, d, H: 0, M: 0, S: 0, L: 0 };
  }
  function formatLocale(locale3) {
    var locale_dateTime = locale3.dateTime, locale_date = locale3.date, locale_time = locale3.time, locale_periods = locale3.periods, locale_weekdays = locale3.days, locale_shortWeekdays = locale3.shortDays, locale_months = locale3.months, locale_shortMonths = locale3.shortMonths;
    var periodRe = formatRe(locale_periods), periodLookup = formatLookup(locale_periods), weekdayRe = formatRe(locale_weekdays), weekdayLookup = formatLookup(locale_weekdays), shortWeekdayRe = formatRe(locale_shortWeekdays), shortWeekdayLookup = formatLookup(locale_shortWeekdays), monthRe = formatRe(locale_months), monthLookup = formatLookup(locale_months), shortMonthRe = formatRe(locale_shortMonths), shortMonthLookup = formatLookup(locale_shortMonths);
    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "f": formatMicroseconds,
      "g": formatYearISO,
      "G": formatFullYearISO,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "q": formatQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatSeconds,
      "u": formatWeekdayNumberMonday,
      "U": formatWeekNumberSunday,
      "V": formatWeekNumberISO,
      "w": formatWeekdayNumberSunday,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear2,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };
    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "f": formatUTCMicroseconds,
      "g": formatUTCYearISO,
      "G": formatUTCFullYearISO,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "q": formatUTCQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatUTCSeconds,
      "u": formatUTCWeekdayNumberMonday,
      "U": formatUTCWeekNumberSunday,
      "V": formatUTCWeekNumberISO,
      "w": formatUTCWeekdayNumberSunday,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };
    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "f": parseMicroseconds,
      "g": parseYear,
      "G": parseFullYear,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "q": parseQuarter,
      "Q": parseUnixTimestamp,
      "s": parseUnixTimestampSeconds,
      "S": parseSeconds,
      "u": parseWeekdayNumberMonday,
      "U": parseWeekNumberSunday,
      "V": parseWeekNumberISO,
      "w": parseWeekdayNumberSunday,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);
    function newFormat(specifier, formats2) {
      return function(date) {
        var string = [], i = -1, j = 0, n = specifier.length, c, pad3, format2;
        if (!(date instanceof Date)) date = /* @__PURE__ */ new Date(+date);
        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad3 = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
            else pad3 = c === "e" ? " " : "0";
            if (format2 = formats2[c]) c = format2(date, pad3);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(specifier.slice(j, i));
        return string.join("");
      };
    }
    function newParse(specifier, Z) {
      return function(string) {
        var d = newDate(1900, void 0, 1), i = parseSpecifier(d, specifier, string += "", 0), week, day;
        if (i != string.length) return null;
        if ("Q" in d) return new Date(d.Q);
        if ("s" in d) return new Date(d.s * 1e3 + ("L" in d ? d.L : 0));
        if (Z && !("Z" in d)) d.Z = 0;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        if (d.m === void 0) d.m = "q" in d ? d.q : 0;
        if ("V" in d) {
          if (d.V < 1 || d.V > 53) return null;
          if (!("w" in d)) d.w = 1;
          if ("Z" in d) {
            week = utcDate(newDate(d.y, 0, 1)), day = week.getUTCDay();
            week = day > 4 || day === 0 ? utcMonday.ceil(week) : utcMonday(week);
            week = utcDay.offset(week, (d.V - 1) * 7);
            d.y = week.getUTCFullYear();
            d.m = week.getUTCMonth();
            d.d = week.getUTCDate() + (d.w + 6) % 7;
          } else {
            week = localDate(newDate(d.y, 0, 1)), day = week.getDay();
            week = day > 4 || day === 0 ? timeMonday.ceil(week) : timeMonday(week);
            week = timeDay.offset(week, (d.V - 1) * 7);
            d.y = week.getFullYear();
            d.m = week.getMonth();
            d.d = week.getDate() + (d.w + 6) % 7;
          }
        } else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
          day = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
          d.m = 0;
          d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
        }
        if ("Z" in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }
        return localDate(d);
      };
    }
    function parseSpecifier(d, specifier, string, j) {
      var i = 0, n = specifier.length, m = string.length, c, parse;
      while (i < n) {
        if (j >= m) return -1;
        c = specifier.charCodeAt(i++);
        if (c === 37) {
          c = specifier.charAt(i++);
          parse = parses[c in pads ? specifier.charAt(i++) : c];
          if (!parse || (j = parse(d, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }
    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }
    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }
    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }
    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }
    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }
    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }
    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }
    function formatQuarter(d) {
      return 1 + ~~(d.getMonth() / 3);
    }
    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }
    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }
    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }
    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }
    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }
    function formatUTCQuarter(d) {
      return 1 + ~~(d.getUTCMonth() / 3);
    }
    return {
      format: function(specifier) {
        var f = newFormat(specifier += "", formats);
        f.toString = function() {
          return specifier;
        };
        return f;
      },
      parse: function(specifier) {
        var p = newParse(specifier += "", false);
        p.toString = function() {
          return specifier;
        };
        return p;
      },
      utcFormat: function(specifier) {
        var f = newFormat(specifier += "", utcFormats);
        f.toString = function() {
          return specifier;
        };
        return f;
      },
      utcParse: function(specifier) {
        var p = newParse(specifier += "", true);
        p.toString = function() {
          return specifier;
        };
        return p;
      }
    };
  }
  var pads = { "-": "", "_": " ", "0": "0" };
  var numberRe = /^\s*\d+/;
  var percentRe = /^%/;
  var requoteRe = /[\\^$*+?|[\]().{}]/g;
  function pad2(value, fill, width) {
    var sign2 = value < 0 ? "-" : "", string = (sign2 ? -value : value) + "", length = string.length;
    return sign2 + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function requote(s) {
    return s.replace(requoteRe, "\\$&");
  }
  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }
  function formatLookup(names) {
    return new Map(names.map((name, i) => [name.toLowerCase(), i]));
  }
  function parseWeekdayNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }
  function parseWeekdayNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.u = +n[0], i + n[0].length) : -1;
  }
  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }
  function parseWeekNumberISO(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.V = +n[0], i + n[0].length) : -1;
  }
  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }
  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }
  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2e3), i + n[0].length) : -1;
  }
  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
  }
  function parseQuarter(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
  }
  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }
  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }
  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }
  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }
  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }
  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }
  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }
  function parseMicroseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 6));
    return n ? (d.L = Math.floor(n[0] / 1e3), i + n[0].length) : -1;
  }
  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function parseUnixTimestamp(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.Q = +n[0], i + n[0].length) : -1;
  }
  function parseUnixTimestampSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.s = +n[0], i + n[0].length) : -1;
  }
  function formatDayOfMonth(d, p) {
    return pad2(d.getDate(), p, 2);
  }
  function formatHour24(d, p) {
    return pad2(d.getHours(), p, 2);
  }
  function formatHour12(d, p) {
    return pad2(d.getHours() % 12 || 12, p, 2);
  }
  function formatDayOfYear(d, p) {
    return pad2(1 + timeDay.count(timeYear(d), d), p, 3);
  }
  function formatMilliseconds(d, p) {
    return pad2(d.getMilliseconds(), p, 3);
  }
  function formatMicroseconds(d, p) {
    return formatMilliseconds(d, p) + "000";
  }
  function formatMonthNumber(d, p) {
    return pad2(d.getMonth() + 1, p, 2);
  }
  function formatMinutes(d, p) {
    return pad2(d.getMinutes(), p, 2);
  }
  function formatSeconds(d, p) {
    return pad2(d.getSeconds(), p, 2);
  }
  function formatWeekdayNumberMonday(d) {
    var day = d.getDay();
    return day === 0 ? 7 : day;
  }
  function formatWeekNumberSunday(d, p) {
    return pad2(timeSunday.count(timeYear(d) - 1, d), p, 2);
  }
  function dISO(d) {
    var day = d.getDay();
    return day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
  }
  function formatWeekNumberISO(d, p) {
    d = dISO(d);
    return pad2(timeThursday.count(timeYear(d), d) + (timeYear(d).getDay() === 4), p, 2);
  }
  function formatWeekdayNumberSunday(d) {
    return d.getDay();
  }
  function formatWeekNumberMonday(d, p) {
    return pad2(timeMonday.count(timeYear(d) - 1, d), p, 2);
  }
  function formatYear2(d, p) {
    return pad2(d.getFullYear() % 100, p, 2);
  }
  function formatYearISO(d, p) {
    d = dISO(d);
    return pad2(d.getFullYear() % 100, p, 2);
  }
  function formatFullYear(d, p) {
    return pad2(d.getFullYear() % 1e4, p, 4);
  }
  function formatFullYearISO(d, p) {
    var day = d.getDay();
    d = day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
    return pad2(d.getFullYear() % 1e4, p, 4);
  }
  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? "-" : (z *= -1, "+")) + pad2(z / 60 | 0, "0", 2) + pad2(z % 60, "0", 2);
  }
  function formatUTCDayOfMonth(d, p) {
    return pad2(d.getUTCDate(), p, 2);
  }
  function formatUTCHour24(d, p) {
    return pad2(d.getUTCHours(), p, 2);
  }
  function formatUTCHour12(d, p) {
    return pad2(d.getUTCHours() % 12 || 12, p, 2);
  }
  function formatUTCDayOfYear(d, p) {
    return pad2(1 + utcDay.count(utcYear(d), d), p, 3);
  }
  function formatUTCMilliseconds(d, p) {
    return pad2(d.getUTCMilliseconds(), p, 3);
  }
  function formatUTCMicroseconds(d, p) {
    return formatUTCMilliseconds(d, p) + "000";
  }
  function formatUTCMonthNumber(d, p) {
    return pad2(d.getUTCMonth() + 1, p, 2);
  }
  function formatUTCMinutes(d, p) {
    return pad2(d.getUTCMinutes(), p, 2);
  }
  function formatUTCSeconds(d, p) {
    return pad2(d.getUTCSeconds(), p, 2);
  }
  function formatUTCWeekdayNumberMonday(d) {
    var dow = d.getUTCDay();
    return dow === 0 ? 7 : dow;
  }
  function formatUTCWeekNumberSunday(d, p) {
    return pad2(utcSunday.count(utcYear(d) - 1, d), p, 2);
  }
  function UTCdISO(d) {
    var day = d.getUTCDay();
    return day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
  }
  function formatUTCWeekNumberISO(d, p) {
    d = UTCdISO(d);
    return pad2(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
  }
  function formatUTCWeekdayNumberSunday(d) {
    return d.getUTCDay();
  }
  function formatUTCWeekNumberMonday(d, p) {
    return pad2(utcMonday.count(utcYear(d) - 1, d), p, 2);
  }
  function formatUTCYear(d, p) {
    return pad2(d.getUTCFullYear() % 100, p, 2);
  }
  function formatUTCYearISO(d, p) {
    d = UTCdISO(d);
    return pad2(d.getUTCFullYear() % 100, p, 2);
  }
  function formatUTCFullYear(d, p) {
    return pad2(d.getUTCFullYear() % 1e4, p, 4);
  }
  function formatUTCFullYearISO(d, p) {
    var day = d.getUTCDay();
    d = day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
    return pad2(d.getUTCFullYear() % 1e4, p, 4);
  }
  function formatUTCZone() {
    return "+0000";
  }
  function formatLiteralPercent() {
    return "%";
  }
  function formatUnixTimestamp(d) {
    return +d;
  }
  function formatUnixTimestampSeconds(d) {
    return Math.floor(+d / 1e3);
  }

  // node_modules/d3-time-format/src/defaultLocale.js
  var locale2;
  var timeFormat;
  var timeParse;
  var utcFormat;
  var utcParse;
  defaultLocale2({
    dateTime: "%x, %X",
    date: "%-m/%-d/%Y",
    time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });
  function defaultLocale2(definition) {
    locale2 = formatLocale(definition);
    timeFormat = locale2.format;
    timeParse = locale2.parse;
    utcFormat = locale2.utcFormat;
    utcParse = locale2.utcParse;
    return locale2;
  }

  // node_modules/d3-scale-chromatic/src/colors.js
  function colors_default(specifier) {
    var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
    while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
    return colors;
  }

  // node_modules/d3-scale-chromatic/src/ramp.js
  var ramp_default = (scheme2) => rgbBasis(scheme2[scheme2.length - 1]);

  // node_modules/d3-scale-chromatic/src/sequential-multi/YlGn.js
  var scheme = new Array(3).concat(
    "f7fcb9addd8e31a354",
    "ffffccc2e69978c679238443",
    "ffffccc2e69978c67931a354006837",
    "ffffccd9f0a3addd8e78c67931a354006837",
    "ffffccd9f0a3addd8e78c67941ab5d238443005a32",
    "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32",
    "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529"
  ).map(colors_default);
  var YlGn_default = ramp_default(scheme);

  // src/vendor/scale-cluster.js
  function numericSort(array2) {
    return array2.slice().sort(function(a, b) {
      return a - b;
    });
  }
  function uniqueCountSorted(input) {
    var uniqueValueCount = 0;
    var lastSeenValue;
    for (var i = 0; i < input.length; i++) {
      if (i === 0 || input[i] !== lastSeenValue) {
        lastSeenValue = input[i];
        uniqueValueCount++;
      }
    }
    return uniqueValueCount;
  }
  function makeMatrix(columns, rows) {
    var matrix = [];
    for (var i = 0; i < columns; i++) {
      var column = [];
      for (var j = 0; j < rows; j++) {
        column.push(0);
      }
      matrix.push(column);
    }
    return matrix;
  }
  function ssq(j, i, sumX, sumXsq) {
    var sji;
    if (j > 0) {
      var muji = (sumX[i] - sumX[j - 1]) / (i - j + 1);
      sji = sumXsq[i] - sumXsq[j - 1] - (i - j + 1) * muji * muji;
    } else {
      sji = sumXsq[i] - sumX[i] * sumX[i] / (i + 1);
    }
    return sji < 0 ? 0 : sji;
  }
  function fillMatrixColumn(imin, imax, column, matrix, backtrackMatrix, sumX, sumXsq) {
    if (imin > imax) {
      return;
    }
    var i = Math.floor((imin + imax) / 2);
    matrix[column][i] = matrix[column - 1][i - 1];
    backtrackMatrix[column][i] = i;
    var jlow = column;
    if (imin > column) {
      jlow = Math.max(jlow, backtrackMatrix[column][imin - 1] || 0);
    }
    jlow = Math.max(jlow, backtrackMatrix[column - 1][i] || 0);
    var jhigh = i - 1;
    if (imax < matrix.length - 1) {
      jhigh = Math.min(jhigh, backtrackMatrix[column][imax + 1] || 0);
    }
    var sji;
    var sjlowi;
    var ssqjlow;
    var ssqj;
    for (var j = jhigh; j >= jlow; --j) {
      sji = ssq(j, i, sumX, sumXsq);
      if (sji + matrix[column - 1][jlow - 1] >= matrix[column][i]) {
        break;
      }
      sjlowi = ssq(jlow, i, sumX, sumXsq);
      ssqjlow = sjlowi + matrix[column - 1][jlow - 1];
      if (ssqjlow < matrix[column][i]) {
        matrix[column][i] = ssqjlow;
        backtrackMatrix[column][i] = jlow;
      }
      jlow++;
      ssqj = sji + matrix[column - 1][j - 1];
      if (ssqj < matrix[column][i]) {
        matrix[column][i] = ssqj;
        backtrackMatrix[column][i] = j;
      }
    }
    fillMatrixColumn(imin, i - 1, column, matrix, backtrackMatrix, sumX, sumXsq);
    fillMatrixColumn(i + 1, imax, column, matrix, backtrackMatrix, sumX, sumXsq);
  }
  function fillMatrices(data, matrix, backtrackMatrix) {
    var nValues = matrix[0].length;
    var sumX = new Array(nValues);
    var sumXsq = new Array(nValues);
    var shift = data[Math.floor(nValues / 2)];
    for (var i = 0; i < nValues; ++i) {
      if (i === 0) {
        sumX[0] = data[0] - shift;
        sumXsq[0] = (data[0] - shift) * (data[0] - shift);
      } else {
        sumX[i] = sumX[i - 1] + data[i] - shift;
        sumXsq[i] = sumXsq[i - 1] + (data[i] - shift) * (data[i] - shift);
      }
      matrix[0][i] = ssq(0, i, sumX, sumXsq);
      backtrackMatrix[0][i] = 0;
    }
    var imin;
    for (var k = 1; k < matrix.length; ++k) {
      if (k < matrix.length - 1) {
        imin = k;
      } else {
        imin = nValues - 1;
      }
      fillMatrixColumn(imin, nValues - 1, k, matrix, backtrackMatrix, sumX, sumXsq);
    }
  }
  function ckmeans(data, nClusters) {
    if (nClusters > data.length) {
      throw new Error("Cannot generate more classes than there are data values");
    }
    var nValues = data.length;
    var sorted = numericSort(data);
    var uniqueCount = uniqueCountSorted(sorted);
    if (uniqueCount === 1) {
      return [sorted];
    }
    nClusters = Math.min(uniqueCount, nClusters);
    var matrix = makeMatrix(nClusters, nValues);
    var backtrackMatrix = makeMatrix(nClusters, nValues);
    fillMatrices(sorted, matrix, backtrackMatrix);
    var clusters = [];
    var clusterRight = backtrackMatrix[0].length - 1;
    for (var cluster = backtrackMatrix.length - 1; cluster >= 0; cluster--) {
      var clusterLeft = backtrackMatrix[cluster][clusterRight];
      clusters[cluster] = sorted.slice(clusterLeft, clusterRight + 1);
      if (cluster > 0) {
        clusterRight = clusterLeft - 1;
      }
    }
    return clusters;
  }
  function scaleCluster() {
    var clusters = [];
    var domain = [];
    var range2 = [];
    var breakpoints = [];
    var scale = function(x2) {
      if (clusters.length === 0) return void 0;
      for (var i = breakpoints.length - 1; i >= 0; i--) {
        if (x2 >= breakpoints[i]) {
          return range2[i];
        }
      }
      return range2[0];
    };
    function rescale() {
      if (range2.length <= 2) {
        return;
      }
      clusters = ckmeans(domain, Math.min(domain.length, range2.length));
      breakpoints = [];
      for (var i = 0; i < clusters.length; i++) {
        breakpoints.push(clusters[i][0]);
      }
    }
    scale.domain = function() {
      if (arguments.length) {
        domain = arguments[0];
        rescale();
        return scale;
      }
      return domain;
    };
    scale.range = function() {
      if (arguments.length) {
        var newRange = arguments[0];
        var needsUpdate = newRange.length !== range2.length;
        range2 = newRange;
        if (needsUpdate) {
          rescale();
        }
        return scale;
      }
      return range2;
    };
    scale.invertExtent = function(rangeValue) {
      var extentA = NaN;
      var extentB = NaN;
      for (var i = 0; i < range2.length; i++) {
        if (range2[i] === rangeValue) {
          extentA = breakpoints[i];
          extentB = i + 1 < range2.length ? breakpoints[i + 1] : NaN;
          break;
        }
      }
      return [extentA, extentB];
    };
    scale.clusters = function() {
      return breakpoints.slice(1);
    };
    scale.copy = function() {
      return scaleCluster().domain(domain).range(range2);
    };
    return scale;
  }

  // src/charts/scales.js
  var WIDTH = 665;
  var HEIGHT = WIDTH * 0.6;
  var chartMargin = { top: -25, right: 37, bottom: 21, left: 10 };
  var _projection = null;
  function getProjection(ncMap) {
    if (_projection) return _projection;
    const chartWidth = WIDTH - chartMargin.left - chartMargin.right;
    const chartHeight = HEIGHT - chartMargin.top - chartMargin.bottom;
    _projection = albers_default().rotate([0, 62, 0]).fitSize([chartWidth, chartHeight], ncMap);
    return _projection;
  }
  function getPath(ncMap) {
    return path_default(getProjection(ncMap));
  }
  function mapValueMap(state2) {
    return new Map(
      state2.data.filter((d) => d.year == state2.year && d.type == state2.aggregationLevel).map((d) => [d.region, d[state2.variable] === null ? -9 : d[state2.variable]])
    );
  }
  function totalValueMap(state2) {
    return new Map(
      state2.data.filter((d) => d.year == state2.year && d.type == state2.aggregationLevel).map((d) => [d.region, d.total])
    );
  }
  function currentDomainAllTime(state2) {
    return state2.data.filter(
      (d) => d.type == state2.aggregationLevel && d[state2.variable] > 0 && !(d[state2.variable] === null)
    ).map((d) => ({ value: d[state2.variable], year: d.year }));
  }
  function histogramData(state2) {
    const all = currentDomainAllTime(state2);
    const currentDomain = all.filter((d) => d.year == state2.year).map((d) => +d.value);
    const currentExtent = extent(all, (d) => d.value);
    const currHistogram = bin().domain(currentExtent).thresholds(ticks(...currentExtent, 10));
    return currHistogram(currentDomain);
  }
  function buildColorScale(state2) {
    const all = currentDomainAllTime(state2);
    const currDomain = all.filter((d) => d.year == state2.scaleYear).map((d) => +d.value);
    if (state2.aggregationLevel == "county") {
      const hist = histogramData(state2);
      const numberOfColorBins = Math.max(
        Math.min(Math.round(currDomain.length / 12), 6),
        3
      );
      const currRange = scheme[numberOfColorBins + 1].slice(1);
      const currBinWidth = hist[1].x1 - hist[1].x0;
      const clusterScale = scaleCluster().domain(currDomain).range(currRange);
      const clusters = clusterScale.clusters();
      const matchedClusters = clusters.map(function(d, i) {
        let currValue = d;
        if (i == 0) {
          currValue = Math.ceil(currValue / currBinWidth) * currBinWidth;
        } else if (i == clusters.length - 1) {
          currValue = Math.floor(currValue / currBinWidth) * currBinWidth;
        } else {
          currValue = Math.round(currValue / currBinWidth) * currBinWidth;
        }
        return currValue;
      });
      const allClusters = [0, Number.EPSILON, ...matchedClusters].filter(
        (d, i, arr) => d != arr[i - 1]
      );
      const allRange = ["url(#NApattern)", "#e3e3e3", ...currRange];
      return threshold().domain([...new Set(allClusters)]).range(allRange);
    }
    const quantileScale = quantile2().domain(currDomain).range(scheme[4].slice(1));
    return threshold().domain([0, Number.EPSILON, ...quantileScale.quantiles()]).range(["url(#NApattern)", "#e3e3e3", ...quantileScale.range()]);
  }

  // src/text/chart-text.js
  function professionChartTitle(variable, specialtyObject) {
    const { name, profession, specialty } = specialtyObject;
    const variableDescriptions = {
      provider_rate: "per 10,000 Population",
      percent_female: "who were Female",
      percent_age: "who were 65 or Older",
      percent_underrepresented: "who were Underrepresented Minorities",
      percent_race_na: "Missing Race",
      total: null
    };
    const pluralize = (prof) => {
      if (["Physician", "Physician Assistant", "Dentist"].includes(prof)) {
        return prof + "s";
      }
      if (prof.includes("Certified Nurse Midwife")) {
        return prof.replace("wife", "wives");
      }
      return prof + "s";
    };
    let subject;
    if (specialty === profession) {
      subject = pluralize(profession);
    } else if (["Physician", "Physician Assistant"].includes(profession)) {
      subject = `${pluralize(profession)} with a Primary Area of Practice of ${name}`;
    } else if (profession === "Certified Nurse Midwife") {
      subject = pluralize(name);
    } else {
      subject = `${pluralize(profession)} with a Specialty of ${name}`;
    }
    if (variable === "total") {
      return `Total Number of ${subject}`;
    }
    const description = variableDescriptions[variable];
    if (!description) {
      throw new Error(`Unknown variable: ${variable}`);
    }
    if (variable === "percent_race_na") {
      return `Percent of ${subject} who were ${description}`;
    }
    return variable === "provider_rate" ? `${subject} ${description}` : `Percent of ${subject} ${description}`;
  }
  function getLayerText(layers) {
    const checkLayers = function(testValue) {
      return ({ value }) => value == testValue;
    };
    let text = "";
    if (layers.some(checkLayers(0))) {
      text += " Rural/nonmetropolitan counties are defined using the July 2023 Core Based Statistical Areas (CBSAs) delineation file from the US Office of Management and Budget and the US Census Bureau. Rural/nonmetropolitan counties include micropolitan counties and counties without CBSAs. Using this definition, NC has 55 nonmetro counties.";
    }
    if (layers.some(checkLayers(2))) {
      text += " Urbanized areas are contiguous areas defined by the the United States Census Bureau, which have 50,000 or more people. Typically, this will include a dense urban core and areas around that core. This layer uses the 2017 update.";
    }
    return text;
  }
  function getFooterText() {
    var currentDate = timeFormat("%B %d, %Y")(/* @__PURE__ */ new Date());
    var footerText = " Population census data and estimates are downloaded from the North Carolina Office of State Budget and Management via NC LINC and are based on US Census data. <br><strong>Source:</strong> North Carolina Health Professions Data System, <a href='http://www.shepscenter.unc.edu/programs-projects/workforce/'>Program on Health Workforce Research and Policy</a>, Cecil G. Sheps Center for Health Services Research, University of North Carolina at Chapel Hill.  Created " + currentDate + " at " + window.location.href + ".";
    return footerText;
  }
  function getSourceText(currentSpecialty) {
    var currentSpecialtyText = "<strong>Notes: </strong>";
    switch (currentSpecialty) {
      case "Dentist":
        currentSpecialtyText += "Data include active, licensed dentists in practice in North Carolina as of October 31 of each year.  Dentist data are derived from the North Carolina State Board of Dental Examiners. About one-third of dentists do not report a business address to the Board; in these cases, county placement is based on the mailing or home address on file.";
        break;
      case "Physician":
        currentSpecialtyText += "Data include active, licensed physicians in practice in North Carolina as of October 31 of each year who are not residents-in-training and are not employed by the Federal government.  Physician data are derived from the North Carolina Medical Board.  County estimates are based on primary practice location. <span style='font-weight: bold;'>Data from 2020 and 2021 are unavailable because of issues with the data which make longitudinal comparisons misleading</span>.";
        break;
      case "Pharmacist":
        currentSpecialtyText += "Data include active, licensed pharmacists in practice in North Carolina as of October 31 of each year.  Pharmacist data are derived from the North Carolina Board of Pharmacy. Beginning in 2018, only mailing addresses are available for licensees, so these are used to place pharmacists in a county.";
        break;
      case "Dental Hygienist":
        currentSpecialtyText += "Data include active, licensed dental hygienists in practice in North Carolina as of October 31 of each year.  Dental hygienist data are derived from the North Carolina State Board of Dental Examiners.";
        break;
      case "Physician Assistant":
        currentSpecialtyText += "Data include active, licensed physician assistants in practice in North Carolina as of October 31 of each year.  Physician assistant data are derived from the North Carolina Medical Board.  County estimates are based on primary practice location.";
        break;
      case "Registered Nurse":
        currentSpecialtyText += "Data include active, licensed registered nurses in practice in North Carolina as of October 31 of each year.  Registered nurse data are derived from the North Carolina Board of Nursing. In 2018 and 2019, the NC Board of Nursing updated the data they report to the Cecil G. Sheps Center, including more detailed information regarding unemployment and not working in nursing professions.";
        break;
      case "Licensed Practical Nurse":
        currentSpecialtyText += "Data include active, licensed practical nurses in practice in North Carolina as of October 31 of each year.  Licensed practical nurse data are derived from the North Carolina Board of Nursing.";
        break;
      case "Nurse Practitioner":
        currentSpecialtyText += "Data include active, licensed nurse practitioners in practice in North Carolina as of October 31 of each year.  Nurse practitioner data are derived from the North Carolina Board of Nursing.";
        break;
      case "Certified Nurse Midwife":
        currentSpecialtyText += "Data include active, licensed certified nurse midwives in practice in North Carolina as of October 31 of each year.  Certified nurse midwife data are derived from the North Carolina Board of Nursing. Effective in 2023, North Carolina Session Law 2023-14 allows certified nurse midwives with at least 24 months and 4,000 hours of practice experience to practice independently, without physician supervision; those who have not yet met this requirement practice under a collaborative provider agreement. Data for the independent practice type begin in 2023. The apparent decline in the collaborative practice type after 2023 reflects midwives moving into the independent category rather than a decrease in the overall certified nurse midwife workforce.";
        break;
      case "Occupational Therapist":
        currentSpecialtyText += "Data include active, licensed occupational therapists in practice in North Carolina as of October 31 of each year.  Occupational therapist data are derived from the North Carolina Board of Occupational Therapy.";
        break;
      case "Occupational Therapy Assistant":
        currentSpecialtyText += "Data include active, licensed occupational therapy assistants in practice in North Carolina as of October 31 of each year.  Occupational therapy assistant data are derived from the North Carolina Board of Occupational Therapy";
        break;
      case "Optometrist":
        currentSpecialtyText += "Data include active, licensed optometrists in practice in North Carolina as of October 31 of each year.  Optometrist data are derived from the North Carolina Board of Optometry.";
        break;
      case "Podiatrist":
        currentSpecialtyText += "Data include active, licensed podiatrists in practice in North Carolina as of October 31 of each year.  Podiatrist data are derived from the North Carolina Board of Podiatry Examiners.";
        break;
      case "Physical Therapist":
        currentSpecialtyText += "Data include active, licensed physical therapists in practice in North Carolina as of October 31 of each year.  Physical therapist data are derived from the North Carolina Board of Physical Therapy Examiners.";
        break;
      case "Physical Therapist Assistant":
        currentSpecialtyText += "Data include active, licensed physical therapist assistants in practice in North Carolina as of October 31 of each year.  Physical therapist assistant data are derived from the North Carolina Board of Physical Therapy Examiners.";
        break;
      case "Psychologist":
        currentSpecialtyText += "Data include active, licensed psychologists in practice in North Carolina as of October 31 of each year.  Psychologist data are derived from the North Carolina Psychology Board.";
        break;
      case "Psychological Associate":
        currentSpecialtyText += "Data include active, licensed psychological associates in practice in North Carolina as of October 31 of each year.  Psychological associate data are derived from the North Carolina Psychology Board.";
        break;
      case "Respiratory Therapist":
        currentSpecialtyText += "Data include active, licensed respiratory therapists in practice in North Carolina as of October 31 of each year.  Respiratory therapist data are derived from the North Carolina Respiratory Care Board.";
        break;
      case "Chiropractor":
        currentSpecialtyText += "Data include active, licensed chiropractors in practice in North Carolina as of October 31 of each year.  Chiropractor data are derived from the North Carolina State Board of Chiropractic Examiners. For 2015 only, the NC Board of Chiropractic Examiners did not provide an annual file of licensure data to the HPDS. 2015 chiropractor data were imputed from other years. As of 2022, the NC Board of Chiropractic Examiners is no longer collecting data on the race or gender of licensees.";
        break;
    }
    return currentSpecialtyText;
  }
  function getPhysicianGroupText(specialtyObject, physicianGroups) {
    const index2 = physicianGroups.map((d) => d.physicianGroup).indexOf(specialtyObject.specialty);
    let text = "";
    if (index2 > -1) {
      text = physicianGroups[index2].areasOfPractice.join(", ");
      text = `<p class="paop-note">${specialtyObject.profession}s with a primary area of practice of ${specialtyObject.name} include the following: ${text}.`;
      if (specialtyObject.specialty == "Primary Care Classic" || specialtyObject.specialty == "Generalist Physician" || specialtyObject.specialty == "Psychiatry, All Specialties") {
        text += " This category overlaps with other categories, i.e., it is not exclusive of the other categories.";
      }
      text += `</p>`;
    }
    return text;
  }

  // src/util/format.js
  var formatters = {
    rate: format(".3r"),
    percent: format(".1%"),
    total: format(",.0f")
  };
  function formatter(type) {
    let currentType = "percent";
    if (type === "provider_rate") {
      currentType = "rate";
    } else if (type === "total") {
      currentType = "total";
    }
    return function(value) {
      if (value === null || value < 0) return "NA";
      if (currentType === "rate" && value === 0) return "0.00";
      return formatters[currentType](value);
    };
  }

  // src/util/wrap.js
  function wrap(config = {}) {
    let { text, maxCharsPerLine = 65, lineHeight = 1.3 } = config;
    if (typeof config === "string") text = config;
    let words = text.trim().split(/\s+/).reverse(), word, x2 = 0, dy = 0, line = [], allTogether = ``;
    while (word = words.pop()) {
      line.push(word);
      let testLineLength = line.join(" ").length;
      if (testLineLength > maxCharsPerLine) {
        line.pop();
        let tspan2 = `<tspan x=${x2} dy=${dy}em>${line.join(" ")}</tspan>`;
        allTogether = `${allTogether}${tspan2}`;
        line = [word];
        dy = lineHeight;
      }
    }
    let tspan = `<tspan x=${x2} dy=${dy}em>${line.join(" ")}</tspan>`;
    allTogether = `${allTogether}${tspan}`;
    return allTogether;
  }

  // src/charts/legend.js
  var RURAL_SQUARE = "M-3.1622776601683795,-3.1622776601683795h6.324555320336759v6.324555320336759h-6.324555320336759Z";
  function layerSet(state2) {
    return new Set(state2.layers.map((d) => d.value));
  }
  function layersById(state2) {
    return new Map(state2.geo.layers.map((d) => [d.id, d]));
  }
  function renderLayers(state2) {
    const active = layerSet(state2);
    const byId = layersById(state2);
    const ncMap = state2.geo.ncMap;
    const path2 = getPath(ncMap);
    const projection = getProjection(ncMap);
    let out = "";
    if (active.has(1) && byId.get(1)) {
      const paths = byId.get(1).geo.features.map(
        (f) => `<path fill="none" stroke-width="1.5" stroke="#001a0e" opacity="0.2" d="${path2(
          f.geometry
        )}"></path>`
      ).join("");
      out += `<g>${paths}</g>`;
    }
    if (active.has(2) && byId.get(2)) {
      const paths = byId.get(2).geo.features.map(
        (f) => `<path fill="none" stroke-width="1" stroke-opacity="0.5" stroke="#001a0e" d="${path2(
          f.geometry
        )}"></path>`
      ).join("");
      out += `<g>${paths}</g>`;
    }
    if (active.has(0) && byId.get(0)) {
      const marks = byId.get(0).geo.features.map((f) => {
        const p = projection(f.geometry.coordinates);
        if (!p) return "";
        return `<path class="rural-marker" fill="#ffffff" stroke="#001a0e" transform="translate(${p[0]},${p[1]})" d="${RURAL_SQUARE}"></path>`;
      }).join("");
      out += `<g>${marks}</g>`;
    }
    return `<g class="layers" pointer-events="none">${out}</g>`;
  }
  function renderSymbolLegend(state2) {
    const active = (v) => state2.layers.some(({ value }) => value == v);
    const offset = 20;
    const textdy = 5;
    const textdx = 10;
    let rows = "";
    if (active(0)) {
      rows += `<g>
      <path fill="#ffffff" stroke="#001a0e" d="${RURAL_SQUARE}" transform="scale(1.5) translate(-5 0)" />
      <text dy="${textdy}" dx="${textdx}">Rural (Nonmetropolitan)</text>
    </g>`;
    }
    if (active(1)) {
      rows += `<g transform="translate(0 ${offset})">
      <line x2="15" stroke-width="1.5" stroke="#001a0e" opacity="0.6" transform="translate(-15 0)" />
      <text dy="${textdy}" dx="${textdx}">Interstates</text>
    </g>`;
    }
    if (active(2)) {
      rows += `<g transform="translate(0 ${offset * 2})">
      <g transform="translate(-20 -10)"><use href="#urbanized-area-icon" /></g>
      <text dy="${textdy}" dx="${textdx}">Urbanized Areas</text>
    </g>`;
    }
    return `<g class="symbol-legend" transform="translate(25 220)">${rows}</g>`;
  }

  // src/charts/histogram.js
  var HEIGHT2 = 230;
  var MARGIN = { top: 0, right: 15, bottom: 15, left: 100 };
  var BIN_WIDTH = 25;
  function renderHistogram(state2, colorScale, histData, mapData) {
    const variable = state2.variable;
    const isPercent = variable.indexOf("percent") > -1;
    const valueFormatter = formatter(variable);
    const ncRow = getDataByVariableForNorthCarolina(variable).filter(
      (d) => d.year == state2.year
    )[0];
    const values = Array.from(mapData.values());
    const missingRegions = values.filter((v) => v === null || v < 0).length;
    const zeroRegions = values.filter((v) => v == 0).length;
    const currDomain = histData.map((d) => d.x1).slice(0, -1);
    const binW = max(histData, (d) => d.x1 - d.x0);
    const xDomainArr = [
      Math.max(0, currDomain[0] - binW),
      ...currDomain,
      currDomain[currDomain.length - 1] + binW
    ];
    const scaleWidth = histData.length * BIN_WIDTH + MARGIN.left;
    const xScale = linear2().domain(extent(xDomainArr)).range([MARGIN.left, scaleWidth]);
    const lastElement = xDomainArr[xDomainArr.length - 1];
    const xAxisTicks = isPercent && lastElement > 1 ? xDomainArr.slice(0, -1) : xDomainArr;
    const yScale = linear2().domain([
      0,
      Math.max(
        max(histData, (d) => d.length),
        missingRegions,
        zeroRegions
      )
    ]).range([HEIGHT2 - MARGIN.bottom, MARGIN.top]);
    const yAxisTicks = yScale.ticks(5);
    const chartTitle = variableLabels[variable] || "Histogram";
    let stateLabel = "State ";
    stateLabel += variable == "provider_rate" ? "Rate" : variable == "total" ? "Median" : "Percentage";
    const ncText = ncRow ? `${stateLabel}: ${valueFormatter(ncRow.value)}` : "";
    const axisValueFormatter = (v) => {
      if (isPercent) return Math.round(v * 100) + "%";
      if (variable == "provider_rate") return format("")(v);
      return valueFormatter(v);
    };
    const countLabel = state2.aggregationLevel == "county" ? "Counties" : "AHECs";
    const zeroBin = `<g transform="translate(${xScale.range()[0] - BIN_WIDTH * 1.9}, ${yScale(0)})">
    <rect x="0" y="${yScale(zeroRegions) - yScale(0)}" width="${BIN_WIDTH}" height="${yScale(0) - yScale(zeroRegions)}" fill="${colorScale(0)}" data-tip="${zeroRegions} counties"></rect>
    <line x2="${BIN_WIDTH}" x1="0"></line>
    <text dy="30" dx="${BIN_WIDTH / 2}">0</text>
  </g>`;
    const bars = histData.map((item, index2) => {
      const x2 = index2 == 0 ? xScale.range()[0] : xScale(item.x0);
      return `<rect x="${x2}" y="${yScale(item.length)}" width="${BIN_WIDTH}" height="${yScale(0) - yScale(item.length)}" fill="${colorScale(item.x0)}" data-tip="${item.length} counties"></rect>`;
    }).join("");
    const naBin = isPercent ? `<g transform="translate(${xScale.range()[1] + BIN_WIDTH * 0.9}, ${yScale(0)})">
        <rect x="0" y="${yScale(missingRegions) - yScale(0)}" width="${BIN_WIDTH}" height="${yScale(0) - yScale(missingRegions)}" fill="${colorScale(-9)}" data-tip="${missingRegions} counties"></rect>
        <line x2="${BIN_WIDTH}" x1="0"></line>
        <text dy="30" dx="${BIN_WIDTH / 2}">NA</text>
      </g>` : "";
    const xTicks = xAxisTicks.map(
      (item, index2) => `<g transform="translate(${xScale(item)},0)"><line y2="15"></line>${index2 % 2 != 0 ? `<text dy="30">${axisValueFormatter(item)}</text>` : ""}</g>`
    ).join("");
    const yTicks = yAxisTicks.filter((item) => item != 0).map(
      (item) => `<g class="yAxis" transform="translate(0,${yScale(item) - HEIGHT2 + 15})">
          <line x1="${xScale.range()[0] - BIN_WIDTH * 2}" x2="${isPercent ? xScale.range()[1] + BIN_WIDTH * 2 : xScale.range()[1]}"></line>
          <text dx="${xScale.range()[0] - BIN_WIDTH * 2 - 10}" dy="5">${item}</text>
        </g>`
    ).join("");
    const yLabel = `<text class="yLabel" transform="translate(-10,${-HEIGHT2 / 2})">
    <tspan x="0" dy="0em">Number</tspan>
    <tspan x="0" dy="1.3em">of</tspan>
    <tspan x="0" dy="1.3em">${countLabel}</tspan>
  </text>`;
    const ncLine = ncRow ? `<g class="ncLine">
        <line x2="${xScale(ncRow.value)}" x1="${xScale(ncRow.value)}" y1="0" y2="${-(HEIGHT2 - 5)}"></line>
        <text x="${xScale(ncRow.value)}" y="${-HEIGHT2}">${ncText}</text>
      </g>` : "";
    const axis = `<g class="histogramAxis" transform="translate(0,${HEIGHT2 - 15})">
    <line x2="${xScale.range()[1]}" x1="${xScale.range()[0]}"></line>
    ${xTicks}
    ${yTicks}
    ${yLabel}
    ${ncLine}
    <text class="histogramTitle" x="${MARGIN.left + (xScale.range()[1] - xScale.range()[0]) / 2}" dy="55">${chartTitle}</text>
  </g>`;
    return `<g class="histogram-legend" transform="translate(40,325)">${zeroBin}${bars}${naBin}${axis}</g>`;
  }

  // src/charts/rowChart.js
  var WIDTH2 = 400;
  var HEIGHT3 = 230;
  var MARGIN2 = { top: 15, right: 15, bottom: 15, left: 0 };
  function renderRowChart(state2, colorScale, mapData) {
    const variable = state2.variable;
    const isPercent = variable.indexOf("percent") > -1;
    const valueFormatter = formatter(variable);
    const mapDataArray = [...mapData.entries()].sort((a, b) => a[1] - b[1]);
    const ncRow = getDataByVariableForNorthCarolina(variable).filter(
      (d) => d.year == state2.year
    )[0];
    const maxAllTime = max(
      state2.data.filter(
        (d) => d.type == state2.aggregationLevel && d[variable] > 0 && !(d[variable] === null)
      ).map((d) => d[variable])
    );
    const xScale = linear2().domain([0, maxAllTime]).nice().range([MARGIN2.left, WIDTH2 - MARGIN2.right]);
    const xTicks = xScale.ticks();
    const yScale = band().domain(mapDataArray.map((d) => d[0])).range([HEIGHT3 - MARGIN2.bottom, MARGIN2.top]).paddingInner(0.1);
    const unit2 = variableUnitText[variable] || "";
    const hoverText = (v) => `${valueFormatter(v)} ${unit2}`;
    const labelFor = (region) => region == "Wake AHEC" ? "Wake" : state2.aggregationLevel == "medicaid" ? medicaidRegionName.get(region) : state2.aggregationLevel == "ruralroots" ? ruralRootsShort[region] || region : region;
    const axisValueFormatter = (v) => {
      if (isPercent) return Math.round(v * 100) + "%";
      if (variable == "provider_rate") return format("")(v);
      return valueFormatter(v);
    };
    let stateLabel = "State ";
    stateLabel = variable == "provider_rate" ? stateLabel + "Rate" : variable == "total" ? "Median" : stateLabel + "Percentage";
    const ncText = ncRow ? `${stateLabel}: ${valueFormatter(ncRow.value)}` : "";
    const rows = mapDataArray.map(
      ([region, value]) => `<g transform="translate(0,${yScale(region)})">
        <rect width="${Math.max(0, xScale(+value))}" height="${yScale.bandwidth()}" fill="${colorScale(+value)}" data-tip="${hoverText(+value)}"></rect>
        <text class="ahecLabel" dx="-10" dy="${yScale.bandwidth() / 1.5}">${labelFor(region)}</text>
      </g>`
    ).join("");
    const ticks2 = xTicks.map(
      (item, index2) => `<g class="xAxis" transform="translate(${xScale(item)},${HEIGHT3 - 5})">
          <line y1="${-HEIGHT3 + 20}"></line>
          ${index2 % 2 == 0 ? `<text dy="1.1em">${axisValueFormatter(item)}</text>` : ""}
        </g>`
    ).join("");
    const title = `<text class="chartTitle" x="${MARGIN2.left + (xScale.range()[1] - xScale.range()[0]) / 2}" dy="${HEIGHT3 + 40}">${variableLabels[variable] || ""}</text>`;
    const ncLine = ncRow ? `<g class="ncLine">
        <line x2="${xScale(ncRow.value)}" x1="${xScale(ncRow.value)}" y1="5" y2="${HEIGHT3 - 5}"></line>
        <text x="${xScale(ncRow.value)}">${ncText}</text>
      </g>` : "";
    return `<g class="row-chart" transform="translate(215,325)">${rows}${ticks2}${title}${ncLine}</g>`;
  }

  // src/charts/map.js
  var NA_PATTERN_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnPgogIDxyZWN0IHdpZHRoPSc4JyBoZWlnaHQ9JzgnIGZpbGw9JyNmZmYnLz4KICA8cGF0aCBkPSdNMCAwTDggOFpNOCAwTDAgOFonIHN0cm9rZS13aWR0aD0nMC41JyBzdHJva2U9JyNhYWEnLz4KPC9zdmc+Cg==";
  var URBANIZED_ICON_PATH = "M 32.4858 13.3461 32.6012 14.6044 32.231 14.9597 31.6662 14.2905 32.4858 13.3461 Z M 25.194 23.9664 24.4492 25.7949 26.3942 26.5296 25.885 27.0629 24.1627 26.3896 24.057 27.558 22.6914 27.0879 21.468 25.6093 21.4236 24.464 22.0235 23.7959 24.1867 24.0316 25.194 23.9664 Z M 16.3836 2.2567 16.6221 4.4401 16.3684 5.6871 16.3836 2.2567 Z M 15.5642 1.0007 17.1151 1 16.3836 2.2567 15.3193 1.8734 15.5642 1.0007 Z M 11.6997 26.7549 10.0921 27.1235 9.847 28.1095 10.5971 29.4157 11.312 29.7587 12.3483 29.5098 12.9187 30.8309 12.8791 31.6368 11.7283 31.5607 9.0846 30.7318 9.193 29.7807 8.6562 29.5743 8.9665 28.0997 8.8826 26.7774 9.5903 26.1651 9.693 25.3413 11.4291 26.0703 11.6997 26.7549 Z M 5.5927 8.8208 7.0199 9.2128 7.7843 8.8277 7.0914 9.733 5.5927 8.8208 Z M 6.2992 4.631 4.5185 2.9384 5.8214 2.4722 6.2992 4.631 Z M 3.4095 13.1043 1.7944 12.9263 1.8698 11.5796 3.4878 12.528 3.4095 13.1043 Z M 3.4095 13.1043 4.2836 12.9475 5.3953 13.5662 7.0056 13.6194 7.8488 12.8781 10.8673 14.6584 12.6142 14.6605 13.0193 15.1164 14.4437 15.1796 13.8816 14.0259 14.2362 13.0913 16.2204 13.2667 16.3278 11.289 15.5733 10.9839 16.303 9.4876 15.2512 9.1701 14.8017 10.0936 13.4565 9.7396 12.8802 9.9024 11.8183 9.3683 12.0768 8.6828 9.8529 7.7064 9.6531 8.4413 7.7843 8.8277 7.8267 7.2934 6.4237 5.098 6.2992 4.631 8.0564 5.2991 8.3719 4.9225 7.0296 3.4628 8.8878 3.8324 9.1005 4.2693 10.4785 4.576 12.0202 6.1915 12.7065 5.7913 13.7032 6.5909 14.1441 6.196 15.8502 5.9903 15.4919 7.4364 15.4947 8.5317 15.852 9.2707 16.8852 9.3303 17.2873 7.9353 18.2784 9.1737 19.8273 9.1663 21.5365 10.8751 20.823 12.5431 22.2126 13.4941 23.7548 11.925 24.4672 12.21 23.5076 13.0238 22.8327 14.3846 23.8087 15.3749 25.8851 14.6896 27.4146 15.3157 27.0245 15.5716 30.9467 16.8616 31.5441 16.6377 32.231 14.9597 32.6294 17.2152 32.2147 17.9316 30.961 18.7367 30.3679 19.4962 29.0336 20.2002 25.1834 18.7796 23.5665 19.4409 24.2441 21.0689 25.5183 22.6127 26.8237 21.5983 28.5573 22.2027 28.8576 22.8573 28.2514 23.6457 29.8167 24.6242 32.1413 25.5075 34 26.4344 33.7533 27.4885 32.674 28.2372 32.3047 27.937 33.6313 26.2728 32.3259 25.6091 29.7854 24.6426 28.1939 23.6562 26.0754 22.919 25.5339 22.9448 25.194 23.9664 25.2007 22.4723 24.1172 21.4316 21.8872 21.3065 21.2582 21.9638 21.0633 21.3456 20.0401 21.3261 18.6794 22.7942 17.7122 21.8075 17.0787 22.4491 15.6622 21.7099 14.2292 19.8187 13.6229 20.1522 12.9511 21.8962 12.1691 21.8651 9.6948 23.3831 8.7205 26.5917 7.383 26.5484 6.2387 27.5637 5.5435 26.5483 4.5846 26.7129 2.1097 24.3947 2.6411 24.002 3.9384 24.3628 6.4264 23.9111 6.4536 23.4245 7.6327 22.6033 8.0512 21.5689 9.211 21.9162 10.2142 22.9693 12.1324 21.6894 12.4425 20.6163 12.2079 19.9353 12.2356 18.3109 12.0238 16.4293 11.0276 16.0505 10.0141 16.369 9.0483 17.5707 8.0584 16.9754 8.8231 16.4237 10.0084 16.1826 9.514 15.5459 7.7585 14.8955 7.3086 15.2631 2.1956 17.0522 1.8748 17.7841 1 17.5437 1.7643 16.7766 1.1652 15.0344 2.7499 14.8544 3.4095 13.1043 Z";
  var aggLabel = {
    county: "County",
    ahec: "AHEC region",
    ruralroots: "Rural Roots Hub",
    medicaid: "Medicaid Region"
  };
  function hoverValueText(state2, value) {
    const unit2 = variableUnitText[state2.variable] || "";
    return `${formatter(state2.variable)(value)} ${unit2}`;
  }
  function tipAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function reorderSelected(features, key, region) {
    const i = features.findIndex((f) => f.properties[key] == region);
    if (i < 0) return features;
    const copy2 = features.slice();
    copy2.push(copy2.splice(i, 1)[0]);
    return copy2;
  }
  function overlayRegionLabel(level, region) {
    if (level == "ahec") return region == "Wake AHEC" ? "Wake" : region;
    if (level == "medicaid") return medicaidRegionName.get(region) || region;
    return region;
  }
  function renderMap(state2) {
    const { ncMap } = state2.geo;
    if (state2.specialty.profession === "Physician" && (state2.year == 2020 || state2.year == 2021)) {
      return `<text x="313" y="290" text-anchor="middle" font-size="22px" fill="#000">Physician data from 2020 and 2021 are unavailable.</text>`;
    }
    const path2 = getPath(ncMap);
    const level = state2.aggregationLevel;
    const region = state2.region;
    const colorScale = buildColorScale(state2);
    const mapData = mapValueMap(state2);
    const totalMap = totalValueMap(state2);
    const variable = state2.variable;
    const showTotalInTip = variable == "provider_rate";
    const titleText = `${professionChartTitle(variable, state2.specialty)} by ${aggLabel[level]}, North Carolina, ${state2.year}`;
    const title = `<text id="map-title" transform="translate(0,25)">${wrap({
      text: titleText,
      maxCharsPerLine: 85
    })}</text>`;
    let countyFeatures = ncMap.features;
    if (region != "North Carolina" && level == "county") {
      countyFeatures = reorderSelected(countyFeatures, "county", region);
    }
    const counties = countyFeatures.map((f) => {
      const county = f.properties.county;
      const val = mapData.get(f.properties[level]);
      const total = totalMap.get(f.properties[level]);
      const selected = level == "county" && county == region ? " selected" : "";
      const tip = `${county} County
${hoverValueText(state2, val)}${showTotalInTip ? `
(${total} total)` : ""}`;
      return `<path class="county${selected}" data-region="${county}" data-tip="${tipAttr(tip)}" fill="${colorScale(val)}" d="${path2(f.geometry)}"></path>`;
    }).join("");
    const countyGroup = `<g class="counties" transform="translate(${chartMargin.left}, ${chartMargin.top})">${counties}</g>`;
    let overlayGroup = "";
    if (level != "county") {
      const geo = state2.geo[level == "ruralroots" ? "ruralRoots" : level];
      let feats = geo.features;
      if (region != "North Carolina") feats = reorderSelected(feats, level, region);
      const paths = feats.map((f) => {
        const r = f.properties[level];
        const val = mapData.get(r);
        const total = totalMap.get(r);
        const selected = r == region ? " selected" : "";
        const tip = `${overlayRegionLabel(level, r)}
${hoverValueText(state2, val)}${showTotalInTip ? `
(${total} total)` : ""}`;
        return `<path class="overlay${selected}" data-region="${r}" data-tip="${tipAttr(tip)}" d="${path2(f.geometry)}"></path>`;
      }).join("");
      overlayGroup = `<g class="overlays" transform="translate(${chartMargin.left}, ${chartMargin.top})">${paths}</g>`;
    }
    const layersGroup = `<g transform="translate(${chartMargin.left}, ${chartMargin.top})">${renderLayers(state2)}</g>`;
    const legendChart = level == "county" ? renderHistogram(state2, colorScale, histogramData(state2), mapData) : renderRowChart(state2, colorScale, mapData);
    const defs = `<defs>
    <pattern id="NApattern" patternUnits="userSpaceOnUse" width="8" height="8">
      <image href="${NA_PATTERN_IMG}" x="0" y="0" width="8" height="8" />
    </pattern>
    <symbol id="urbanized-area-icon" viewBox="0 0 35 33" width="25" height="24" fill="none" stroke="#333">
      <path d="${URBANIZED_ICON_PATH}" />
    </symbol>
  </defs>`;
    return `${defs}<g id="map-container">${title}${countyGroup}${overlayGroup}${layersGroup}${renderSymbolLegend(
      state2
    )}${legendChart}</g>`;
  }

  // node_modules/d3-shape/src/constant.js
  function constant_default2(x2) {
    return function constant2() {
      return x2;
    };
  }

  // node_modules/d3-path/src/path.js
  var pi2 = Math.PI;
  var tau2 = 2 * pi2;
  var epsilon3 = 1e-6;
  var tauEpsilon = tau2 - epsilon3;
  function append2(strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += arguments[i] + strings[i];
    }
  }
  function appendRound2(digits) {
    let d = Math.floor(digits);
    if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
    if (d > 15) return append2;
    const k = 10 ** d;
    return function(strings) {
      this._ += strings[0];
      for (let i = 1, n = strings.length; i < n; ++i) {
        this._ += Math.round(arguments[i] * k) / k + strings[i];
      }
    };
  }
  var Path = class {
    constructor(digits) {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null;
      this._ = "";
      this._append = digits == null ? append2 : appendRound2(digits);
    }
    moveTo(x2, y2) {
      this._append`M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}`;
    }
    closePath() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._append`Z`;
      }
    }
    lineTo(x2, y2) {
      this._append`L${this._x1 = +x2},${this._y1 = +y2}`;
    }
    quadraticCurveTo(x12, y12, x2, y2) {
      this._append`Q${+x12},${+y12},${this._x1 = +x2},${this._y1 = +y2}`;
    }
    bezierCurveTo(x12, y12, x2, y2, x3, y3) {
      this._append`C${+x12},${+y12},${+x2},${+y2},${this._x1 = +x3},${this._y1 = +y3}`;
    }
    arcTo(x12, y12, x2, y2, r) {
      x12 = +x12, y12 = +y12, x2 = +x2, y2 = +y2, r = +r;
      if (r < 0) throw new Error(`negative radius: ${r}`);
      let x05 = this._x1, y05 = this._y1, x21 = x2 - x12, y21 = y2 - y12, x01 = x05 - x12, y01 = y05 - y12, l01_2 = x01 * x01 + y01 * y01;
      if (this._x1 === null) {
        this._append`M${this._x1 = x12},${this._y1 = y12}`;
      } else if (!(l01_2 > epsilon3)) ;
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon3) || !r) {
        this._append`L${this._x1 = x12},${this._y1 = y12}`;
      } else {
        let x20 = x2 - x05, y20 = y2 - y05, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l = r * Math.tan((pi2 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l / l01, t21 = l / l21;
        if (Math.abs(t01 - 1) > epsilon3) {
          this._append`L${x12 + t01 * x01},${y12 + t01 * y01}`;
        }
        this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x12 + t21 * x21},${this._y1 = y12 + t21 * y21}`;
      }
    }
    arc(x2, y2, r, a0, a1, ccw) {
      x2 = +x2, y2 = +y2, r = +r, ccw = !!ccw;
      if (r < 0) throw new Error(`negative radius: ${r}`);
      let dx = r * Math.cos(a0), dy = r * Math.sin(a0), x05 = x2 + dx, y05 = y2 + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
      if (this._x1 === null) {
        this._append`M${x05},${y05}`;
      } else if (Math.abs(this._x1 - x05) > epsilon3 || Math.abs(this._y1 - y05) > epsilon3) {
        this._append`L${x05},${y05}`;
      }
      if (!r) return;
      if (da < 0) da = da % tau2 + tau2;
      if (da > tauEpsilon) {
        this._append`A${r},${r},0,1,${cw},${x2 - dx},${y2 - dy}A${r},${r},0,1,${cw},${this._x1 = x05},${this._y1 = y05}`;
      } else if (da > epsilon3) {
        this._append`A${r},${r},0,${+(da >= pi2)},${cw},${this._x1 = x2 + r * Math.cos(a1)},${this._y1 = y2 + r * Math.sin(a1)}`;
      }
    }
    rect(x2, y2, w, h) {
      this._append`M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}h${w = +w}v${+h}h${-w}Z`;
    }
    toString() {
      return this._;
    }
  };
  function path() {
    return new Path();
  }
  path.prototype = Path.prototype;

  // node_modules/d3-shape/src/path.js
  function withPath(shape) {
    let digits = 3;
    shape.digits = function(_) {
      if (!arguments.length) return digits;
      if (_ == null) {
        digits = null;
      } else {
        const d = Math.floor(_);
        if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
        digits = d;
      }
      return shape;
    };
    return () => new Path(digits);
  }

  // node_modules/d3-shape/src/array.js
  var slice2 = Array.prototype.slice;
  function array_default(x2) {
    return typeof x2 === "object" && "length" in x2 ? x2 : Array.from(x2);
  }

  // node_modules/d3-shape/src/curve/linear.js
  function Linear(context) {
    this._context = context;
  }
  Linear.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x2, y2) {
      x2 = +x2, y2 = +y2;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
          break;
        case 1:
          this._point = 2;
        // falls through
        default:
          this._context.lineTo(x2, y2);
          break;
      }
    }
  };
  function linear_default(context) {
    return new Linear(context);
  }

  // node_modules/d3-shape/src/point.js
  function x(p) {
    return p[0];
  }
  function y(p) {
    return p[1];
  }

  // node_modules/d3-shape/src/line.js
  function line_default2(x2, y2) {
    var defined = constant_default2(true), context = null, curve = linear_default, output = null, path2 = withPath(line);
    x2 = typeof x2 === "function" ? x2 : x2 === void 0 ? x : constant_default2(x2);
    y2 = typeof y2 === "function" ? y2 : y2 === void 0 ? y : constant_default2(y2);
    function line(data) {
      var i, n = (data = array_default(data)).length, d, defined0 = false, buffer;
      if (context == null) output = curve(buffer = path2());
      for (i = 0; i <= n; ++i) {
        if (!(i < n && defined(d = data[i], i, data)) === defined0) {
          if (defined0 = !defined0) output.lineStart();
          else output.lineEnd();
        }
        if (defined0) output.point(+x2(d, i, data), +y2(d, i, data));
      }
      if (buffer) return output = null, buffer + "" || null;
    }
    line.x = function(_) {
      return arguments.length ? (x2 = typeof _ === "function" ? _ : constant_default2(+_), line) : x2;
    };
    line.y = function(_) {
      return arguments.length ? (y2 = typeof _ === "function" ? _ : constant_default2(+_), line) : y2;
    };
    line.defined = function(_) {
      return arguments.length ? (defined = typeof _ === "function" ? _ : constant_default2(!!_), line) : defined;
    };
    line.curve = function(_) {
      return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
    };
    line.context = function(_) {
      return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
    };
    return line;
  }

  // src/charts/sparkCharts.js
  var WIDTH3 = 240;
  var HEIGHT4 = WIDTH3 * 0.29;
  var MARGIN3 = { top: 15, right: 17, bottom: 21, left: 10 };
  var CHART_W = WIDTH3 - MARGIN3.left - MARGIN3.right;
  var CHART_H = HEIGHT4 - MARGIN3.top - MARGIN3.bottom;
  function barFill(barVar, barYear, selVar, selYear) {
    if (barVar == selVar) return barYear == selYear ? "#a33180" : "#be8edd";
    return barYear == selYear ? "#31a354" : "#addd8e";
  }
  function headerRegion(state2) {
    const { aggregationLevel: lvl, region } = state2;
    if (lvl == "county" && region != "North Carolina") return `${region} County`;
    if (lvl == "ahec" && region.indexOf("AHEC") == -1 && region != "North Carolina")
      return `${region} AHEC`;
    if (lvl == "medicaid" && region != "North Carolina")
      return medicaidRegionName.get(region);
    return region;
  }
  function sparkChart(state2, variable) {
    const fmt = formatter(variable);
    const chartData = getDataByVariableForCurrentRegion(variable);
    const ncData = getDataByVariableForNorthCarolina(variable);
    const raceNAData = getDataByVariableForCurrentRegion("percent_race_na");
    const underData = getDataByVariableForCurrentRegion("percent_underrepresented");
    const xExtent = extent(chartData, (d) => d.year);
    const xDomain = range(xExtent[0], xExtent[1] + 1);
    const xScale = band().domain(xDomain).range([0, CHART_W]).padding(0.1);
    const xBandwidth = Math.min(xScale.bandwidth(), 50);
    const xLinear = linear2().domain(xExtent).range([0, CHART_W]);
    const yMax = max([
      max(chartData, (d) => d.value),
      max(ncData, (d) => d.value),
      variable == "percent_underrepresented" ? max(raceNAData, (d) => +d.value) : variable == "percent_race_na" ? max(underData, (d) => +d.value) : 0
    ]);
    const yScale = linear2().domain([0, yMax]).range([CHART_H, 0]);
    const n = chartData.length;
    const rects = chartData.map((d, i) => ({
      x: xScale(d.year),
      y: yScale(d.value),
      width: xBandwidth,
      height: CHART_H - yScale(d.value),
      value: fmt(d.value),
      year: d.year,
      // Always label the first, last, and currently-selected year so the mapped
      // year stays labeled across re-renders (incl. after a tap on mobile).
      defaultAnnotation: i == 0 || i == n - 1 || d.year == state2.year
    }));
    const bars = rects.map((r) => {
      const fill = barFill(variable, r.year, state2.variable, state2.year);
      return `<rect class="spark-bar" data-year="${r.year}" x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" style="fill:${fill}"></rect>`;
    }).join("");
    let nc = "";
    if (state2.region != "North Carolina") {
      const lineGen = line_default2().x((d) => xLinear(d.year)).y((d) => yScale(+d.value));
      const linePath = lineGen(ncData);
      const last = ncData[ncData.length - 1];
      const ncx = xLinear.range()[1];
      const ncy = yScale(last.value);
      let txt = "State ";
      txt = variable == "provider_rate" ? txt + "Rate" : variable == "total" ? txt + "Median" : txt + "%";
      const tx = variable.indexOf("percent") > -1 ? ncx + 17 : ncx + 8;
      nc = `<g transform="translate(${MARGIN3.left}, ${MARGIN3.top})">
      <path class="spark-ncline" d="${linePath}"></path>
      <text class="spark-nctext" x="${tx}" y="${ncy + 5}">${txt}</text>
    </g>`;
    }
    const labels = rects.map((r) => {
      const cx = r.x + r.width * 0.5;
      return `<g class="spark-anno${r.defaultAnnotation ? " spark-anno--default" : ""}" data-year="${r.year}">
        <text class="spark-value" x="${cx}" y="${r.y - 4}">${r.value}</text>
        <text class="spark-year" x="${cx}" y="${r.y + r.height + 15}">${r.year}</text>
      </g>`;
    }).join("");
    return `<g class="spark-chart" data-variable="${variable}">
    <rect class="spark-bg" width="${WIDTH3}" height="${HEIGHT4 * 0.4}" fill="#fff" transform="translate(0,-20)"></rect>
    <text class="spark-title" transform="translate(0,-5)">${variableLabels[variable] || variable}</text>
    <g transform="translate(${MARGIN3.left}, ${MARGIN3.top})">${bars}</g>
    ${nc}
    <g transform="translate(${MARGIN3.left}, ${MARGIN3.top})">${labels}</g>
  </g>`;
  }
  function sparksMarkup(state2) {
    const header = `<text class="spark-header" transform="translate(0,-65)">${wrap(
      { text: `Profession Demographics for ${headerRegion(state2)}`, maxCharsPerLine: 30, lineHeight: 1.1 }
    )}</text>`;
    const charts = state2.variables.map((v, i) => `<g transform="translate(0,${i * 110})">${sparkChart(state2, v)}</g>`).join("");
    return `<g transform="translate(0,90)">${header}${charts}</g>`;
  }
  function renderSparks(container, state2) {
    container.classList.remove("is-hovering");
    container.innerHTML = sparksMarkup(state2);
  }
  function initSparkInteraction(container) {
    function setHoverYear(year) {
      container.classList.add("is-hovering");
      container.querySelectorAll(".spark-anno.is-active, .spark-bar.is-hovered").forEach(
        (el) => el.classList.remove("is-active", "is-hovered")
      );
      container.querySelectorAll(`.spark-anno[data-year="${year}"]`).forEach((el) => el.classList.add("is-active"));
      container.querySelectorAll(`.spark-bar[data-year="${year}"]`).forEach((el) => el.classList.add("is-hovered"));
    }
    function clearHover() {
      container.classList.remove("is-hovering");
      container.querySelectorAll(".spark-anno.is-active, .spark-bar.is-hovered").forEach(
        (el) => el.classList.remove("is-active", "is-hovered")
      );
    }
    container.addEventListener("mouseover", (e) => {
      const bar = e.target.closest("[data-year]");
      if (bar) setHoverYear(bar.dataset.year);
    });
    container.addEventListener("mouseleave", clearHover);
    container.addEventListener("click", (e) => {
      const bar = e.target.closest("[data-year]");
      const chart = e.target.closest("[data-variable]");
      if (bar) {
        changeYear(+bar.dataset.year);
        if (chart) changeVariable(chart.dataset.variable);
      } else if (chart) {
        changeVariable(chart.dataset.variable);
      }
    });
  }

  // src/ui/export.js
  var SVGNS = "http://www.w3.org/2000/svg";
  var EXPORT_STYLE = `
  svg { font-family: Helvetica, Arial, sans-serif; font-size: 16px; }
  .county { stroke: #fff; stroke-width: 1; }
  .overlay { fill: none; stroke: #2a2a2a; stroke-width: 3; }
  .selected { stroke: rgb(163,49,128); stroke-width: 4px; }
  #map-title { font-weight: 600; font-size: 1em; }
  .rural-marker { fill: #fff; stroke: #001a0e; }
  .symbol-legend text { font-size: 1em; font-weight: 600; fill: #4b4b4b; }
  .histogram-legend text { font-size: 1.1em; fill: #4b4b4b; text-anchor: middle; }
  .histogram-legend line { stroke: #4b4b4b; }
  .histogram-legend .histogramTitle, .histogram-legend .yLabel { font-weight: 600; }
  .histogram-legend .yAxis line { stroke: #bdbdbd; }
  .histogram-legend .ncLine text { fill: #00567a; font-weight: 600; font-size: 1em; }
  .histogram-legend .ncLine line { stroke: #00567a; stroke-width: 3px; }
  .row-chart text { fill: #4b4b4b; font-size: 1.1em; text-anchor: middle; }
  .row-chart .ahecLabel { text-anchor: end; }
  .row-chart .xAxis line { stroke: #bdbdbd; }
  .row-chart .chartTitle { font-weight: 600; }
  .row-chart .ncLine text { fill: #00567a; font-weight: 600; text-anchor: middle; }
  .row-chart .ncLine line { stroke: #00567a; stroke-width: 3px; }
  .spark-header { font-size: 1em; font-weight: 600; }
  .spark-title { font-size: 1em; }
  .spark-bar { stroke: #fff; stroke-width: 1; }
  .spark-value { font-size: 1em; text-anchor: middle; }
  .spark-year { fill: #6f6f6f; font-size: 1em; text-anchor: middle; }
  .spark-anno { visibility: hidden; }
  .spark-anno--default { visibility: visible; }
  .spark-ncline { fill: none; stroke: #00567a; stroke-width: 2; stroke-opacity: 0.5; }
  .spark-nctext { fill: #00567a; font-size: 1em; }
`;
  function rasterize(svg, w, h, background) {
    return new Promise((resolve, reject) => {
      const xml = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(
        new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
      );
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w * 2;
        canvas.height = h * 2;
        const ctx = canvas.getContext("2d");
        ctx.scale(2, 2);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")), "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("SVG image failed to load"));
      };
      img.src = url;
    });
  }
  function triggerDownload(blobOrUrl, filename) {
    const url = typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof blobOrUrl !== "string") setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  async function downloadImage() {
    const state2 = getState();
    if (!state2.dataLoaded) return;
    const notes = document.querySelector(".notes-text");
    const notesText = notes ? notes.innerText : "";
    const W = 1050;
    const H = 810;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("xmlns", SVGNS);
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    let content = `<style>${EXPORT_STYLE}</style><rect width="${W}" height="${H}" fill="#fff" /><g transform="translate(25,25)">${renderMap(state2)}</g><g transform="translate(720,25)">${sparksMarkup(state2)}</g><text font-size="10px" transform="translate(10,750)">${wrap({
      text: notesText,
      maxCharsPerLine: 200
    })}</text>`;
    try {
      const res = await fetch("./sheps_workforce_nc_for_web.svg");
      if (res.ok) {
        const doc = new DOMParser().parseFromString(
          await res.text(),
          "image/svg+xml"
        );
        const inner = doc.documentElement.innerHTML;
        content += `<g transform="translate(15,655) scale(0.4)">${inner}</g>`;
      }
    } catch (e) {
    }
    svg.innerHTML = content;
    try {
      const blob = await rasterize(svg, W, H, "#fff");
      triggerDownload(blob, "viz.png");
    } catch (err) {
      console.error("Image export failed:", err);
    }
  }
  function downloadCsv() {
    var _a;
    const state2 = getState();
    if (!state2.dataLoaded) return;
    let notesText = (((_a = document.querySelector(".notes-text")) == null ? void 0 : _a.innerText) || "").replace(
      /\n/g,
      " "
    );
    let length = notesText.length, step = 120, brokenNotesText = "", i = 0, j;
    while (i < length) {
      j = notesText.indexOf(" ", i + step);
      if (j === -1) j = length;
      brokenNotesText += '"' + notesText.slice(i, j) + '"\n';
      i = j;
    }
    notesText = brokenNotesText;
    const yearExtent = extent(state2.data, (d) => d.year);
    const variable = state2.variable;
    const aggregationLevel = state2.aggregationLevel;
    const formattedData = Array.from(
      group(
        state2.data.filter((d) => d.type == aggregationLevel),
        (d) => d.region
      )
    ).map(function(d) {
      let newRow = {};
      newRow[aggregationLevel] = d[0];
      d[1].forEach(function(e) {
        newRow[e.year] = e[variable];
      });
      return newRow;
    });
    let csv2 = "State: North Carolina\n";
    csv2 += "Profession: " + state2.specialty.profession + "\n";
    csv2 += "Specialty/PAOP: " + state2.specialty.specialty + "\n";
    csv2 += `Variable: ${variable == "provider_rate" ? "rate per 10k" : variable}
`;
    csv2 += notesText;
    csv2 += csvFormat(formattedData, [
      aggregationLevel,
      ...range(yearExtent[0], yearExtent[1] + 1)
    ]);
    const uri = "data:attachment/csv;charset=utf-8," + encodeURI(csv2);
    triggerDownload(uri, "workforcedata.csv");
  }

  // src/ui/controls.js
  var GEOGRAPHIES = [
    { value: "county", label: "County" },
    { value: "ahec", label: "AHEC" },
    { value: "medicaid", label: "Medicaid Region" },
    { value: "ruralroots", label: "Rural Roots Hub" }
  ];
  var LAYERS = [
    { value: 0, label: "Rural (Nonmetropolitan)" },
    { value: 1, label: "Interstates" },
    { value: 2, label: "Urbanized Areas" }
  ];
  function esc(s) {
    return String(s).replace(/"/g, "&quot;");
  }
  function option(value, label, selected, disabled) {
    return `<option value="${esc(value)}"${selected ? " selected" : ""}${disabled ? " disabled" : ""}>${label}</option>`;
  }
  function specialtyLabel(profession) {
    if (profession === "Certified Nurse Midwife") return "and a practice type";
    if (["Physician", "Physician Assistant"].includes(profession))
      return "and a primary area of practice";
    return "and a specialty";
  }
  function regionSelectLabel(level) {
    switch (level) {
      case "ahec":
        return "Select an AHEC";
      case "medicaid":
        return "Select a Medicaid Region";
      case "ruralroots":
        return "Select a Rural Roots Hub";
      default:
        return "Select a county";
    }
  }
  function regionDisplay(level, region) {
    return level == "medicaid" ? medicaidRegionName.get(region) || region : region;
  }
  function renderProfessionControls(container, state2) {
    const professions = state2.specialtiesAll.filter((d) => d.profession == d.specialty).sort(
      (a, b) => a.profession.toUpperCase() < b.profession.toUpperCase() ? -1 : 1
    );
    const professionOpts = professions.map(
      (p) => option(p.code, p.profession, p.profession == state2.specialty.profession)
    ).join("");
    const specialties = state2.specialtiesAll.filter(
      (d) => d.profession == state2.specialty.profession
    );
    const showSpecialty = specialties.length > 1;
    const specialtyOpts = specialties.map((s) => option(s.code, s.name, s.code == state2.specialty.code)).join("");
    const specialtyField = showSpecialty ? `<div class="control-field">
      <label for="hw-specialty">${specialtyLabel(state2.specialty.profession)}</label>
      <select id="hw-specialty" data-control="specialty">${specialtyOpts}</select>
    </div>` : "";
    container.innerHTML = `
    <div class="control-field">
      <label for="hw-profession">Choose a profession</label>
      <select id="hw-profession" data-control="profession">${professionOpts}</select>
    </div>
    ${specialtyField}`;
  }
  function renderViewControls(container, state2) {
    const measureOpts = state2.variables.map((v) => option(v, variableLabels[v] || v, v == state2.variable)).join("");
    const geoOpts = GEOGRAPHIES.map(
      (g) => option(
        g.value,
        g.label,
        g.value == state2.aggregationLevel,
        g.value == "medicaid" && !state2.medicaidRegions
      )
    ).join("");
    const regions = [
      ...new Set(
        state2.data.filter((d) => d.type == state2.aggregationLevel).map((d) => d.region)
      )
    ].map((r) => ({ value: r, label: regionDisplay(state2.aggregationLevel, r) })).sort((a, b) => a.label > b.label ? 1 : a.label < b.label ? -1 : 0);
    const regionOpts = option("North Carolina", "All of North Carolina", state2.region == "North Carolina") + regions.map((r) => option(r.value, r.label, r.value == state2.region)).join("");
    const active = new Set(state2.layers.map((l) => l.value));
    const layerBoxes = LAYERS.map(
      (l) => `<label class="layer-check"><input type="checkbox" data-control="layer" value="${l.value}"${active.has(l.value) ? " checked" : ""} /> ${l.label}</label>`
    ).join("");
    container.innerHTML = `
    <div class="control-field">
      <label for="hw-year">Select a year: ${state2.year}</label>
      <input id="hw-year" type="range" data-control="year"
        min="${state2.yearExtent[0]}" max="${state2.yearExtent[1]}" step="1"
        value="${state2.year}" aria-label="Select a year" aria-valuetext="${state2.year}" />
    </div>
    <div class="control-field">
      <label for="hw-measure">Show on map</label>
      <select id="hw-measure" data-control="measure">${measureOpts}</select>
    </div>
    <div class="control-field">
      <label for="hw-geo">See data by</label>
      <select id="hw-geo" data-control="geo">${geoOpts}</select>
    </div>
    <div class="control-field">
      <label for="hw-region">${regionSelectLabel(state2.aggregationLevel)}</label>
      <select id="hw-region" data-control="region">${regionOpts}</select>
    </div>
    <fieldset class="control-field layer-fieldset">
      <legend>Add map layers</legend>
      ${layerBoxes}
    </fieldset>
    <div class="control-actions">
      <button type="button" class="hw-btn" data-action="download-image">Save image</button>
      <button type="button" class="hw-btn" data-action="download-data">Download data</button>
      <button type="button" class="hw-btn" data-action="help" aria-expanded="false">How to use this</button>
    </div>`;
  }
  function initControls(root) {
    root.addEventListener("change", (e) => {
      const el = e.target;
      const state2 = getState();
      switch (el.dataset.control) {
        case "profession":
        case "specialty": {
          const next = state2.specialtiesAll.find((d) => d.code == el.value);
          if (next) changeSpecialty(next);
          break;
        }
        case "measure":
          changeVariable(el.value);
          break;
        case "geo":
          changeAggregation(el.value);
          break;
        case "region":
          setRegion(el.value);
          break;
        case "layer": {
          const value = +el.value;
          const label = LAYERS.find((l) => l.value == value).label;
          const current = state2.layers.slice();
          if (el.checked) current.push({ value, label });
          else {
            const i = current.findIndex((l) => l.value == value);
            if (i > -1) current.splice(i, 1);
          }
          updateLayers(current);
          break;
        }
        default:
          break;
      }
    });
    root.addEventListener("input", (e) => {
      if (e.target.dataset.control === "year") changeYear(e.target.value);
    });
    root.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "download-image") downloadImage();
      else if (action === "download-data") downloadCsv();
    });
  }

  // src/ui/notes.js
  function renderNotes(container, state2) {
    const groupText = getPhysicianGroupText(
      state2.specialty,
      state2.geo.physicianGroups
    );
    const source = getSourceText(state2.specialty.profession);
    const layer = getLayerText(state2.layers);
    const footer = getFooterText();
    container.innerHTML = `${groupText}<p class="notes-text">${source}${layer}${footer}</p>`;
  }

  // src/ui/help.js
  var HELP_HTML = `
  <ul>
    <li><strong>Choose a profession</strong> (and a specialty, practice type, or primary area of practice where available) to load its data.</li>
    <li><strong>Show on map</strong> picks the measure shown &mdash; a rate, a total, or a percentage.</li>
    <li><strong>See data by</strong> switches the geography between counties, AHEC regions, Medicaid regions, and Rural Roots Hubs.</li>
    <li>Pick a region from the <strong>Select a&hellip;</strong> menu, or click a region on the map, to focus the charts on the right. Click it again (or choose "All of North Carolina") to reset.</li>
    <li>Use the <strong>year</strong> slider to change the mapped year. Hover the small charts on the right to read any year; the blue line marks the statewide value.</li>
    <li><strong>Add map layers</strong> overlays rural counties, interstates, or urbanized areas.</li>
    <li><strong>Save image</strong> and <strong>Download data</strong> export the current view as a PNG or CSV.</li>
  </ul>`;
  var _open = false;
  function initHelp(controlsContainer, panel) {
    panel.innerHTML = HELP_HTML;
    panel.hidden = true;
    controlsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="help"]');
      if (!btn) return;
      _open = !_open;
      panel.hidden = !_open;
      btn.setAttribute("aria-expanded", String(_open));
    });
  }

  // src/ui/tooltip.js
  var tipEl = null;
  function ensure() {
    if (tipEl) return tipEl;
    tipEl = document.createElement("div");
    tipEl.className = "hw-tooltip";
    tipEl.setAttribute("role", "tooltip");
    tipEl.hidden = true;
    document.body.appendChild(tipEl);
    return tipEl;
  }
  function initTooltip(container) {
    const tip = ensure();
    const canHover = !window.matchMedia || window.matchMedia("(hover: hover)").matches;
    if (!canHover) return;
    window.addEventListener("scroll", () => tip.hidden = true, { passive: true });
    container.addEventListener("mousemove", (e) => {
      const el = e.target.closest("[data-tip]");
      if (!el) {
        tip.hidden = true;
        return;
      }
      const text = el.getAttribute("data-tip");
      if (tip.textContent !== text) tip.textContent = text;
      tip.hidden = false;
      const pad3 = 14;
      const r = tip.getBoundingClientRect();
      let x2 = e.clientX + pad3;
      let y2 = e.clientY + pad3;
      if (x2 + r.width > window.innerWidth) x2 = e.clientX - r.width - pad3;
      if (y2 + r.height > window.innerHeight) y2 = e.clientY - r.height - pad3;
      tip.style.left = x2 + "px";
      tip.style.top = y2 + "px";
    });
    container.addEventListener("mouseleave", () => {
      tip.hidden = true;
    });
  }

  // src/main.js
  var app = document.getElementById("app");
  app.innerHTML = `
  <div class="hw-app">
    <div id="hw-profession-controls" class="control-panel control-panel--primary"
         role="group" aria-label="Choose a profession"></div>
    <p class="sr-only">The map and charts below present this data visually. To access the
      underlying numbers as a table, use the "Download data" button to download a CSV file.</p>
    <div id="hw-dashboard" class="dashboard">
      <div class="map-cell">
        <svg id="hw-map" class="map-svg" viewBox="-15 0 655 610" role="img"
             aria-label="Choropleth map of North Carolina health workforce supply"></svg>
      </div>
      <div class="sparks-cell">
        <svg id="hw-sparks" class="spark-svg" viewBox="-30 0 372 710" role="img"
             aria-label="Longitudinal demographic charts for the selected region"></svg>
      </div>
    </div>
    <div id="hw-status" class="hw-status" aria-live="polite"></div>
    <div id="hw-view-controls" class="control-panel" role="group" aria-label="View options"></div>
    <div id="hw-help" class="help-panel"></div>
    <div id="hw-notes" class="notes"></div>
  </div>`;
  var appEl = app.querySelector(".hw-app");
  var professionEl = document.getElementById("hw-profession-controls");
  var viewControlsEl = document.getElementById("hw-view-controls");
  var helpEl = document.getElementById("hw-help");
  var dashboardEl = document.getElementById("hw-dashboard");
  var mapEl = document.getElementById("hw-map");
  var sparksEl = document.getElementById("hw-sparks");
  var notesEl = document.getElementById("hw-notes");
  var statusEl = document.getElementById("hw-status");
  var lastControlsSig = null;
  function controlsSignature(state2) {
    return JSON.stringify([
      state2.specialty.code,
      state2.aggregationLevel,
      state2.variable,
      state2.region,
      state2.layers.map((l) => l.value),
      state2.variables,
      state2.dataLoaded,
      state2.loadFailed
    ]);
  }
  function updateYearUI(state2) {
    const slider = document.getElementById("hw-year");
    if (slider) slider.value = state2.year;
    const label = viewControlsEl.querySelector('label[for="hw-year"]');
    if (label) label.textContent = `Select a year: ${state2.year}`;
  }
  function render(state2) {
    const sig = controlsSignature(state2);
    if (sig !== lastControlsSig) {
      renderProfessionControls(professionEl, state2);
      renderViewControls(viewControlsEl, state2);
      lastControlsSig = sig;
    } else {
      updateYearUI(state2);
    }
    if (state2.loadFailed) {
      dashboardEl.style.visibility = "hidden";
      statusEl.textContent = "We're sorry \u2014 we couldn't find that dataset. Please try another profession.";
      return;
    }
    if (!state2.dataLoaded || !state2.geo) {
      statusEl.textContent = "Loading\u2026";
      return;
    }
    statusEl.textContent = "";
    dashboardEl.style.visibility = "visible";
    mapEl.innerHTML = renderMap(state2);
    renderSparks(sparksEl, state2);
    renderNotes(notesEl, state2);
  }
  mapEl.addEventListener("click", (e) => {
    const el = e.target.closest("[data-region]");
    if (el) changeRegion(el.dataset.region);
    else setRegion("North Carolina");
  });
  initControls(appEl);
  initSparkInteraction(sparksEl);
  initHelp(appEl, helpEl);
  initTooltip(mapEl);
  subscribe(render);
  (async function init() {
    try {
      statusEl.textContent = "Loading\u2026";
      const [geo, specialties] = await Promise.all([loadGeo(), loadSpecialties()]);
      setGeo(geo);
      setSpecialties(specialties);
      const professions = specialties.filter((d) => d.profession == d.specialty);
      const start = professions[Math.round((professions.length - 1) * Math.random())];
      render(getState());
      changeSpecialty(start);
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Sorry \u2014 the visualization failed to load its data. Please try again later.";
    }
  })();
})();
//# sourceMappingURL=app.js.map
