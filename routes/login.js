import express from 'express'
import bcrypt from 'bcrypt'

import User from '../models/user.js'
import genAuthToken from '../utils/genAuthToken.js'

const router = express.Router()

router.post("/", async (req, res) => {
    // const { email, password } = req.body;
    // if (!email || !password) {
    //   res.status(400).json({ error: "Fill all details" });
    // }
    // try {
    //   const userValid = await User.findOne({ email: email });
  
    //   if (userValid) {
    //     const isMatch = await bcrypt.compare(password, userValid.password);
    //     if (!isMatch) {
    //       res.status(400).json({ error: "invalid details" });
    //       } else {
    //       //token generates
                   
    //       const token = genAuthToken(userValid);
    //       res.status(201).send({token})
    //     }
    //   } else {
    //     res.status(400).json({Error: "Invalid mail_id or password"})
    //   }
    // } catch (error) {
    //   res.status(400).json({ error: "Tokenerror" });
    //   console.log(error)
    // }
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("Invalid email or password...");
  
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword)
      return res.status(400).send("Invalid email or password...");
  
    const token = genAuthToken(user);
  
    res.status(201).send(token);
  });

  export default router