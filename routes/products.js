import express from "express";
import cloudinary from "../utils/cloudinary.js";
import Product from "../models/product.js";
import { isAdmin } from "../middleware/auth.js";


const router = express.Router();

//CREATE

router.post("/", isAdmin, async (req, res) => {
    const { name, brand, desc, price, image } = req.body;
  
    try {
      if (image) {
        const uploadedRes = await cloudinary.uploader.upload(image, {
          upload_preset: "Online Shopping Project",
        });
  
        if (uploadedRes) {
          const product = new Product({
            name,
            brand,
            desc,
            price,
            image: uploadedRes,
          });
  
          const savedProduct = await product.save();
          res.status(200).send(savedProduct);
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  //GET ALL PRODUCTS

router.get("/", async (req, res) => {
  const qbrand = req.query.brand;
  try {
    let products;

    if (qbrand) {
      products = await Product.find({
        brand: qbrand,
      });
    } else {
      products = await Product.find();
    }

    res.status(200).send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

//GET PRODUCT
router.get("/find/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    res.status(200).send(product);
  } catch (err) {
    res.status(500).send(err);
  }
});

//DELETE PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if(!product) return res.status(404).send("Product not found...");
    
    if (product.image.public_id){
      const destroyResponse = await cloudinary.uploader.destroy(product.image.public_id);
           
      if (destroyResponse){
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        res.status(200).send(deletedProduct);
      }
    }else{
      console.log("Action Terminated. Failed to deleted product image...");
    }
  } catch (err) {
    res.status(500).send(err);
  }
});
  
//EDIT PRODUCT
router.put("/:id", isAdmin, async (req, res) => {
 if(req.body.productImg){
  try {
    const destroyResponse = await cloudinary.uploader.destroy(
      req.body.product.image.public_id
    );
    if(destroyResponse){
      const uploadedResponse = await cloudinary.uploader.upload(
        req.body.productImg,
        {
          upload_preset: "Online Shopping Project",
        },
      );
      if(uploadedResponse){
        const updatedProduct = await Product.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              ...req.body.product,
              image: uploadedResponse,
            }
          },
          {new: true}
        );
        res.status(200).send(updatedProduct)
      }
    }
   }catch(error){
    res.status(500).send(error)
  }
  }
 else{
  try{
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body.product,
      },
      {new: true}
    )
    res.status(200).send(updatedProduct)
  }catch(error){
    res.status(500).send(error)
  }
 }
});

  export default router