var express = require("express");
var router = express.Router();
let { body, validationResult } = require("express-validator");

let userModel = require("../schemas/users");
let roleModel = require("../schemas/roles");

function sendValidationErrors(req, res, next) {
  let result = validationResult(req);
  if (result.errors.length > 0) {
    return res.status(400).send(
      result.errors.map(function (e) {
        return {
          [e.path]: e.msg,
        };
      }),
    );
  }
  next();
}

router.get("/", async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
    .populate({ path: "role", select: "name description" });
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .findOne({ _id: req.params.id, isDeleted: false })
      .populate({ path: "role", select: "name description" });
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post(
  "/",
  [
    body("email")
      .notEmpty()
      .withMessage("email khong duoc de trong")
      .bail()
      .isEmail()
      .withMessage("email sai dinh dang"),
    body("username")
      .notEmpty()
      .withMessage("username khong duoc de trong")
      .bail()
      .isAlphanumeric()
      .withMessage("username khong duoc chua ki tu dac biet"),
    body("password")
      .notEmpty()
      .withMessage("password khong duoc de trong")
      .bail()
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 1,
      })
      .withMessage(
        "password dai it nhat 8 ki tu, trong do co it nhat 1 ki tu hoa, 1 ki tu thuong, 1 ki tu so va 1 ki tu dac biet",
      ),
    body("role")
      .notEmpty()
      .withMessage("role khong duoc de trong")
      .bail()
      .isMongoId()
      .withMessage("role phai la 1 id"),
    body("avatarUrl").optional().isURL().withMessage("Url khong hop le"),
  ],
  sendValidationErrors,
  async function (req, res, next) {
    try {
      let role = await roleModel.findOne({
        _id: req.body.role,
        isDeleted: false,
      });
      if (!role) {
        return res.status(400).send({ message: "role not found" });
      }

      let newItem = new userModel({
        username: req.body.username,
        password: req.body.password, // không mã hoá
        email: req.body.email,
        fullName: req.body.fullName,
        avatarUrl: req.body.avatarUrl,
        status: req.body.status,
        role: req.body.role,
        loginCount: req.body.loginCount,
      });

      await newItem.save();

      // populate cho đẹp
      let saved = await userModel
        .findById(newItem._id)
        .populate({ path: "role", select: "name description" });
      res.send(saved);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
);

router.put(
  "/:id",
  [body("role").optional().isMongoId().withMessage("role phai la 1 id")],
  sendValidationErrors,
  async function (req, res, next) {
    try {
      let id = req.params.id;

      if (req.body.role) {
        let role = await roleModel.findOne({
          _id: req.body.role,
          isDeleted: false,
        });
        if (!role) {
          return res.status(400).send({ message: "role not found" });
        }
      }

      let updatedItem = await userModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        req.body,
        {
          new: true,
        },
      );

      if (!updatedItem)
        return res.status(404).send({ message: "id not found" });

      let populated = await userModel
        .findById(updatedItem._id)
        .populate({ path: "role", select: "name description" });
      res.send(populated);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
);

router.post(
  "/enable",
  [
    body("email")
      .notEmpty()
      .withMessage("email khong duoc de trong")
      .bail()
      .isEmail(),
    body("username").notEmpty().withMessage("username khong duoc de trong"),
  ],
  sendValidationErrors,
  async function (req, res, next) {
    try {
      let user = await userModel.findOneAndUpdate(
        {
          email: req.body.email,
          username: req.body.username,
          isDeleted: false,
        },
        { status: true },
        { new: true },
      );

      if (!user) {
        return res.status(404).send({ message: "user not found" });
      }

      res.send(user);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
);

router.post(
  "/disable",
  [
    body("email")
      .notEmpty()
      .withMessage("email khong duoc de trong")
      .bail()
      .isEmail(),
    body("username").notEmpty().withMessage("username khong duoc de trong"),
  ],
  sendValidationErrors,
  async function (req, res, next) {
    try {
      let user = await userModel.findOneAndUpdate(
        {
          email: req.body.email,
          username: req.body.username,
          isDeleted: false,
        },
        { status: false },
        { new: true },
      );

      if (!user) {
        return res.status(404).send({ message: "user not found" });
      }

      res.send(user);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
);

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findOneAndUpdate(
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
