!function () { const e = "undefined" != typeof exports && exports || "undefined" != typeof define && {} || this || window; "undefined" != typeof define && define("save-svg-as-png", [], () => e), e.default = e; const t = "http://www.w3.org/2000/xmlns/", n = "http://www.w3.org/2000/svg", r = /url\(["']?(.+?)["']?\)/, o = { woff2: "font/woff2", woff: "font/woff", otf: "application/x-font-opentype", ttf: "application/x-font-ttf", eot: "application/vnd.ms-fontobject", sfnt: "application/font-sfnt", svg: "image/svg+xml" }, i = e => e instanceof HTMLElement || e instanceof SVGElement, s = e => { if (!i(e)) throw new Error(`an HTMLElement or SVGElement is required; got ${e}`) }, a = e => new Promise((t, n) => { i(e) ? t(e) : n(new Error(`an HTMLElement or SVGElement is required; got ${e}`)) }), l = e => { const t = Object.keys(o).filter(t => e.indexOf(`.${t}`) > 0).map(e => o[e]); return t ? t[0] : (console.error(`Unknown font format for ${e}. Fonts may not be working correctly.`), "application/octet-stream") }, c = (e, t, n) => { const r = e.viewBox && e.viewBox.baseVal && e.viewBox.baseVal[n] || null !== t.getAttribute(n) && !t.getAttribute(n).match(/%$/) && parseInt(t.getAttribute(n)) || e.getBoundingClientRect()[n] || parseInt(t.style[n]) || parseInt(window.getComputedStyle(e).getPropertyValue(n)); return null == r || isNaN(parseFloat(r)) ? 0 : r }, d = e => { const t = window.atob(e.split(",")[1]), n = e.split(",")[0].split(":")[1].split(";")[0], r = new ArrayBuffer(t.length), o = new Uint8Array(r); for (let e = 0; e < t.length; e++)o[e] = t.charCodeAt(e); return new Blob([r], { type: n }) }, h = e => Promise.all(Array.from(e.querySelectorAll("image")).map(e => { let t = e.getAttributeNS("http://www.w3.org/1999/xlink", "href") || e.getAttribute("href"); return t ? ((e => e && 0 === e.lastIndexOf("http", 0) && -1 === e.lastIndexOf(window.location.host))(t) && (t += (-1 === t.indexOf("?") ? "?" : "&") + "t=" + (new Date).valueOf()), new Promise((n, r) => { const o = document.createElement("canvas"), i = new Image; i.crossOrigin = "anonymous", i.src = t, i.onerror = (() => r(new Error(`Could not load ${t}`))), i.onload = (() => { o.width = i.width, o.height = i.height, o.getContext("2d").drawImage(i, 0, 0), e.setAttributeNS("http://www.w3.org/1999/xlink", "href", o.toDataURL("image/png")), n(!0) }) })) : Promise.resolve(null) })), u = {}, w = e => Promise.all(e.map(e => new Promise((t, n) => { if (u[e.url]) return t(u[e.url]); const o = new XMLHttpRequest; o.addEventListener("load", () => { const n = (e => { let t = ""; const n = new Uint8Array(e); for (let e = 0; e < n.byteLength; e++)t += String.fromCharCode(n[e]); return window.btoa(t) })(o.response), i = e.text.replace(r, `url("data:${e.format};base64,${n}")`) + "\n"; u[e.url] = i, t(i) }), o.addEventListener("error", n => { console.warn(`Failed to load font from: ${e.url}`, n), u[e.url] = null, t(null) }), o.addEventListener("abort", n => { console.warn(`Aborted loading font from: ${e.url}`, n), t(null) }), o.open("GET", e.url), o.responseType = "arraybuffer", o.send() }))).then(e => e.filter(e => e).join("")); let f = null; const g = (e, t) => { const { selectorRemap: n, modifyStyle: o, modifyCss: i, fonts: s, excludeUnusedCss: a } = t || {}, c = i || ((e, t) => { return `${n ? n(e) : e}{${o ? o(t) : t}}\n` }), d = [], h = void 0 === s, u = s || []; return (() => f || (f = Array.from(document.styleSheets).map(e => { try { return { rules: e.cssRules, href: e.href } } catch (t) { return console.warn(`Stylesheet could not be loaded: ${e.href}`, t), {} } })))().forEach(({ rules: t, href: n }) => { t && Array.from(t).forEach(t => { if (void 0 !== t.style) if (((e, t) => { if (t) try { return e.querySelector(t) || e.parentNode && e.parentNode.querySelector(t) } catch (e) { console.warn(`Invalid CSS selector "${t}"`, e) } })(e, t.selectorText)) d.push(c(t.selectorText, t.style.cssText)); else if (h && t.cssText.match(/^@font-face/)) { const e = ((e, t) => { const n = e.cssText.match(r), o = n && n[1] || ""; if (!o || o.match(/^data:/) || "about:blank" === o) return; const i = o.startsWith("../") ? `${t}/../${o}` : o.startsWith("./") ? `${t}/.${o}` : o; return { text: e.cssText, format: l(i), url: i } })(t, n); e && u.push(e) } else a || d.push(t.cssText) }) }), w(u).then(e => d.join("\n") + e) }, p = () => { if (!(navigator.msSaveOrOpenBlob || "download" in document.createElement("a"))) return { popup: window.open() } }; e.prepareSvg = ((e, r, o) => { s(e); const { left: i = 0, top: a = 0, width: l, height: d, scale: u = 1, responsive: w = !1, excludeCss: f = !1 } = r || {}; return h(e).then(() => { let s = e.cloneNode(!0); s.style.backgroundColor = (r || {}).backgroundColor || e.style.backgroundColor; const { width: h, height: p } = ((e, t, n, r) => { if ("svg" === e.tagName) return { width: n || c(e, t, "width"), height: r || c(e, t, "height") }; if (e.getBBox) { const { x: t, y: n, width: r, height: o } = e.getBBox(); return { width: t + r, height: n + o } } })(e, s, l, d); if ("svg" !== e.tagName) { if (!e.getBBox) return void console.error("Attempted to render non-SVG element", e); { null != s.getAttribute("transform") && s.setAttribute("transform", s.getAttribute("transform").replace(/translate\(.*?\)/, "")); const e = document.createElementNS("http://www.w3.org/2000/svg", "svg"); e.appendChild(s), s = e } } if (s.setAttribute("version", "1.1"), s.setAttribute("viewBox", [i, a, h, p].join(" ")), s.getAttribute("xmlns") || s.setAttributeNS(t, "xmlns", n), s.getAttribute("xmlns:xlink") || s.setAttributeNS(t, "xmlns:xlink", "http://www.w3.org/1999/xlink"), w ? (s.removeAttribute("width"), s.removeAttribute("height"), s.setAttribute("preserveAspectRatio", "xMinYMin meet")) : (s.setAttribute("width", h * u), s.setAttribute("height", p * u)), Array.from(s.querySelectorAll("foreignObject > *")).forEach(e => { e.setAttributeNS(t, "xmlns", "svg" === e.tagName ? n : "http://www.w3.org/1999/xhtml") }), !f) return g(e, r).then(e => { const t = document.createElement("style"); t.setAttribute("type", "text/css"), t.innerHTML = `<![CDATA[\n${e}\n]]>`; const n = document.createElement("defs"); n.appendChild(t), s.insertBefore(n, s.firstChild); const r = document.createElement("div"); r.appendChild(s); const i = r.innerHTML.replace(/NS\d+:href/gi, 'xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href'); if ("function" != typeof o) return { src: i, width: h, height: p }; o(i, h, p) }); { const e = document.createElement("div"); e.appendChild(s); const t = e.innerHTML; if ("function" != typeof o) return { src: t, width: h, height: p }; o(t, h, p) } }) }), e.svgAsDataUri = ((t, n, r) => (s(t), e.prepareSvg(t, n).then(({ src: e, width: t, height: n }) => { const o = `data:image/svg+xml;base64,${window.btoa((e => decodeURIComponent(encodeURIComponent(e).replace(/%([0-9A-F]{2})/g, (e, t) => { const n = String.fromCharCode(`0x${t}`); return "%" === n ? "%25" : n })))('<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>' + e))}`; return "function" == typeof r && r(o, t, n), o }))), e.svgAsPngUri = ((t, n, r) => { s(t); const { encoderType: o = "image/png", encoderOptions: i = .8, canvg: a } = n || {}, l = ({ src: e, width: t, height: n }) => { const s = document.createElement("canvas"), l = s.getContext("2d"), c = window.devicePixelRatio || 1; let d; s.width = t * c, s.height = n * c, s.style.width = `${s.width}px`, s.style.height = `${s.height}px`, l.setTransform(c, 0, 0, c, 0, 0), a ? a(s, e) : l.drawImage(e, 0, 0); try { d = s.toDataURL(o, i) } catch (e) { if ("undefined" != typeof SecurityError && e instanceof SecurityError || "SecurityError" === e.name) return void console.error("Rendered SVG images cannot be downloaded in this browser."); throw e } return "function" == typeof r && r(d, s.width, s.height), Promise.resolve(d) }; return a ? e.prepareSvg(t, n).then(l) : e.svgAsDataUri(t, n).then(e => new Promise((t, n) => { const r = new Image; r.onload = (() => t(l({ src: r, width: r.width, height: r.height }))), r.onerror = (() => { n(`There was an error loading the data URI as an image on the following SVG\n${window.atob(e.slice(26))}Open the following link to see browser's diagnosis\n${e}`) }), r.src = e })) }), e.download = ((e, t, n) => { if (navigator.msSaveOrOpenBlob) navigator.msSaveOrOpenBlob(d(t), e); else { const r = document.createElement("a"); if ("download" in r) { r.download = e, r.style.display = "none", document.body.appendChild(r); try { const e = d(t), n = URL.createObjectURL(e); r.href = n, r.onclick = (() => requestAnimationFrame(() => URL.revokeObjectURL(n))) } catch (e) { console.error(e), console.warn("Error while getting object URL. Falling back to string URL."), r.href = t } r.click(), document.body.removeChild(r) } else n && n.popup && (n.popup.document.title = e, n.popup.location.replace(t)) } }), e.saveSvg = ((t, n, r) => { const o = p(); return a(t).then(t => e.svgAsDataUri(t, r || {})).then(t => e.download(n, t, o)) }), e.saveSvgAsPng = ((t, n, r) => { const o = p(); return a(t).then(t => e.svgAsPngUri(t, r || {})).then(t => e.download(n, t, o)) }) }();