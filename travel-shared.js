(function() {
  var data = window.travelData || {
    places: [],
    regionLocalNames: {},
    photoOrientations: {}
  };
  var preferredRegionOrder = [
    "California",
    "Texas",
    "Washington",
    "Nevada",
    "District of Columbia",
    "New York",
    "Taiwan",
    "Japan",
    "Vietnam",
    "Thailand",
    "Laos",
    "Cambodia",
    "Malaysia",
    "Brunei",
    "Indonesia",
    "Singapore",
    "Australia",
    "Shandong",
    "Yunnan",
    "Guizhou",
    "Fujian",
    "Hubei",
    "Jilin",
    "Liaoning"
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function(character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function thumbnailSrc(src) {
    return src
      .replace(/^img\//, "img/thumbs/")
      .replace(/\.(jpe?g|png|webp|heic)$/i, ".webp");
  }

  function textLabel(primary, local) {
    return local && local !== primary ? primary + " / " + local : primary;
  }

  function htmlLabel(primary, local) {
    if (!local || local === primary) {
      return escapeHtml(primary);
    }

    return escapeHtml(primary) + ' <span class="local-name">/ <bdi dir="auto">' + escapeHtml(local) + "</bdi></span>";
  }

  function countPhotosForPlace(place) {
    return place && place.photos ? place.photos.length : 0;
  }

  function totalPhotoCount() {
    return data.places.reduce(function(total, place) {
      return total + countPhotosForPlace(place);
    }, 0);
  }

  function regionOrder(region) {
    var index = preferredRegionOrder.indexOf(region);
    return index >= 0 ? index : preferredRegionOrder.length + 1;
  }

  function compareRegions(a, b) {
    var rankDelta = regionOrder(a) - regionOrder(b);
    if (rankDelta !== 0) {
      return rankDelta;
    }

    var photoDelta = regionPhotoCount(b) - regionPhotoCount(a);
    if (photoDelta !== 0) {
      return photoDelta;
    }

    return String(a).localeCompare(String(b));
  }

  function comparePlaces(a, b) {
    var regionDelta = compareRegions(a.region, b.region);
    if (regionDelta !== 0) {
      return regionDelta;
    }

    var photoDelta = countPhotosForPlace(b) - countPhotosForPlace(a);
    if (photoDelta !== 0) {
      return photoDelta;
    }

    return textLabel(a.name, a.localName).localeCompare(textLabel(b.name, b.localName));
  }

  function uniqueRegions(options) {
    var onlyWithPhotos = options && options.onlyWithPhotos;
    var regions = [];
    data.places.forEach(function(place) {
      if (onlyWithPhotos && !countPhotosForPlace(place)) {
        return;
      }
      if (regions.indexOf(place.region) === -1) {
        regions.push(place.region);
      }
    });
    return regions.sort(compareRegions);
  }

  function regionPhotoCount(region) {
    return data.places.reduce(function(total, place) {
      return total + (place.region === region ? countPhotosForPlace(place) : 0);
    }, 0);
  }

  function flattenPhotos(options) {
    var onlyWithPhotos = options && options.onlyWithPhotos;
    var entries = [];
    data.places.forEach(function(place, placeIndex) {
      if (!place.photos || !place.photos.length) {
        if (!onlyWithPhotos) {
          entries.push({
            type: "place",
            place: place,
            placeIndex: placeIndex,
            region: place.region
          });
        }
        return;
      }

      place.photos.forEach(function(photo, photoIndex) {
        entries.push({
          type: "photo",
          region: place.region,
          place: place,
          placeIndex: placeIndex,
          photo: photo,
          photoIndex: photoIndex,
          orientation: data.photoOrientations[photo.src] || "",
          thumbnail: thumbnailSrc(photo.src)
        });
      });
    });
    return entries.sort(function(a, b) {
      if (a.type === "place" || b.type === "place") {
        return comparePlaces(a.place, b.place);
      }

      var placeDelta = comparePlaces(a.place, b.place);
      if (placeDelta !== 0) {
        return placeDelta;
      }

      return a.photoIndex - b.photoIndex;
    });
  }

  function placesWithPhotos(region) {
    return data.places.filter(function(place) {
      return (!region || place.region === region) && countPhotosForPlace(place) > 0;
    }).sort(comparePlaces);
  }

  function firstPhotoForRegion(region) {
    var match = placesWithPhotos(region)[0];
    return match && match.photos && match.photos[0] ? match.photos[0] : null;
  }

  function photoLabel(count) {
    return count + " photo" + (count === 1 ? "" : "s");
  }

  function regionLabel(region) {
    return textLabel(region, data.regionLocalNames[region]);
  }

  function placeLabel(place) {
    return textLabel(place.name, place.localName);
  }

  function createPhotoViewer() {
    var viewer = document.createElement("div");
    viewer.className = "photo-viewer";
    viewer.setAttribute("aria-hidden", "true");
    viewer.innerHTML = '' +
      '<button class="photo-viewer-close" type="button" aria-label="Close photo">X</button>' +
      '<div class="photo-viewer-content">' +
        '<img alt="">' +
        '<p class="photo-viewer-caption"></p>' +
        '<a class="photo-viewer-original" href="" target="_blank" rel="noopener">Open original file</a>' +
      "</div>";
    document.body.appendChild(viewer);

    var image = viewer.querySelector("img");
    var caption = viewer.querySelector(".photo-viewer-caption");
    var original = viewer.querySelector(".photo-viewer-original");

    function open(src, text) {
      image.src = src;
      image.alt = text || "";
      caption.textContent = text || "";
      original.href = src;
      viewer.classList.add("open");
      viewer.setAttribute("aria-hidden", "false");
      document.body.classList.add("viewer-open");
    }

    function close() {
      viewer.classList.remove("open");
      viewer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("viewer-open");
      image.src = "";
      original.href = "";
    }

    viewer.addEventListener("click", function(event) {
      if (event.target === viewer || event.target.closest(".photo-viewer-close")) {
        close();
      }
    });

    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && viewer.classList.contains("open")) {
        close();
      }
    });

    return { open: open, close: close, element: viewer };
  }

  window.travelShared = {
    data: data,
    escapeHtml: escapeHtml,
    thumbnailSrc: thumbnailSrc,
    textLabel: textLabel,
    htmlLabel: htmlLabel,
    countPhotosForPlace: countPhotosForPlace,
    totalPhotoCount: totalPhotoCount,
    preferredRegionOrder: preferredRegionOrder.slice(),
    regionOrder: regionOrder,
    compareRegions: compareRegions,
    comparePlaces: comparePlaces,
    uniqueRegions: uniqueRegions,
    regionPhotoCount: regionPhotoCount,
    flattenPhotos: flattenPhotos,
    placesWithPhotos: placesWithPhotos,
    firstPhotoForRegion: firstPhotoForRegion,
    photoLabel: photoLabel,
    regionLabel: regionLabel,
    placeLabel: placeLabel,
    createPhotoViewer: createPhotoViewer
  };
})();
