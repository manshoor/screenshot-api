'use strict';
const express = require("express");
const cors = require("cors");
const {PORT} = require("./config/config");
const screenshotRouter = require("./routes/screenshotRouter");
const app = express();
app.enable("trust proxy");
app.use(cors({}));
app.use(express.json());
app.disable('x-powered-by');

app.get("/", (req, res) => {
  res.send("<h2>Reinventing the wheel. Again. </h2>");
  console.log("Reinventing the wheel. Again. ");
});
app.get("/api/v1", (req, res) => {
  res.send("<h2>welcome to screenshot API</h2>");
  console.log("yeah it ran");
});
app.use(express.static(__dirname + '/tmp'));
app.use("/api/v1/screenshot", screenshotRouter);

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
