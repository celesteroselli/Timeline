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

    // Group events: periods and their associated dates
    const periods = timelineData.filter(e => e.type === 'period');
    const dates = timelineData.filter(e => e.type === 'date');

    // If no periods, just render all dates
    if (periods.length === 0) {
        timelineData.forEach((event, index) => {
            const timelineItem = createTimelineItem(event, index);
            timeline.appendChild(timelineItem);
        });
        return;
    }

    let currentRow = 1;

    // Render periods and dates together
    periods.forEach((period, periodIndex) => {
        // Find dates that fall within this period
        const periodDates = dates.filter(date => isDateInPeriod(date, period));
        const datesBeforePeriod = periodIndex === 0 ? dates.filter(date => isDateBeforePeriod(date, period)) : [];

        // Render dates before the first period
        if (periodIndex === 0 && datesBeforePeriod.length > 0) {
            datesBeforePeriod.forEach((date, idx) => {
                const dateItem = createTimelineItem(date, dates.indexOf(date));
                dateItem.querySelector('.timeline-content').style.gridRow = currentRow;
                dateItem.querySelector('.timeline-marker').style.gridRow = currentRow;
                timeline.appendChild(dateItem);
                currentRow++;
                // Add spacing between dates
                if (idx < datesBeforePeriod.length - 1) {
                    currentRow++;
                }
            });
        }

        // Calculate how many rows this period should span
        const periodStartRow = currentRow;
        // Each date takes 2 rows (1 for content, 1 for spacing)
        const rowSpan = Math.max(periodDates.length * 2 - 1, 1);

        // Create and render the period
        const periodItem = createTimelineItem(period, periods.indexOf(period));
        const periodContent = periodItem.querySelector('.timeline-content');
        periodContent.style.gridRow = `${periodStartRow} / span ${rowSpan}`;
        timeline.appendChild(periodItem);

        // Render dates within this period
        periodDates.forEach((date, idx) => {
            const dateItem = createTimelineItem(date, dates.indexOf(date));
            dateItem.querySelector('.timeline-content').style.gridRow = currentRow;
            dateItem.querySelector('.timeline-marker').style.gridRow = currentRow;
            timeline.appendChild(dateItem);
            currentRow++;
            // Add spacing between dates
            if (idx < periodDates.length - 1) {
                currentRow++;
            }
        });

        // Move to next row after period
        if (periodDates.length === 0) {
            currentRow++;
        } else {
            currentRow++;
        }
    });

    // Render any remaining dates after the last period
    const lastPeriod = periods[periods.length - 1];
    const remainingDates = dates.filter(date => isDateAfterPeriod(date, lastPeriod));
    remainingDates.forEach((date, idx) => {
        const dateItem = createTimelineItem(date, dates.indexOf(date));
        dateItem.querySelector('.timeline-content').style.gridRow = currentRow;
        dateItem.querySelector('.timeline-marker').style.gridRow = currentRow;
        timeline.appendChild(dateItem);
        currentRow++;
        // Add spacing between dates
        if (idx < remainingDates.length - 1) {
            currentRow++;
        }
    });
}

// Helper function to check if a date falls within a period
function isDateInPeriod(dateEvent, period) {
    // Simple string comparison - in production you'd use proper date parsing
    const dateStr = dateEvent.startDate.toLowerCase();
    const periodStart = period.startDate.toLowerCase();
    const periodEnd = period.endDate.toLowerCase();

    // Extract day numbers for comparison
    const dateDay = extractDay(dateStr);
    const startDay = extractDay(periodStart);
    const endDay = extractDay(periodEnd);

    return dateDay >= startDay && dateDay <= endDay;
}

function isDateBeforePeriod(dateEvent, period) {
    const dateDay = extractDay(dateEvent.startDate.toLowerCase());
    const startDay = extractDay(period.startDate.toLowerCase());
    return dateDay < startDay;
}

function isDateAfterPeriod(dateEvent, period) {
    const dateDay = extractDay(dateEvent.startDate.toLowerCase());
    const endDay = extractDay(period.endDate.toLowerCase());
    return dateDay > endDay;
}

function extractDay(dateStr) {
    // Extract numeric day from strings like "January 4th" or "Evening of January 4th"
    const match = dateStr.match(/(\d+)(st|nd|rd|th)/);
    return match ? parseInt(match[1]) : 0;
}

// Create timeline item
function createTimelineItem(event, index) {
    const item = document.createElement('div');
    item.className = `timeline-item ${event.type}`;
    item.dataset.id = event.id;

    const dateText = event.type === 'period'
        ? `${event.startDate} - ${event.endDate}`
        : event.startDate;

    item.innerHTML = `
        <div class="timeline-content">
            <div class="timeline-date">${dateText}</div>
            <div class="timeline-title">${event.title}</div>
            <div class="timeline-details ${event.type === 'period' ? 'expanded' : ''}">
                <div class="timeline-description">${event.description}</div>
                ${event.images && event.images.length > 0 ? createCarousel(event.images, event.id, event.rotate) : ''}
            </div>
        </div>
        <div class="timeline-marker"></div>
    `;

    const content = item.querySelector('.timeline-content');
    const details = item.querySelector('.timeline-details');

    // Only add click handler for date events (not periods)
    if (event.type === 'date') {
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
    } else if (event.type === 'period') {
        // Initialize carousel immediately for periods since they're always expanded
        if (event.images && event.images.length > 0) {
            setTimeout(() => initializeCarousel(event.id), 0);
        }
    }

    return item;
}

// Create carousel HTML
function createCarousel(images, eventId, rotate) {
    if (!images || images.length === 0) return '';

    // Calculate rotation degrees based on rotate value
    const rotationDegrees = rotate ? rotate * 90 : 0;
    const rotationStyle = rotationDegrees > 0 ? `style="transform: rotate(${rotationDegrees}deg);"` : '';

    const imagesHtml = images.map((img, index) =>
        `<img src="${img}" alt="Image ${index + 1}" class="carousel-image ${index === 0 ? 'active' : ''}" ${rotationStyle}>`
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

