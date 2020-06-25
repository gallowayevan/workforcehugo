(function () {

  const options = {
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    keys: [{
      name: 'title',
      weight: 0.5
    }, {
      name: 'authors',
      weight: 0.2
    },
    {
      name: 'summary',
      weight: 0.4
    },
    {
      name: 'teaserText',
      weight: 0.6
    },
    {
      name: 'keywords',
      weight: 0.9
    }]
  };

  fetch('/index.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (searchJSON) {
      const searchIndex = searchJSON.map(function (d) {
        if (d.author) d.author = cleanCommaDelimited(d.author);
        if (d.date) d.date = new Date(d.date);

        return d;
      })
      const fuse = new Fuse(searchIndex, options);

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
        const searchResults = event.target.value.length >= options.minMatchCharLength ?
          fuse.search(event.target.value).map(d => d.fileID).slice(0, numberOfSearchResults) :
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