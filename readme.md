# Documentation

## Adding thumbnail images

In the frontmatter, specify a file name for the `teaserImage`. This file must be in the `/static/images/thumbnails` folder. The image should be cropped and resized to 400 x 300 pixels.
For instance, you could use ImageMagick to create a thumbnail from a larger image:
```powershell
cd "C:\Users\emg33\Documents\code\workforcehugo\static\images\posts\cnm>"
magick figure_2.png -resize 400x300^ -gravity center -extent 400x300 ../../thumbnails/cnm_growth.jpg
```

## Publish a post but have it be unlisted, so that others can view but it does not appear in list of posts

Add `unlisted: true` to front matter.

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
