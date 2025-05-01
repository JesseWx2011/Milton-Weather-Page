// spc.js

// Create an object to hold the URLs for each day's outlook
const outlooks = {
    day1: "https://www.spc.noaa.gov/partners/outlooks/national/swody1.png",
    day2: "https://www.spc.noaa.gov/partners/outlooks/national/swody2.png",
    day3: "https://www.spc.noaa.gov/partners/outlooks/national/swody3.png",
    day4: "https://www.spc.noaa.gov/products/exper/day4-8/day4prob.gif",
    day5: "https://www.spc.noaa.gov/products/exper/day4-8/day5prob.gif",
    day6: "https://www.spc.noaa.gov/products/exper/day4-8/day6prob.gif",
    day7: "https://www.spc.noaa.gov/products/exper/day4-8/day7prob.gif",
    day8: "https://www.spc.noaa.gov/products/exper/day4-8/day8prob.gif",
    day1tornado: "https://www.spc.noaa.gov/partners/outlooks/national/swody1_TORN.png",
    day2tornado: "https://www.spc.noaa.gov/partners/outlooks/national/swody2_TORN.png",
    day1hail: "https://www.spc.noaa.gov/partners/outlooks/national/swody1_HAIL.png",
    day1wind: "https://www.spc.noaa.gov/partners/outlooks/national/swody1_WIND.png",
    day2hail: "https://www.spc.noaa.gov/partners/outlooks/national/swody2_HAIL.png",
    day2wind: "https://www.spc.noaa.gov/partners/outlooks/national/swody2_WIND.png",
    day3probalistic: "https://www.spc.noaa.gov/partners/outlooks/national/swody3_PROB.png",
};

// Get references to the select element and the display div
const outlookSelect = document.getElementById('outlook-select');
const outlookDisplay = document.getElementById('outlook-display');

// Function to update the display based on the selected outlook
function updateOutlook() {
    const selectedValue = outlookSelect.value;
    const imageUrl = outlooks[selectedValue];

    // Update the display div with the selected image
    outlookDisplay.innerHTML = `<img class="outlookImg" src="${imageUrl}" alt="${selectedValue} Outlook">`;
}

// Add an event listener to the select element to call updateOutlook on change
outlookSelect.addEventListener('change', updateOutlook);

// Optionally, trigger the update on page load to show the default selection
updateOutlook();
