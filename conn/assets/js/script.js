document.addEventListener('DOMContentLoaded', () => {
    const API_BASE =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://farm-ai-iota.vercel.app';
    const API_ROOT = `${API_BASE}/backend`;

    const grid = document.getElementById('professionals-grid');
    const modal = document.getElementById('booking-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const bookingForm = document.getElementById('booking-form');
    let selectedProfessionalId = null;

    function getSignedInUser() {
        try {
            return JSON.parse(localStorage.getItem('myfarmai_user') || 'null');
        } catch (_) {
            return null;
        }
    }

    function requireAuth() {
        const user = getSignedInUser();
        if (user && user.email) return true;

        // Use parent app auth UI when embedded as an iframe.
        try {
            if (window.parent && typeof window.parent.showSection === 'function') {
                window.parent.showSection('auth');
            }
        } catch (_) {
            // ignore
        }
        alert('Please sign in to book a consultation.');
        return false;
    }

    // Fetch professionals
    fetchProfessionals();

    let allProfessionals = [];

    async function fetchProfessionals() {
        try {
            const response = await fetch(`${API_ROOT}/conn/professionals`);
            const data = await response.json();

            if (data.status === 'success') {
                allProfessionals = data.data;
                renderProfessionals(allProfessionals);
            } else {
                grid.innerHTML = '<p class="loading-text">Failed to load professionals.</p>';
            }
        } catch (error) {
            console.error('Error fetching professionals:', error);
            grid.innerHTML = '<p class="loading-text">An error occurred while loading data.</p>';
        }
    }

    function renderProfessionals(professionals) {
        if (professionals.length === 0) {
            grid.innerHTML = '<p class="loading-text">No professionals found.</p>';
            return;
        }

        grid.innerHTML = professionals.map(prof => `
            <div class="card">
                <div class="card-img-wrapper">
                    <img src="${prof.image_url}" alt="${prof.name}" class="card-img">
                    <div class="status-badge status-${prof.availability_status}">
                        <div class="status-dot"></div>
                    </div>
                </div>
                <div class="card-content-wrapper">
                    <h3 class="card-title">${prof.name}</h3>
                    <p class="card-specialty">${prof.specialty}</p>
                    <div class="card-meta">
                        <span class="rating"><i class="ph-fill ph-star"></i> ${prof.rating}</span>
                        <span>• ${prof.experience_years} Years Exp.</span>
                    </div>
                </div>
                <button class="btn-book" onclick="openModal('${prof.id}', '${prof.name.replace(/'/g, "\\'")}')">Consult</button>
            </div>
        `).join('');
    }

    // Search and Category Filtering
    const searchInput = document.getElementById('expert-search');
    const categoryChips = document.querySelectorAll('.category-chip');

    const filterProfessionals = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const activeCategory = document.querySelector('.category-chip.active').textContent.toLowerCase();

        const filtered = allProfessionals.filter(prof => {
            const matchesSearch = prof.name.toLowerCase().includes(searchTerm) ||
                prof.specialty.toLowerCase().includes(searchTerm);

            const matchesCategory = activeCategory === 'all' ||
                prof.specialty.toLowerCase().includes(activeCategory.replace(' experts', '').replace(' doctors', ''));

            return matchesSearch && matchesCategory;
        });

        renderProfessionals(filtered);
    };

    if (searchInput) {
        searchInput.addEventListener('input', filterProfessionals);
    }

    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterProfessionals();
        });
    });

    // Navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Modal functionality
    window.openModal = (id, name) => {
        if (!requireAuth()) return;
        selectedProfessionalId = id;
        document.getElementById('prof-name').textContent = name;
        const emailEl = document.getElementById('user_email');
        const user = getSignedInUser();
        if (emailEl && user && user.email) {
            emailEl.value = user.email;
            emailEl.readOnly = true; // prevent editing (optional)
        }
        modalOverlay.classList.add('active');
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        bookingForm.reset();
        selectedProfessionalId = null;
        const emailEl = document.getElementById('user_email');
        if (emailEl) emailEl.readOnly = false;
    };

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!requireAuth()) return;
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');

        // Show loading state
        btnText.style.display = 'none';
        loader.style.display = 'inline-block';
        submitBtn.disabled = true;

        const formData = new FormData(bookingForm);
        formData.append('professional_id', selectedProfessionalId);

        try {
            const response = await fetch(`${API_ROOT}/conn/book`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.status === 'success') {
                const notified = Boolean(data.data && data.data.consultantEmailSent);
                alert(
                    notified
                        ? 'Appointment booked successfully! The consultant has been notified by email.'
                        : 'Appointment booked successfully! Your request has been saved.'
                );
                closeModal();
            } else {
                alert(data.message || 'Booking failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred while booking. Please try again.');
        } finally {
            // Restore button state
            btnText.style.display = 'inline';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
});
