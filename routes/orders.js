import express from "express";
import moment from "moment";

import { auth, isUser, isAdmin } from "../middleware/auth.js";
import Order from "../models/Order.js";

const router = express.Router();

//get all orders

router.get("/", isAdmin, async (req, res) => {
  const query = req.query.new;
  try {
    const orders = query
      ? await Order.find().sort({ _id: -1 }).limit(4)
      : await Order.find().sort({ _id: -1 });
    res.status(200).send(orders);
  } catch (error) {
    console.log("backend-orders-get all order", error);
    res.status(500).send(error);
  }
});

//get current month orders
router.get("/stats", isAdmin, async (req, res) => {
  const previousmonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("DD-MM-YYYY HH:mm:ss");

  try {
    const orders = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(previousmonth) } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month", //current month and previous month
          total: { $sum: 1 }, //total current month orders and total previous month orders
        },
      },
    ]);

    res.status(200).send(orders);
  } catch (error) {
    console.log("orders-PreviousMonth", error);
    res.status(500).send(error);
  }
});

//get income
router.get("/income/stats", isAdmin, async (req, res) => {
  const previousmonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("DD-MM-YYYY HH:mm:ss");

  try {
    const income = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(previousmonth) } } },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$total",
        },
      },
      {
        $group: {
          _id: "$month", //current month and previous month
          total: { $sum: "$sales" }, //total current month sales and total previous month sales
        },
      },
    ]);

    res.status(200).send(income);
  } catch (error) {
    console.log("income-PreviousMonth", error);
    res.status(500).send(error);
  }
});

//week sales
router.get("/week-sales", isAdmin, async (req, res) => {
  const weekSales = moment()
    .day(moment().day() - 7)
    .format("YYYY-MM-DD");
  try {
    const lastWeekSales = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(weekSales) } } },
      {
        $project: {
          day: { $dayOfWeek: "$createdAt" },
          sales: "$total",
        },
      },
      {
        $group: {
          _id: "$day", //all days
          total: { $sum: "$sales" }, //last weekly sales of total
        },
      },
    ]);
    res.status(200).send(lastWeekSales);
    console.log("week sales", lastWeekSales)
  } catch (error) {
    console.log("Monthly Reports", error);
    res.status(500).send(error);
  }
});

//CREATE

// createOrder is fired by stripe webhook
// example endpoint

// router.post("/", auth, async (req, res) => {
//     const newOrder = new Order(req.body);

//   try {
//     const savedOrder = await newOrder.save();
//     res.status(200).send(savedOrder);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

//UPDATE
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).send(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

//GET AN ORDER
router.get("/findOne/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    // if(req.user._id !== order.userId || !req.user.isAdmin)
    // return res.status(403).send("Access denied. Not authorized....")
    res.status(200).send(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

// //DELETE
// router.delete("/:id", isAdmin, async (req, res) => {
//   try {
//     await Order.findByIdAndDelete(req.params.id);
//     res.status(200).send("Order has been deleted...");
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

// //GET USER ORDERS
// router.get("/find/:userId", isUser, async (req, res) => {
//   try {
//     const orders = await Order.find({ userId: req.params.userId });
//     res.status(200).send(orders);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

// //GET ALL ORDERS

// router.get("/", isAdmin, async (req, res) => {
//   try {
//     const orders = await Order.find();
//     res.status(200).send(orders);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

// // GET MONTHLY INCOME

// router.get("/income", isAdmin, async (req, res) => {
//   const date = new Date();
//   const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
//   const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

//   try {
//     const income = await Order.aggregate([
//       { $match: { createdAt: { $gte: previousMonth } } },
//       {
//         $project: {
//           month: { $month: "$createdAt" },
//           sales: "$amount",
//         },
//       },
//       {
//         $group: {
//           _id: "$month",
//           total: { $sum: "$sales" },
//         },
//       },
//     ]);
//     res.status(200).send(income);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

export default router;
