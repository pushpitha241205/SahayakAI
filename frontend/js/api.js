// Sahayak AI API and Auth Storage Utilities

const API_BASE = window.location.origin;

const Auth = {
  getToken() {
    return localStorage.getItem("sahayak_token");
  },

  getUser() {
    const u = localStorage.getItem("sahayak_user");
    return u ? JSON.parse(u) : null;
  },

  setAuth(token, user) {
    localStorage.setItem("sahayak_token", token);
    localStorage.setItem("sahayak_user", JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem("sahayak_token");
    localStorage.removeItem("sahayak_user");
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isAdmin() {
    const u = this.getUser();
    return u && u.role === "admin";
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "/login.html";
    }
  },

  requireAdmin() {
    if (!this.isAuthenticated() || !this.isAdmin()) {
      window.location.href = "/login.html";
    }
  },

  logout() {
    this.clearAuth();
    window.location.href = "/login.html";
  }
};

const API = {
  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = Auth.getToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);

      if (response.status === 401) {
        // Token expired or invalid
        Auth.clearAuth();
        if (!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html") && window.location.pathname !== "/") {
          window.location.href = "/login.html";
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Request failed with error.");
      }
      return data;
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    }
  },

  // Auth endpoints
  login(email, password) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  register(userData) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  },

  getProfile() {
    return this.request("/api/users/me");
  },

  updateProfile(profileData) {
    return this.request("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(profileData)
    });
  },

  // Emergency endpoints
  analyzeEmergency(description, language = "en") {
    return this.request("/api/emergency/analyze", {
      method: "POST",
      body: JSON.stringify({ description, language })
    });
  },

  createEmergency(emergencyData) {
    return this.request("/api/emergency/create", {
      method: "POST",
      body: JSON.stringify(emergencyData)
    });
  },

  getActiveEmergency() {
    return this.request("/api/emergency/active");
  },

  getEmergency(id) {
    return this.request(`/api/emergency/${id}`);
  },

  resolveEmergency(id, notes) {
    return this.request(`/api/emergency/${id}/resolve`, {
      method: "PUT",
      body: JSON.stringify({ resolution_notes: notes })
    });
  },

  getHelplines() {
    return this.request("/api/emergency/numbers/helplines");
  },

  // Contact endpoints
  getContacts() {
    return this.request("/api/contacts");
  },

  createContact(contact) {
    return this.request("/api/contacts", {
      method: "POST",
      body: JSON.stringify(contact)
    });
  },

  updateContact(id, contact) {
    return this.request(`/api/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(contact)
    });
  },

  deleteContact(id) {
    return this.request(`/api/contacts/${id}`, {
      method: "DELETE"
    });
  },

  // Incidents
  getIncidents() {
    return this.request("/api/incidents");
  },

  getIncident(id) {
    return this.request(`/api/incidents/${id}`);
  },

  // Admin endpoints
  getAdminStats() {
    return this.request("/api/admin/statistics");
  },

  getAdminEmergencies() {
    return this.request("/api/admin/emergencies");
  },

  getAdminUsers() {
    return this.request("/api/admin/users");
  }
};
