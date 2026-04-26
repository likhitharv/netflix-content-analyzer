# Netflix Content Analyzer

A lightweight, full-stack web application built to parse, analyze, and visualize Netflix catalog data. 

This project was designed with clean architecture in mind. Rather than relying on heavy external frameworks, it demonstrates how to build and connect a custom Python REST API to a responsive, vanilla JavaScript frontend. It processes thousands of rows of local dataset files and renders the insights dynamically in the browser.

## Features

* **Custom Python HTTP Server:** Processes CSV data and serves it via a REST API without using frameworks like Flask or Django.
* **Vanilla JavaScript Frontend:** Handles asynchronous data fetching and DOM updates cleanly and efficiently.
* **Interactive Visualization:** Integrates Chart.js via CDN to display responsive data charts.
* **Zero Backend Dependencies:** The server relies entirely on Python's built-in standard libraries (`http.server`, `csv`, `json`).

## Tech Stack

* **Backend:** Python 3
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Visualization:** Chart.js
* **Data Source:** CSV (`netflix_titles.csv`)

## Project Structure

```text
netflix_content_analyzer/
├── backend/
│   ├── netflix_titles.csv    # The dataset
│   └── server.py             # Python HTTP server and API logic
├── frontend/
│   ├── index.html            # Main UI structure
│   └── script.js             # Data fetching and chart rendering
├── .gitignore                # Untracked files configuration
└── README.md                 # Project documentation
