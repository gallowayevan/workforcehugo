---
title: "{{ replace .Name "-" " " | title }}"
date: {{ dateFormat "2006-01-02" .Date }}
author: ""
draft: true
teaserText: ""
# Thumbnail image file, placed in /static/images/thumbnails/ (400x300, bare filename)
teaserImage: ""
keywords: []
# javascript: ["app.js"]  # page-bundle scripts loaded at end of body
# css: ["app.css"]        # page-bundle stylesheets loaded in head
# observable: true        # load the page bundle's observable.js as a module
# downloadId: viz         # id of the element whose <svg> the Download buttons export
---
