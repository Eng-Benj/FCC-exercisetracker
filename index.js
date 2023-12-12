const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const MongoDB_URL = process.env.MongoDB_URL;
mongoose.connect(MongoDB_URL);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
  },
  { versionKey: false },
);
const User = mongoose.model("User", userSchema);

const exerciseSchema = new Schema(
  {
    userID: String,
    username: String,
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: String,
  },
  { versionKey: false },
);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username: username });
  newUser.save((err, data) => {
    if (err) {
      res.json({ error: err });
    }
    res.json({ username: data.username, _id: data._id });
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      res.json({ error: err });
    }
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const description = req.body.description;
  const duration = req.body.duration;
  const date = (
    req.body.date ? new Date(req.body.date).toString() : new Date().toString()
  ).substring(0, 15);
  const id = req.params._id;
  User.findById(id, (err, user) => {
    if (err) {
      res.json({ error: err });
    }
    const username = user.username;
    const newExercise = new Exercise({
      userID: id,
      username: username,
      description: description,
      duration: duration,
      date: date,
    });
    newExercise.save((err, data) => {
      if (err) {
        res.json({ error: err });
      }
      res.json({
        username: data.username,
        description: data.description,
        duration: data.duration,
        date: data.date,
        _id: data.userID,
      });
    });
  });
});

app.get("/api/users/:_id/logs", async function (req, res) {
  const userID = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
  const to = req.query.to || new Date(0).toISOString().substring(0, 10);
  const limit = Number(req.query.limit) || 0;
  const user = await User.findById(userID);
  const exercises = await Exercise.find({ userID: req.params._id })
    .limit(limit)
    .exec();
  let log = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    };
  });
  console.log(log);
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
