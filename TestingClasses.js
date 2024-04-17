const {
  Room,
  User,
  UserManager,
  RoomManager,
  LobbyHandler,
} = require("./SocketClasses.js");

class TestRoom extends Room {
  constructor(server, size, id, name) {
    super(server, size, id, name);
  }

  onJoin(user) {
    super.onJoin(user);
    this.broadcast("join", { id: user.id, name: user.name });
    this.send(
      user,
      "users",
      this.users.map((u) => {
        return { id: u.id, name: u.name };
      }),
    );
  }

  onLeave(user) {
    super.onLeave(user);
    this.broadcast("leave", { id: user.id, name: user.name });
  }

  onMessage(user, event, message) {
    switch (event) {
      case "username":
        user.name = message;
        this.broadcast(
          "users",
          this.users.map((u) => {
            return { id: u.id, name: u.name };
          }),
        );
        break;
    }
  }

  update() {}
}

class TestUser extends User {
  constructor(socket, id, name) {
    super(socket, id, name);
  }

  onMessage(event, message) {
    if (this.room) this.room.onMessage(this, event, message);
  }
}

class TestLobbyHandler extends LobbyHandler {
  constructor(server, maxRooms, maxUsers) {
    super(server, maxRooms, maxUsers);
  }

  onMessage(socket, event, message) {
    let ret;
    switch (event) {
      case "joinLobby":
        ret = this.joinRoom(message, this.findUser(socket));
        this.server
          .to(socket.id)
          .emit(
            "lobbyResponse",
            ret ? "Joined Lobby" : "Failed to join lobby try a diffrent id",
          );
        break;
      case "createLobby":
        ret = this.createRoom("test", 2, TestRoom);
        this.server
          .to(socket.id)
          .emit(
            "lobbyResponse",
            ret ? "Created Lobby" : "Failed to create lobby try a diffrent id",
          );
      default:
        this.userManager.onMessage(socket, event, message);
        break;
    }
  }
}

class PongRoom extends Room{
  constructor(server, size, id, name){
    super(server, size, id, name);
    this.screenWidth = 300;
    this.screenHeight = 200;
    this.ball = {x: 100, y: 100, radius: 10, speedX: 2, speedY: 2}
    this.paddle1 = {x: 10, y: 100, width: 10, height: 50}
    this.paddle2 = {x: 280, y: 100, width: 10, height: 50}
    this.score = {p1: 0, p2: 0}
    this.paddleSpeed = 2;
  }

  onJoin(user){
    super.onJoin(user);
    this.broadcast("join", {id: user.id, name: user.name});
    this.send(user, "users", this.users.map((u) => {
      return {id: u.id, name: u.name};
    }));
  }

  onLeave(user){
    super.onLeave(user);
    this.broadcast("leave", {id: user.id, name: user.name});
  }

  onMessage(user, event, message){
    //console.log(event);
    switch(event){
      case "username":
        user.name = message;
        this.broadcast("users", this.users.map((u) => {
          return {id: u.id, name: u.name};
        }));
        break;
    }
  }

  sendUpdate(){
    let data = {
      paddle1: {x: this.paddle1.x, y: this.paddle1.y, width: this.paddle1.width, height: this.paddle1.height},
      paddle2: {x: this.paddle2.x, y: this.paddle2.y, width: this.paddle2.width, height: this.paddle2.height},
      ball: {x: this.ball.x, y: this.ball.y, r: this.ball.radius},
      score: {p1: this.score.p1, p2: this.score.p2}
    }
    this.broadcast("update", data);
  }

