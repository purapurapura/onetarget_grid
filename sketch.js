// Фиксируем идеальное разрешение (Виртуальный холст 16:9)
const VW = 1920; 
const VH = 1080;

// Настройки стадий сетки
let stageCols = [2, 5, 10, 13, 16, 36];
let stageRows = [2, 5, 10, 13, 16, 19];
let clickRadii = [1, 2, 4, 6, 7, 9]; 
let maxStage = 5; 
let currentStage = 0;

// Массив цветов фокуса
let focusColorsHex = [
  "#02CC13", // 1
  "#172BC0", // 2
  "#00BAE8", // 3
  "#782ECC", // 4
  "#D7249E", // 5
  "#E9C242", // 6
  "#F77A1A", // 7
  "#E01D1D"  // 8
];
let focusColors = [];

let colDefault, colFocus, colFocusRelated, colAfterImpact, colLogo;

let pendingStage = -1;
let expansionDelayTimer = 0;
let lastClickedStage = 0;
let EXPANSION_DELAY_FRAMES = 40; 

let isRecording = false; 

// ЛОГОТИП ВРЕМЕННО ОТКЛЮЧЕН
// let logo; 
// let logoSvgText = ""; 
let grid = [];
let currentFocus = null;

class Cell {
  constructor(c, r) {
    this.c = c; 
    this.r = r;
    this.state = 0; 
    
    this.curSize = 0;   
    this.tarSize = 0;   
    this.curStroke = 0;
    this.tarStroke = 0;
    
    this.tarColor = color("#C9CBD0"); // fallback default
    this.curColor = color("#C9CBD0");
    
    this.curR = red(this.tarColor);
    this.curG = green(this.tarColor);
    this.curB = blue(this.tarColor);
    this.delay = 0; 
  }
  
  update() {
    if (this.delay > 0) {
      this.delay--; 
    } else {
      if (abs(this.tarSize - this.curSize) > 0.05) this.curSize = lerp(this.curSize, this.tarSize, 0.08); 
      else this.curSize = this.tarSize;
      
      if (abs(this.tarStroke - this.curStroke) > 0.05) this.curStroke = lerp(this.curStroke, this.tarStroke, 0.08); 
      else this.curStroke = this.tarStroke;
      
      this.curR = lerp(this.curR, red(this.tarColor), 0.08);
      this.curG = lerp(this.curG, green(this.tarColor), 0.08);
      this.curB = lerp(this.curB, blue(this.tarColor), 0.08);
      
      if (abs(this.curR - red(this.tarColor)) < 1.0 && abs(this.curG - green(this.tarColor)) < 1.0 && abs(this.curB - blue(this.tarColor)) < 1.0) {
        this.curR = red(this.tarColor);
        this.curG = green(this.tarColor);
        this.curB = blue(this.tarColor);
      }
      this.curColor = color(this.curR, this.curG, this.curB);
    }
  }
  
  draw(startX, startY) {
    if (this.curSize < 0.1) return; 
    
    let x = startX + this.c * 50;
    let y = startY - this.r * 50; 
    
    // ЗАПРЕТНАЯ ЗОНА ВРЕМЕННО ОТКЛЮЧЕНА
    // if (x + 20 > 1668 && x - 20 < 1668 + 182 && y + 20 > 70 && y - 20 < 70 + 36.11) {
    //   return; 
    // }
    
    noStroke();
    fill(this.curColor);
    ellipse(x, y, this.curSize, this.curSize);
    
    let innerD = this.curSize - this.curStroke * 2;
    if (innerD > 0) {
      fill(255); 
      ellipse(x, y, innerD, innerD);
    }
  }
}

// ПРЕЛОАД ЛОГОТИПА ВРЕМЕННО ОТКЛЮЧЕН
// function preload() {
//   logo = loadImage("onetarget_logo.svg");
//   loadStrings("onetarget_logo.svg", function(result) {
//     logoSvgText = result.join('\n');
//   });
// }

function setup() {
  createCanvas(windowWidth, windowHeight); 

  // Инициализируем массив цветов
  for (let i = 0; i < focusColorsHex.length; i++) {
    focusColors.push(color(focusColorsHex[i]));
  }

  colDefault = color("#C9CBD0");       
  colFocus = focusColors[0];           // Стартуем с 02CC13
  colFocusRelated = colDefault;        // Обводка такого же цвета как default
  colAfterImpact = colDefault;         // After Impact теперь тоже СЕРЫЙ
  colLogo = color("#A3A7B2");          
  
  resetSketch(); 
}

