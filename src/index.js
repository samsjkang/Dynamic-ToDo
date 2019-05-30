const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

/* ************** Database Setup ************** */

// <password> is the pw for my database so not putting that here :) 
mongoose.connect("mongodb+srv://admin-sam:jk@cluster0-mpfdn.mongodb.net/toDoDB", {useNewUrlParser: true});

// To Do Items
var tasksSchema = new Schema ({
  name: String
});

var Task = mongoose.model("Task", tasksSchema);

// Root List
var defaultTask1 = new Task({
  name: "Check off completed tasks"
});

var defaultTask2 = new Task({
  name: "Add new tasks!"
})

var defaultTasks = [defaultTask1, defaultTask2];

// Custom Lists
var listSchema = new Schema ({
  name: String,
  tasks: [tasksSchema]
});

var List = mongoose.model("List", listSchema);

/* *************** Port ***************** */

app.listen(8080, function() {
  console.log("Server running on port 8080");
});

/* *************** Routing ***************** */

app.get("/", function(req, res) { // Root get route
  Task.find({}, function(err, foundTasks) { // finds all Tasks in tasks collection
    if (foundTasks.length === 0) { // initialization if no Tasks exist
      Task.insertMany(defaultTasks, function(err) { // initialized with defaultTasks
        if(err) {
          console.log("error");
        } 
        else {
          console.log("success");
        }
      });
      res.redirect("/");
    } 
    else { // already initialized so just renders existing Tasks
      res.render("list", {
        listTitle: "To Do List",
        newListItems: foundTasks
      });
    }
  });
});

app.get("/:listName", function(req, res) { // Custom get route
  var listName = _.capitalize(req.params.listName);
  List.findOne({name: listName}, function(err, foundList) { // finds List with name of listName from lists collection
    if(err) {
      console.log("error");
    } 
    else{
      if(!foundList) { // create List in lists collection if not found
        var list = new List ({
          name: listName,
          tasks: defaultTasks
        });
      
        list.save();
        
        res.redirect("/" + listName);
      } 
      else { // renders existing List
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.tasks
        });
      }
    }
  })

});

app.post("/", function(req, res) { // Add new item
  var taskName = req.body.newItem;
  var listName = req.body.list;
  console.log(listName);

  var task = new Task({
    name: taskName
  });

  if(listName === "To") { // Root route submission
    task.save();
    res.redirect("/");
  } 
  else { // Custom route submission
    List.findOne({name: listName}, function(err, foundList) {
      if(!err) {
        foundList.tasks.push(task);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) { // Delete item
  var completedTask = req.body.checkbox; // gives us id of checked task
  var listName = req.body.listName;
  console.log(listName);

  if(listName === "To") { // delete tasks on root page
    Task.findByIdAndRemove(completedTask, function(err) {
      if(err) {
        console.log("error");
      } 
      else {
        console.log("deleted task");
        res.redirect("/");
      }
    });  
  }
  else { // delete tasks for custom pages
    List.findOneAndUpdate({name: listName}, {$pull: {tasks: {_id: completedTask}}}, 
      function(err, foundList) {
        if(!err) {
          res.redirect("/" + listName);
        }
    });
  }
});


