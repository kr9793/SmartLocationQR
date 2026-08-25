let allLocations = [];
let activeCategory = "All";


/* ==========================================
   LOAD LOCATIONS
   ========================================== */

async function loadLocations() {

    try {

        const [locRes, schedRes] = await Promise.all([
            fetch("assets/data/locations.json?v=" + Date.now()),
            fetch("assets/data/schedule.json?v=" + Date.now())
        ]);

        if (!locRes.ok) {
            throw new Error("Unable to load locations");
        }

        const locationsData = await locRes.json();
        
        let schedulesData = [];
        if (schedRes.ok) {
            try {
                schedulesData = await schedRes.json();
            } catch (e) {
                console.error("Failed to parse schedule", e);
            }
        }

        allLocations = locationsData.map(loc => {
            const sched = schedulesData.find(s => String(s.location_id) === String(loc.id));
            return {
                ...loc,
                schedule: sched ? sched.sessions : []
            };
        }).filter(loc => loc.schedule.length > 0);


        buildFilterChips(
            allLocations
        );


        document.getElementById(
            "skeletonGrid"
        ).style.display =
            "none";


        document.getElementById(
            "locations"
        ).style.display =
            "grid";


        applyFilters();

    }

    catch (error) {

        console.error(error);

        document.getElementById(
            "skeletonGrid"
        ).style.display =
            "none";

        document.getElementById(
            "homeError"
        ).style.display =
            "block";

    }

}


/* ==========================================
   FILTER CHIPS
   ========================================== */

function buildFilterChips(locations) {

    const categories =
        Array.from(
            new Set(
                locations
                    .map(l => l.category)
                    .filter(Boolean)
            )
        );


    const container =
        document.getElementById(
            "filterChips"
        );


    container.innerHTML = "";


    if (categories.length === 0) {

        return;

    }


    const allChip =
        document.createElement(
            "button"
        );

    allChip.type = "button";
    allChip.className =
        "chip active";
    allChip.textContent = "All";

    allChip.addEventListener(
        "click",
        () => selectCategory("All")
    );

    container.appendChild(
        allChip
    );


    categories.forEach(
        category => {

            const chip =
                document.createElement(
                    "button"
                );

            chip.type = "button";
            chip.className = "chip";
            chip.textContent = category;

            chip.addEventListener(
                "click",
                () => selectCategory(category)
            );

            container.appendChild(
                chip
            );

        }
    );

}


function selectCategory(category) {

    activeCategory = category;


    document
        .querySelectorAll(
            "#filterChips .chip"
        )
        .forEach(
            chip => {

                chip.classList.toggle(
                    "active",
                    chip.textContent === category
                );

            }
        );


    applyFilters();

}


/* ==========================================
   FILTER + SEARCH
   ========================================== */

function applyFilters() {

    const search =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase()
            .trim();


    let filtered =
        allLocations;


    if (activeCategory !== "All") {

        filtered =
            filtered.filter(
                l =>
                    l.category ===
                    activeCategory
            );

    }


    if (search) {

        filtered =
            filtered.filter(
                location => {

                    const name =
                        String(
                            location.name || ""
                        ).toLowerCase();


                    const description =
                        String(
                            location.description || ""
                        ).toLowerCase();

                    let matchSchedule = false;
                    if (location.schedule) {
                        for (const session of location.schedule) {
                            if (session.type && session.type.toLowerCase().includes(search)) matchSchedule = true;
                            for (const paper of session.papers) {
                                if (paper.title.toLowerCase().includes(search) || 
                                    paper.presenter.toLowerCase().includes(search) ||
                                    paper.id.toLowerCase().includes(search)) {
                                    matchSchedule = true;
                                    break;
                                }
                            }
                            if (matchSchedule) break;
                        }
                    }

                    return (
                        name.includes(search) ||
                        description.includes(search) ||
                        matchSchedule
                    );

                }
            );

    }


    displayLocations(
        filtered
    );

}


/* ==========================================
   DISPLAY
   ========================================== */

function displayLocations(
    locations
) {

    const container =
        document.getElementById(
            "locations"
        );


    const count =
        document.getElementById(
            "locationCount"
        );


    const noResults =
        document.getElementById(
            "noResults"
        );


    container.innerHTML = "";


    count.textContent =
        locations.length;


    if (
        locations.length === 0
    ) {

        noResults.style.display =
            "block";

        return;

    }


    noResults.style.display =
        "none";


    locations.forEach(
        location => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "home-card";


            const icon =
                location.icon || "📍";


            card.innerHTML = `

                <a
                    href="location.html?id=${location.id}"
                    class="home-card-link"
                >

                    <div class="home-card-image">

                        <span class="card-icon-badge">${icon}</span>

                        <img
                            src="${location.image}"
                            alt="${location.name}"
                            loading="lazy"
                            onerror="this.style.display='none'; this.parentElement.classList.add('image-fallback');"
                        >

                    </div>


                    <div class="home-card-body">

                        <div class="home-card-number">
                            ${location.category ? location.category.toUpperCase() : "CONFERENCE HALL"}
                        </div>

                        <h3>
                            ${location.name}
                        </h3>

                        <p style="color: var(--cyan); font-weight: 500; font-size: 0.9rem;">
                            ${location.schedule.length} Sessions Scheduled
                        </p>


                        <div class="home-card-action">

                            <span>
                                View Location
                            </span>

                            <span class="home-arrow">
                                →
                            </span>

                        </div>

                    </div>

                </a>

            `;


            container.appendChild(
                card
            );

        }
    );

}


/* ==========================================
   SEARCH
   ========================================== */

document
    .getElementById(
        "searchInput"
    )
    .addEventListener(
        "input",
        applyFilters
    );


loadLocations();
