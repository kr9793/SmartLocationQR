let currentLocation = null;


/* ==========================================
   LOAD LOCATION
   ========================================== */

async function loadLocation() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");


    if (!id) {

        showError(
            "No location ID was provided."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "assets/data/locations.json?v=" +
                Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load location data."
            );

        }


        const locations =
            await response.json();


        const location =
            locations.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!location) {

            throw new Error(
                "This location does not exist."
            );

        }


        currentLocation =
            location;


        displayLocation(
            location
        );

    }

    catch (error) {

        console.error(error);

        showError(
            error.message
        );

    }

}


/* ==========================================
   DISPLAY
   ========================================== */

function displayLocation(location) {

    document.title =
        location.name +
        " | Smart Location QR";


    document.getElementById(
        "name"
    ).textContent =
        location.name;


    document.getElementById(
        "description"
    ).textContent =
        location.description ||
        "MMMUT campus location, Gorakhpur.";


    /* CATEGORY / TYPE BADGE */

    document.getElementById(
        "locationType"
    ).textContent =
        location.icon
            ? location.icon + " " + (location.category || "CAMPUS LOCATION").toUpperCase()
            : (location.category || "CAMPUS LOCATION").toUpperCase();


    /* PHOTO */

    const photo =
        document.getElementById(
            "locationPhoto"
        );


    photo.src =
        location.image;


    photo.alt =
        location.name;


    photo.onerror =
        function () {

            this.style.display =
                "none";

        };


    /* COORDINATES — VALIDATE */

    const lat =
        Number(location.latitude);

    const lng =
        Number(location.longitude);

    const hasValidCoords =
        Number.isFinite(lat) &&
        Number.isFinite(lng);


    if (hasValidCoords) {

        document.getElementById(
            "coordinates"
        ).textContent =
            lat + ", " + lng;


        /* DIRECTIONS */

        document.getElementById(
            "directions"
        ).href =
            "https://www.google.com/maps/dir/?api=1&destination=" +
            lat + "," + lng;


        /* MAP */

        document.getElementById(
            "mapFrame"
        ).src =
            "https://maps.google.com/maps?q=" +
            lat + "," + lng +
            "&z=18&output=embed";

    }

    else {

        document.getElementById(
            "coordinates"
        ).textContent =
            "Not available";


        document.getElementById(
            "mapSection"
        ).style.display =
            "none";


        document.getElementById(
            "directions"
        ).style.display =
            "none";


        document.getElementById(
            "mapUnavailable"
        ).style.display =
            "block";

    }


    /* BUTTONS */

    document.getElementById(
        "shareButton"
    ).addEventListener(
        "click",
        shareLocation
    );


    document.getElementById(
        "copyButton"
    ).addEventListener(
        "click",
        copyCoordinates
    );


    if (!hasValidCoords) {

        document.getElementById(
            "copyButton"
        ).disabled = true;

    }


    /* SHOW */

    document.getElementById(
        "loading"
    ).style.display =
        "none";


    document.getElementById(
        "locationContent"
    ).style.display =
        "block";

    loadSchedule(location.id);
}


/* ==========================================
   LOAD SCHEDULE
   ========================================== */

let currentLocationScheduleSessions = [];
let currentDayFilter = "Day 01";

async function loadSchedule(locationId) {
    try {
        const response = await fetch("assets/data/schedule.json?v=" + Date.now());
        if (!response.ok) return;

        const allSchedules = await response.json();
        const locationSchedule = allSchedules.find(s => String(s.location_id) === String(locationId));

        if (locationSchedule && locationSchedule.sessions && locationSchedule.sessions.length > 0) {
            currentLocationScheduleSessions = locationSchedule.sessions;
            document.getElementById("scheduleSection").style.display = "block";
            
            // Set up Day tab listeners
            const tabs = document.querySelectorAll(".schedule-tab");
            tabs.forEach(tab => {
                tab.addEventListener("click", function() {
                    tabs.forEach(t => t.classList.remove("active"));
                    this.classList.add("active");
                    currentDayFilter = this.dataset.day;
                    renderSchedule();
                });
            });
            
            // Render default (Day 1)
            renderSchedule();
        }
    } catch (error) {
        console.error("Failed to load schedule:", error);
    }
}

function renderSchedule() {
    const container = document.getElementById("scheduleContainer");
    let html = "";
    
    const filteredSessions = currentLocationScheduleSessions.filter(session => 
        session.day.includes(currentDayFilter)
    );
    
    if (filteredSessions.length === 0) {
        container.innerHTML = `<p style="color: #888; font-size: 0.9rem; text-align: center; padding: 20px;">No sessions scheduled for this day.</p>`;
        return;
    }
    
    filteredSessions.forEach(session => {
        html += `
        <div class="schedule-group">
            <div class="schedule-header">
                <div class="schedule-header-left">
                    <span>${session.day}</span>
                    <h3 style="margin: 0; color: var(--cyan);">${session.type}</h3>
                </div>
                <div class="schedule-time" style="margin-top: 5px;">
                    ${session.time}
                </div>
            </div>
        `;
        
        if (session.papers && session.papers.length > 0) {
            session.papers.forEach(paper => {
                html += `
                <div class="schedule-paper">
                    <div class="schedule-paper-header">
                        <span class="schedule-paper-id">#${paper.id}</span>
                        <span class="schedule-paper-track">Track ${paper.track}</span>
                    </div>
                    <h4 class="schedule-paper-title">${paper.title}</h4>
                    <div class="schedule-paper-presenter">
                        <span class="presenter-icon">👤</span> ${paper.presenter}
                    </div>
                </div>
                `;
            });
        } else {
            html += `<p style="color: #888; font-size: 0.9rem;">No papers scheduled for this session.</p>`;
        }
        
        html += `</div>`;
    });
    
    container.innerHTML = html;
}


/* ==========================================
   SHARE
   ========================================== */

async function shareLocation() {

    const url =
        window.location.href;


    if (navigator.share) {

        try {

            await navigator.share({

                title:
                    currentLocation.name,

                text:
                    "Location: " +
                    currentLocation.name,

                url:
                    url

            });

        }

        catch (error) {

            console.log(
                "Share cancelled."
            );

        }

    }

    else {

        try {

            await navigator.clipboard.writeText(
                url
            );

            showMessage(
                "Location link copied"
            );

        }

        catch {

            showMessage(
                "Unable to copy link"
            );

        }

    }

}


/* ==========================================
   COPY
   ========================================== */

async function copyCoordinates() {

    const lat =
        Number(currentLocation.latitude);

    const lng =
        Number(currentLocation.longitude);


    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {

        showMessage(
            "Coordinates unavailable"
        );

        return;

    }


    const coordinates =
        lat + ", " + lng;


    try {

        await navigator.clipboard.writeText(
            coordinates
        );

        showMessage(
            "Coordinates copied"
        );

    }

    catch {

        showMessage(
            "Unable to copy coordinates"
        );

    }

}


/* ==========================================
   MESSAGE
   ========================================== */

function showMessage(message) {

    const element =
        document.getElementById(
            "shareMessage"
        );


    element.textContent =
        message;


    element.style.display =
        "block";


    setTimeout(
        () => {

            element.style.display =
                "none";

        },
        2200
    );

}


/* ==========================================
   ERROR
   ========================================== */

function showError(message) {

    document.getElementById(
        "loading"
    ).style.display =
        "none";


    document.getElementById(
        "error"
    ).style.display =
        "block";


    document.getElementById(
        "errorMessage"
    ).textContent =
        message;

}


loadLocation();
