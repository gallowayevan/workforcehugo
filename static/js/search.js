// Client-side search over the pre-rendered thumbnail cards.
// Fetches /index.json (built by layouts/index.json), matches the query as a
// substring of title/authors/teaserText/keywords, and swaps the matching
// thumbnail cards into the .thumbnails container.
(function () {

  const minMatchCharLength = 1;

  fetch('/index.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (searchJSON) {
      const searchIndex = searchJSON.map(function (d) {
        const searchString = [d.title, d.authors, d.teaserText, d.keywords].join(' ').toLowerCase();
        return { searchString, fileID: d.fileID };
      });

      const searchBoxes = document.querySelectorAll('.search-box');

      const thumbnailBox = document.querySelector('.thumbnails');
      const defaultNumberDisplayed = Array.from(document.querySelectorAll('.thumbnails > div'), d => d.style.display).filter(d => d != "none").length;
      const thumbnails = new Map(Array.from(thumbnailBox.querySelectorAll(".thumbnail"), d => [d.getAttribute('data-file-id'), d]));
      const defaultKeys = Array.from(thumbnails.keys()).slice(0, defaultNumberDisplayed);
      for (var i = 0; i < searchBoxes.length; i++) {
        searchBoxes[i].addEventListener('keyup', search, false);
      }

      function search(event) {
        const searchResults = event.target.value.length >= minMatchCharLength ?
          searchIndex.filter(d => d.searchString.includes(event.target.value.toLowerCase())).map(d => d.fileID) :
          defaultKeys;

        const thumbnailFragment = document.createDocumentFragment();

        searchResults.forEach(d => {
          if (thumbnails.has(d)) thumbnailFragment.appendChild(thumbnails.get(d));
        })

        thumbnailBox.innerHTML = '';
        thumbnailBox.appendChild(thumbnailFragment);

        // Announce result count to screen readers
        const announce = document.getElementById('search-results-announce');
        if (announce && event.target.value.length >= minMatchCharLength) {
          announce.textContent = searchResults.length + ' result' + (searchResults.length !== 1 ? 's' : '') + ' found';
        } else if (announce) {
          announce.textContent = '';
        }
      }
    });

}());
