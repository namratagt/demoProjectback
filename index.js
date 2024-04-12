const res = require("express/lib/response");
const {
  express,
  Product,
  User,
  app,
  port,
  ObjectId,
  Order,
  mongoose,
} = require("./moduless");
const { query } = require("express");
// Product APIs

app.get("/api/products", async (req, res) => {
  try {
    const data = await Product.find({});
    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({});
  }
});

app.post("/api/products/add", async (req, res) => {
  try {
    const singleProduct = await Product.create(req.query);
    res.status(200).json(singleProduct);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.get("/api/products/filter", async (req, res) => {
  const { filter } = req.query;
  Product.find({ type: filter.toLowerCase() })
    .then((data) => res.status(200).json(data))
    .catch((err) => res.status(404).json({}));
});

app.get("/api/products/search", async (req, res) => {
  let { term } = req.query;
  console.log(term);
  try {
    const first = await Product.find({ type: term });
    const second = await Product.find({ title: term });
    const third = await Product.find({
      color: { $regex: new RegExp(term, "i") },
    });
    // res.json(second);
    res.status(200).json(first.concat(second, third));
  } catch (error) {
    console.log(error);
    res.status(404).json({});
  }
});

app.get("/api/products/price", async (req, res) => {
  const { range } = req.query;
  try {
    const data = (await Product.find({})).filter(
      (item) => item.price[1] <= range
    );
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.get("/api/products/sort", async (req, res) => {
  const { sortType } = req.query;
  try {
    const sortedData = (await Product.find()).sort((a, b) =>
      sortType === "asce" ? a.price[1] - b.price[1] : b.price[1] - a.price[1]
    );
    res.status(200).json(sortedData);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.get("/api/products/color", async (req, res) => {
  const { color } = req.query;
  try {
    Product.find({ color: { $regex: new RegExp(color.toLowerCase(), "i") } })
      .then((data) => res.status(200).json(data))
      .catch((err) => res.status(200).json({}));
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.get("/api/products/singleProduct/:Productid", async (req, res) => {
  try {
    const { Productid } = req.params;
    const data = await Product.findOne({ _id: Productid });
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    console.log(error);
    res.status(400).json({});
  }
});

app.get("/api/products/size", async (req, res) => {
  const { size } = req.query;
  console.log(size);
  try {
    const data = (await Product.find()).filter((item) => {
      if (size == "xs") return item.xs > 0;
      else if (size == "s") return item.s > 0;
      else if (size == "m") return item.m > 0;
      else if (size == "l") return item.l > 0;
      else if (size == "xl") return item.xl > 0;
      else if (size == "xxl") return item.xxl > 0;
      return false;
    });
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(200).json({});
  }
});

app.post("/api/products/addComment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { comm } = req.body;
    const singleProduct = await Product.findOne({ _id: id });
    singleProduct.comments.push(comm);
    await singleProduct.save();
    return res.status(200).json(singleProduct);
  } catch (err) {
    console.log(err);
    res.status(200).json({});
  }
});

app.post("/api/product/rating/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { num } = req.body;
    const singleProduct = await Product.findOne({ _id: id });

    singleProduct.star += parseInt(num);
    singleProduct.count += 1;
    await singleProduct.save();
    return res.status(200).json(singleProduct);
  } catch (err) {
    console.log(err);
    res.status(200).json({});
  }
});

// User APIs

app.post("/api/users/create", async (req, res) => {
  try {
    const { phone, password, email, name } = req.query;
    let single = await User.findOne({ phone });
    if (single) {
      return res.status(404).json({});
    }
    singleUser = await User.create({
      phone,
      password,
      email,
      name,
      cart: [],
      wishList: [],
      orders: [],
      sum: 0,
    });
    res.status(200).json(singleUser);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.get("/api/users/get", async (req, res) => {
  try {
    const { ph } = req.query;
    const user = await User.findOne({ phone: ph });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "err" });
  }
});

app.post("/api/users/add/:ph/:id/:type/:size", async (req, res) => {
  try {
    const { type, ph, id, size } = req.params;
    const currUser = await User.findOne({ phone: ph });
    if (!currUser) {
      return res.status(404).json({});
    }
    if (type === "cart") {
      const item = currUser.cart.find((item) => {
        if (item[0] == id && item[1] == size) {
          return true;
        }
        return false;
      });
      if (item) {
        return res.status(200).json(currUser);
      }
      currUser.cart.push([id, size, 1]);
      const singleProduct = await Product.findOne({ _id: id });
      currUser.sum += singleProduct.price[1];
      await currUser.save();
    } else {
      const item1 = currUser.wishList.find((item) => item == id);
      if (item1) {
        return res.status(200).json(currUser);
      }
      currUser.wishList.push(id);
      await currUser.save();
    }
    return res.status(200).json(currUser);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.delete("/api/users/delete", async (req, res) => {
  try {
    const { id, ph, type, size, price } = req.query;
    const currUser = await User.findOne({ phone: ph });
    if (!currUser) return res.status(404).json({});
    if (type === "cart") {
      let nums = [];
      for (let i = 0; i < currUser.cart.length; i++) {
        const item = currUser.cart[i];
        if (item[0] == id && item[1] == size) {
          currUser.sum -= Number(price) * item[2];
        } else {
          nums.push(item);
        }
      }

      currUser.cart = nums;
    } else {
      let nums = [];
      for (let i = 0; i < currUser.wishList.length; i++) {
        const item = currUser.wishList[i];
        if (item != id) {
          nums.push(item);
        }
      }
      console.log(nums);
      currUser.wishList = nums;
    }
    await currUser.save();
    res.status(200).json(currUser);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.post("/api/users/update", async (req, res) => {
  try {
    const { id, ph, type, size, price } = req.query;
    const singleUser = await User.findOne({ phone: ph });
    for (let i = 0; i < singleUser.cart.length; i++) {
      const item = singleUser.cart[i];
      if (item[0] == id && item[1] == size) {
        if (type == "inc") {
          item[2] += 1;
          singleUser.sum += Number(price);
        } else {
          item[2] -= 1;
          singleUser.sum -= Number(price);
        }
      }
    }
    singleUser.markModified("sum");
    singleUser.markModified("cart");
    console.log(singleUser);
    await singleUser.save();
    res.status(200).json(singleUser);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.get("/api/users/bag", async (req, res) => {
  try {
    const { ph, type } = req.query;

    const singleUser = await User.findOne({ phone: ph });
    if (type == "cart") return res.status(200).json(singleUser.cart);
    else return res.status(200).json(singleUser.wishList);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.get("/api/users/getCartProduct", async (req, res) => {
  try {
    const { id } = req.query;
    console.log(id);
    const currUser = await User.findOne({ _id: id });
    const data = await Promise.all(
      currUser.cart.map(async (item) => {
        const productId = new mongoose.Types.ObjectId(item[0]);
        const { _id, img, title, price } = await Product.findOne({
          _id: productId,
        });
        return { _id, img: img[0], title, price, size: item[1], qty: item[2] };
      })
    );
    console.log(data);
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(404).json({});
  }
});

app.get("/api/users/getWishlistProduct", async (req, res) => {
  try {
    const { id } = req.query;
    const currUser = await User.findOne({ _id: id });
    const data = await Promise.all(
      currUser.wishList.map(async (item) => {
        return await Product.findOne({
          _id: item,
        });
      })
    );
    console.log(data);
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(404).json({});
  }
});

app.get("/api/otp", async (req, res) => {
  try {
    let { ph } = req.query;
    const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    ph = String(ph);
    console.log(ph);
    res.json(otp);
  } catch (err) {
    console.log(err);
    return res.status(404).json({});
  }
});

app.get("/api/users/login", async (req, res) => {
  const { phone, password } = req.query;
  try {
    const data = await User.findOne({ phone, password });
    if (data === null) {
      return res.status(401).json({});
    }
    return res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(200).json({});
  }
});

app.post("/api/users/forget", async ({ query }, res) => {
  try {
    const { phone, pass } = query;
    const user = await User.findOne({ phone: phone });
    user.password = pass;
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(400).json({});
  }
});

app.get("/api/users/orders", async ({ query }, res) => {
  try {
    const data = await Order.find(query);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(200).json({});
  }
});

// order api

app.get("/api/orders", async (req, res) => {
  try {
    const allOrders = await Order.find({});
    res.status(200).json(allOrders);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});

app.post("/api/orders/add", async ({ body }, res) => {
  try {
    var { userId, products, name, postalCode, city, address, phone } =
      body.params;
    let data = [];
    const singleUser = await User.findOne({ _id: userId });
    for (let i = 0; i < products.length; i++) {
      const productId = products[i]._id;
      const size = products[i].size;
      const qty = products[i].qty;
      const singleProduct = await Product.findOne({ _id: productId });
      const newOrder = await Order.create({
        productId,
        userId,
        size,
        qty,
        name,
        postalCode,
        city,
        address,
        phone,
        price: Number(singleProduct.price[1]),
        img: singleProduct.img[0],
        title: singleProduct.title,
      });
      data.push(newOrder);
    }
    singleUser.sum = 0;
    singleUser.cart = [];
    await singleUser.save();
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
});
//admin page apis

app.put("/api/admin/productUpdate", async (req, res) => {
  try {
    const productId = req.params.productId;
    const { type, desc, xs, s, m, l, xl, xxl, color, title, price, img } =
      req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        type,
        desc,
        xs,
        s,
        m,
        l,
        xl,
        xxl,
        color,
        title,
        price,
        img,
      },
      { new: true } // Returns the updated product
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error });
  }
});

app.post("/api/admin/newProduct", async (req, res) => {
  try {
    const { type, desc, xs, s, m, l, xl, xxl, color, title, price, img } =
      req.query;
    const updatedProduct = await Product.create({
      type,
      desc,
      xs,
      s,
      m,
      l,
      xl,
      xxl,
      color,
      title,
      price,
      img,
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);

    res.status(404).json({ err: error });
  }
});

app.delete("/api/admin/productDelete", async (req, res) => {
  try {
    const productId = req.params.productId;
    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error });
  }
});

app.get("/api/admin/singleOrderDetails", async (req, res) => {
  try {
    const orderId = body.params.orderId;
    const orderDetails = await Order.findById(orderId);
    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error });
  }
});

app.put("/api/admin/orderStatusTrue", async ({ body }, res) => {
  try {
    const orderId = body.params.orderId;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: true },
      { new: true } // Returns the updated order
    );

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error });
  }
});
app.put("/api/admin/orderStatusFalse", async ({ body }, res) => {
  try {
    const orderId = body.params.orderId;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: false },
      { new: true } // Returns the updated order
    );

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error });
  }
});
app.listen(port, () => console.log(`Server is Up... Port : ${port}`));
