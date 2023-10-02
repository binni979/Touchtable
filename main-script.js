// Function to create dropdown options for each map
function createDropdownOptions(mapIndex) {
    const dropdown = document.getElementById(`dropdown${mapIndex}`);
    const layerSelect = dropdown.nextElementSibling.querySelector(`#layers${mapIndex}`);
    const submitButton = dropdown.nextElementSibling.querySelector('.submit');
    const datePicker = dropdown.nextElementSibling.querySelector(`#datePicker${mapIndex}`);
    // const dateRangeDisplay = document.getElementById('dateRangeDisplay');
    var selectTimeFrame, rangeDateandTime, available_dates, isPeriodic, timeDensity,description;

    // Fetch layers and populate dropdown options
    fetch(" https://staging-stac.delta-backend.com/collections")
            .then(response => response.json())
            .then(response => {
                // const availableDates = [];
                response.collections.forEach(collection => {
                    var opt = document.createElement("option");
                    opt.value = collection.id;
                    opt.label = collection.title;
                    layerSelect.appendChild(opt);
                    selectTimeFrame = collection.summaries.datetime;
                    rangeDateandTime = collection.extent.temporal.interval;
                    isPeriodic = collection["dashboard:is_periodic"];
                    timeDensity = collection["dashboard:time_density"];
                    description = collection.description;
                    const minDate = formatDateToYYYYMMDD(rangeDateandTime[0][0]);
                    const maxDate = formatDateToYYYYMMDD(rangeDateandTime[0][1]) ;

                    const availableDates = getAvailableDatesFromDashboard(collection);
                    console.log("Available dates for", collection.title, ":", availableDates);

                    // Store the date and time range as data attributes on the option element
                    opt.setAttribute('data-min-date', minDate);
                    opt.setAttribute('data-max-date', maxDate);
                    opt.setAttribute('data-select-timeframe', availableDates);// Store the selectTimeFrame
                    opt.setAttribute('data-description', description);
                    opt.setAttribute('is-periodic', isPeriodic);
                    opt.setAttribute('time-density', timeDensity);

                });
            });
    layerSelect.addEventListener("change", () => {
            const selectedOption = layerSelect.options[layerSelect.selectedIndex];
            const minDate = selectedOption.getAttribute('data-min-date');
            const maxDate = selectedOption.getAttribute('data-max-date');
            available_dates = selectedOption.getAttribute('data-select-timeframe');
            datePicker.setAttribute("min", minDate);
            datePicker.setAttribute("max", maxDate);
            available_dates = formatDateToYYYYMMDD(available_dates);
        }
    );
        //
        datePicker.addEventListener('change', () => {
            selected_date = datePicker.value;
        });

    submitButton.addEventListener('click', async () => {
            console.log(available_dates, selected_date, description, "MMMMM");
            var selected_layer = layerSelect.value;
            var selected_date = datePicker.value;
            if (!available_dates.includes(selected_date)) {
                alert("These are the dates" + " " + ":" + " " + available_dates);
            } else {
                rasterUrl = "https://staging-raster.delta-backend.com/mosaic/register";
                var response1 = await postData(rasterUrl, {
                    collections: [selected_layer],
                    datetime: selected_date
                });
                mosicid = response1.searchid;
                console.log(mosicid)

                const jsonUrl = 'output.json';
                const response = await fetch(jsonUrl);
                const jsonData = await response.json();
                console.log(jsonData);

                if (jsonData.hasOwnProperty(selected_layer)) {
                    const selectedCollectionData = jsonData[selected_layer];
                    console.log(selectedCollectionData);

                    // Extract colormapName, rescale, and nodata from selectedCollectionData
                    const colormapName = selectedCollectionData.colormap;
                    const rescale = selectedCollectionData.rescale;
                    // const nodata = selectedCollectionData.nodata;
                    const stacCol = selected_layer;
                    const type = selectedCollectionData.type;
                    console.log(type)
                    const colormapScale = selectedCollectionData.stops;
                    console.log(colormapScale, "type")
                    const name = selectedCollectionData.name;

                    var url;
                    if (available_dates.includes(selected_date) && selected_layer === stacCol) {
                        // url = `https://staging-raster.delta-backend.com/mosaic/tiles/${mosicid}/WebMercatorQuad/{z}/{x}/{y}@1x?assets=cog_default&colormap_name=${colormapName}&rescale=${rescale[0]}%2C${rescale[1]}&nodata=${nodata}`;
                        url = `https://staging-raster.delta-backend.com/mosaic/tiles/${mosicid}/WebMercatorQuad/{z}/{x}/{y}@1x?assets=cog_default&colormap_name=${colormapName}&rescale=${rescale[0]}%2C${rescale[1]}&nodata=0`;

                        const legendElement = document.getElementById(`legend${mapIndex}`);
                        legendElement.innerHTML = '';
                        const stacColParagraph = document.createElement('p');
                        stacColParagraph.className = 'legend-stacCol';
                        stacColParagraph.textContent = `${name}`;
                        legendElement.appendChild(stacColParagraph);

                        if (type === "categorical") {
                            const legendItemContainer = document.createElement('div');
                            legendItemContainer.className = 'legend-item-container';

                            stops.forEach((stop, index) => {
                                const color = stop.color;
                                const label = stop.label;

                                const item = document.createElement('div');
                                item.className = 'legend-item';

                                const colorBox = document.createElement('span');
                                colorBox.className = 'color-box';
                                colorBox.style.backgroundColor = color;

                                const labelSpan = document.createElement('span');
                                labelSpan.className = 'label-text';
                                labelSpan.textContent = label;

                                item.appendChild(colorBox);
                                item.appendChild(labelSpan);

                                legendItemContainer.appendChild(item);
                            });

                            legendElement.appendChild(legendItemContainer);
                        } else if (type === "gradient") {
                                const stops = colormapScale;
                                const min = rescale[0];
                                const max = rescale[1];
                                const range = max - min;

                                const legendItemContainer = document.createElement('div');
                                legendItemContainer.className = 'legend-item-container';

                                stops.forEach((stopColor, index) => {
                                    const value = min + (index / (stops.length - 1)) * range;
                                    const item = document.createElement('div');
                                    item.className = 'legend-item';

                                    const colorBox = document.createElement('span');
                                    colorBox.className = 'color-box';
                                    colorBox.style.backgroundColor = stopColor;

                                    const labelSpan = document.createElement('span');
                                    labelSpan.className = 'label-text';
                                    labelSpan.textContent = value.toFixed(2);

                                    item.appendChild(colorBox);
                                    item.appendChild(labelSpan);

                                    legendItemContainer.appendChild(item);
                                });

                                legendElement.appendChild(legendItemContainer);
                            }
                        }
                    }
                else {
                    const legendElement = document.getElementById(`legend${mapIndex}`);
                    legendElement.innerHTML = '';
                        url = `https://staging-raster.delta-backend.com/mosaic/tiles/${mosicid}/WebMercatorQuad/{z}/{x}/{y}@1x?assets=cog_default&nodata=0`;
                }
                    updateMapWithRaster(url, mapIndex);
                }
            hideDropdownContent(mapIndex);
        });
    }

