function exportToSVG() {
  let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `<rect width="100%" height="100%" fill="white"/>\n`;
  
  let totalW = 36 * 40 + 35 * 10;
  let totalH = 19 * 40 + 18 * 10;
  let startX = (width - totalW) / 2 + 20;  
  let startY = height - (height - totalH) / 2 - 20; 
  
  // Рисуем сетку
  for (let c = 0; c < 36; c++) {
    for (let r = 0; r < 19; r++) {
      let cell = grid[c][r];
      if (cell.curSize < 0.1) continue; 
      
      let x = startX + c * 50;
      let y = startY - r * 50; 
      
      if (x + 20 > 1668 && x - 20 < 1668 + 182 && y + 20 > 70 && y - 20 < 70 + 36.11) {
        continue; 
      }
      
      let hexCol = "#" + hex(round(cell.curR), 2) + hex(round(cell.curG), 2) + hex(round(cell.curB), 2);
      svg += `<circle cx="${x}" cy="${y}" r="${cell.curSize / 2}" fill="${hexCol}"/>\n`;
      
      let innerD = cell.curSize - cell.curStroke * 2;
      if (innerD > 0) {
        svg += `<circle cx="${x}" cy="${y}" r="${innerD / 2}" fill="white"/>\n`;
      }
    }
  }
  
  // ВНЕДРЯЕМ ВЕКТОРНЫЙ ЛОГОТИП В ЭКСПОРТ (через Base64 Data-URI)
  if (logoSvgText !== "") {
    // 1. Перекрашиваем все элементы логотипа в нужный цвет #A3A7B2
    let coloredLogo = logoSvgText.replace(/fill="[^"]*"/gi, 'fill="#A3A7B2"');
    
    // 2. Кодируем строку SVG в формат Base64 (безопасно для любых символов)
    let base64Logo = btoa(unescape(encodeURIComponent(coloredLogo)));
    
    // 3. Вставляем как независимый масштабируемый image
    svg += `<image href="data:image/svg+xml;base64,${base64Logo}" x="1668" y="70" width="182" height="36.11" />\n`;
  }
  
  svg += `</svg>`;
  
  let blob = new Blob([svg], {type: "image/svg+xml"});
  let url = URL.createObjectURL(blob);
  let link = document.createElement("a");
  link.href = url;
  link.download = "onetarget_export.svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log("Exported clean custom SVG with perfect Base64 vector logo!");
}
