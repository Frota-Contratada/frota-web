import L from 'leaflet';


export const originIcon = L.divIcon({
  className: 'custom-map-marker-origin',
  html: `
    <div style="
      background-color: #10B981;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
      border: 2px solid #ffffff;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});


export const destinationIcon = L.divIcon({
  className: 'custom-map-marker-destination',
  html: `
    <div style="
      background-color: #EF4444;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
      border: 2px solid #ffffff;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});


export const stopIcon = (index: number) =>
  L.divIcon({
    className: 'custom-map-marker-stop',
    html: `
      <div style="
        background-color: #F59E0B;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 8px rgba(245, 158, 11, 0.4);
        border: 2px solid #ffffff;
        color: #ffffff;
        font-weight: bold;
        font-size: 12px;
      ">
        ${index}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });


export const branchIcon = L.divIcon({
  className: 'custom-map-marker-branch',
  html: `
    <div style="
      background-color: #E21B22;
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 14px rgba(226, 27, 34, 0.45);
      border: 2px solid #ffffff;
    ">
      <span style="
        color: #ffffff;
        transform: rotate(45deg);
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -0.5px;
      ">S</span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});
