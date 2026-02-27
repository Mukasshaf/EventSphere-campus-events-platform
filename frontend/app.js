const API_BASE_URL = '/api';

let currentEvents = [];

// ================= UI TOGGLE LOGIC =================
const toggleSwitch = document.getElementById('view-toggle');
const userLabel = document.getElementById('user-label');
const adminLabel = document.getElementById('admin-label');
const userView = document.getElementById('user-view');
const adminView = document.getElementById('admin-view');

toggleSwitch.addEventListener('change', () => {
    if (toggleSwitch.checked) {
        // Admin Mode
        userLabel.classList.remove('active');
        adminLabel.classList.add('active');
        userView.classList.remove('active');
        adminView.classList.add('active');
        renderAdminEvents();
    } else {
        // User Mode
        adminLabel.classList.remove('active');
        userLabel.classList.add('active');
        adminView.classList.remove('active');
        userView.classList.add('active');
        renderUserEvents();
    }
});

// ================= FETCH DATA =================
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if(response.ok) {
            currentEvents = await response.json();
            if (toggleSwitch.checked) {
                renderAdminEvents();
            } else {
                renderUserEvents();
            }
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// ================= RENDERING =================
function renderUserEvents() {
    const list = document.getElementById('user-events-list');
    if (currentEvents.length === 0) {
        list.innerHTML = '<p>No upcoming events.</p>';
        return;
    }

    list.innerHTML = currentEvents.map(event => `
        <div class="event-card">
            <span class="event-date">${new Date(event.date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <button class="btn primary-btn" onclick="openRegisterModal(${event.id}, '${event.title.replace(/'/g, "\\'")}')">Register Now</button>
        </div>
    `).join('');
}

function renderAdminEvents() {
    const list = document.getElementById('admin-events-list');
    if (currentEvents.length === 0) {
        list.innerHTML = '<p style="padding: 1.5rem">No events mapped yet.</p>';
        return;
    }

    list.innerHTML = currentEvents.map(event => `
        <div class="admin-row">
            <div class="admin-info">
                <h4>${event.title}</h4>
                <span>ID: ${event.id} | ${event.date}</span>
            </div>
            <div class="admin-actions">
                <button class="btn outline-btn" onclick="openRegsModal(${event.id}, '${event.title.replace(/'/g, "\\'")}')">Registrations</button>
                <button class="btn primary-btn" onclick="openEditModal(${event.id}, '${event.title.replace(/'/g, "\\'")}', '${event.date}', '${event.description.replace(/'/g, "\\'")}')">Edit</button>
            </div>
        </div>
    `).join('');
}


// ================= REGISTRATION FUNCTIONALITY =================
const regModal = document.getElementById('register-modal');
const regForm = document.getElementById('register-form');

function openRegisterModal(id, title) {
    document.getElementById('reg-event-id').value = id;
    document.getElementById('reg-event-title-display').innerText = title;
    regModal.classList.add('active');
}

function closeRegisterModal() {
    regModal.classList.remove('active');
    regForm.reset();
}

regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        event_id: parseInt(document.getElementById('reg-event-id').value, 10),
        user_name: document.getElementById('reg-name').value,
        user_email: document.getElementById('reg-email').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/events/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            alert('Successfully registered!');
            closeRegisterModal();
        } else {
            alert('Failed to register.');
        }
    } catch (e) {
        alert('Error connecting to server.');
    }
});

// ================= ADMIN CREATE/EDIT FUNCTIONALITY =================
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-event-form');

function openCreateModal() {
    document.getElementById('edit-modal-title').innerText = "Create New Event";
    document.getElementById('edit-submit-btn').innerText = "Create Event";
    document.getElementById('edit-event-id').value = "";
    editForm.reset();
    editModal.classList.add('active');
}

function openEditModal(id, title, date, desc) {
    document.getElementById('edit-modal-title').innerText = "Edit Event";
    document.getElementById('edit-submit-btn').innerText = "Update Event";
    document.getElementById('edit-event-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-date').value = date;
    document.getElementById('edit-desc').value = desc;
    editModal.classList.add('active');
}

function closeEditModal() {
    editModal.classList.remove('active');
    editForm.reset();
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-event-id').value;
    const payload = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-desc').value,
        date: document.getElementById('edit-date').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/events/${id}` : `${API_BASE_URL}/events`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            closeEditModal();
            loadEvents();
        } else {
            alert('Failed to save event.');
        }
    } catch (e) {
        alert('Error connecting to server.');
    }
});

// ================= VIEW REGISTRATIONS FUNCTIONALITY =================
const regsModal = document.getElementById('regs-modal');
const regsiBody = document.getElementById('regs-tbody');
const noRegsMsg = document.getElementById('no-regs-msg');

async function openRegsModal(id, title) {
    document.getElementById('regs-event-title').innerText = title;
    regsiBody.innerHTML = '';
    noRegsMsg.style.display = 'none';
    regsModal.classList.add('active');

    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}/registrations`);
        if (response.ok) {
            const regs = await response.json();
            if (regs.length === 0) {
                noRegsMsg.style.display = 'block';
            } else {
                regsiBody.innerHTML = regs.map(r => `
                    <tr>
                        <td>${r.user_name}</td>
                        <td>${r.user_email}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        noRegsMsg.style.display = 'block';
        noRegsMsg.innerText = "Error loading registrations.";
    }
}

function closeRegsModal() {
    regsModal.classList.remove('active');
}

loadEvents();
