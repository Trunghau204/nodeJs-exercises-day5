var express = require("express");
var router = express.Router();

let roleModel = require("../schemas/roles");
let userModel = require("../schemas/users");

router.get("/", async function (req, res, next) {
  let roles = await roleModel.find({ isDeleted: false });
  res.send(roles);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await roleModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.get("/:id/users", async function (req, res, next) {
  try {
    let role = await roleModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!role) {
      return res.status(404).send({ message: "role not found" });
    }

    let users = await userModel
      .find({ role: req.params.id, isDeleted: false })
      .populate({ path: "role", select: "name description" });

    res.send(users);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/", async function (req, res, next) {
  try {
    let newItem = new roleModel({
      name: req.body.name,
      description: req.body.description,
    });
    await newItem.save();
    res.send(newItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await roleModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      {
        new: true,
      },
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await roleModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
