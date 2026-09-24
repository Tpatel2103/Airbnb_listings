let favorites = 0;


/*
    Load the Airbnb JSON file
    using fetch() and await.
*/

async function loadListings() {

    try {

        const response = await fetch(
            "data/airbnb_sf_listings_500.json"
        );


        if (!response.ok) {

            throw new Error(
                "Could not load the JSON file."
            );

        }


        const data = await response.json();


        /*
            Get the listings from the JSON.

            This supports either:
            - a JSON array
            - data.listings
            - data.results
        */

        let listings;


        if (Array.isArray(data)) {

            listings = data;

        } else if (Array.isArray(data.listings)) {

            listings = data.listings;

        } else if (Array.isArray(data.results)) {

            listings = data.results;

        } else {

            throw new Error(
                "The JSON format was not recognized."
            );

        }


        /*
            The assignment asks for
            the first 50 listings.
        */

        listings = listings.slice(0, 50);


        displayListings(listings);


    } catch (error) {

        console.error(error);

        document.getElementById("loading").style.display =
            "none";

        document.getElementById("error").textContent =
            "Sorry, the listings could not be loaded.";

    }

}


/*
    Display all 50 listings.
*/

function displayListings(listings) {

    const container =
        document.getElementById("listings");


    document.getElementById("loading").style.display =
        "none";


    listings.forEach((listing, index) => {


        /*
            Listing information
        */

        const name =
            listing.name ||
            "Unnamed Airbnb Listing";


        const description =
            listing.description ||
            listing.summary ||
            "No description available.";


        const hostName =
            listing.host_name ||
            listing.hostName ||
            "Unknown Host";


        const price =
            listing.price ||
            "Price unavailable";


        const image =
            listing.picture_url ||
            listing.thumbnail_url ||
            listing.picture ||
            "";


        const hostImage =
            listing.host_picture_url ||
            listing.host_thumbnail_url ||
            listing.host_picture ||
            "";


        const amenities =
            listing.amenities ||
            [];


        /*
            Create card
        */

        const card =
            document.createElement("article");


        card.className =
            "listing-card";


        card.innerHTML = `

            <div class="image-container">

                ${
                    image
                    ?
                    `<img
                        src="${image}"
                        alt="${name}"
                        class="listing-image"
                        onerror="this.style.display='none'"
                    >`
                    :
                    `<div
                        class="listing-image"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            background:#ddd;
                        "
                    >
                        No Image
                    </div>`
                }


                <button
                    class="favorite-button"
                    title="Add to favorites"
                >
                    ♡
                </button>

            </div>


            <div class="listing-content">


                <h2>
                    ${name}
                </h2>


                <p class="description">
                    ${description}
                </p>


                <div class="price">

                    ${price}

                    <span
                        style="
                            font-size:14px;
                            font-weight:normal;
                        "
                    >
                        / night
                    </span>

                </div>


                <div class="host">

                    ${
                        hostImage
                        ?
                        `<img
                            src="${hostImage}"
                            alt="${hostName}"
                            class="host-image"
                            onerror="this.style.display='none'"
                        >`
                        :
                        `<div
                            class="host-image"
                        ></div>`
                    }


                    <div class="host-name">

                        Hosted by
                        <strong>
                            ${hostName}
                        </strong>

                    </div>

                </div>


                <div class="amenities">

                    <div class="amenities-title">
                        Amenities
                    </div>

                    <div>
                        ${formatAmenities(amenities)}
                    </div>

                </div>


                <button
                    class="details-button"
                >
                    Listing #${index + 1}
                </button>


            </div>

        `;


        /*
            Creative feature:
            Favorite button.
        */

        const favoriteButton =
            card.querySelector(".favorite-button");


        favoriteButton.addEventListener(
            "click",
            function () {


                if (
                    favoriteButton.textContent.trim()
                    === "♡"
                ) {

                    favoriteButton.textContent =
                        "♥";

                    favoriteButton.classList.add(
                        "selected"
                    );

                    favorites++;


                } else {

                    favoriteButton.textContent =
                        "♡";

                    favoriteButton.classList.remove(
                        "selected"
                    );

                    favorites--;

                }


                document.getElementById(
                    "favoriteCount"
                ).textContent = favorites;

            }
        );


        container.appendChild(card);

    });

}


/*
    Format amenities.
*/

function formatAmenities(amenities) {


    if (!amenities) {

        return "No amenities listed.";

    }


    /*
        If amenities is an array
    */

    if (Array.isArray(amenities)) {

        if (amenities.length === 0) {

            return "No amenities listed.";

        }


        return amenities
            .slice(0, 6)
            .join(" • ");

    }


    /*
        If amenities is a string
    */

    if (typeof amenities === "string") {

        return amenities
            .replace("[", "")
            .replace("]", "")
            .replace(/"/g, "")
            .split(",")
            .slice(0, 6)
            .join(" • ");

    }


    return "No amenities listed.";

}


/*
    Start the webpage.
*/

loadListings();