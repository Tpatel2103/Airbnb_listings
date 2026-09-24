# Airbnb Listings Explorer

This project is a web page that displays the first 50 Airbnb listings from a provided JSON dataset.

The page uses vanilla HTML, CSS, and JavaScript. The listings are loaded dynamically using JavaScript `fetch()` and `async/await`.

## Features

- Displays the first 50 Airbnb listings
- Loads listing data from a JSON file using `fetch()` and `async/await`
- Displays:
  - Listing name
  - Description
  - Price per night
  - Host name
  - Host photo
  - Listing photo
  - Amenities
- Responsive grid layout
- Works on desktop, tablet, and mobile screens
- Favorite button for each listing
- Favorite counter showing the number of selected listings
- Error message if the JSON data cannot be loaded

## Technologies Used

- HTML5
- CSS3
- JavaScript
- JSON
- JavaScript Fetch API
- GitHub Pages

## Project Structure

```text
airbnb-listings/
│
├── index.html
├── style.css
├── script.js
└── airbnb_sf_listings_500.json