  update(){
    if (this.users.length >= 2){
      if (this.users[0].input == 1){
        this.paddle1.y+=this.paddleSpeed;
      }
      else if (this.users[0].input == -1){
        this.paddle1.y-=this.paddleSpeed;
      }
      if (this.users[1].input == 1){
        this.paddle2.y+=this.paddleSpeed;
      }
      else if (this.users[1].input == -1){
        this.paddle2.y-=this.paddleSpeed;
      }
      this.users[0].input = 0;
      this.users[1].input = 0;
      if (this.paddle1.y < 0) this.paddle1.y = 0;
      else if (this.paddle1.y > this.screenHeight - this.paddle1.height) this.paddle1.y = this.screenHeight - this.paddle1.height;
      if (this.paddle2.y < 0) this.paddle2.y = 0;
      else if (this.paddle2.y > this.screenHeight - this.paddle2.height) this.paddle2.y = this.screenHeight - this.paddle2.height;
      this.ball.x += this.ball.speedX;
      this.ball.y += this.ball.speedY;
      if (this.ball.x-this.ball.radius < 0){
        this.score.p2++;
        this.ball.x = this.screenWidth/2;
        this.ball.y = this.screenHeight/2;
        this.ball.speedX = 2;
        this.ball.speedY = 2;
      }
      else if (this.ball.x+this.ball.radius > this.screenWidth){
        this.score.p1++;
        this.ball.x = this.screenWidth/2;
        this.ball.y = this.screenHeight/2;
        this.ball.speedX = -2;
        this.ball.speedY = -2;
      }
      if (this.ball.y-this.ball.radius < 0 || this.ball.y+this.ball.radius > this.screenHeight){
        this.ball.speedY *= -1;
      }
      if (lineCircle(this.paddle1.x, this.paddle1.y, this.paddle1.width+this.paddle1.x,this.paddle1.y,this.ball.x,this.ball.y,this.ball.radius)||lineCircle(this.paddle1.x,this.paddle1.y+this.paddle1.height,this.paddle1.x+this.paddle1.width,this.paddle1.y+this.paddle1.height,this.ball.x,this.ball.y,this.ball.radius)||lineCircle(this.paddle2.x,this.paddle2.y,this.paddle2.width+this.paddle1.x,this.paddle2.y,this.ball.x,this.ball.y,this.ball.radius)||lineCircle(this.paddle2.x,this.paddle2.y+this.paddle2.height,this.paddle2.x+this.paddle2.width,this.paddle2.y+this.paddle2.height,this.ball.x,this.ball.y,this.ball.radius)){
        this.ball.speedY *= -1;
      }
      if (lineCircle(this.paddle1.x,this.paddle1.y,this.paddle1.x,this.paddle1.y+this.paddle1.height,this.ball.x,this.ball.y,this.ball.radius)||lineCircle(this.paddle1.x+this.paddle1.width,this.paddle1.y,this.paddle1.x+this.paddle1.width,this.paddle1.y+this.paddle1.height,this.ball.x,this.ball.y,this.ball.radius)||lineCircle(this.paddle2.x,this.paddle2.y,this.paddle2.x,this.paddle2.y+this.paddle2.height,this.ball.x,this.ball.y,this.ball.radius)||lineCircle(this.paddle2.x+this.paddle2.width,this.paddle2.y,this.paddle2.x+this.paddle2.width,this.paddle2.y+this.paddle2.height,this.ball.x,this.ball.y,this.ball.radius)){
        this.ball.speedX *= -1;
      }
    }
    this.sendUpdate();
  }
}

class PongUser extends User{
  constructor(socket, id, name){
    super(socket, id, name);
    this.input = 0;
  }

  onMessage(event, message){
    switch(event){
      case "username":
        this.name = message;
        this.room.broadcast("users", this.room.users.map((u) => {
          return {id: u.id, name: u.name};
        }));
        break;
      case "input":
        this.input = message;
    }
  }
}

class PongLobbyHandler extends LobbyHandler{
  constructor(server, maxRooms, maxUsers){
    super(server, maxRooms, maxUsers);
  }
  onMessage(socket, event, message){
    let ret;
   // console.log(message)
    switch(event){
      case "joinLobby":
        ret = this.joinRoom(message[0], this.findUser(socket));
        this.server
          .to(socket.id)
          .emit(
            "lobbyResponse",
            ret ? "Joined Lobby" : "Failed to join lobby try a diffrent id",
          );
        break;
      case "createLobby":
        ret = this.createRoom(message[0], 2, PongRoom);
        this.server
          .to(socket.id)
          .emit(
            "lobbyResponse",
            ret ? "Created Lobby" : "Failed to create lobby try a diffrent id",
          );
      default:
        this.userManager.onMessage(socket, event, message);
        break;
    }
    //console.log(this.roomManager.rooms)
  }
}

function distanc(x1, y1, x2, y2){
  return Math.sqrt(Math.pow(x2-x1, 2)+Math.pow(y2-y1,2));
}

function pointCircle(x1, y1, x2, y2, r){
  if (distanc(x1, y1, x2, y2) <= r){
    return true;
  }
  return false;
}

function linePoint(x1, y1, x2, y2, px, py){
  let d1 = distanc(px, py, x1, y1);
  let d2 = distanc(px, py, x2, y2);
  let len = distanc(x1, y1, x2, y2);
  let buffer = 0.1;
  if (d1+d2 >= len-buffer && d1+d2 <= len+buffer) {
    return true;
  }
  return false;
}

function lineCircle(x1, y1, x2, y2, cx, cy, cr){
  let inside1 = pointCircle(x1,y1, cx,cy,cr);
  let inside2 = pointCircle(x2,y2, cx,cy,cr);
  if (inside1 || inside2) return true;
  let len = distanc(x1, y1, x2, y2);
  let dot = ( ((cx-x1)*(x2-x1)) + ((cy-y1)*(y2-y1)) ) / Math.pow(len,2);
  let closestX = x1 + (dot * (x2-x1));
  let closestY = y1 + (dot * (y2-y1));
  let onSegment = linePoint(x1,y1,x2,y2, closestX,closestY);
  if (!onSegment) return false;
  distX = closestX - cx;
  distY = closestY - cy;
  let distance = Math.sqrt( (distX*distX) + (distY*distY) );

  if (distance <= cr) {
    return true;
  }
  return false;
}


module.exports = { TestRoom, TestUser, TestLobbyHandler, PongRoom, PongUser, PongLobbyHandler };
