

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const turnEl = document.getElementById('turn');
const restartBtn = document.getElementById('restartBtn');
const modeSelect = document.getElementById('modeSelect');
const playerMarkSelect = document.getElementById('playerMarkSelect');
const xScoreEl = document.getElementById('xScore');
const oScoreEl = document.getElementById('oScore');
const drawScoreEl = document.getElementById('drawScore');

let board = Array(9).fill(null); // null | 'X' | 'O'
let currentPlayer = 'X';
let gameOver = false;
let mode = 'pvp'; // 'pvp' or 'pvc'
let humanMark = 'X';
let scores = { X:0, O:0, D:0 };

const winningLines = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function init(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.setAttribute('role','button');
    cell.setAttribute('aria-label', `cell ${i+1}`);
    cell.addEventListener('click', onCellClick);
    boardEl.appendChild(cell);
  }
  modeSelect.addEventListener('change', onModeChange);
  playerMarkSelect.addEventListener('change', onPlayerMarkChange);
  restartBtn.addEventListener('click', restart);
  updateModeControls();
  render();
}

function onModeChange(e){
  mode = e.target.value;
  updateModeControls();
  restart();
}

function onPlayerMarkChange(e){
  humanMark = e.target.value;
  restart();
}

function updateModeControls(){
  document.getElementById('aiMarkLabel').style.display = (mode === 'pvc') ? 'inline-flex' : 'none';
}

function onCellClick(e){
  const idx = Number(e.currentTarget.dataset.index);
  if(gameOver || board[idx]) return;

  if(mode === 'pvc'){
    // human plays as humanMark
    if(currentPlayer !== humanMark) return; // prevent clicking when CPU's turn
  }

  makeMove(idx, currentPlayer);

  if(mode === 'pvc' && !gameOver){
    // after human move, let CPU move (if it's CPU's turn)
    window.setTimeout(()=>{
      if(!gameOver && currentPlayer !== humanMark){
        const aiMove = findBestMove(board, currentPlayer);
        if(aiMove != null) makeMove(aiMove, currentPlayer);
      }
    }, 200);
  }
}

function makeMove(index, player){
  if(board[index] || gameOver) return;
  board[index] = player;
  render();
  const winner = checkWinner(board);
  if(winner){
    gameOver = true;
    highlightWin(winner.line);
    statusEl.textContent = `Winner: ${winner.player}`;
    scores[winner.player]++;
    updateScores();
    return;
  }
  if(isDraw(board)){
    gameOver = true;
    statusEl.textContent = 'Draw';
    scores.D++;
    updateScores();
    return;
  }
  currentPlayer = (player === 'X') ? 'O' : 'X';
  turnEl.textContent = currentPlayer;
}

function render(){
  const cells = boardEl.children;
  for(let i=0;i<9;i++){
    cells[i].textContent = board[i] || '';
    cells[i].classList.toggle('disabled', !!board[i] || gameOver);
  }
  turnEl.textContent = currentPlayer;
  if(!gameOver) statusEl.textContent = `Current turn: ${currentPlayer}`;
}

function restart(){
  board = Array(9).fill(null);
  gameOver = false;
  // default starting player X unless human chose O in pvc
  currentPlayer = 'X';
  mode = modeSelect.value;
  humanMark = playerMarkSelect.value;
  // if player chose O in pvc, let CPU start (X)
  render();
  // if mode pvc and CPU is X, CPU plays first move
  if(mode === 'pvc' && currentPlayer !== humanMark){
    // CPU plays
    window.setTimeout(()=>{
      const aiMove = findBestMove(board, currentPlayer);
      if(aiMove != null) makeMove(aiMove, currentPlayer);
    }, 220);
  }
}

function checkWinner(bd){
  for(const line of winningLines){
    const [a,b,c] = line;
    if(bd[a] && bd[a] === bd[b] && bd[a] === bd[c]){
      return { player: bd[a], line };
    }
  }
  return null;
}

function isDraw(bd){
  return bd.every(Boolean) && !checkWinner(bd);
}

function highlightWin(line){
  for(const i of line){
    boardEl.children[i].classList.add('win');
  }
}

function updateScores(){
  xScoreEl.textContent = scores.X;
  oScoreEl.textContent = scores.O;
  drawScoreEl.textContent = scores.D;
}

// ----- Minimax AI -----
// Returns index of best move for player (player is 'X' or 'O')
function findBestMove(bd, player){
  // if board empty and player is X, pick center for a small speedup
  if(bd.every(v=>v===null) && player === 'X') return 4;
  const best = minimax(bd.slice(), player, player);
  return best.index;
}

function minimax(bd, maximizingPlayer, current){
  const winner = checkWinner(bd);
  if(winner){
    if(winner.player === maximizingPlayer) return {score: 1};
    else return {score: -1};
  }
  if(isDraw(bd)) return {score: 0};

  const avail = bd.map((v,i)=>v===null?i:null).filter(v=>v!==null);
  let bestMove = {score: (current === maximizingPlayer) ? -Infinity : Infinity, index: null};

  for(const idx of avail){
    bd[idx] = current;
    const next = (current === 'X') ? 'O' : 'X';
    const res = minimax(bd, maximizingPlayer, next);
    bd[idx] = null;

    if(current === maximizingPlayer){
      // maximize
      if(res.score > bestMove.score){
        bestMove = {score: res.score, index: idx};
      }
    } else {
      // minimize
      if(res.score < bestMove.score){
        bestMove = {score: res.score, index: idx};
      }
    }
  }
  return bestMove;
}

// initialize
init();
