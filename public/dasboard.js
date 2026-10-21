const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("eventifyToken");
const storedUser = localStorage.getItem("eventifyUser");

const registrationGrid = document.getElementById("registrationGrid");
const dashboardMessage = document.getElementById("dashboardMessage");

if (!token || !storedUser) {
    alert("Please log in to view your dashboard.");
    window.location.href = "/login.html";
} else {
    try {
        const user = JSON.parse(storedUser);

        document.getElementById("userName").textContent =
            user.name || "User";

        document.getElementById("profileName").textContent =
            user.name || "User";

        document.getElementById("profileEmail").textContent =
            user.email || "";

        document.getElementById("profileRole").textContent =
            user.role || "USER";

        document.getElementById("userAvatar").textContent =
            (user.name || "U").charAt(0).toUpperCase();

    } catch (error) {
        localStorage.removeItem("eventifyUser");
        localStorage.removeItem("eventifyToken");
        window.location.href = "/login.html";
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

async function loadRegistrations() {
    registrationGrid.innerHTML = `
        <div class="loading-card">
            <div class="loader"></div>
            <p>Loading registrations...</p>
        </div>
    `;

    dashboardMessage.textContent = "";

    try {
        const response = await fetch(`${API_URL}/registrations/my/list`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("eventifyToken");
            localStorage.removeItem("eventifyUser");

            alert("Your session has expired. Please log in again.");
            window.location.href = "/login.html";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load registrations");
        }

        const registrations = data.registrations || [];

        if (registrations.length === 0) {
            registrationGrid.innerHTML = `
                <div class="dashboard-empty">
                    <div class="empty-icon">🎟️</div>
                    <h3>No active registrations yet</h3>
                    <p>Explore upcoming events and register for something exciting.</p>
                    <a href="/#events" class="primary-btn">
                        Explore Events →
                    </a>
                </div>
            `;
            return;
        }

        registrationGrid.innerHTML = registrations.map((registration, index) => {
            const event = registration.event;

            if (!event) return "";

            return `
                <article class="event-card">
                    <div class="event-card-banner">
                        <span>${["🚀", "💻", "🎓", "🎨", "🎤", "🌟"][index % 6]}</span>
                        <span class="event-tag">REGISTERED</span>
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
                            <span class="seat-count">Confirmed</span>

                            <button
                                class="cancel-registration-btn"
                                data-registration-id="${escapeHTML(registration._id)}"
                            >
                                Cancel Registration
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        registrationGrid
            .querySelectorAll(".cancel-registration-btn")
            .forEach((button) => {
                button.addEventListener("click", async () => {
                    const confirmed = confirm(
                        "Are you sure you want to cancel this registration?"
                    );

                    if (!confirmed) return;

                    await cancelRegistration(
                        button.dataset.registrationId,
                        button
                    );
                });
            });

    } catch (error) {
        console.error("Dashboard error:", error);

        registrationGrid.innerHTML = `
            <div class="dashboard-empty">
                <h3>Unable to load registrations</h3>
                <p>${escapeHTML(error.message)}</p>
                <button id="retryDashboard" class="outline-btn">
                    Try Again
                </button>
            </div>
        `;

        document.getElementById("retryDashboard")
            ?.addEventListener("click", loadRegistrations);
    }
}

async function cancelRegistration(registrationId, button) {
    button.disabled = true;
    button.textContent = "Cancelling...";

    try {
        const response = await fetch(
            `${API_URL}/registrations/${encodeURIComponent(registrationId)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Cancellation failed");
        }

        alert("✅ " + data.message);
        await loadRegistrations();

    } catch (error) {
        alert("❌ " + error.message);
        button.disabled = false;
        button.textContent = "Cancel Registration";
    }
}

document.getElementById("refreshRegistrations")
    .addEventListener("click", loadRegistrations);

document.getElementById("logoutButton")
    .addEventListener("click", () => {
        localStorage.removeItem("eventifyToken");
        localStorage.removeItem("eventifyUser");

        window.location.href = "/login.html";
    });

if (token && storedUser) {
    loadRegistrations();
}