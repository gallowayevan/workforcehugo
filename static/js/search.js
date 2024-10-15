(function () {

  const minMatchCharLength = 1;

  fetch('/index.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (searchJSON) {
      const searchIndex = searchJSON.map(function (d,index) {
        const searchString = [d.title, d.authors, d.teaserText, d.tags, d.keywords].join(' ').toLowerCase();
            return {path: d.permalink, searchString, index, fileID: d.fileID}
      });

      const searchBoxes = document.querySelectorAll('.search-box');

      const thumbnailBox = document.querySelector('.thumbnails');
      const defaultNumberDisplayed = Array.from(document.querySelectorAll('.thumbnails > div'), d => d.style.display).filter(d => d != "none").length;
      const thumbnails = new Map(Array.from(thumbnailBox.querySelectorAll(".thumbnail"), d => [d.getAttribute('data-file-id'), d]));
      const defaultKeys = Array.from(thumbnails.keys()).slice(0, defaultNumberDisplayed);
      const numberOfSearchResults = 18;
      for (var i = 0; i < searchBoxes.length; i++) {
        searchBoxes[i].addEventListener('keyup', search, false);
      }

      function search(event) {
        const searchResults = event.target.value.length >= minMatchCharLength ?
        searchIndex.filter(d=>d.searchString.includes(event.target.value.toLowerCase())).map(d => d.fileID) :
          defaultKeys;

        const thumbnailFragment = document.createDocumentFragment();

        searchResults.forEach(d => {
          if (thumbnails.has(d)) thumbnailFragment.appendChild(thumbnails.get(d));
        })

        thumbnailBox.innerHTML = '';
        thumbnailBox.appendChild(thumbnailFragment);
      }

      function cleanCommaDelimited(current) {
        let split = current.split(",").map(d => d.trim());
        return split;
      }
    });

}());