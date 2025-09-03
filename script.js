// Generic function to load images from JSON
async function loadImages(type) {
  try {
    console.log(`Fetching: ${type}_images/list.json`);
    const response = await fetch(`${type}_images/list.json`); // relative path
    console.log(`Response status for ${type}:`, response.status);

    if (!response.ok) throw new Error(`${type} list.json not found`);

    const imageNames = await response.json();
    console.log(`${type} images loaded:`, imageNames);

    // return full relative paths
    return imageNames.map(name => `${type}_images/${name}`);
  } catch (error) {
    console.error(`Error loading ${type} images:`, error);
    return [];
  }
}

// Render images inside a container
async function displayImages(type, containerId) {
  const images = await loadImages(type);
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = ""; // Clear existing images

  images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `${type} image`;
    img.classList.add("image-item");
    container.appendChild(img);
  });
}

// Load both image sets when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  displayImages("campus", "campus-container");
  displayImages("external", "external-container");
});
