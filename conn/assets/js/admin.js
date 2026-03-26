document.addEventListener('DOMContentLoaded', () => {
    const API_BASE =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://farm-ai-iota.vercel.app';
    const API_ROOT = `${API_BASE}/backend`;
    const listBody = document.getElementById('admin-professionals-list');
    const modalOverlay = document.getElementById('admin-modal-overlay');
    const closeModalBtn = document.getElementById('admin-close-modal');
    const adminForm = document.getElementById('admin-form');
    const addBtn = document.getElementById('add-specialist-btn');
    const modalTitle = document.getElementById('modal-title');

    // Image picker elements
    const imageFileInput = document.getElementById('image_file');
    const imageUrlHidden = document.getElementById('image_url');
    const imgPreview = document.getElementById('img-preview');
    const uploadZone = document.getElementById('upload-zone');

    // --- Image picker: live preview + auto-upload ---
    function showPreview(src) {
        imgPreview.src = src;
        imgPreview.classList.add('visible');
        uploadZone.classList.add('has-preview');
    }

    function clearPreview() {
        imgPreview.src = '';
        imgPreview.classList.remove('visible');
        uploadZone.classList.remove('has-preview');
        imageUrlHidden.value = '';
        if (imageFileInput) imageFileInput.value = '';
    }

    // Drag-and-drop visual feedback
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', () => uploadZone.classList.remove('drag-over'));

    imageFileInput.addEventListener('change', async () => {
        const file = imageFileInput.files[0];
        if (!file) return;

        // Instant local preview
        const localUrl = URL.createObjectURL(file);
        showPreview(localUrl);

        // Upload to server
        const fd = new FormData();
        fd.append('image_file', file);

        try {
            const res = await fetch(`${API_ROOT}/conn/upload`, { method: 'POST', body: fd });
            const data = await res.json();

            if (data.status === 'success') {
                imageUrlHidden.value = data.url;   // store server path in hidden field
                // Clear the selected file so it won't be sent on submit
                // (the backend expects multipart fields only, not files, for create/update).
                imageFileInput.value = '';
            } else {
                alert('Image upload failed: ' + data.message);
                clearPreview();
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Image upload failed. Check your server.');
            clearPreview();
        }
    });

    let currentProfessionals = [];
    let currentAppointments = [];
    let isEditing = false;

    // Fetch Initial Data
    fetchProfessionals();
    fetchAppointments();


    async function fetchProfessionals() {
        try {
            const response = await fetch(`${API_ROOT}/conn/professionals`);
            const data = await response.json();

            if (data.status === 'success') {
                currentProfessionals = data.data;
                renderProfessionals();
            } else {
                listBody.innerHTML = `<tr><td colspan="6" class="loading-text">Failed to load professionals.</td></tr>`;
            }
        } catch (error) {
            console.error('Error fetching professionals:', error);
            listBody.innerHTML = `<tr><td colspan="6" class="loading-text">Error loading data.</td></tr>`;
        }
    }

    async function fetchAppointments() {
        const appointmentListBody = document.getElementById('admin-appointments-list');
        try {
            const response = await fetch(`${API_ROOT}/conn/appointments`);

            // If the server returned non-JSON (e.g. PHP error page), show raw text
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                console.error('Non-JSON response from server:', text);
                appointmentListBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color:#ef4444;">
                    Server error — check PHP logs.<br><small style="font-size:0.75rem;">${text.substring(0, 200)}</small>
                </td></tr>`;
                return;
            }

            if (data.status === 'success') {
                currentAppointments = data.data;
                renderAppointments(appointmentListBody);
            } else {
                appointmentListBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color:#ef4444;">
                    ${data.message || 'Failed to load appointments.'}
                </td></tr>`;
            }
        } catch (error) {
            console.error('Network error fetching appointments:', error);
            appointmentListBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color:#ef4444;">
                Network error — could not reach backend API<br>
                <small style="font-size:0.75rem;">${error.message}</small>
            </td></tr>`;
        }
    }

    function renderProfessionals() {
        if (currentProfessionals.length === 0) {
            listBody.innerHTML = `<tr><td colspan="6" class="loading-text">No professionals found.</td></tr>`;
            return;
        }

        listBody.innerHTML = currentProfessionals.map(prof => `
            <tr>
                <td><img src="${prof.image_url}" alt="${prof.name}"></td>
                <td><strong>${prof.name}</strong></td>
                <td>${prof.specialty}</td>
                <td><i class="ph-fill ph-star" style="color: var(--accent-color);"></i> ${prof.rating}</td>
                <td><span class="status-badge" style="position: static; display: inline-flex;"><div class="status-dot" style="background: ${getStatusColor(prof.availability_status)}"></div> ${prof.availability_status}</span></td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="editProfessional('${prof.id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-icon delete" onclick="deleteProfessional('${prof.id}')" title="Delete"><i class="ph ph-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderAppointments(container) {
        if (currentAppointments.length === 0) {
            container.innerHTML = `<tr><td colspan="8" class="loading-text">No appointments yet.</td></tr>`;
            return;
        }

        container.innerHTML = currentAppointments.map((app, index) => `
            <tr>
                <!-- # -->
                <td style="color: var(--text-secondary); font-weight: 600; text-align: center;">${index + 1}</td>

                <!-- Full Name -->
                <td><strong>${app.user_name}</strong></td>

                <!-- Email Address -->
                <td>
                    <a href="mailto:${app.user_email}" style="color: var(--primary-color); text-decoration: none;">
                        ${app.user_email}
                    </a>
                </td>

                <!-- Phone Number -->
                <td>
                    <a href="tel:${app.user_phone}" style="color: var(--primary-color); text-decoration: none;">
                        ${app.user_phone}
                    </a>
                </td>

                <!-- Specialist Booked -->
                <td><strong>${app.professional_name}</strong></td>

                <!-- Preferred Date & Time -->
                <td style="white-space: nowrap;">${new Date(app.appointment_date).toLocaleString()}</td>

                <!-- What do you want to discuss? -->
                <td>
                    <div style="max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                         title="${app.message}">
                        ${app.message}
                    </div>
                </td>

                <!-- Actions -->
                <td>
                    <button class="btn-icon delete" onclick="deleteAppointment(${app.id})" title="Delete Appointment">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    window.switchTab = (tab) => {
        const specSection = document.getElementById('specialists-section');
        const appSection = document.getElementById('appointments-section');
        const tabs = document.querySelectorAll('.tab-btn');

        if (tab === 'specialists') {
            specSection.style.display = 'block';
            appSection.style.display = 'none';
            tabs[0].style.backgroundColor = 'var(--primary-color)';
            tabs[0].style.color = 'var(--white)';
            tabs[1].style.backgroundColor = 'var(--white)';
            tabs[1].style.color = 'var(--text-primary)';
        } else {
            specSection.style.display = 'none';
            appSection.style.display = 'block';
            tabs[1].style.backgroundColor = 'var(--primary-color)';
            tabs[1].style.color = 'var(--white)';
            tabs[0].style.backgroundColor = 'var(--white)';
            tabs[0].style.color = 'var(--text-primary)';
        }
    };

    function getStatusColor(status) {
        if (status === 'available') return '#10b981';
        if (status === 'busy') return '#f59e0b';
        return '#ef4444';
    }

    // Modal Control
    const openModal = (mode = 'add', profData = null) => {
        isEditing = mode === 'edit';
        modalTitle.textContent = isEditing ? 'Edit Specialist' : 'Add New Specialist';

        if (isEditing && profData) {
            document.getElementById('prof_id').value = profData.id;
            document.getElementById('name').value = profData.name;
            document.getElementById('specialty').value = profData.specialty;
            document.getElementById('experience_years').value = profData.experience_years;
            document.getElementById('rating').value = profData.rating;
            document.getElementById('image_url').value = profData.image_url;
            document.getElementById('email').value = profData.email || '';
            document.getElementById('phone').value = profData.phone || '';
            document.getElementById('availability_status').value = profData.availability_status;
            document.getElementById('description').value = profData.description;

            // Show existing image in the upload zone preview
            if (profData.image_url) {
                showPreview(profData.image_url);
            } else {
                clearPreview();
            }
        } else {
            adminForm.reset();
            document.getElementById('prof_id').value = '';
            clearPreview();
        }

        modalOverlay.classList.add('active');
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        adminForm.reset();
        clearPreview();
    };

    addBtn.addEventListener('click', () => openModal('add'));
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Handle Edit globally
    window.editProfessional = (id) => {
        const prof = currentProfessionals.find(p => String(p.id) === String(id));
        if (prof) openModal('edit', prof);
    };

    // Handle Delete globally
    window.deleteProfessional = async (id) => {
        if (!confirm('Are you sure you want to delete this specialist? This action cannot be undone.')) return;

        try {
            const formData = new FormData();
            formData.append('id', id);

            const response = await fetch(`${API_ROOT}/conn/professionals/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.status === 'success') {
                alert('Specialist deleted successfully.');
                fetchProfessionals(); // Refresh list
            } else {
                alert(data.message || 'Deletion failed');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('An error occurred. Please try again.');
        }
    };

    window.deleteAppointment = async (id) => {
        if (!confirm('Are you sure you want to cancel/delete this appointment?')) return;

        try {
            const formData = new FormData();
            formData.append('id', id);

            const response = await fetch(`${API_ROOT}/conn/appointments/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.status === 'success') {
                alert('Appointment deleted successfully.');
                fetchAppointments(); // Refresh list
            } else {
                alert(data.message || 'Deletion failed');
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('An error occurred. Please try again.');
        }
    };

    // Handle Form Submit (Add/Edit)
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('admin-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');

        btnText.style.display = 'none';
        loader.style.display = 'inline-block';
        submitBtn.disabled = true;

        const formData = new FormData(adminForm);
        // Backend create/update for conn/professionals does not handle file uploads on submit.
        // The file upload already happens immediately on image selection.
        formData.delete('image_file');

        const profId = document.getElementById('prof_id')?.value?.trim();
        const url = isEditing
            ? `${API_ROOT}/conn/professionals/${encodeURIComponent(profId || formData.get('id') || '')}`
            : `${API_ROOT}/conn/professionals`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            let data = null;
            try {
                data = await response.json();
            } catch (_) {
                // If server returns non-JSON (HTML error page), show a short snippet.
                const txt = await response.text();
                throw new Error(`Request failed (${response.status}): ${txt.substring(0, 200)}`);
            }

            if (data.status === 'success') {
                alert(isEditing ? 'Specialist updated successfully!' : 'Specialist added successfully!');
                closeModal();
                fetchProfessionals(); // Refresh list
            } else {
                alert(data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(error.message || 'An error occurred. Please try again.');
        } finally {
            btnText.style.display = 'inline';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
});
