import express from 'express'
import bcrypt from 'bcrypt'

import User from '../models/user.js'
import genAuthToken from '../utils/genAuthToken.js'

const router = express.Router()

router.post("/", async(req, res)=>{
    const { name, email, password } = req.body;
  
    if (!name) {
      res.status(400).send({ error: "Error in Name Validation" });
    } else if (!email) {
      res.status(400).send({ error: "Error in Email Validation" });
    } else if (!password) {
      res.status(400).send({ error: "Error in password Validation" });
    } 
    
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("User already exists...");
    
    user = new User({ name, email, password });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
  
     await user.save();
  
     const token = genAuthToken(user);

     res.send(token);
  
    //  res.status(400).send({user, token});

})

export default router