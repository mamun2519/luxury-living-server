const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken');
const { query } = require('express');
const stripe = require("stripe")('sk_test_51L1nmNCGpaTt0RU81oq26j6Ta7gwb9pGlOOwxjeXAQgefsXMvmRxFUopKE2St6GDbDpxjUug0KxRyqzL6oKarPcR00lqLjh70r')
// middle ware 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@admin.gtjon.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// verifay jwt token ------------------
 function verifayJwtToken(req , res , next ){
      const authHeader = req.headers.authorization
      if(!authHeader){
            return res.status(401).send({message: 'Unauthorization Access'})
      }
      const token = authHeader.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN , function(err, decoded) {
            if(err){
                  return res.status(403).send({message: "forbiden Access"})
            }
            req.decoded = decoded
            next()
          });
 }
      

//    start -------------
async function run(){
      try{  
            await client.connect()
            const serviceCollection = client.db("Luxury-Leving").collection("service");
            const reviewCollection = client.db("Luxury-Leving").collection("review");
            const userCollection = client.db("Luxury-Leving").collection("user");
            const orderCollection = client.db("Luxury-Leving").collection("order");
            const paymentCollection = client.db("Luxury-Leving").collection("payment");
            const projectCollection = client.db("Luxury-Leving").collection("project");

                 // create payment maythod 
                 app.post('/create-payment-intent', async (req, res) => {
                  const service = req.body
                  console.log(service);
                  const price = service.price
                  const amount = price * 100
                  console.log(amount , price);

                  const paymentIntent = await stripe.paymentIntents.create({
                        amount: amount,
                        currency: "usd",
                        payment_method_types: ['card']
                  });
                  console.log(paymentIntent);
                  res.send({ clientSecret: paymentIntent.client_secret })
            })

            // project API   
            app.get('/project' ,  async (req , res) =>{
                  const query = {}
                  const service = await projectCollection.find(query).toArray()
                  res.send(service)
            })
           
            //  service section --------
            // read service data 
            app.get('/service' ,  async (req , res) =>{
                  const query = {}
                  const service = await serviceCollection.find(query).toArray()
                  res.send(service)
            })

            app.delete('/service/:id' , async (req , res) => {
                  const id = req.params.id
                  const query = {_id: ObjectId(id)}
                  const delets = await serviceCollection.deleteOne(query)
                  app.res(delets)
            })


            // order api 
            app.get('/order' , async (req , res) => {
                  const query = {}
                  const order = await orderCollection.find(query).toArray()
                  res.send(order)
            })
            app.post('/order' , verifayJwtToken, async (req , res ) =>{
                  const order = req.body
                  const submit = await orderCollection.insertOne(order)
                  res.send({message: "Your order Successfull!"})
            })

            app.get('/order/:email' , async (req , res) => {
                  const email = req.params.email
                  const query = {email : email}
                  const order = await orderCollection.find(query).toArray()
                  res.send(order)

            })

            app.get('/orders/:id' , async (req , res) => {
                  const id = req.params.id
                  const query = {_id: ObjectId(id)}
                  const result = await orderCollection.findOne(query)
                  res.send(result)
            })

            app.patch('/order/:id' , async (req , res)=> {
                  const id = req.params.id
                  const payment = req.body
                  const filter = {_id: ObjectId(id)}
                  const updateDoc = {
                        $set: {
                              paid: "Paid",
                              transactionId: payment.transactionId
                        }
                  }
                  
                  const result = await orderCollection.updateOne(filter , updateDoc)
                  const setPayment = await paymentCollection.insertOne(payment)
                  res.send(updateDoc)
            })
            app.patch('/shipped/:id' , async (req , res) => {
                  const id = req.params.id
                  const filter = {_id: ObjectId(id)}
                  const updateDoc = {
                        $set:{
                              paid: "Shipped"
                        }
                  }
                  const result = await orderCollection.updateOne(filter , updateDoc)
                  res.send(updateDoc)
            })


            app.delete('/order/:id' , async (req , res) => {
                  const id = req.params.id
                  const query = {_id: ObjectId(id)}
                  const result = await orderCollection.deleteOne(query)
                  res.send(result)
            } )



            // review section ------------

            app.get('/review' , async (req , res) => {
                  const query = {}
                  const review = await reviewCollection.find(query).toArray()
                  res.send(review)
            })

            app.post('/review' , async (req , res) => {
                  const review = req.body
                  const submit = await reviewCollection.insertOne(review)
                  res.send({message: "Review Added Successful!"})
            })


            // create user with jwt token 
            app.put('/user/:email' , async (req , res) => {
                  const email = req.params.email
                  const userEmail = req.body
                  const filter = {email: email}
                  const option = {upsert: true}
                  const updateDoc = {
                        $set: userEmail
                  }
                  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN , { expiresIn: '1h' });
                  const result = await userCollection.updateOne(filter ,  updateDoc , option)
                  res.send({result , token})
            })

            app.get('/user' , verifayJwtToken, async (req , res) => {
                  const query = {}
                  const result = await userCollection.find(query).toArray()
                  res.send(result)
            })

            app.delete('/user/:id' , async (req , res) => {
                  const id = req.params.id
                  const query = {_id: ObjectId(id)}
                  const deletes = await userCollection.deleteOne(query)
                  res.send(deletes)
            })

            // admin api 
            app.put('/user/admin/:email' , verifayJwtToken, async (req , res) => {
                  const email = req.params.email

                  const adminRequester = req.decoded.email
                  const requestAccount = await userCollection.findOne({email: adminRequester})
                  if(requestAccount.role == 'admin'){
                        const filter = {email: email}
                        const updateDoc = {
                              $set: {role: "admin"}
                        }
                        const result = await userCollection.updateOne(filter , updateDoc)
                        res.send(result)

                  }
                  else {
                        res.status(403).send({ message: "forbiden" })
                  }
                
            })

            app.get('/user/:email' , async (req , res) => {
                  const email = req.params.email
                  const user = await userCollection.findOne({email: email})
                  const isAdmin = user.role == 'admin'
                  res.send({admin: isAdmin })
            })


      }

      finally{

      }

}
run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('Hello luxcury living!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})