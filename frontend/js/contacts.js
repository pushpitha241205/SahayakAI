// Emergency Contacts CRUD controller

document.addEventListener("DOMContentLoaded", async () => {
  Auth.requireAuth();

  const showBtn = document.getElementById("show-add-contact-btn");
  const formCard = document.getElementById("contact-form-card");
  const cancelBtn = document.getElementById("cancel-contact-btn");
  const form = document.getElementById("contact-form");

  showBtn.addEventListener("click", () => {
    document.getElementById("form-heading").innerText = "Add Emergency Contact";
    document.getElementById("edit-contact-id").value = "";
    form.reset();
    formCard.style.display = "block";
    formCard.scrollIntoView({ behavior: "smooth" });
  });

  cancelBtn.addEventListener("click", () => {
    formCard.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-contact-id").value;
    const name = document.getElementById("contact-name").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    const relationship = document.getElementById("contact-relationship").value;

    try {
      if (id) {
        await API.updateContact(id, { name, phone, relationship });
      } else {
        await API.createContact({ name, phone, relationship });
      }
      formCard.style.display = "none";
      await loadContacts();
    } catch (err) {
      alert("Error saving contact: " + err.message);
    }
  });

  await loadContacts();
});

async function loadContacts() {
  const container = document.getElementById("contacts-list");
  try {
    const contacts = await API.getContacts();

    if (contacts.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2.5rem;">
          <p style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.5rem;">No contacts registered yet!</p>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Add at least 2 family members or trusted friends so Sahayak AI can send your GPS location during distress.</p>
        </div>
      `;
      return;
    }

    let html = "";
    contacts.forEach(c => {
      html += `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">
              ${c.name} <span class="badge badge-medium">${c.relationship}</span>
            </h3>
            <p style="color: var(--text-muted); font-size: 0.95rem;">
              Phone: <a href="tel:${c.phone}" style="color: #60a5fa; text-decoration: none;">${c.phone}</a>
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button onclick="editContact(${c.id}, '${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${c.relationship}')" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
              Edit
            </button>
            <button onclick="deleteContact(${c.id})" class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
              Delete
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444;">Failed to load contacts: ${err.message}</p>`;
  }
}

window.editContact = function(id, name, phone, relationship) {
  document.getElementById("form-heading").innerText = "Edit Emergency Contact";
  document.getElementById("edit-contact-id").value = id;
  document.getElementById("contact-name").value = name;
  document.getElementById("contact-phone").value = phone;
  document.getElementById("contact-relationship").value = relationship;

  const formCard = document.getElementById("contact-form-card");
  formCard.style.display = "block";
  formCard.scrollIntoView({ behavior: "smooth" });
};

window.deleteContact = async function(id) {
  if (confirm("Are you sure you want to remove this emergency contact?")) {
    try {
      await API.deleteContact(id);
      await loadContacts();
    } catch (err) {
      alert("Error deleting contact: " + err.message);
    }
  }
};
