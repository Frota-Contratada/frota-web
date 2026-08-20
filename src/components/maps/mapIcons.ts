import L from 'leaflet';

export const originIcon = L.divIcon({
  className: 'custom-map-marker-origin',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background-color: rgba(16, 185, 129, 0.2);
        animation: markerPulse 2s ease-out infinite;
      "></div>
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
        border: 2.5px solid #ffffff;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 36],
  popupAnchor: [0, -36],
});

export const destinationIcon = L.divIcon({
  className: 'custom-map-marker-destination',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background-color: rgba(226, 27, 34, 0.2);
        animation: markerPulse 2s ease-out infinite;
      "></div>
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: linear-gradient(135deg, #EF4444 0%, #E21B22 100%);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 16px rgba(226, 27, 34, 0.4);
        border: 2.5px solid #ffffff;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 36],
  popupAnchor: [0, -36],
});

export const stopIcon = (index: number) =>
  L.divIcon({
    className: 'custom-map-marker-stop',
    html: `
      <div style="
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        border: 2px solid #ffffff;
        color: #ffffff;
        font-weight: 700;
        font-size: 11px;
        font-family: system-ui, sans-serif;
      ">
        ${index}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

export const branchIcon = L.divIcon({
  className: 'custom-map-marker-branch',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background-color: rgba(44, 44, 158, 0.2);
        animation: markerPulse 2.2s ease-out infinite;
      "></div>
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        background: linear-gradient(135deg, #E21B22 0%, #C41219 100%);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 18px rgba(226, 27, 34, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <span style="
          color: #ffffff;
          transform: rotate(45deg);
          font-size: 13px;
          font-weight: 800;
          font-family: system-ui, sans-serif;
        ">S</span>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 40],
  popupAnchor: [0, -40],
});
