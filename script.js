const API_URL = "https://nse-backend-utot.onrender.com//top-stocks";
const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

// Green/Red shades
const greenShades = ["#006600", "#009900", "#00cc00", "#00ff00"];
const redShades   = ["#660000", "#990000", "#cc0000", "#ff0000"];
const maxChange = 20;

// Format turnover
function humanFormat(num){
  if(num >= 1e9) return (num/1e9).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "B";
  if(num >= 1e6) return (num/1e6).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "M";
  if(num >= 1e3) return (num/1e3).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "K";
  return num.toString();
}

// Map pChange to shade
function getShade(pChange){
  if(pChange > 0){
    const step = maxChange / greenShades.length;
    let idx = Math.floor(pChange / step);
    if(idx >= greenShades.length) idx = greenShades.length - 1;
    return greenShades[idx];
  } else if(pChange < 0){
    const step = maxChange / redShades.length;
    let idx = Math.floor(Math.abs(pChange) / step);
    if(idx >= redShades.length) idx = redShades.length - 1;
    return redShades[idx];
  } else {
    return "#d2b48c"; // neutral
  }
}

// Render summary
function renderSummary(summary){
  const summaryDiv = document.getElementById("summary");
  summaryDiv.innerHTML = `
    <span class="advances">Advances: ${summary.advances}</span>
    <span class="declines">Declines: ${summary.declines}</span>
    <span class="unchanged">Unchange: ${summary.unchanged}</span>
  `;
}

// Render grid
function renderGrid(stocks){
  const grid = document.getElementById("stockGrid");
  grid.innerHTML = ""; // clear old

  stocks.forEach(stock => {
    const cube = document.createElement("div");
    cube.className = "cube";

    cube.style.backgroundColor = getShade(stock.pChange);
    cube.style.color = 'white';

    // Format turnover
    const turnoverText = humanFormat(stock.totalTradedValue);

    // Create cube HTML
    cube.innerHTML = `
      <div class="symbol">${stock.symbol}</div>
      <div class="pchange">${stock.pChange.toFixed(2)}%</div>
      <div class="turnover">${turnoverText}</div>
    `;

    // Highlight turnover depending on unit
    const turnoverEl = cube.querySelector(".turnover");
    if (turnoverText.endsWith("B")) {
      turnoverEl.style.color = "gold";       // Billion = Gold
      turnoverEl.style.fontWeight = "bold";
    } else if (turnoverText.endsWith("M")) {
      turnoverEl.style.color = "silver";     // Million = Silver
    } else if (turnoverText.endsWith("K")) {
      turnoverEl.style.color = "peru";       // Thousand = Bronze-ish
    }

    cube.addEventListener('click', () => {
      navigator.clipboard.writeText(stock.symbol);
    });

    grid.appendChild(cube);
  });
}


// Fetch and render
async function fetchDataAndRender(){
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // Validate
    if(data.stocks && data.summary){
      renderSummary(data.summary);
      renderGrid(data.stocks);
    } else {
      console.error("Invalid data format", data);
    }
  } catch(err){
    console.error("Failed to fetch:", err);
  }
}

// Initial fetch
fetchDataAndRender();

// Auto refresh every 4 minutes
setInterval(fetchDataAndRender, REFRESH_INTERVAL);

