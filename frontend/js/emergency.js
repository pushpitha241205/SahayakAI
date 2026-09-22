// Active Emergency Page Handler

let emergencyId = null;
let mapInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  Auth.requireAuth();

  const urlParams = new URLSearchParams(window.location.search);
  emergencyId = urlParams.get("id");

  if (!emergencyId) {
    // If no ID passed, try to fetch current active emergency
    try {
      const activeRes = await API.getActiveEmergency();
      if (activeRes.active && activeRes.emergency) {
        emergencyId = activeRes.emergency.id;
      } else {
        window.location.href = "/dashboard.html";
        return;
      }
    } catch (e) {
      window.location.href = "/dashboard.html";
      return;
    }
  }

  await loadEmergencyDetails();

  document.getElementById("resolve-em-btn").addEventListener("click", resolveCurrentEmergency);
});

async function loadEmergencyDetails() {
  try {
    const data = await API.getEmergency(emergencyId);

    document.getElementById("em-type-title").innerText = `${data.emergency_type} (${data.severity})`;
    document.getElementById("em-timestamp").innerText = `Reported: ${new Date(data.created_at).toLocaleString()}`;
    document.getElementById("em-desc-text").innerText = data.description || "No description provided.";

    const statusBadge = document.getElementById("em-status-badge");
    statusBadge.innerText = data.status;
    if (data.status === "RESOLVED") {
      statusBadge.className = "badge badge-resolved";
      document.getElementById("resolve-em-btn").style.display = "none";
    } else {
      statusBadge.className = "badge badge-active";
    }

    // Coordinates & Map
    const coordsText = document.getElementById("location-coords-text");
    const mapsLink = document.getElementById("google-maps-link");

    if (data.latitude && data.longitude) {
      coordsText.innerText = `Latitude: ${data.latitude.toFixed(5)}, Longitude: ${data.longitude.toFixed(5)}`;
      mapsLink.href = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
      renderMap(data.latitude, data.longitude, data.emergency_type);
    } else {
      coordsText.innerText = "Location coordinates were not provided during trigger.";
      mapsLink.style.display = "none";
      document.getElementById("emergency-map").innerHTML = "<p style='padding:2rem;text-align:center;color:#94a3b8;'>Map unavailable without GPS coordinates.</p>";
    }

    // Incidents / Guidance
    const guidanceContainer = document.getElementById("ai-guidance-container");
    if (data.incidents && data.incidents.length > 0) {
      const latest = data.incidents[data.incidents.length - 1];
      const actions = latest.recommended_action ? latest.recommended_action.split("\n") : [];
      
      let html = `
        <div style="background: #0f172a; padding: 1rem; border-radius: 8px; border: 1px solid var(--card-border);">
          <h4 style="color: #60a5fa; font-size: 0.95rem; margin-bottom: 0.5rem;">AI Analysis Summary</h4>
          <p style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 0.75rem;">${latest.ai_analysis}</p>
          <h4 style="color: #34d399; font-size: 0.95rem; margin-bottom: 0.5rem;">Recommended Steps:</h4>
          <ul style="padding-left: 1.2rem; color: #f8fafc; font-size: 0.85rem; line-height: 1.6;">
            ${actions.map(a => `<li>${a}</li>`).join("")}
          </ul>
        </div>
      `;
      guidanceContainer.innerHTML = html;
    } else {
      guidanceContainer.innerHTML = `
        <div style="background: #0f172a; padding: 1rem; border-radius: 8px;">
          <p style="color: #f59e0b; font-size: 0.9rem;">Remain calm and follow standard emergency procedures. Keep your phone line clear.</p>
        </div>
      `;
    }

  } catch (err) {
    alert("Could not load emergency details: " + err.message);
  }
}

function renderMap(lat, lng, title) {
  if (mapInstance) {
    mapInstance.remove();
  }

  const mapContainer = document.getElementById("emergency-map");
  mapContainer.innerHTML = "";

  mapInstance = L.map('emergency-map').setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(mapInstance);

  L.marker([lat, lng]).addTo(mapInstance)
    .bindPopup(`<b>${title}</b><br>Emergency Origin`)
    .openPopup();
}

async function resolveCurrentEmergency() {
  const notes = prompt("Enter any safety notes (or click OK to resolve as Safe):", "All safe, false alarm or emergency resolved.");
  if (notes === null) return; // User clicked Cancel

  try {
    await API.resolveEmergency(emergencyId, notes);
    alert("Emergency marked as RESOLVED. Stay safe!");
    window.location.href = "/history.html";
  } catch (err) {
    alert("Error updating status: " + err.message);
  }
}
