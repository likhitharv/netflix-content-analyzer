
const API_URL = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws/live_viewers";
const netflixRed = '#E50914';
const netflixBlue = '#0071eb';


let currentType = "All";
let currentYear = 2021;
let isDarkMode = true;
let liveSocket = null;


const themeBtn = document.getElementById('theme_btn');
const htmlEl = document.documentElement;
const yearSlider = document.getElementById('year_slider');
const yearVal = document.getElementById('year_val');
const contentRadios = document.getElementsByName('content_type');
const startLiveBtn = document.getElementById('start_live_btn');


function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function getBaseLayout() {
    const textColor = isDarkMode ? '#ffffff' : '#333333';
    return {
        paper_bgcolor: 'rgba(0,0,0,0)', 
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, family: 'Helvetica Neue, sans-serif' },
        margin: { t: 10, l: 30, r: 10, b: 40 }, // Slightly reduced margins for mobile
        xaxis: { gridcolor: 'rgba(128, 128, 128, 0.2)' },
        yaxis: { gridcolor: 'rgba(128, 128, 128, 0.2)' }
    };
}


function getIconForGenre(genre) {
    const style = "font-family: 'Font Awesome 6 Free'; font-weight: 900;";
    const iconMap = {
        "International Movies": "&#xf0ac;",      
        "Dramas": "&#xf22d;",                    
        "Documentaries": "&#xf03d;",             
        "Action & Adventure": "&#xf135;",        
        "Children & Family Movies": "&#xf0c0;",  
        "Independent Movies": "&#xf008;",        
        "Romantic Movies": "&#xf004;",           
        "Thrillers": "&#xf21b;",                 
        "Comedies": "&#xf588;",                  
        "TV Dramas": "&#xf26c;",                 
        "International TV Shows": "&#xf0ac;",    
        "TV Comedies": "&#xf26c;",               
    };
    const unicode = iconMap[genre] || "&#xf02b;"; 
    return `<span style="${style}">${unicode}</span>`;
}

//Data Fetching and Visualizations 
async function fetchAndRenderDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard_stats?content_type=${currentType}&max_year=${currentYear}`);
        const data = await res.json();
        renderCharts(data.line_chart, data.bar_chart, data.tree_chart);
    } catch (error) { console.error("Error fetching dashboard data:", error); }
}

function renderCharts(lineData, barData, treeData) {
    //Line Chart
    const lineTraces = [
        { x: lineData.year, y: lineData.movies, type: 'scatter', mode: 'lines', name: 'Movie', line: { color: netflixBlue, width: 3 } },
        { x: lineData.year, y: lineData.tv_shows, type: 'scatter', mode: 'lines', name: 'TV Show', line: { color: netflixRed, width: 3 } }
    ];
    Plotly.newPlot('line_chart', lineTraces, getBaseLayout(), {responsive: true, displayModeBar: false});

    //Bar Chart
    const barTrace = {
        x: barData.countries, y: barData.counts, type: 'bar',
        marker: { color: [netflixRed, '#ff7378', '#ff7378', '#ff7378', '#ff7378', '#ff7378', '#ff7378', '#ff7378', '#ff7378', '#ff7378'] }
    };
    Plotly.newPlot('bar_chart', [barTrace], getBaseLayout(), {responsive: true, displayModeBar: false});

    //Genre TreeMap
    const formattedLabels = treeData.labels.map((label, index) => {
        const iconHTML = getIconForGenre(label);
        const count = treeData.values[index];
        return `${iconHTML} <b>${label}</b><br><span style="font-size:12px; opacity:0.85">${count} Titles</span>`;
    });

    const treeTrace = {
        type: "treemap",
        labels: formattedLabels,           
        parents: treeData.labels.map(() => ""), 
        values: treeData.values,
        hovertext: treeData.labels,        
        marker: { colors: [netflixRed], cmid: 0, colorscale: 'Reds' },
        textinfo: "label",
        tiling: { pad: 5 } 
    };
    
    
    const treeLayout = { 
        ...getBaseLayout(), 
        margin: { t: 0, l: 0, r: 0, b: 0 }
    };
    
    Plotly.newPlot('genre_tree_chart', [treeTrace], treeLayout, {responsive: true, displayModeBar: false});
}

//Live Data WebSockets
startLiveBtn.addEventListener('click', (e) => {
    if (liveSocket) return; 

    e.target.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Live Simulation Running...`;
    e.target.classList.add("opacity-80");

    liveSocket = new WebSocket(WS_URL);

    liveSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`Live Spike: +${data.live_spike} viewers!`);
        e.target.innerHTML = `<i class="fa-solid fa-satellite-dish mr-2"></i> Spike: +${data.live_spike} Viewers!`;
    };

    liveSocket.onerror = (error) => { console.error("WebSocket Error:", error); };
    liveSocket.onclose = () => { console.log("Live Simulation stopped."); };
});

// Custom Theme Toggle Logic
themeBtn.addEventListener('click', () => {
    htmlEl.classList.toggle('dark');
    isDarkMode = htmlEl.classList.contains('dark');
    themeBtn.innerHTML = isDarkMode ? '<i class="fa-solid fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode';
    fetchAndRenderDashboard(); 
});

//Interaction Event Listeners
contentRadios.forEach(radio => { 
    radio.addEventListener('change', (e) => { 
        currentType = e.target.value; 
        fetchAndRenderDashboard(); 
    }); 
});

const processSliderChange = debounce(() => { fetchAndRenderDashboard(); }, 300);

yearSlider.addEventListener('input', (e) => {
    currentYear = e.target.value;
    yearVal.innerText = currentYear;
    processSliderChange(); 
});


window.addEventListener('resize', debounce(() => {
    Plotly.Plots.resize('line_chart');
    Plotly.Plots.resize('bar_chart');
    Plotly.Plots.resize('genre_tree_chart');
}, 200));


fetchAndRenderDashboard();