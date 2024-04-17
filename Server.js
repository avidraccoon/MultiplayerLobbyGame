const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const sModule = require("./SocketModule.js");
const tClasses = require("./TestingClasses.js");
const fs = require("fs").promises;

const getHome = function (req, res) {
  fs.readFile(__dirname + "/client/index.html")
    .then((contents) => {
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      res.end(contents);
    })
    .catch((err) => {
      console.log(err);
      res.writeHead(500);
      res.end(err);
      return;
    });
};

const getScript = function (req, res, location) {
  fs.readFile(__dirname + location)
    .then((contents) => {
      res.setHeader("Content-Type", "text/javascript");
      res.writeHead(200);
      res.end(contents);
    })
    .catch((err) => {
      console.log(err);
      res.writeHead(500);
      res.end(err);
      return;
    });
};

const requestListener = function (req, res) {
  console.log(req.url);
  switch (req.url) {
    case "/":
      getHome(req, res);
      break;
    case "/homeScript.js":
      getScript(req, res, "/client/homeScript.js");
      break;
  }
};

const httpServer = createServer(requestListener);

const io = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
  mode: "development",
});

const lobbyHandler = new tClasses.PongLobbyHandler(io, 2, 10);

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.onAny((event, ...args) => {
    console.log(event, args);
    lobbyHandler.onMessage(socket, event, args);
  });
  lobbyHandler.connect(socket, tClasses.PongUser);
  //lobbyHandler.joinRoom("test", lobbyHandler.findUser(socket));
  socket.on("disconnect", () => {
      console.log("a user disconnected");
      lobbyHandler.disconnect(socket);
  });
});



const host = "localhost";
const port = 3000;
httpServer.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
