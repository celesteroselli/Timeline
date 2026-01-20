// Timeline data storage
let timelineData = [];

// DOM elements
const timeline = document.getElementById('timeline');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEventsFromJSON();
});

// Load events from JSON file
async function loadEventsFromJSON() {
    try {
        const response = await fetch('events.json');
        if (!response.ok) {
            throw new Error('Failed to load events data');
        }
        timelineData = await response.json();
        renderTimeline();
    } catch (error) {
        console.error('Error loading events:', error);
        timeline.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Events</h3>
                <p>Could not load timeline events. Please check that events.json exists.</p>
            </div>
        `;
    }
}

// Render timeline
function renderTimeline() {
    if (timelineData.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <h3>No Events Yet</h3>
                <p>Click the "+ Add Event" button to create your first timeline event.</p>
            </div>
        `;
        return;
    }

    timeline.innerHTML = '';

    timelineData.forEach((event, index) => {
        const timelineItem = createTimelineItem(event, index);
        timeline.appendChild(timelineItem);
    });
}

// Create timeline item
function createTimelineItem(event, index) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.dataset.id = event.id;

    const dateText = event.type === 'period'
        ? `${event.startDate} - ${event.endDate}`
        : event.startDate;

    item.innerHTML = `
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <div class="timeline-date">${dateText}</div>
            <div class="timeline-title">${event.title}</div>
            <div class="timeline-details">
                <div class="timeline-description">${event.description}</div>
                ${event.images && event.images.length > 0 ? createCarousel(event.images, event.id) : ''}
            </div>
        </div>
    `;

    const content = item.querySelector('.timeline-content');
    const details = item.querySelector('.timeline-details');

    content.addEventListener('click', (e) => {
        // Don't toggle if clicking on carousel buttons
        if (e.target.closest('.carousel-btn') || e.target.closest('.carousel-indicator')) {
            return;
        }

        details.classList.toggle('expanded');

        // Initialize carousel if expanded and has images
        if (details.classList.contains('expanded') && event.images && event.images.length > 0) {
            initializeCarousel(event.id);
        }
    });

    return item;
}

// Create carousel HTML
function createCarousel(images, eventId) {
    if (!images || images.length === 0) return '';

    const imagesHtml = images.map((img, index) =>
        `<img src="${img}" alt="Image ${index + 1}" class="carousel-image ${index === 0 ? 'active' : ''}">`
    ).join('');

    const indicatorsHtml = images.length > 1 ? images.map((_, index) =>
        `<span class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`
    ).join('') : '';

    const buttonsHtml = images.length > 1 ? `
        <button class="carousel-btn prev" aria-label="Previous image">&lt;</button>
        <button class="carousel-btn next" aria-label="Next image">&gt;</button>
    ` : '';

    return `
        <div class="carousel" data-event-id="${eventId}">
            <div class="carousel-container">
                ${imagesHtml}
                ${buttonsHtml}
            </div>
            ${indicatorsHtml ? `<div class="carousel-indicators">${indicatorsHtml}</div>` : ''}
        </div>
    `;
}

// Initialize carousel functionality
function initializeCarousel(eventId) {
    const carousel = document.querySelector(`.carousel[data-event-id="${eventId}"]`);
    if (!carousel) return;

    let currentIndex = 0;
    const images = carousel.querySelectorAll('.carousel-image');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');

    if (images.length <= 1) return;

    function showImage(index) {
        images.forEach(img => img.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));

        images[index].classList.add('active');
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }
        currentIndex = index;
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newIndex = (currentIndex - 1 + images.length) % images.length;
            showImage(newIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newIndex = (currentIndex + 1) % images.length;
            showImage(newIndex);
        });
    }

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(index);
        });
    });
}

