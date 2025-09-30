async function fetchWeather() {
    const ApiURL = "https://api.ambientweather.net/v1/devices?applicationKey=40b33f6a63754b5fb70a4d5fe557c64efcdd693597924c21986b47e71e1e68eb&apiKey=c5cc20bfdc0446aaaddd4543eb04c64c4852dcd72d1f4d5d8c7f207c1d21036a";

    const response = await fetch(ApiURL);
    const data = await response.json();
    console.log(data);

    // helper: truncate to 2 decimal places without rounding up
    function toHundredths(num) {
        return Math.floor(num * 100) / 100;
    }

    const lastUpdate = document.querySelector(".subtitle");

    const temp = document.getElementById("temp");
    const humidity = document.getElementById("humidity");
    const rainToday = document.getElementById("rain");
    const solar = document.getElementById("solar");
    const uv = document.getElementById("uv");
    const pressure = document.getElementById("pressure");
    const dewpoint = document.getElementById("dewpoint");
    const feelslike = document.getElementById("feelslike");
    
    lastUpdate.innerHTML = `Last Update: ${new Date(data[0].lastData.dateutc).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "short", timeStyle: "short" })} CDT`;
    temp.innerHTML = `${data[0].lastData.tempf}°F`;
    humidity.innerHTML = `${data[0].lastData.humidity}%`;
    rainToday.innerHTML = `${toHundredths(data[0].lastData.dailyrainin).toFixed(2)}"`;
    solar.innerHTML = `${data[0].lastData.solarradiation} W/m²`;
    uv.innerHTML = `${data[0].lastData.uv}`;
    pressure.innerHTML = `${toHundredths(data[0].lastData.baromrelin).toFixed(2)} inHg`;
    dewpoint.innerHTML = `${data[0].lastData.dewPoint}°F`;
    feelslike.innerHTML = `${data[0].lastData.feelsLike}°F`;
}

fetchWeather();
