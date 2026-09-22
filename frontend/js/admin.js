// Admin Command Center Controller

document.addEventListener("DOMContentLoaded", async () => {
  Auth.requireAdmin();

  await loadAdminStats();
  await loadAdminEmergencies();
  await loadAdminUsers();

  document.getElementById("refresh-admin-btn").addEventListener("click", async () => {
    await loadAdminStats();
    await loadAdminEmergencies();
    await loadAdminUsers();
  });
});

async function loadAdminStats() {
  try {
    const stats = await API.getAdminStats();
    document.getElementById("stat-total-users").innerText = stats.total_users;
    document.getElementById("stat-active-em").innerText = stats.active_emergencies;
    document.getElementById("stat-resolved-em").innerText = stats.resolved_emergencies;
    document.getElementById("stat-total-em").innerText = stats.total_emergencies;
  } catch (err) {
    console.error("Could not load stats:", err);
  }
}

async function loadAdminEmergencies() {
  const tbody = document.getElementById("admin-emergencies-tbody");
  try {
    const emergencies = await API.getAdminEmergencies();

    if (emergencies.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No emergency events reported.</td></tr>`;
      return;
    }

    let html = "";
    emergencies.forEach(em => {
      const isResolved = em.status === "RESOLVED";
      const statusBadge = isResolved
        ? `<span class="badge badge-resolved">RESOLVED</span>`
        : `<span class="badge badge-active">ACTIVE SOS</span>`;

      const sevClass = em.severity === "CRITICAL" ? "badge-critical" : em.severity === "HIGH" ? "badge-high" : "badge-medium";

      let loc = "No GPS";
      if (em.latitude && em.longitude) {
        loc = `<a href="https://www.google.com/maps?q=${em.latitude},${em.longitude}" target="_blank" style="color: #60a5fa;">${em.latitude.toFixed(4)}, ${em.longitude.toFixed(4)}</a>`;
      }

      html += `
        <tr style="border-bottom: 1px solid var(--card-border);">
          <td style="padding: 0.75rem;">#${em.id}</td>
          <td style="padding: 0.75rem; font-weight: 600;">${em.emergency_type}</td>
          <td style="padding: 0.75rem;"><span class="badge ${sevClass}">${em.severity}</span></td>
          <td style="padding: 0.75rem;">${loc}</td>
          <td style="padding: 0.75rem;">${statusBadge}</td>
          <td style="padding: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">${new Date(em.created_at).toLocaleString()}</td>
          <td style="padding: 0.75rem;">
            <a href="/emergency.html?id=${em.id}" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Open</a>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 1rem; color: #ef4444;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAdminUsers() {
  const tbody = document.getElementById("admin-users-tbody");
  try {
    const users = await API.getAdminUsers();

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No users found.</td></tr>`;
      return;
    }

    let html = "";
    users.forEach(u => {
      html += `
        <tr style="border-bottom: 1px solid var(--card-border);">
          <td style="padding: 0.75rem;">#${u.id}</td>
          <td style="padding: 0.75rem; font-weight: 600;">${u.name}</td>
          <td style="padding: 0.75rem; color: #94a3b8;">${u.email}</td>
          <td style="padding: 0.75rem;">${u.phone}</td>
          <td style="padding: 0.75rem;"><span class="badge ${u.role === 'admin' ? 'badge-high' : 'badge-medium'}">${u.role}</span></td>
          <td style="padding: 0.75rem;">${u.contact_count} contacts registered</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 1rem; color: #ef4444;">Error: ${err.message}</td></tr>`;
  }
}