function draw() {
  if (expansionDelayTimer > 0) {
    expansionDelayTimer--;
    if (expansionDelayTimer === 0 && pendingStage !== -1) {
      currentStage = pendingStage;
      activateGrid(currentStage, true);
      if (currentFocus !== null) {
        applyFocusRelated(currentFocus.c, currentFocus.r, lastClickedStage);
      }
      pendingStage = -1;
    }
  }
  
  background(255);
  
  let scaleFactor = min(windowWidth / VW, windowHeight / VH);
  let offsetX = (windowWidth - VW * scaleFactor) / 2;
  let offsetY = (windowHeight - VH * scaleFactor) / 2;
  
  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);
  
  let totalW = 36 * 40 + 35 * 10;
  let totalH = 19 * 40 + 18 * 10;
  let startX = (VW - totalW) / 2 + 20;  
  let startY = VH - (VH - totalH) / 2 - 20; 
  
  for (let c = 0; c < 36; c++) {
    for (let r = 0; r < 19; r++) {
      grid[c][r].update();
      grid[c][r].draw(startX, startY);
    }
  }
  
  // ОТРИСОВКА ЛОГОТИПА ВРЕМЕННО ОТКЛЮЧЕНА
  // if (logo) {
  //   tint(colLogo);
  //   image(logo, 1668, 70, 182, 36.11);
  //   noTint(); 
  // }
  
  pop(); 
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function resetSketch() {
  currentStage = 0;
  currentFocus = null;
  pendingStage = -1;
  expansionDelayTimer = 0;
  lastClickedStage = 0;
  
  for (let c = 0; c < 36; c++) {
    grid[c] = []; 
    for (let r = 0; r < 19; r++) {
      grid[c][r] = new Cell(c, r);
    }
  }
  activateGrid(currentStage, false);
}

function keyPressed() {
  // Переключение цветов фокуса по цифрам 1-8
  if (key >= '1' && key <= '8') {
    let index = int(key) - 1;
    colFocus = focusColors[index];
    
    // Мгновенно обновляем цвет только у ТЕКУЩЕЙ точки фокуса (state 2)
    // state 4 (After Impact) мы больше не трогаем, она остается серой
    for (let c = 0; c < 36; c++) {
      for (let r = 0; r < 19; r++) {
        if (grid[c][r].state === 2) {
          grid[c][r].tarColor = colFocus;
        }
      }
    }
  }

  if (key === 'q' || key === 'Q') {
    resetSketch();
  }
  
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);       
  }
  
  if (key === 'e' || key === 'E') {
    exportToSVG();
  }
}

function exportToSVG() {
  let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">\n`;
  svg += `<rect width="100%" height="100%" fill="white"/>\n`;
  
  let totalW = 36 * 40 + 35 * 10;
  let totalH = 19 * 40 + 18 * 10;
  let startX = (VW - totalW) / 2 + 20;  
  let startY = VH - (VH - totalH) / 2 - 20; 
  
  for (let c = 0; c < 36; c++) {
    for (let r = 0; r < 19; r++) {
      let cell = grid[c][r];
      if (cell.curSize < 0.1) continue; 
      
      let x = startX + c * 50;
      let y = startY - r * 50; 
      
      // ЗАПРЕТНАЯ ЗОНА ЭКСПОРТА ВРЕМЕННО ОТКЛЮЧЕНА
      // if (x + 20 > 1668 && x - 20 < 1668 + 182 && y + 20 > 70 && y - 20 < 70 + 36.11) {
      //   continue; 
      // }
      
      let hexCol = "#" + hex(round(cell.curR), 2) + hex(round(cell.curG), 2) + hex(round(cell.curB), 2);
      svg += `<circle cx="${x}" cy="${y}" r="${cell.curSize / 2}" fill="${hexCol}"/>\n`;
      
      let innerD = cell.curSize - cell.curStroke * 2;
      if (innerD > 0) {
        svg += `<circle cx="${x}" cy="${y}" r="${innerD / 2}" fill="white"/>\n`;
      }
    }
  }
  
  // ВНЕДРЕНИЕ ВЕКТОРНОГО ЛОГОТИПА ВРЕМЕННО ОТКЛЮЧЕНО
  // if (logoSvgText !== "") {
  //   let coloredLogo = logoSvgText.replace(/fill="[^"]*"/gi, 'fill="#A3A7B2"');
  //   let base64Logo = btoa(unescape(encodeURIComponent(coloredLogo)));
  //   svg += `<image href="data:image/svg+xml;base64,${base64Logo}" x="1668" y="70" width="182" height="36.11" />\n`;
  // }
  
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
}

