let allSessions = [];
let filteredSessions = [];
let locationsMap = {};
let activeDayFilter = "All";

async function loadFullSchedule() {
    try {
        const [locRes, schedRes] = await Promise.all([
            fetch("assets/data/locations.json?v=" + Date.now()),
            fetch("assets/data/schedule.json?v=" + Date.now())
        ]);

        if (!locRes.ok || !schedRes.ok) throw new Error("Unable to load data");

        const locationsData = await locRes.json();
        const schedulesData = await schedRes.json();

        // Build location lookup map
        locationsData.forEach(loc => {
            locationsMap[loc.id] = loc;
        });

        // Flatten all sessions
        schedulesData.forEach(scheduleObj => {
            const loc = locationsMap[scheduleObj.location_id];
            if (!loc) return;

            scheduleObj.sessions.forEach(session => {
                allSessions.push({
                    location: loc,
                    ...session
                });
            });
        });

        // Sort sessions by day then time
        allSessions.sort((a, b) => {
            if (a.day !== b.day) return a.day.localeCompare(b.day);
            return a.time.localeCompare(b.time);
        });

        document.getElementById("scheduleLoading").style.display = "none";
        document.getElementById("scheduleResults").style.display = "block";

        setupFilters();
        applyFilters();

    } catch (error) {
        console.error(error);
        document.getElementById("scheduleLoading").style.display = "none";
        document.getElementById("noScheduleResults").style.display = "block";
        document.getElementById("noScheduleResults").innerHTML = "<p>Error loading schedule data.</p>";
    }
}

function setupFilters() {
    // Search input
    document.getElementById("scheduleSearchInput").addEventListener("input", applyFilters);

    // Day chips
    const chips = document.querySelectorAll("#dayFilterChips .chip");
    chips.forEach(chip => {
        chip.addEventListener("click", function() {
            chips.forEach(c => c.classList.remove("active"));
            this.classList.add("active");
            activeDayFilter = this.dataset.day;
            applyFilters();
        });
    });
}

function applyFilters() {
    const search = document.getElementById("scheduleSearchInput").value.toLowerCase().trim();

    filteredSessions = allSessions.filter(session => {
        // Day filter
        if (activeDayFilter !== "All" && !session.day.includes(activeDayFilter)) {
            return false;
        }

        // Search filter
        if (search) {
            const locMatch = session.location.name.toLowerCase().includes(search);
            const typeMatch = session.type && session.type.toLowerCase().includes(search);
            const timeMatch = session.time && session.time.toLowerCase().includes(search);
            
            let paperMatch = false;
            if (session.papers) {
                for (const paper of session.papers) {
                    if (paper.title.toLowerCase().includes(search) || 
                        paper.presenter.toLowerCase().includes(search) ||
                        paper.id.toLowerCase().includes(search) ||
                        paper.track.toLowerCase().includes(search)) {
                        paperMatch = true;
                        break;
                    }
                }
            }

            return locMatch || typeMatch || timeMatch || paperMatch;
        }

        return true;
    });

    renderSchedule();
}

function renderSchedule() {
    const container = document.getElementById("scheduleResults");
    const noResults = document.getElementById("noScheduleResults");
    const count = document.getElementById("sessionCount");

    container.innerHTML = "";
    
    // Count total papers across filtered sessions for the counter
    let paperCount = 0;
    filteredSessions.forEach(s => { paperCount += s.papers ? s.papers.length : 0 });
    count.textContent = `${filteredSessions.length} Sessions (${paperCount} Papers)`;

    if (filteredSessions.length === 0) {
        noResults.style.display = "block";
        return;
    }

    noResults.style.display = "none";

    filteredSessions.forEach(session => {
        const group = document.createElement("div");
        group.className = "schedule-group";
        
        let papersHtml = "";
        if (session.papers && session.papers.length > 0) {
            papersHtml = session.papers.map(p => `
                <div class="schedule-paper">
                    <div class="schedule-paper-header">
                        <span class="schedule-paper-id">#${p.id}</span>
                        <span class="schedule-paper-track">Track ${p.track}</span>
                    </div>
                    <h4 class="schedule-paper-title">${p.title}</h4>
                    <div class="schedule-paper-presenter">
                        <span class="presenter-icon">👤</span> ${p.presenter}
                    </div>
                </div>
            `).join("");
        } else {
            papersHtml = `<p style="color: #888; font-size: 0.9rem;">No papers scheduled for this session.</p>`;
        }

        group.innerHTML = `
            <div class="schedule-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3 style="margin: 0; color: var(--cyan);">${session.type}</h3>
                    <div class="schedule-time" style="margin-top: 5px;">${session.time}</div>
                </div>
                <div style="text-align: right;">
                    <a href="location.html?id=${session.location.id}" style="text-decoration: none;">
                        <span style="display: inline-block; padding: 4px 10px; background: rgba(56, 189, 248, 0.1); border: 1px solid var(--cyan); border-radius: 20px; color: var(--cyan); font-size: 0.85rem; font-weight: 500;">
                            📍 ${session.location.name}
                        </span>
                    </a>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${session.day}</div>
                </div>
            </div>
            <div class="schedule-papers">
                ${papersHtml}
            </div>
        `;
        
        container.appendChild(group);
    });
}

// Init
loadFullSchedule();
