const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000

// middle ware 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@admin.gtjon.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
      try{  
            await client.connect()
            const serviceCollection = client.db("Luxury-Leving").collection("service");
           

            // read service data 
            app.get('/service' , async (req , res) =>{
                  const query = {}
                  const service = await serviceCollection.find(query).toArray()
                  res.send(service)
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