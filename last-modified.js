function updateLastModified() {
    // Get the last modified time from the document's metadata
    const lastModified = new Date(document.lastModified);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Chicago',
        timeZoneName: 'short'
    };
    
    const formattedDate = lastModified.toLocaleString('en-US', options);
    const lastModifiedElement = document.querySelector('.credits p:last-child');
    
    if (lastModifiedElement) {
        lastModifiedElement.textContent = `Document last updated: ${formattedDate}`;
    }
}

// Update when the page loads
document.addEventListener('DOMContentLoaded', updateLastModified);

// Update every minute
setInterval(updateLastModified, 60000); 