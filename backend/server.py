from fastapi import FastAPI, WebSocket, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
import asyncio
import os 

app = FastAPI(title="Netflix Content Analyzer API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading and cleaning dataset...")
try:
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    CSV_PATH = os.path.join(BASE_DIR, "netflix_titles.csv")
    
    df = pd.read_csv(CSV_PATH) # <-- Changed to use absolute path
    df['date_added'] = pd.to_datetime(df['date_added'], errors='coerce')
    df['year_added'] = df['date_added'].dt.year
    df = df.dropna(subset=['year_added']) 
    df['year_added'] = df['year_added'].astype(int)
    
    df['genre_list'] = df['listed_in'].apply(lambda x: [item.strip() for item in x.split(',')])

    print(f"Dataset ready with {len(df)} titles!")
except Exception as e:
    print(f"CRITICAL ERROR loading data: {e}. Ensure 'netflix_titles.csv' is in backend folder.")
    df = pd.DataFrame()

@app.get("/api/dashboard_stats")
async def get_dashboard_stats(content_type: str = Query("All"), max_year: int = Query(2021)):
   
    if df.empty: return {"error": "Dataset not loaded"}

    filtered_df = df[df['year_added'] <= max_year]
    if content_type != "All":
        filtered_df = filtered_df[filtered_df['type'] == content_type]

    line_counts = filtered_df.groupby(['year_added', 'type']).size().unstack(fill_value=0).reset_index()
    
    line_data = {
        "year": line_counts['year_added'].tolist(),
        "movies": line_counts['Movie'].tolist() if 'Movie' in line_counts.columns else [0] * len(line_counts),
        "tv_shows": line_counts['TV Show'].tolist() if 'TV Show' in line_counts.columns else [0] * len(line_counts)
    }

    countries_exploded = filtered_df['country'].dropna().str.split(', ').explode()
    country_counts = countries_exploded.value_counts()
    
    bar_data = {
        "countries": country_counts.index[:10].tolist(),
        "counts": country_counts.values[:10].tolist()
    }

    genres_exploded = filtered_df['genre_list'].explode()
    top_genres = genres_exploded.value_counts().head(12)
    
    tree_data = {
        "labels": top_genres.index.tolist(),
        "values": top_genres.values.tolist(),
    }

    return {
        "line_chart": line_data,
        "bar_chart": bar_data,
        "tree_chart": tree_data
    }

@app.get("/api/search")
async def search_title(query: str):
    if df.empty: return []
    
    results = df[df['title'].str.contains(query, case=False, na=False)]
    
    return results[['title', 'type', 'director', 'country', 'release_year', 'description', 'duration', 'listed_in']].head(5).to_dict('records')

@app.websocket("/ws/live_viewers")
async def live_viewers_websocket(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket client connected for live viewers.")
    try:
        while True:
            viewer_spike = random.randint(50, 2000)
            await websocket.send_json({"live_spike": viewer_spike})
            await asyncio.sleep(2)
    except:
        print("WebSocket client disconnected.")