function activateGrid(stage, withDelay) {
  let cols = stageCols[stage];
  let rows = stageRows[stage];
  let prevBase = (stage > 0) ? (stageCols[stage-1] + stageRows[stage-1]) : 0;
  
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let cell = grid[c][r];
      if (cell.state === 0) { 
        cell.state = 1;
        cell.tarSize = 40;          
        cell.tarStroke = 1;
        cell.tarColor = colDefault;
        
        if (withDelay) {
          cell.curSize = 0;         
          cell.curStroke = 20;      
          let distOffset = max(0, (c + r) - prevBase + 2);
          cell.delay = distOffset * 3; 
        } else {
          cell.curSize = 40;
          cell.curStroke = 1;
          cell.delay = 0;
        }
      }
    }
  }
}

function mousePressed() {
  let scaleFactor = min(windowWidth / VW, windowHeight / VH);
  let offsetX = (windowWidth - VW * scaleFactor) / 2;
  let offsetY = (windowHeight - VH * scaleFactor) / 2;
  
  let vMouseX = (mouseX - offsetX) / scaleFactor;
  let vMouseY = (mouseY - offsetY) / scaleFactor;
  
  let totalW = 36 * 40 + 35 * 10;
  let totalH = 19 * 40 + 18 * 10;
  let startX = (VW - totalW) / 2 + 20;
  let startY = VH - (VH - totalH) / 2 - 20;
  
  let clickedC = -1;
  let clickedR = -1;
  
  for (let c = 0; c < stageCols[currentStage]; c++) {
    for (let r = 0; r < stageRows[currentStage]; r++) {
      let cx = startX + c * 50;
      let cy = startY - r * 50;
      
      // ЗАПРЕТНАЯ ЗОНА КЛИКА ВРЕМЕННО ОТКЛЮЧЕНА
      // if (cx + 20 > 1668 && cx - 20 < 1668 + 182 && cy + 20 > 70 && cy - 20 < 70 + 36.11) {
      //   continue;
      // }
      
      if (dist(vMouseX, vMouseY, cx, cy) <= 20) {
        if (grid[c][r].state > 0) {
          clickedC = c;
          clickedR = r;
          break;
        }
      }
    }
  }
  
  if (clickedC !== -1 && clickedR !== -1) {
    handleFocus(grid[clickedC][clickedR]);
  }
}

function handleFocus(target) {
  lastClickedStage = currentStage;
  
  if (currentFocus !== null) {
    currentFocus.state = 4;
    currentFocus.tarStroke = 20;
    currentFocus.tarColor = colAfterImpact; // Теперь это colDefault (серый)
  }
  
  currentFocus = target;
  currentFocus.state = 2;
  currentFocus.tarStroke = 20; 
  currentFocus.tarColor = colFocus;
  currentFocus.delay = 0; 
  
  applyFocusRelated(currentFocus.c, currentFocus.r, lastClickedStage);
  
  if (currentStage < maxStage && pendingStage === -1) {
    pendingStage = currentStage + 1;
    expansionDelayTimer = EXPANSION_DELAY_FRAMES;
  }
}

function applyFocusRelated(fc, fr, clickedStage) {
  let R = clickRadii[clickedStage];
  let maxStr = (currentStage >= 3) ? 20 : map(currentStage, 0, 2, 8, 16);
  
  for (let c = 0; c < stageCols[currentStage]; c++) {
    for (let r = 0; r < stageRows[currentStage]; r++) {
      if (c === fc && r === fr) continue; 
      
      let cell = grid[c][r];
      let d = max(abs(c - fc), abs(r - fr)); 
      
      if (d <= R) { 
        let sWeight;
        
        if (R <= 1.0) {
          sWeight = maxStr; 
        } else {
          sWeight = map(d, 1, R, maxStr, 4);
        }
        
        sWeight = constrain(sWeight, 4, maxStr);
        
        if (cell.state === 1 || cell.state === 3) {
          cell.state = 3;
          if (sWeight > cell.tarStroke) {
            cell.tarStroke = sWeight;
          }
          cell.tarColor = colFocusRelated; 
        }
      }
    }
  }
}
