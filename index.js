const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken');
// middle ware 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@admin.gtjon.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// verifay jwt token 
 function verifayJwtToken  (req , res , next ){
      const authHeader = req.headers.authorization
      if(!authHeader){
            return res.status(401).send({message: 'Unauthorization Access'})
      }
      jwt.verify(token, process.env.ACCESS_TOKEN , function(err, decoded) {
            if(err){
                  return res.status(403).send({message: "forbiden Access"})
            }
            req.decoded = decoded
            next()
          });
 }

async function run(){
      try{  
            await client.connect()
            const serviceCollection = client.db("Luxury-Leving").collection("service");
            const reviewCollection = client.db("Luxury-Leving").collection("review");
            const userCollection = client.db("Luxury-Leving").collection("user");
           
            //  service section --------
            // read service data 
            app.get('/service' , async (req , res) =>{
                  const query = {}
                  const service = await serviceCollection.find(query).toArray()
                  res.send(service)
            })



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