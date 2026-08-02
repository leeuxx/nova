// 离线图标数据 — 通过 IconifyPreload 在 iconify-icon 初始化时注入
// 必须在 iconify-icon.min.js 之前加载
// 图标网址：https://icon-sets.iconify.design/material-symbols
window.IconifyPreload = [
  {
    prefix: 'material-symbols',
    width: 24, height: 24,
    icons: {
      'home-outline':           { body: '<path fill="currentColor" d="M6 19h3v-6h6v6h3v-9l-6-4.5L6 10zm-2 2V9l8-6l8 6v12h-7v-6h-2v6zm8-8.75"/>' },
      'bolt':                   { body: '<path fill="currentColor" d="m8 22l1-7H4l9-13h2l-1 8h6L10 22z"/>' },
      'menu':                   { body: '<path fill="currentColor" d="M3 18v-2h18v2zm0-5v-2h18v2zm0-5V6h18v2z"/>' },
      'notifications-outline':  { body: '<path fill="currentColor" d="M4 19v-2h2v-7q0-2.075 1.25-3.687T10.5 4.2v-.7q0-.625.438-1.062T12 2t1.063.438T13.5 3.5v.7q2 .5 3.25 2.113T18 10v7h2v2zm8 3q-.825 0-1.412-.587T10 20h4q0 .825-.587 1.413T12 22m-4-5h8v-7q0-1.65-1.175-2.825T12 6T9.175 7.175T8 10z"/>' },
      'dark-mode-outline':      { body: '<path fill="currentColor" d="M12 21q-3.75 0-6.375-2.625T3 12t2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q1.375 0 2.525-.613T20.9 10.65q.05.325.075.662T21 12q0 3.75-2.625 6.375T12 21m0-2q2.2 0 3.95-1.213t2.55-3.162q-.5.125-1 .2t-1 .075q-3.075 0-5.238-2.163T9.1 7.5q0-.5.075-1t.2-1q-1.95.8-3.163 2.55T5 12q0 2.9 2.05 4.95T12 19m-.25-6.75"/>' },
      'light-mode-outline':     { body: '<path fill="currentColor" d="M14.125 14.125Q15 13.25 15 12t-.875-2.125T12 9t-2.125.875T9 12t.875 2.125T12 15t2.125-.875m-5.663 1.413Q7 14.075 7 12t1.463-3.537T12 7t3.538 1.463T17 12t-1.463 3.538T12 17t-3.537-1.463M5 13H1v-2h4zm18 0h-4v-2h4zM11 5V1h2v4zm0 18v-4h2v4zM6.4 7.75L3.875 5.325L5.3 3.85l2.4 2.5zm12.3 12.4l-2.425-2.525L17.6 16.25l2.525 2.425zM16.25 6.4l2.425-2.525L20.15 5.3l-2.5 2.4zM3.85 18.7l2.525-2.425L7.75 17.6l-2.425 2.525zM12 12"/>' },
      'account-circle':         { body: '<path fill="currentColor" d="M5.85 17.1q1.275-.975 2.85-1.537T12 15t3.3.563t2.85 1.537q.875-1.025 1.363-2.325T20 12q0-3.325-2.337-5.663T12 4T6.337 6.338T4 12q0 1.475.488 2.775T5.85 17.1m3.663-5.113Q8.5 10.976 8.5 9.5t1.013-2.488T12 6t2.488 1.013T15.5 9.5t-1.012 2.488T12 13t-2.488-1.012M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"/>' },
      'close':                  { body: '<path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"/>' },
      'help-outline':           { body: '<path fill="currentColor" d="M12.838 17.638q.362-.363.362-.888t-.362-.888t-.888-.362t-.887.363t-.363.887t.363.888t.887.362t.888-.363M11.05 14.15h1.85q0-.825.188-1.3t1.062-1.3q.65-.65 1.025-1.238T15.55 8.9q0-1.4-1.025-2.15T12.1 6q-1.425 0-2.312.75T8.55 8.55l1.65.65q.125-.45.563-.975T12.1 7.7q.8 0 1.2.438t.4.962q0 .5-.3.938t-.75.812q-1.1.975-1.35 1.475t-.25 1.825M12 22q-2.075 0-3.9-.787t-3.175-2.138T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/>' },
      'delete-outline':         { body: '<path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"/>' },
      'add':                    { body: '<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/>' },
      'edit-outline':           { body: '<path fill="currentColor" d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"/>' },
      'circle-outline':         { body: '<path fill="currentColor" d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/>' },
      'keyboard-arrow-up':      { body: '<path fill="currentColor" d="m12 10.8l-4.6 4.6L6 14l6-6l6 6l-1.4 1.4z"/>' },
      'keyboard-arrow-down':    { body: '<path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/>' },
      'text-fields':            { body: '<path fill="currentColor" d="M5 4v3h5.5v12h3V7H19V4z"/>' },
      'notes':                  { body: '<path fill="currentColor" d="M3 18v-2h12v2zm0-5v-2h18v2zm0-5V6h18v2z"/>' },
      'calendar-today':         { body: '<path fill="currentColor" d="M5 22q-.825 0-1.413-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5zM5 8h14V6H5zm7 6q-.425 0-.712-.288T11 13t.288-.712T12 12t.713.288T13 13t-.288.713T12 14"/>' },
      'tag':                    { body: '<path fill="currentColor" d="M11.5 21L2 11.5V2h9.5L21 11.5zM11.55 19l7.95-7.95L11.55 4H4v7.55zM6.5 8q.625 0 1.063-.438T8 6.5t-.437-1.062T6.5 5t-1.062.438T5 6.5t.438 1.063T6.5 8"/>' },
      'link':                   { body: '<path fill="currentColor" d="M11 17H7q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h4v2H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h4zm1-4v-2h2v2zm0 0H8v-2h4zm2 4v-2h4q1.25 0 2.125-.875T21 12t-.875-2.125T18 9h-4V7h4q2.075 0 3.538 1.463T23 12t-1.462 3.537T18 17z"/>' },
      'checklist':              { body: '<path fill="currentColor" d="M4 21q-.425 0-.712-.288T3 20t.288-.712T4 19h16q.425 0 .713.288T21 20t-.288.713T20 21zm0-8q-.425 0-.712-.288T3 12t.288-.712T4 11h16q.425 0 .713.288T21 12t-.288.713T20 13zm0-8q-.425 0-.712-.288T3 4t.288-.712T4 3h16q.425 0 .713.288T21 4t-.288.713T20 5z"/>' }
    }
  },
  {
    prefix: 'mdi',
    width: 24, height: 24,
    icons: {
      'numeric':                    { body: '<path fill="currentColor" d="M4 17V9H2V7h4v10zm18-2a2 2 0 0 1-2 2h-4v-2h4v-2h-2v-2h2V9h-4V7h4a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 1-1.5 1.5a1.5 1.5 0 0 1 1.5 1.5zm-8 0v2H8v-4a2 2 0 0 1 2-2h2V9H8V7h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v2z"/>' },
      'format-list-bulleted-square':{ body: '<path fill="currentColor" d="M3 4h4v4H3zm6 1v2h12V5zm-6 5h4v4H3zm6 1v2h12v-2zm-6 5h4v4H3zm6 1v2h12v-2z"/>' },
      'paperclip':                  { body: '<path fill="currentColor" d="M16.5 6v11.5a4 4 0 0 1-4 4a4 4 0 0 1-4-4V5A2.5 2.5 0 0 1 11 2.5A2.5 2.5 0 0 1 13.5 5v10.5a1 1 0 0 1-1 1a1 1 0 0 1-1-1V6H10v9.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5V5a4 4 0 0 0-4-4a4 4 0 0 0-4 4v12.5a5.5 5.5 0 0 0 5.5 5.5a5.5 5.5 0 0 0 5.5-5.5V6z"/>' },
      'chevron-down':               { body: '<path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z"/>' },
      'upload':                     { body: '<path fill="currentColor" d="M9 16v-6H5l7-7l7 7h-4v6zm-4 4v-2h14v2z"/>' },
      'eye-outline':                { body: '<path fill="currentColor" d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"/>' },
      'filter-variant':             { body: '<path fill="currentColor" d="M6 13h12v-2H6M3 6v2h18V6M10 18h4v-2h-4z"/>' },
      'sort-ascending':             { body: '<path fill="currentColor" d="M19 17h3l-4 4l-4-4h3V3h2M2 17h10v2H2M6 5v2H2V5m0 6h7v2H2z"/>' },
      'sort-descending':            { body: '<path fill="currentColor" d="M19 7h3l-4-4l-4 4h3v14h2M2 17h10v2H2M6 5v2H2V5m0 6h7v2H2z"/>' },
      'radiobox-marked':            { body: '<path fill="currentColor" d="M12 20a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 5a5 5 0 0 0-5 5a5 5 0 0 0 5 5a5 5 0 0 0 5-5a5 5 0 0 0-5-5"/>' },
      'radiobox-blank':             { body: '<path fill="currentColor" d="M12 20a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"/>' },
      'radio-button-checked':       { body: '<path fill="currentColor" d="M12 20a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 5a5 5 0 0 0-5 5a5 5 0 0 0 5 5a5 5 0 0 0 5-5a5 5 0 0 0-5-5"/>' },
      'radio-button-unchecked':     { body: '<path fill="currentColor" d="M12 20a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"/>' },
      'bell-outline':               { body: '<path fill="currentColor" d="M10 21h4c0 1.1-.9 2-2 2s-2-.9-2-2m11-2v1H3v-1l2-2v-6c0-3.1 2-5.8 5-6.7V4c0-1.1.9-2 2-2s2 .9 2 2v.3c3 .9 5 3.6 5 6.7v6zm-4-8c0-2.8-2.2-5-5-5s-5 2.2-5 5v7h10z"/>' },
      'bell-ring-outline':          { body: '<path fill="currentColor" d="M10 21h4a2 2 0 0 1-2 2a2 2 0 0 1-2-2m11-2v1H3v-1l2-2v-6c0-3.1 2.03-5.83 5-6.71V4a2 2 0 0 1 2-2a2 2 0 0 1 2 2v.29c2.97.88 5 3.61 5 6.71v6zm-4-8a5 5 0 0 0-5-5a5 5 0 0 0-5 5v7h10zm2.75-7.81l-1.42 1.42A8.98 8.98 0 0 1 21 11h2c0-2.93-1.16-5.75-3.25-7.81M1 11h2c0-2.4.96-4.7 2.67-6.39L4.25 3.19A10.96 10.96 0 0 0 1 11"/>' }
    }
  },
  {
    prefix: 'lucide',
    width: 24, height: 24,
    icons: {
      'refresh-cw': { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></g>' },
      'settings':   { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0a2.34 2.34 0 0 0 3.319 1.915a2.34 2.34 0 0 1 2.33 4.033a2.34 2.34 0 0 0 0 3.831a2.34 2.34 0 0 1-2.33 4.033a2.34 2.34 0 0 0-3.319 1.915a2.34 2.34 0 0 1-4.659 0a2.34 2.34 0 0 0-3.32-1.915a2.34 2.34 0 0 1-2.33-4.033a2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></g>' }
    }
  }
]
