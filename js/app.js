/**
 * AgriConnect PWA Main Logic
 */

// State
const state = {
    currentSection: 'home',
    products: [
        { id: 1, name: 'Premium Maize Seeds', price: '₦12,500', img: 'images/maize.png' },
        { id: 2, name: 'Organic Fertilizer', price: '₦5,000', img: 'images/fertilizer.png' },
        { id: 3, name: 'Sprayer Pump', price: '₦8,200', img: 'https://images.unsplash.com/photo-1595856403061-0b5c1f03d29a?auto=format&fit=crop&q=80&w=300' },
        { id: 4, name: 'Rhode Island Red Chicks', price: '₦800', img: 'https://images.unsplash.com/photo-1547568573-05b1c5740443?auto=format&fit=crop&q=80&w=300' }
    ],
    vets: [
        { id: 1, name: 'Dr. Amina Bello', specialization: 'Livestock Specialist', rating: 4.8, img: 'images/vet-1.png' },
        { id: 2, name: 'Dr. John Okafor', specialization: 'Crop Pathologist', rating: 4.9, img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300' },
        { id: 3, name: 'Vet. Sarah Musa', specialization: 'Poultry Expert', rating: 4.7, img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300' }
    ]
};

// DOM Elements
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Navigate to Home initially
    showSection('home');

    // Simulate Loading and Populate Data
    setTimeout(() => {
        populateMarketplace();
        populateVets();
    }, 1500); // 1.5s delay to show skeleton loader

    // Event Listeners
    chatSendBtn.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registered', reg))
            .catch(err => console.log('Service Worker Failed', err));
    }
});

// Navigation Logic
window.showSection = function (sectionId) {
    // Update State
    state.currentSection = sectionId;

    // Hide all sections
    document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.add('d-none');
        sec.classList.remove('active-section'); // Custom class for animations if needed
    });

    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('d-none');
        target.classList.add('active-section');
    }

    // Update Nav Active States (Both mobile and desktop)
    const navMapping = {
        'home': 'Home',
        'ai-chat': 'Ask AI',
        'market': 'Shop',
        'consult': 'Consult Vets'
    };

    // Bottom Nav
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
        nav.style.color = 'var(--text-secondary)';
    });

    let navId = 'nav-home';
    if (sectionId === 'ai-chat') navId = 'nav-chat';
    else if (sectionId === 'market') navId = 'nav-market';
    else if (sectionId === 'consult') navId = 'nav-consult';

    const activeNav = document.getElementById(navId);
    if (activeNav) {
        activeNav.classList.add('active');
        activeNav.style.color = 'var(--primary)';
    }

    // Desktop Nav
    document.querySelectorAll('.desktop-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.textContent === navMapping[sectionId]) {
            link.classList.add('active');
        }
    });

    window.scrollTo(0, 0);
};

// Data Population
function populateMarketplace() {
    const containers = [document.getElementById('home-products'), document.getElementById('market-list')];

    containers.forEach(container => {
        if (!container) return;

        // Clear skeletons
        container.innerHTML = '';

        state.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.img}" alt="${product.name}" class="product-img" loading="lazy">
                <div class="product-details">
                    <div class="product-price">${product.price}</div>
                    <div class="text-sm mb-1">${product.name}</div>
                    <button class="btn btn-primary text-xs" style="width: 100%; padding: 0.5rem;">Buy Now</button>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

function populateVets() {
    const containers = [document.getElementById('home-vets'), document.getElementById('consult-list')];

    containers.forEach(container => {
        if (!container) return;

        // Clear skeletons
        container.innerHTML = '';

        state.vets.forEach(vet => {
            const card = document.createElement('div');
            card.className = 'card vet-card';
            card.style.marginBottom = '0.75rem';
            card.innerHTML = `
                <div class="vet-avatar flex-center" style="overflow: hidden;">
                    <img src="${vet.img || 'https://via.placeholder.com/60'}" alt="${vet.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0; font-size: 1rem;">${vet.name}</h4>
                    <p class="text-xs text-muted" style="margin: 0;">${vet.specialization}</p>
                    <div class="text-xs text-primary">★ ${vet.rating} / 5.0</div>
                </div>
                <button class="btn btn-outline text-xs">Consult</button>
            `;
            container.appendChild(card);
        });
    });
}

// Chat Functionality
function handleChatSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add User Message
    addMessage(text, 'user');
    chatInput.value = '';

    // Scroll to bottom
    // window.scrollTo(0, document.body.scrollHeight);

    // Simulate AI Latency
    const loadingId = addLoadingMessage();

    setTimeout(() => {
        removeMessage(loadingId);
        const aiResponse = generateAIResponse(text);
        addMessage(aiResponse, 'ai');
    }, 1500);
}

function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerText = text;
    chatMessages.appendChild(div);
    // Scroll into view
    div.scrollIntoView({ behavior: 'smooth' });
    return div;
}

function addLoadingMessage() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message ai';
    div.innerHTML = '<span style="animation: pulse 1s infinite;">Thinking...</span>';
    chatMessages.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function generateAIResponse(query) {
    const q = query.toLowerCase();
    if (q.includes('weather')) return "The weather outlook for the next 3 days is sunny with simulated rainfall on Thursday evening. Ideal for planting maize.";
    if (q.includes('price') || q.includes('cost')) return "Market prices for cassava have risen by 5% this week due to high demand in the south.";
    if (q.includes('sick') || q.includes('disease')) return "I'm sorry to hear that. Could you describe the symptoms? If it's urgent, please consult Dr. Amina Bello from the Vets section.";
    if (q.includes('fertilizer')) return "For yam, NPK 15-15-15 is generally recommended applied 4 weeks after planting.";
    return "That's an interesting farming question! Unfortunately, as a demo AI, I have limited knowledge. Try asking about weather, prices, or fertilizer.";
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('');
}

// Modal Functions
window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
};

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
};

window.handleSellSubmit = function (e) {
    e.preventDefault();
    const name = document.getElementById('sell-name').value;
    const price = document.getElementById('sell-price').value;

    if (!name || !price) return;

    // Add to state
    const newProduct = {
        id: Date.now(),
        name: name,
        price: '₦' + parseInt(price).toLocaleString(),
        img: 'images/maize.png' // New generated placeholder
    };

    state.products.unshift(newProduct);

    // Refresh UI
    populateMarketplace();

    // Reset Form
    document.getElementById('sell-form').reset();
    closeModal('sell-modal');

    // Show success feedback
    showToast('Product Posted Successfully!', 'success');
};

// Toast Notification System
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Export for use in other parts
window.showToast = showToast;

// Role Selection for Auth
window.selectRole = function (button) {
    // Remove active class from all role buttons
    const roleButtons = document.querySelectorAll('#role-selector .btn');
    roleButtons.forEach(btn => btn.classList.remove('active'));

    // Add active to selected button
    button.classList.add('active');

    const role = button.getAttribute('data-role');
    console.log('Selected role:', role);
    // You can store this for backend submission
};
