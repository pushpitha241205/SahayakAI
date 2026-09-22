// Navigation and Session Initialization

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
});

function renderNavbar() {
  const navContainer = document.getElementById("navbar-container");
  if (!navContainer) return;

  const isAuthed = Auth.isAuthenticated();
  const user = Auth.getUser();
  const isAdmin = Auth.isAdmin();

  let navHTML = `
    <nav class="navbar">
      <a href="/index.html" class="brand">
        <div class="brand-icon">🚨</div>
        <span>Sahayak AI</span>
      </a>
      <ul class="nav-links">
        <li><a href="/index.html">Home</a></li>
  `;

  if (isAuthed) {
    navHTML += `
      <li><a href="/dashboard.html">Dashboard</a></li>
      <li><a href="/contacts.html">Emergency Contacts</a></li>
      <li><a href="/history.html">Incident History</a></li>
      <li><a href="/profile.html">Profile</a></li>
    `;
    if (isAdmin) {
      navHTML += `<li><a href="/admin.html" style="color: #f59e0b;">Admin Portal</a></li>`;
    }
    navHTML += `
      <li><span style="color: #94a3b8; font-size: 0.85rem;">Hi, ${user ? user.name.split(" ")[0] : "User"}</span></li>
      <li><button onclick="Auth.logout()" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Logout</button></li>
    `;
  } else {
    navHTML += `
      <li><a href="/login.html" class="btn btn-secondary" style="padding: 0.4rem 0.8rem;">Login</a></li>
      <li><a href="/register.html" class="btn btn-primary" style="padding: 0.4rem 0.8rem;">Register</a></li>
    `;
  }

  navHTML += `
      </ul>
    </nav>
  `;

  navContainer.innerHTML = navHTML;
}
