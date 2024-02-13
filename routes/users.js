import express from "express";
import moment from "moment";

import {auth, isUser, isAdmin} from "../middleware/auth.js";
import User from "../models/user.js";


const router = express.Router();

//GET ALL USERS

router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ _id: -1 });
    res.status(200).send(users);
  } catch (error) {
    console.log("backend-orders-get all order", error);
    res.status(500).send(error);
  }
});

//DELETE
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    res.status(200).send(deletedUser);
  } catch (err) {
    res.status(500).send(err);
  }
});

//GET USER
router.get("/find/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    res.status(200).send({
    id:user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
  } catch (err) {
    res.status(500).send(err);
  }
});

//UPDATE USER
router.put("/:id", isUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if(!(user.email === req.body.email)){
      const emailInUse = await User.findOne({email: req.body.email});
      if(emailInUse)
      return res.status(400).send("That email is already taken...");
    }
    if(req.body.password && user){
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      user.password = hashedPassword;
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        isAdmin: req.body.isAdmin,
        password: user.password,
      },
      {new: true}
    )
    res.status(200).send({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

//GET USER STATS
router.get("/stats", isAdmin, async (req, res) => {
  const previousmonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("DD-MM-YYYY HH:mm:ss");

  try {
    const users = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(previousmonth) } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month", //current month and previous month
          total: { $sum: 1 }, //total current month users and total previous month users
        },
      },
    ]);

    res.status(200).send(users);
  } catch (error) {
    console.log("Users-PreviousMonth", error);
    res.status(500).send(error);
  }
});

export default router;
