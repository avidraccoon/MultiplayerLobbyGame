localStorage.debug = '*';
let test = document.getElementById("test");
let htmlUsers =
  document.getElementById('myList');
let users = [];
let button = document.getElementById('submit');
let join = document.getElementById('join');
let create = document.getElementById('create');
var socket = io();
const lobbyStatus = document.getElementById('lobbyStatus');

function updateUsers(){
  let ul = `${users.map(data =>
    `<li>${data.name}</li>`).join('')}`;
  htmlUsers.innerHTML = ul;
}

function sendUsername(name){
  socket.emit('username', name);
}

function createLobby(id){
  socket.emit('createLobby', id);
}

function joinLobby(id){
  socket.emit('joinLobby', id);
}

button.onclick = () => {sendUsername(document.getElementById('username').value); document.getElementById('username').value = '';}

join.onclick = () => {joinLobby(document.getElementById('lobby').value); document.getElementById('lobby').value = '';}

create.onclick = () => {createLobby(document.getElementById('lobby').value); document.getElementById('lobby').value = 0;}

socket.on("update", (msg) => {
  //console.log(msg)
  test.innerText = "Counter " + msg;
});

socket.on("users", (msg) => {
  //console.log(msg)
  users = msg;
  updateUsers();
})

socket.on("join", (msg) => {
  console.log(msg)
  users.push(msg);
  updateUsers();
})
//socket.onAny((...args)=>{
  //console.log(args)
//})
socket.on("lobbyResponse" , (msg) => {
  console.log(msg)
  if (msg.type == "creating") {
    if (msg.success) {
      lobbyStatus.innerText = "Lobby Created";
      return;
    }
    lobbyStatus.innerText = "Lobby Creation Failed Try a diffrent id";
    return;
  }
  if (msg.type == "joining"){
   if (msg.success){
     lobbyStatus.innerText = "Joined Lobby";
     return;
   }
   lobbyStatus.innerText = "Lobby Join Failed Try a diffrent id";
   return;
  }
})