class Room{

  constructor(server, size, id, name){
    this.server = server;
    this.users = [];
    this.size = size;
    this.locked = false;
    this.id = id;
    if (name == undefined) name = id + "";
    this.name = name;
    this.updateRate = 60;
    this.setUpdateInterval();
    this.onCreate();
  }

  send(client, event, message){
    this.server.to(client.socket).emit(event, message);
  }

  broadcast(event, message){
    this.server.to(this.id).emit(event, message)
  }

  onMessage(user, event, message){
    switch (event){
      case "username":
        user.name = message;
        this.broadcast("users", this.users.map(u => {return {id : u.id, name: u.name}}));
    }
  }

  setUpdateRate(rate){
    this.updateRate = rate;
    this.setUpdateInterval();
  }
  
  setUpdateInterval(){
    var t = this;
    this.interval = setInterval(function(){t.update();}, 1000/this.updateRate);
  }

  update(){
    this.broadcast("users", this.users.map(u => {return {id : u.id, name: u.name}}));
  }

  dispose(){
    this.users.forEach(user => {
      user.dispose();
    });
    this.users = [];
    this.onDispose();
  }
  
  lock(){
    this.locked = true;
  }

  unlock(){
    this.locked = false;
  }

  toggleLock(){
    this.locked = !this.locked;
  }

  canJoin(user){
    if (this.locked) return false;
    if (this.users.length >= this.size) return false;
    if (this.users.find(u => u.id == user.id)) return false;
    return true;
  }

  onCreate(){
    
  }

  onJoin(user){
    this.users.push(user);
    if (this.users.length >= this.size) this.lock();
  }

  onLeave(user){
    user.room = null;
    users.splice(users.indexOf(user), 1);
    if (this.users.length < this.size) this.unlock();
  }

  onDispose(){
    
  }
}


class User{

  constructor(socket, id, name){
    this.id = id;
    this.name = name;
    this.socket = socket;
    this.room = null;
    this.toRemove = false;
  }

  leave(){
    this.onLeave(this.room);
  }

  dispose(){
    this.leave();
    this.onDisposal();
  }

  join(room){
    this.room = room;
    this.room.onJoin(this);
    this.onJoin(room);
  }

  onJoin(room){
    this.room = room;
    this.socket.join(room.id);
  }

  onLeave(room){
    this.toRemove = true;
    room.onLeave(this);
  }

  onDispose(){
    
  }

  onMessage(event, message){
    if (this.room) this.room.onMessage(this, event, message);
  }
  
}

class UserManager{
  constructor(server){
    this.server = server;
    this.users = [];
  }

  send(user, event, message){
    this.sendSocket(user.socket, event, message);
  }

  sendSocket(socket, event, message){
    this.server.to(socket).emit(event, message);
  }

  broadcast(event, message){
   this.users.map((user) => user.emit(event, message));
  }

  connect(socket){
    if (this.users.find(user => user.socket == socket)) return;
    this.users.push(new User(socket, socket.id, socket.id))
  }

  findUser(socket){
    return this.users.find(u => u.socket == socket);
  }

  findUserById(id){
    return this.users.find(u => u.id == id);
  }

  addUser(id, name, socket){
    var user = new User(id, name, socket);
    this.users.push(user);
    return user;
  }

  onMessage(socket, event, message){
    this.findUser(socket).onMessage(event, message);
  }
  
}

class RoomManager{

  constructor(server){
    this.server = server;
    this.rooms = [];
  }

  createRoom(size, name){
    var id = this.rooms.length;
    var room = new Room(this.server, size, id, name);
    this.rooms.push(room);
    return room;
  }

  findRoomById(id){
    return this.rooms.find(r => r.id == id);
  }

  findRoomByUser(user){
    return this.rooms.find(r => r.users.find(u => u.id == user.id));
  }

  canJoinRoom(id, user){
    let room = this.findRoomById(id);
    return (room == undefined) ? false : room.canJoin(user);
  }

  joinRoom(id, user){
    //console.log(this.canJoinRoom(id, user));
    if (this.canJoinRoom(id, user)){
      let room = this.findRoomById(id);
      user.join(room);
      return true;
    }
    return false;
  }

  leaveRoom(id, user){
    let room = this.findRoomByUser(user);
    if (room != undefined){
      user.leave();
      return true;
    }
    return false;
  }

  createRoom(size, id, name, roomClass){
    if (roomClass == undefined){
      roomClass = Room;
    }
    var room = new roomClass(this.server, size, id, name);
    this.rooms.push(room);
    //console.log(this.rooms);
    return true;
  }

  destroyRoom(id){
    if (this.findRoomById(id) == undefined) return false;
    this.findRoomById(id).dispose();
    return true;
  }
  
}

class LobbyHandler{

  constructor(server, maxRooms, maxUsers){
    this.server = server;
    this.roomManager = new RoomManager(server);
    this.userManager = new UserManager(server);
    this.maxRooms = maxRooms;
    this.maxUsers = maxUsers;
  }

  findUser(socket){
    //console.log(this.userManager.findUser(socket));
    return this.userManager.findUser(socket);
  }

  onMessage(socket, event, message){

    switch (event){

      case "joinLobby":
        let ret = this.joinRoom(message, this.findUser(socket));
        this.server.to(socket.id).emit("lobbyResponse", {type: "joining", success: ret});

        break;
      defualt:
        this.userManager.onMessage(socket, event, message);
        break;
    }
    //console.log(this.roomManager.rooms)
  }
  
  connect(socket){
    this.userManager.connect(socket);
  }

  disconnect(socket){
    this.userManager.disconnect(socket);
    socket.disconnect();
  }

  joinRoom(id, user){
    return this.roomManager.joinRoom(id, user);
  }

  roomExists(id){
    return this.roomManager.findRoomById(id) != undefined;
  }
  
  createRoom(id, size, roomClass){
    if (this.roomManager.rooms.length >= this.maxRooms) return false;
    if (this.userManager.users.length >= this.maxUsers) return false;
    let success = this.roomManager.createRoom(size, id, id, roomClass);
    return success;
  }

  destroyRoom(id){
    return this.roomManager.destroyRoom(id);
  }
  
}

module.exports = {Room, User, UserManager, RoomManager, LobbyHandler};