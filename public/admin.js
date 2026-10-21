// ============================================
// EVENTIFY - ADMIN DASHBOARD
// ============================================

const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    const eventForm = document.getElementById("eventForm");
    const messageBox =
        document.getElementById("eventMessage") ||
        document.getElementById("adminMessage");

    // Show message on dashboard
    function showMessage(message, type = "error") {
        if (!messageBox) {
            alert(message);
            return;
        }

        messageBox.textContent = message;
        messageBox.style.color =
            type === "success" ? "green" : "crimson";
        messageBox.style.display = "block";
    }

    // Get saved token
    function getToken() {
        return localStorage.getItem("eventifyToken");
    }

    // Check admin login
    function checkAdmin() {
        const token = getToken();
        const savedUser = localStorage.getItem("eventifyUser");

        if (!token || !savedUser) {
            window.location.href = "login.html";
            return false;
        }

        try {
            const user = JSON.parse(savedUser);

            if (user.role !== "admin") {
                document.body.innerHTML = `
                    <div style="
                        text-align:center;
                        margin:100px auto;
                        font-family:Arial,sans-serif;
                    ">
                        <h1>403 — Admin Access Required</h1>
                        <p>Your account does not have permission to access this page.</p>
                        <a href="index.html">Return to homepage</a>
                    </div>
                `;
                return false;
            }
        } catch (error) {
            localStorage.removeItem("eventifyUser");
            window.location.href = "login.html";
            return false;
        }

        return true;
    }

    // Safely read backend response
    async function readResponse(response) {
        const text = await response.text();

        if (!text) {
            throw new Error(
                `Server returned an empty response (HTTP ${response.status}).`
            );
        }

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            console.error("Non-JSON response:", text);

            throw new Error(
                `Server returned invalid data (HTTP ${response.status}).`
            );
        }

        if (!response.ok || data.success === false) {
            throw new Error(
                data.message || `Request failed (HTTP ${response.status}).`
            );
        }

        return data;
    }

    // ============================================
    // CREATE EVENT
    // ============================================

    if (eventForm) {
        eventForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!checkAdmin()) return;

            const submitButton =
                eventForm.querySelector('button[type="submit"]');

            const title =
                document.getElementById("eventTitle")?.value.trim();

            const description =
                document.getElementById("eventDescription")?.value.trim();

            const dateValue =
                document.getElementById("eventDate")?.value;

            const location =
                document.getElementById("eventLocation")?.value.trim();

            const capacityValue =
                document.getElementById("eventCapacity")?.value;

            const capacity = Number(capacityValue);

            if (
                !title ||
                !description ||
                !dateValue ||
                !location ||
                !capacityValue
            ) {
                showMessage("Please fill in all event fields.");
                return;
            }

            if (!Number.isInteger(capacity) || capacity < 1) {
                showMessage("Capacity must be a positive whole number.");
                return;
            }

            const eventDate = new Date(dateValue);

            if (Number.isNaN(eventDate.getTime())) {
                showMessage("Please enter a valid event date.");
                return;
            }

            if (eventDate <= new Date()) {
                showMessage("Please choose a future event date and time.");
                return;
            }

            const originalButtonText = submitButton
                ? submitButton.textContent
                : "";

            try {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Publishing...";
                }

                showMessage("Publishing event...", "success");

                const response = await fetch(`${API_URL}/events`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        date: eventDate.toISOString(),
                        location,
                        capacity
                    })
                });

                const data = await readResponse(response);

                showMessage(
                    data.message || "Event created successfully!",
                    "success"
                );

                eventForm.reset();

                // Refresh event list if this function exists
                if (typeof loadEvents === "function") {
                    await loadEvents();
                }

            } catch (error) {
                console.error("Create event error:", error);
                showMessage(error.message || "Failed to create event.");
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }

    // ============================================
    // INITIALIZE DASHBOARD
    // ============================================

    if (checkAdmin()) {
        console.log("Eventify Admin Dashboard initialized.");
    }
});