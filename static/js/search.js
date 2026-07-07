// Site search. Present on pages that include the search partial (homepage
// and section list pages). Fetches /index.json and renders matches as
// catalog entries into #search-results, hiding the server-rendered
// #catalog-list while a query is active. All result content is inserted
// via textContent (never innerHTML) so index data cannot inject markup.
(function () {

    const box = document.getElementById('search-box');
    if (!box) return;

    const list = document.getElementById('catalog-list');
    const results = document.getElementById('search-results');
    const announce = document.getElementById('search-results-announce');
    const headingTag = (results && results.dataset.heading) || 'h3';
    const labels = { blog: 'Blog', projects: 'Report', interactive: 'Interactive' };
    const minQueryLength = 2;

    let index = null;
    fetch('/index.json')
        .then(function (response) { return response.json(); })
        .then(function (data) {
            index = data.map(function (d) {
                const keywords = Array.isArray(d.keywords) ? d.keywords.join(' ') : (d.keywords || '');
                return {
                    entry: d,
                    haystack: [d.title, d.authors, d.teaserText, keywords].join(' ').toLowerCase()
                };
            });
        });

    function make(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.textContent = text;
        return el;
    }

    function render(entries) {
        results.textContent = '';
        entries.forEach(function (d) {
            const entry = make('div', 'entry');
            const meta = make('div', 'entry-meta');
            meta.appendChild(make('span',
                'entry-type' + (d.section === 'interactive' ? ' is-interactive' : ''),
                labels[d.section] || d.section));
            if (d.date) meta.appendChild(make('span', 'entry-date', d.date));

            const body = make('div', 'entry-body');
            const heading = make(headingTag, 'entry-title');
            const link = document.createElement('a');
            link.href = d.url;
            link.textContent = d.title;
            heading.appendChild(link);
            body.appendChild(heading);
            if (d.teaserText) body.appendChild(make('p', 'entry-teaser', d.teaserText));
            if (d.authors) body.appendChild(make('p', 'entry-authors', d.authors));

            entry.appendChild(meta);
            entry.appendChild(body);
            results.appendChild(entry);
        });
    }

    box.addEventListener('input', function () {
        if (!index) return;
        const query = box.value.trim().toLowerCase();

        if (query.length < minQueryLength) {
            results.hidden = true;
            if (list) list.hidden = false;
            if (announce) announce.textContent = '';
            return;
        }

        const hits = index
            .filter(function (d) { return d.haystack.includes(query); })
            .map(function (d) { return d.entry; });

        render(hits);
        results.hidden = false;
        if (list) list.hidden = true;
        if (announce) {
            announce.textContent = hits.length + ' result' + (hits.length !== 1 ? 's' : '') + ' found';
        }
    });

}());
