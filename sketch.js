// sprite sheets
let attackSheet, runSheet, jumpSheet, char2StandbySheet, char2RunSheet;

// 畫格尺寸 (Frame dimensions) - 根據圖片實際尺寸修正
const ATTACK_FRAME_W = 50; // 角色1 攻擊圖檔: 395px / 5幀 = 79px
const RUN_FRAME_W = 45;    // 角色1 跑步圖檔: 474px / 6幀 ~= 79px
const JUMP_FRAME_W = 46;   // 角色1 跳躍圖檔: 200px / 4幀 = 50px
const CHAR2_STANDBY_FRAME_W = 66; // 角色2 待機圖檔: 250px / 5幀 = 50px
const CHAR2_RUN_FRAME_W = 61; // 角色2 跑步圖檔: 350px / 7幀 = 50px
const FRAME_H = 70;
const ATTACK_FRAMES = 5;
const RUN_FRAMES = 6;
const JUMP_FRAMES = 4;
const CHAR2_STANDBY_FRAMES = 5;
const CHAR2_RUN_FRAMES = 7;

// 動畫計時與速度控制（數字越小越快）
// 使用毫秒穩定計時來控制逐格播放（更像跑馬燈）
let currentIdx = 0;
let lastChange = 0;
let attackDuration = 120; // 每幀毫秒（待機/攻擊）
let runDuration = 80; // 每幀毫秒（跑步）
let jumpDuration = 100; // 每幀毫秒（跳躍）
let char2StandbyDuration = 150; // 角色2 待機速度
let char2RunDuration = 90; // 角色2 跑步速度

// -- 角色1 狀態 --
let mode = 'attack';
let mode2 = 'standby'; // 角色2 狀態

// -- 全域狀態 --
let activeCharacter = 1; // 1 或 2

// 角色位置、方向與速度
let characterX, characterY;
let facing = 1; // 1 代表朝右, -1 代表朝左
let moveSpeed = 4; // 移動速度
let groundY; // 地面高度

// 跳躍物理相關變數
let velocityY = 0;
let gravity = 0.6;
let jumpStrength = -15; // 負值代表向上
let isJumping = false;


