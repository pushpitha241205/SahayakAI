// User Incident History Controller

document.addEventListener("DOMContentLoaded", async () => {
  Auth.requireAuth();
  await loadIncidentsHistory();
});

async function loadIncidentsHistory() {
  const container = document.getElementById("history-container");

  try {
    const emergencies = await API.getIncidents();

    if (emergencies.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2.5rem;">
          <p style="color: #34d399; font-size: 1.1rem; margin-bottom: 0.5rem;">✅ No Emergency Incidents Recorded</p>
          <p style="color: var(--text-muted); font-size: 0.9rem;">You have not triggered any emergencies yet.</p>
        </div>
      `;
      return;
    }

    let html = "";
    emergencies.forEach(em => {
      const dateStr = new Date(em.created_at).toLocaleString();
      const isResolved = em.status === "RESOLVED";
      const statusBadge = isResolved
        ? `<span class="badge badge-resolved">RESOLVED</span>`
        : `<span class="badge badge-active">ACTIVE SOS</span>`;

      const sevClass = em.severity === "CRITICAL" ? "badge-critical" : em.severity === "HIGH" ? "badge-high" : "badge-medium";
      const sevBadge = `<span class="badge ${sevClass}">${em.severity}</span>`;

      let locationSnippet = "No GPS recorded";
      if (em.latitude && em.longitude) {
        locationSnippet = `<a href="https://www.google.com/maps?q=${em.latitude},${em.longitude}" target="_blank" style="color: #60a5fa;">📍 ${em.latitude.toFixed(4)}, ${em.longitude.toFixed(4)}</a>`;
      }

      let incidentsDetail = "";
      if (em.incidents && em.incidents.length > 0) {
        const inc = em.incidents[0];
        incidentsDetail = `
          <div style="margin-top: 0.75rem; padding: 0.75rem; background: #0f172a; border-radius: 6px; font-size: 0.85rem;">
            <strong>AI Analysis:</strong> <span style="color: #cbd5e1;">${inc.ai_analysis}</span><br>
            ${inc.detected_keywords ? `<strong>Keywords:</strong> <span style="color: #f59e0b;">${inc.detected_keywords}</span><br>` : ''}
            <strong>Guidance:</strong> <span style="color: #34d399;">${inc.recommended_action.split('\n')[0]}</span>
          </div>
        `;
      }

      html += `
        <div class="card" style="border-left: 4px solid ${isResolved ? '#10b981' : '#ef4444'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                <h3 style="font-size: 1.15rem;">${em.emergency_type}</h3>
                ${sevBadge}
                ${statusBadge}
              </div>
              <p style="color: var(--text-muted); font-size: 0.85rem;">Date: ${dateStr} | Location: ${locationSnippet}</p>
            </div>
            <div>
              <a href="/emergency.html?id=${em.id}" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.85rem;">View Full Details</a>
            </div>
          </div>

          <p style="color: #cbd5e1; font-size: 0.95rem; margin-top: 0.75rem;">
            <strong>Description:</strong> ${em.description || "N/A"}
          </p>

          ${incidentsDetail}
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444;">Failed to load emergency history: ${err.message}</p>`;
  }
}
