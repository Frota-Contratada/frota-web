import L from 'leaflet';

export const originIcon = L.divIcon({
  className: 'custom-map-marker-origin',
  html: `
    <div style="display: flex; align-items: center; justify-content: center; transform: translate(0, 0); transition: transform 0.2s ease;">
      <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(16, 185, 129, 0.4));">
        <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 40 15 40C15 40 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#10B981"/>
        <circle cx="15" cy="14" r="5.5" fill="#FFFFFF"/>
      </svg>
    </div>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

export const destinationIcon = L.divIcon({
  className: 'custom-map-marker-destination',
  html: `
    <div style="display: flex; align-items: center; justify-content: center; transform: translate(0, 0); transition: transform 0.2s ease;">
      <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(226, 27, 34, 0.45));">
        <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 40 15 40C15 40 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#E21B22"/>
        <circle cx="15" cy="14" r="5.5" fill="#FFFFFF"/>
      </svg>
    </div>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

export const stopIcon = (index: number) =>
  L.divIcon({
    className: 'custom-map-marker-stop',
    html: `
      <div style="display: flex; align-items: center; justify-content: center;">
        <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 6px rgba(15, 23, 42, 0.35));">
          <path d="M13 0C5.8203 0 0 5.8203 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.8203 20.1797 0 13 0Z" fill="#0F172A"/>
          <text x="13" y="16.5" fill="#FFFFFF" font-size="10" font-weight="700" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central">${index}</text>
        </svg>
      </div>
    `,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -34],
  });

export const branchIcon = L.divIcon({
  className: 'custom-map-marker-branch',
  html: `
    <div style="display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 5px 12px rgba(226, 27, 34, 0.45));">
        <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.61116 26.3888 0 17 0Z" fill="#E21B22"/>
        <path d="M11 11H23V23H11V11ZM13 13V15H15V13H13ZM17 13V15H21V13H17ZM13 17V19H15V17H13ZM17 17V19H21V17H17ZM13 21V23H15V21H13ZM17 21V23H21V21H17Z" fill="#FFFFFF"/>
      </svg>
    </div>
  `,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -44],
});

export const vehicleIcon = (heading = 0) =>
  L.divIcon({
    className: 'custom-map-marker-vehicle',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.3s ease;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45); border: 2.5px solid #ffffff;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

export const createTomTomMarkerElement = (
  type: 'origin' | 'destination' | 'branch' | 'stop' | 'vehicle',
  index = 1
): HTMLElement => {
  const el = document.createElement('div');
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.cursor = 'pointer';

  if (type === 'origin') {
    el.innerHTML = `
      <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(16, 185, 129, 0.45));">
        <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 40 15 40C15 40 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#10B981"/>
        <circle cx="15" cy="14" r="5.5" fill="#FFFFFF"/>
      </svg>
    `;
  } else if (type === 'destination') {
    el.innerHTML = `
      <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(226, 27, 34, 0.45));">
        <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 40 15 40C15 40 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#E21B22"/>
        <circle cx="15" cy="14" r="5.5" fill="#FFFFFF"/>
      </svg>
    `;
  } else if (type === 'branch') {
    el.innerHTML = `
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 5px 12px rgba(226, 27, 34, 0.45));">
        <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.61116 26.3888 0 17 0Z" fill="#E21B22"/>
        <path d="M11 11H23V23H11V11ZM13 13V15H15V13H13ZM17 13V15H21V13H17ZM13 17V19H15V17H13ZM17 17V19H21V17H17ZM13 21V23H15V21H13ZM17 21V23H21V21H17Z" fill="#FFFFFF"/>
      </svg>
    `;
  } else if (type === 'vehicle') {
    el.innerHTML = `
      <div style="width: 36px; height: 36px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45); border: 2.5px solid #ffffff;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
        </svg>
      </div>
    `;
  } else {
    el.innerHTML = `
      <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 6px rgba(15, 23, 42, 0.35));">
        <path d="M13 0C5.8203 0 0 5.8203 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.8203 20.1797 0 13 0Z" fill="#0F172A"/>
        <text x="13" y="16.5" fill="#FFFFFF" font-size="10" font-weight="700" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central">${index}</text>
      </svg>
    `;
  }

  return el;
};
