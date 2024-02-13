import express from 'express'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import Order from '../models/Order.js';

dotenv.config()
const router = express.Router();
const stripe = Stripe(process.env.STRIPE_KEY)

// Use an Indian Stripe test card India (IN) 4000 0035 6000 0008 Visa

router.post('/create-checkout-session', async (req, res) => {

  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userId,
      // cart: JSON.stringify(req.body.cartItems),
    },
  });
  const line_items = req.body.cartItems.map((item) => {
    return {
      price_data: {
        currency: "INR",
        product_data: {
          name: item.name,
          images: [item.image.url],
          description: item.desc,
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price*100,
      },
      quantity: item.cartQuantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["IN"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "INR",
          },
          display_name: "Free shipping",
          // Delivers between 5-7 business days
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "INR",
          },
          display_name: "Next day air",
          // Delivers in exactly 1 business day
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
     line_items,
     mode: "payment",
    customer: customer.id,
      success_url: `${process.env.CLIENT_URL}/checkout-success`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
    });
  
    res.send({url: session.url})
  });
  
  //create order
  const createOrder = async (customer, data, lineItems) => {
    // const Items = JSON.parse(customer.metadata.cart);
  
    const products = lineItems.data.map((item) => {
      return {
        productId: item.id,
        quantity: item.cartQuantity,
      };
    });
  
    const newOrder = new Order({
      userId: customer.metadata.userId,
      customerId: data.customer,
      paymentIntentId: data.payment_intent,
      products: lineItems.data,
      subtotal: (data.amount_subtotal)/100,
      total: (data.amount_total)/100,
      shipping: data.customer_details,
      payment_status: data.payment_status,
    });
  
    try {
      const savedOrder = await newOrder.save();
      console.log("Processed Order:", savedOrder);
    } catch (err) {
      console.log(err);
    }
  };
  //stripe webhook
  let endpointSecret;
  // endpointSecret = "whsec_23278701518b97d7c7df593f650936af6cf30afd111dfb775a1a8c35bf681659";

  router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let data;
  let eventType;

  if(endpointSecret){

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("webhook verified")
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`)
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  data = event.data.object;
  eventType = event.type;
} else {
  data = req.body.data.object;
  eventType = req.body.type;
}
  // Handle the event
  if (eventType === "checkout.session.completed"){
    stripe.customers.retrieve(data.customer).then((customer) => {
      stripe.checkout.sessions.listLineItems(
        data.id,
        {},
        function(err, lineItems){
        console.log("line_items", lineItems)
        createOrder(customer, data, lineItems);
        }
      );
      // try {
      //   // CREATE ORDER
        // createOrder(customer, data);
      // } catch (err) {
      //   console.log(typeof createOrder);
      //   console.log(err);
      // }
      // console.log(customer);
      // console.log("data", data)
    })
    .catch((err) => console.log(err.message));
  }
  // Return a 200 res to acknowledge receipt of the event
  res.send().end();
});

  export default router;

  