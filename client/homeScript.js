let users = [];
var socket = io();
let ball = {x:0, y:0, r:0};
let paddle1 = {x:0, y:0, width:0, height:0};
let paddle2 = {x:0, y:0, width:0, height:0};
let score = {p1:0, p2:0};
let lobby = {name: "", id: "", size: 0};

document.getElementById("submit").onclick = () => {
  let name = document.getElementById("username");
  socket.emit("username", name.value);
  name.value = "";
};

document.getElementById("join").onclick = () => {
  let id = document.getElementById("lobby");
  //console.log(id.value)
  socket.emit("joinLobby", id.value);
  id.value = "";
};

document.getElementById("create").onclick = () => {
  socket.emit("createLobby", document.getElementById("lobby").value);
};

function updateUsers(user, joining) {
  if (joining == undefined) users = user;
  else if (joining) users.push(user);
  else users = users.filter((u) => u.id != user.id);
  document.getElementById("myList").innerHTML = "";
  for (let i = 0; i < users.length; i++){
    let li = document.createElement("li");
    let text = document.createElement("p");
    text.innerText = users[i].name;
    li.appendChild(text);
    document.getElementById("myList").appendChild(li);
  }
  //document.getElementById("myList").innerHTML =
    `${users.map((data) => `<li>${data.name}</li>`).join("")}`;
}

socket.on("users", (msg) => {
  updateUsers(msg);
});

socket.on("join", (msg) => {
  updateUsers(msg, true);
});

socket.on("leave", (msg) => {
  updateUsers(msg, false);
});

socket.on("lobbyResponse", (msg) => {
  document.getElementById("lobbyStatus").innerText = msg;
});

socket.on("lobbyInfo", (msg) => {
  lobby.name = msg.name;
  lobby.id = msg.id;
  lobby.size = msg.id;
});

socket.on("update", (msg) => {
  paddle1 = msg.paddle1;
  paddle2 = msg.paddle2;
  ball = msg.ball;
  score = msg.score;
});

socket.onAny((...args) => {
  //console.log(args);
});

function setup() {
  createCanvas(300, 200);
}

function draw() {
  background(220);
  //console.log(paddle1)
 //rect(10, 10, 100, 100)
  textAlign(CENTER)
  textSize(20);
  text(`${score.p1}\t\t\t\t\t\t${score.p2}`,150, 25)
  rect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
  rect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
  ellipse(ball.x, ball.y, ball.r*2);
  if (keyIsDown(UP_ARROW)){
    socket.emit("input", -1);
  }
  else if (keyIsDown(DOWN_ARROW)){
    socket.emit("input", 1);
  }
}

