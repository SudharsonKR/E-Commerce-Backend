import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import mongoose from 'mongoose';

import { products } from './product.js';
import register from './routes/register.js';
import login from './routes/login.js';
import stripe from './routes/stripe.js';
import productsRoute from './routes/products.js'
import users from './routes/users.js'
import orders from './routes/orders.js'

dotenv.config()
const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/register', register)
app.use('/api/login', login)
app.use('/api/stripe', stripe)
app.use('/api/products', productsRoute)
app.use('/api/users', users)
app.use('/api/orders', orders)

app.get('/', (req, res)=>{
    res.send("Welcome to Online Shopping")
})

app.get('/products', (req, res)=>{
    res.send(products)
})
const PORT = process.env.PORT || 8001
const db = process.env.MONGO_URL

//server connections
app.listen(PORT, ()=>{ console.log("Server running on port", PORT)})

//database connections
mongoose.connect(db)
.then(()=>console.log("Database successfully connected"))
.catch((error)=>console.log("Datanase connection failed", error.message))