function formatDateToYYYYMMDD(dateString) {
        const date = new Date(dateString);
        const formattedDate = date.toISOString().split('T')[0];
        return formattedDate;
}


function getAvailableDatesFromDashboard(collection) {
  const isPeriodic = collection["dashboard:is_periodic"];
  const timeDensity = collection["dashboard:time_density"];
  const summaries = collection.summaries.datetime;
  console.log(isPeriodic, "isperiodic", timeDensity, "timedensity", summaries, "summaries")

  if (!isPeriodic || !summaries) {
    // If isPeriodic is false or summaries is missing, return all available dates
    return summaries || null;
  }

  const startDate = new Date(summaries[0]);
  const endDate = new Date(summaries[summaries.length - 1]);

  const availableDates = [];

  if (isPeriodic) {
    if (timeDensity === "day") {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        availableDates.push(currentDate.toISOString());
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (timeDensity === "month") {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        availableDates.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString());
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else if (timeDensity === "year") {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        availableDates.push(currentDate.toISOString());
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }
  }
  return availableDates.map(date => date.slice(0, 19) + 'Z')
  console.log(availableDates);
}


// Function to update the map with the raster image based on selected layer, date, and map index
    function updateMapWithRaster(url, mapIndex) {
        const map = maps[mapIndex - 1];

        // Remove existing raster layer (if any)
          const existingLayerId = `raster-layer${mapIndex}`;
          if (map.getLayer(existingLayerId)) {
            map.removeLayer(existingLayerId);
          }
          if (map.getSource(`imagery${mapIndex}`)) {
            map.removeSource(`imagery${mapIndex}`);
          }


        const source_id = `imagery${mapIndex}`;
        // Add raster layer
        map.addSource(source_id, {
            type: 'raster',
            tiles: [url],
        });

        map.addLayer({
            id: `raster-layer${mapIndex}`,
            type: 'raster',
            source: source_id,
            paint: {
                'raster-opacity': 0.70,
            },
        });
    }

    // Add event listeners to dropdowns dynamically
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach((dropdown, index) => {
        const mapIndex = index + 1;
        const dropdownBtn = dropdown.querySelector('button');
        const dropdownContent = dropdown.querySelector('.dropdown-content');

        dropdownBtn.addEventListener('click', () => {
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        });

        // Create dropdown options for each map
        // createDropdownOptions(mapIndex);
        // const map = maps[index];
        // map.on('click', () => {
        //     dropdownContent.style.display = 'none';
        // });
        createDropdownOptions(mapIndex);
        maps.forEach(map => {
            map.on('click', ()=>{
                dropdownContent.style.display = 'none';
            })
        })
    });

    function hideDropdownContent(mapIndex) {
        const dropdownContent = document.querySelector(`#dropdown${mapIndex} + .dropdown-content`);
        dropdownContent.style.display = 'none';
    }
    maps.forEach(map => {
        map.on('resize', () => {
            map.resize(); // Adjust map size
        });
    });

    // Function to handle reset button click
    const resetButton = document.querySelector('#reset');
    resetButton.addEventListener('click', () => {
        const confirmed = confirm("Are you sure to reset? Other users might be affected by this.");
        if (confirmed) {
            maps.forEach((map, index) => {
                const initialCenterZoomStyle = INITIAL_CENTER_ZOOM_STYLE[index];
                map.setCenter(initialCenterZoomStyle.center);
                map.setZoom(initialCenterZoomStyle.zoom);
                map.setStyle(initialCenterZoomStyle.style);
                const legendElement = document.getElementById(`legend${index + 1}`);
                legendElement.innerHTML = '';
            });
        }
    });

// Function to make POST request
async function postData(url = "", data = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return response.json();
}
