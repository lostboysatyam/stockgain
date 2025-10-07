const API_URL = "https://nse-backend-utot.onrender.com/top-stocks"; // ✅ Fixed double slash
const REFRESH_INTERVAL = 1.5 * 60 * 1000; // 1.5 minutes

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

// Calculate readable text color based on background
function getContrastColor(hex) {
  const r = parseInt(hex.substr(1,2),16);
  const g = parseInt(hex.substr(3,2),16);
  const b = parseInt(hex.substr(5,2),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? "black" : "white";
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

  // Fade out old grid for smooth transition
  grid.style.opacity = 0;

  setTimeout(() => {
    grid.innerHTML = ""; // clear old

    stocks.forEach(stock => {
      const cube = document.createElement("div");
      cube.className = "cube";

      const bgColor = getShade(stock.pChange);
      cube.style.backgroundColor = bgColor;

      // ✅ Dynamic text color for readability
      cube.style.color = getContrastColor(bgColor);

      const turnoverText = humanFormat(stock.totalTradedValue);

      cube.innerHTML = `
        <div class="symbol">${stock.symbol}</div>
        <div class="pchange">${stock.pChange.toFixed(2)}%</div>
        <div class="turnover">${turnoverText}</div>
      `;

      const turnoverEl = cube.querySelector(".turnover");
      if (turnoverText.endsWith("B")) {
        turnoverEl.style.color = "gold";       
        turnoverEl.style.fontWeight = "bold";
      } else if (turnoverText.endsWith("M")) {
        turnoverEl.style.color = "silver";     
      } else if (turnoverText.endsWith("K")) {
        turnoverEl.style.color = "peru";       
      }

      cube.addEventListener('click', (e) => {
        navigator.clipboard.writeText(stock.symbol);

        const ripple = document.createElement("span");
        ripple.classList.add("ripple");

        const rect = cube.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        cube.appendChild(ripple);
        setTimeout(() => ripple.remove(), 350);
      });

      grid.appendChild(cube);
    });

    // Fade in after update
    grid.style.opacity = 1;
  }, 200); 
}

// Fetch and render
async function fetchDataAndRender(){
  try {
    const res = await fetch(API_URL);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if(data.error){
      console.error("Backend error:", data.error);
      document.getElementById("summary").innerHTML = "<span style='color:red'>⚠️ Data unavailable</span>";
      return;
    }
    
    if(data.stocks && data.summary){
      renderSummary(data.summary);
      renderGrid(data.stocks);
    } else {
      console.error("Invalid data format", data);
    }
  } catch(err){
    console.error("Failed to fetch:", err);
    document.getElementById("summary").innerHTML = "<span style='color:red'>⚠️ Data fetch failed</span>";
  }
}

// Initial fetch
fetchDataAndRender();

// Auto refresh every 1.5 minutes
setInterval(fetchDataAndRender, REFRESH_INTERVAL);

