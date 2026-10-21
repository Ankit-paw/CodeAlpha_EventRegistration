const API_URL = "http://localhost:5000/api";

const eventGrid = document.getElementById("eventGrid");
const apiMessage = document.getElementById("apiMessage");
const refreshButton = document.getElementById("refreshEvents");

// Event descriptions ko HTML injection se safe display karna
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Date format
function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date not available";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// LOAD EVENTS
async function loadEvents() {
    if (!eventGrid) return;

    eventGrid.innerHTML = `
        <div class="loading-card">
            <div class="loader"></div>
            <p>Loading events...</p>
        </div>
    `;

    if (apiMessage) apiMessage.textContent = "";

    try {
        const response = await fetch(`${API_URL}/events`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load events");
        }

        const events = data.events || [];

        if (events.length === 0) {
            eventGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No events available</h3>
                    <p>Please check again later for upcoming events.</p>
                </div>
            `;
            return;
        }

        eventGrid.innerHTML = events.map((event, index) => {
            const capacity = Number(event.capacity) || 0;
            const registered = Number(event.registeredCount) || 0;
            const seatsLeft = Math.max(0, capacity - registered);

            return `
                <article class="event-card">
                    <div class="event-card-banner">
                        <span>${["🚀", "💻", "🎓", "🎨", "🎤", "🌟"][index % 6]}</span>
                        <span class="event-tag">EVENT</span>
                    </div>

                    <div class="event-card-content">
                        <h3>${escapeHTML(event.title)}</h3>

                        <p class="event-description">
                            ${escapeHTML(event.description)}
                        </p>

                        <div class="event-info">
                            <p>📅 ${escapeHTML(formatDate(event.date))}</p>
                            <p>📍 ${escapeHTML(event.location)}</p>
                        </div>

                        <div class="event-card-footer">
                            <span class="seat-count">
                                ${seatsLeft} seats left
                            </span>

                            <button
                                class="register-event-btn"
                                data-event-id="${escapeHTML(event._id)}"
                                ${seatsLeft === 0 ? "disabled" : ""}
                            >
                                ${seatsLeft === 0 ? "Event Full" : "Register Now →"}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        // REGISTER BUTTONS
        eventGrid.querySelectorAll(".register-event-btn").forEach((button) => {
            button.addEventListener("click", () => {
                registerForEvent(button.dataset.eventId, button);
            });
        });

    } catch (error) {
        console.error("Load events error:", error);

        eventGrid.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load events</h3>
                <p>Check that your backend server is running.</p>
                <button class="outline-btn" id="retryEvents">
                    Try Again
                </button>
            </div>
        `;

        document.getElementById("retryEvents")
            ?.addEventListener("click", loadEvents);

        if (apiMessage) apiMessage.textContent = error.message;
    }
}

// REGISTER FOR AN EVENT
async function registerForEvent(eventId, button) {
    const token = localStorage.getItem("eventifyToken");

    if (!token) {
        alert("Please log in before registering for an event.");
        window.location.href = "/login.html";
        return;
    }

    button.disabled = true;
    button.textContent = "Registering...";

    try {
        const response = await fetch(
            `${API_URL}/registrations/${encodeURIComponent(eventId)}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("eventifyToken");
            localStorage.removeItem("eventifyUser");

            alert("Your login session has expired. Please log in again.");
            window.location.href = "/login.html";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Registration failed");
        }

        alert("🎉 " + data.message);

        await loadEvents();

    } catch (error) {
        alert("❌ " + error.message);

        button.disabled = false;
        button.textContent = "Register Now →";
    }
}

// REFRESH BUTTON
if (refreshButton) {
    refreshButton.addEventListener("click", loadEvents);
}

// INITIAL LOAD
loadEvents();