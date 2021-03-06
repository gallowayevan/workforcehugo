Document


- switch blog to hugo
	- image processing pipeline (use page resources?)
	- connect to netlify cms?	
	- add interactives make one combined line chart with ability to select multiple professions and show either rate per 10k over time or cumulative percentage growth
	- documentation, esp if not using netlify cms
		- first explain directory structure
		- focus on things that Hugo assumes
    - change config.toml to change baseURL
	- look for icons for front page 

- create archetypes?


# Documentation

## Adding thumbnail images

In the frontmatter, specify a file name for the `teaserImage`. This file must be in the `/static/images/thumbnails` folder. The image should be cropped and resized to 400 x 300 pixels.

## Adding download buttons for interactive charts. 

For content pages of type `observable` or `interactive`, you can add `Download Image` and `Download SVG` buttons. These buttons are added automatically when a `downloadId` parameter is added to the frontmatter. 
```yaml
...
downloadId: viz
...
``` 
The `downloadId` must be the same as the `id` attribute of the `<div>` containing the `svg` that you want users to be able to download.
```html
<div id="viz">
	<svg ...>A chart or map</svg>
</div>
```