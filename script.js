let favorites = 0;

async function loadListings() {
    try {
        const response = await fetch("data/airbnb_listings.json");

        if (!response.ok) {
            throw new Error("Could not load the listings data.");
        }

        const data = await response.json();

        // Get the first 50 listings
        const listings = data.slice(0, 50);

        displayListings(listings);

    } catch (error) {
        console.error(error);

        document.getElementById("loading").textContent =
            "Sorry, the listings could not be loaded.";
    }
}


function displayListings(listings) {

    const container = document.getElementById("listings");

    document.getElementById("loading").style.display = "none";

    listings.forEach((listing, index) => {

        const card = document.createElement("article");

        card.className = "listing-card";

        card.innerHTML = `
            <div class="image-container">
                <img
                    src="${listing.picture_url || listing.thumbnail_url}"
                    alt="${listing.name || "Airbnb listing"}"
                    class="listing-image"
                >

                <button class="favorite-button">
                    ♡
                </button>
            </div>

            <div class="listing-content">

                <h2>${listing.name || "Unnamed Listing"}</h2>

                <p class="description">
                    ${listing.description || "No description available."}
                </p>

                <div class="price">
                    $${listing.price || "N/A"} / night
                </div>

                <div class="host">
                    <img
                        src="${listing.host_picture_url || ""}"
                        alt="Host photo"
                        class="host-image"
                    >

                    <div>
                        <strong>Hosted by ${listing.host_name || "Unknown host"}</strong>
                    </div>
                </div>

                <div class="amenities">
                    <strong>Amenities</strong>
                    <p>${formatAmenities(listing.amenities)}</p>
                </div>

                <button class="details-button">
                    View Listing
                </button>

            </div>
        `;

        const favoriteButton =
            card.querySelector(".favorite-button");

        favoriteButton.addEventListener("click", () => {

            if (favoriteButton.textContent === "♡") {

                favoriteButton.textContent = "♥";
                favoriteButton.classList.add("selected");

                favorites++;

            } else {

                favoriteButton.textContent = "♡";
                favoriteButton.classList.remove("selected");

                favorites--;
            }

            document.getElementById("favoriteCount").textContent =
                favorites;
        });

        container.appendChild(card);
    });
}


function formatAmenities(amenities) {

    if (!amenities) {
        return "No amenities listed.";
    }

    // Some Airbnb datasets store amenities as a string
    if (typeof amenities === "string") {

        return amenities
            .replace("[", "")
            .replace("]", "")
            .replace(/"/g, "")
            .split(",")
            .slice(0, 5)
            .join(" • ");
    }

    // If amenities is already an array
    if (Array.isArray(amenities)) {
        return amenities.slice(0, 5).join(" • ");
    }

    return "No amenities listed.";
}


loadListings();