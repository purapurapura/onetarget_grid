// Настройки стадий сетки
let stageCols = [2, 5, 10, 13, 16, 36];
let stageRows = [2, 5, 10, 13, 16, 19];
let clickRadii = [1, 2, 4, 6, 7, 9]; 
let maxStage = 5; 
let currentStage = 0;

let colDefault, colFocus, colFocusRelated, colAfterImpact, colLogo;

let pendingStage = -1;
let expansionDelayTimer = 0;
let lastClickedStage = 0;
let EXPANSION_DELAY_FRAMES = 40; 

let isRecording = false; 

let logo; 
let logoSvgText = ""; // Сюда загрузится текстовый код из локального файла
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
    
    this.tarColor = colDefault;
    this.curColor = colDefault;
    
    this.curR = red(colDefault);
    this.curG = green(colDefault);
    this.curB = blue(colDefault);
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
    
    if (x + 20 > 1668 && x - 20 < 1668 + 182 && y + 20 > 70 && y - 20 < 70 + 36.11) {
      return; 
    }
    
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

// Загружаем картинку и текст из файла, который лежит в репозитории
function preload() {
  logo = loadImage("onetarget_logo.svg");
  
  loadStrings("onetarget_logo.svg", function(result) {
    logoSvgText = result.join('\n');
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  colDefault = color("#C9CBD0");       
  colFocus = color("#172BC0");         
  colFocusRelated = color("#03D2FF");  
  colAfterImpact = color("#03D2FF");   
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
  
  let totalW = 36 * 40 + 35 * 10;
  let totalH = 19 * 40 + 18 * 10;
  let startX = (width - totalW) / 2 + 20;  
  let startY = height - (height - totalH) / 2 - 20; 
  
  for (let c = 0; c < 36; c++) {
    for (let r = 0; r < 19; r++) {
      grid[c][r].update();
      grid[c][r].draw(startX, startY);
    }
  }
  
  if (logo) {
    tint(colLogo);
    image(logo, 1668, 70, 182, 36.11);
    noTint(); 
  }
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
  let totalW = 36 * 40 + 35 * 10;
  let totalH = 19 * 40 + 18 * 10;
  let startX = (width - totalW) / 2 + 20;
  let startY = height - (height - totalH) / 2 - 20;
  
  let clickedC = -1;
  let clickedR = -1;
  
  for (let c = 0; c < stageCols[currentStage]; c++) {
    for (let r = 0; r < stageRows[currentStage]; r++) {
      let cx = startX + c * 50;
      let cy = startY - r * 50;
      
      if (cx + 20 > 1668 && cx - 20 < 1668 + 182 && cy + 20 > 70 && cy - 20 < 70 + 36.11) {
        continue;
      }
      
      if (dist(mouseX, mouseY, cx, cy) <= 20) {
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
    currentFocus.tarColor = colAfterImpact; 
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
      let d = dist(c, r, fc, fr); 
      
      if (d <= R + 0.1) { 
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
