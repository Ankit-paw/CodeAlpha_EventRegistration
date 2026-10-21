// ===================================
// EVENTIFY AUTHENTICATION
// ===================================

const API_URL = "http://127.0.0.1:5000/api";

// ===================================
// HELPER: SHOW MESSAGE
// ===================================

function showMessage(element, text, color = "crimson") {
    if (!element) return;

    element.textContent = text;
    element.style.color = color;
}

// ===================================
// HELPER: API REQUEST
// ===================================

async function apiRequest(endpoint, options = {}) {
    let response;

    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch (error) {
        throw new Error(
            "Backend se connection nahi ho raha. Check karo ki server port 5000 par chal raha hai."
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            `Server ne invalid response diya. HTTP status: ${response.status}`
        );
    }

    if (!response.ok || data.success === false) {
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
}

// ===================================
// REGISTER USER
// ===================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("registerMessage");
        const button = registerForm.querySelector('button[type="submit"]');

        try {
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!name || !email || !password) {
                throw new Error("Please fill in all fields.");
            }

            if (password.length < 6) {
                throw new Error("Password must be at least 6 characters.");
            }

            button.disabled = true;
            button.textContent = "Creating Account...";

            showMessage(message, "Creating your account...", "#555");

            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            showMessage(
                message,
                "Account created successfully! Redirecting to login...",
                "green"
            );

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } catch (error) {
            console.error("Registration error:", error);
            showMessage(message, error.message);

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Create Account →";
            }
        }
    });
}

// ===================================
// LOGIN USER
// ===================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("loginMessage");
        const button = loginForm.querySelector('button[type="submit"]');

        try {
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                throw new Error("Please enter your email and password.");
            }

            button.disabled = true;
            button.textContent = "Logging in...";

            showMessage(message, "Verifying your account...", "#555");

            const data = await apiRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!data.token || !data.user) {
                throw new Error("Login response is missing user or token data.");
            }

            // Save login session
            localStorage.setItem("eventifyToken", data.token);
            localStorage.setItem(
                "eventifyUser",
                JSON.stringify(data.user)
            );

            showMessage(message, "Login successful! Redirecting...", "green");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 800);

        } catch (error) {
            console.error("Login error:", error);
            showMessage(message, error.message);

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Login →";
            }
        }
    });
}

// ===================================
// LOGOUT USER
// ===================================

function logoutUser() {
    localStorage.removeItem("eventifyToken");
    localStorage.removeItem("eventifyUser");

    window.location.href = "login.html";
}