function preload() {
  // 載入所有角色的圖片資源
  attackSheet = loadImage('1-攻擊/1-all攻擊.png');
  runSheet = loadImage('1/all.png');
  jumpSheet = loadImage('1-跳/1-跳all.png');
  char2StandbySheet = loadImage('2-待機/2-待機all.png');
  char2RunSheet = loadImage('2/all.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noSmooth();

  // 初始化角色位置在畫面中央
  characterX = width / 2;
  groundY = height / 2; // 將初始 Y 位置設為地面
  characterY = groundY;
  // 不在 setup 中切割為多張影格（預留使用整張 spritesheet，繪製時取子影格）
}

function draw() {
  background('#f5ebe0');

  // 根據當前活動的角色，執行不同的繪製和邏輯函數
  if (activeCharacter === 1) {
    drawCharacter1();
  } else { // activeCharacter === 2
    drawCharacter2();
  }
}

function drawCharacter1() {
  // 檢查是否按住右方向鍵（持續按住則跑步）
  let wantRun = (keyIsDown(RIGHT_ARROW) || keyIsDown(LEFT_ARROW)) && !isJumping;
  
  // 決定當前模式
  let newMode;
  if (isJumping) {
    newMode = 'jump';
  } else if (wantRun) {
    newMode = 'run';
  } else {
    newMode = 'attack';
  }

  // --- 物理與位置更新 ---
  // 套用重力
  velocityY += gravity;
  characterY += velocityY;

  // 如果角色落地
  if (characterY >= groundY) {
    characterY = groundY;
    velocityY = 0;
    isJumping = false;
  }

  // 如果正在跑步 (且不在空中)，更新角色位置和方向
  if (wantRun && !isJumping) {
    if (keyIsDown(LEFT_ARROW)) {
      characterX -= moveSpeed;
      facing = -1; // 朝左
    } else if (keyIsDown(RIGHT_ARROW)) {
      characterX += moveSpeed;
      facing = 1; // 朝右
    }
  }

  // --- 動畫狀態管理 ---
  // 模式切換時重置索引與計時，避免跳幀
  if (newMode !== mode) {
    mode = newMode;
    currentIdx = 0;
    lastChange = millis();
  }

  // 選擇對應的幀數長度與間隔（毫秒）
  let framesLength, duration, currentFrameW, sheet;
  if (mode === 'run') {
    framesLength = RUN_FRAMES; duration = runDuration; currentFrameW = RUN_FRAME_W; sheet = runSheet;
  } else if (mode === 'jump') {
    framesLength = JUMP_FRAMES; duration = jumpDuration; currentFrameW = JUMP_FRAME_W; sheet = jumpSheet;
  } else { // 'attack'
    framesLength = ATTACK_FRAMES; duration = attackDuration; currentFrameW = ATTACK_FRAME_W; sheet = attackSheet;
  }

  // 若超過間隔則切到下一幀（逐格更新）
  if (millis() - lastChange >= duration) {
    currentIdx = (currentIdx + 1) % framesLength;
    lastChange = millis();
  }

  let idx = currentIdx;

  // --- 繪圖 ---
  let maxTargetW = width * 0.5;
  let scaleFactor = maxTargetW / currentFrameW;
  if (scaleFactor > 2) scaleFactor = 2;
  if (scaleFactor < 0.3) scaleFactor = 0.3;
  let targetW = currentFrameW * scaleFactor;
  let targetH = FRAME_H * scaleFactor;

  // --- 繪圖區塊 ---
  push(); // 儲存當前的繪圖設定
  translate(characterX, characterY); // 將畫布原點移動到角色位置
  scale(facing, 1); // 根據 facing 變數翻轉 X 軸 (1 不變, -1 翻轉)

  // 從對應的 spritesheet 取出子影格並繪製（確保只會畫出一張影格）
  let sx = idx * currentFrameW;
  image(sheet, 0, 0, targetW, targetH, sx, 0, currentFrameW, FRAME_H);
  pop(); // 恢復到儲存的繪圖設定
}

function drawCharacter2() {
  // 檢查是否按住左右方向鍵
  let wantRun = keyIsDown(RIGHT_ARROW) || keyIsDown(LEFT_ARROW);
  let newMode = wantRun ? 'run' : 'standby';

  // 如果正在跑步，更新角色位置和方向
  if (wantRun) {
    if (keyIsDown(LEFT_ARROW)) {
      characterX -= moveSpeed;
      facing = -1; // 朝左
    } else if (keyIsDown(RIGHT_ARROW)) {
      characterX += moveSpeed;
      facing = 1; // 朝右
    }
  }

  // --- 動畫狀態管理 ---
  if (newMode !== mode2) {
    mode2 = newMode;
    currentIdx = 0;
    lastChange = millis();
  }

  // 選擇對應的幀數長度與間隔
  let framesLength, duration, currentFrameW, sheet;
  if (mode2 === 'run') {
    framesLength = CHAR2_RUN_FRAMES; duration = char2RunDuration; currentFrameW = CHAR2_RUN_FRAME_W; sheet = char2RunSheet;
  } else { // 'standby'
    framesLength = CHAR2_STANDBY_FRAMES; duration = char2StandbyDuration; currentFrameW = CHAR2_STANDBY_FRAME_W; sheet = char2StandbySheet;
  }

  // 若超過間隔則切到下一幀（逐格更新）
  if (millis() - lastChange >= duration) {
    currentIdx = (currentIdx + 1) % framesLength;
    lastChange = millis();
  }
  
  let idx = currentIdx;

  // --- 繪圖 ---
  let maxTargetW = width * 0.5;
  let scaleFactor = maxTargetW / currentFrameW;
  if (scaleFactor > 2) scaleFactor = 2;
  if (scaleFactor < 0.3) scaleFactor = 0.3;
  let targetW = currentFrameW * scaleFactor;
  let targetH = FRAME_H * scaleFactor;
  
  // --- 繪圖區塊 ---
  push();
  translate(characterX, groundY); // 使用角色的 X 座標，Y 座標固定在地面
  scale(facing, 1); // 翻轉角色方向

  let sx = idx * currentFrameW;
  image(sheet, 0, 0, targetW, targetH, sx, 0, currentFrameW, FRAME_H);
  pop();
}

function keyPressed() {
  // 角色1的跳躍指令
  if (keyCode === UP_ARROW && !isJumping && activeCharacter === 1) {
    isJumping = true;
    velocityY = jumpStrength;
  }
  // 按下空白鍵切換角色
  if (key === ' ') {
    activeCharacter = activeCharacter === 1 ? 2 : 1;
    // 切換時重置動畫計時器
    characterX = width / 2;
    facing = 1;
    isJumping = false; // 確保切換時不在跳躍狀態
    currentIdx = 0;
    lastChange = millis();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
