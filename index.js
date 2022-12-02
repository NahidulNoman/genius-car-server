const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require("dotenv").config();

// middle wares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("genius car server is running...");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a31ucvz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// jwt
function verifyJWT(req,res,next){
  const author = req.headers.authorization;
  if(!author){
    return res.status(403).send({message : 'unauthorize access'})
  }
  const token = author.split(' ')[1];
  jwt.verify(token, process.env.TOKEN_SECRET, function(err,decoded){
    if(err){
      return res.status(403).send({message : 'unauthorize access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try{
    const serviceCollection = client.db("geniusCar").collection("service");
    const orderCollection = client.db('geniusCar').collection('orders')

    app.post('/jwt', (req,res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET,{expiresIn : '10h'});
      res.send({token});
    })

    app.get('/services', async (req,res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/services/:id', async (req,res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    
    // orders api
    app.get('/orders', verifyJWT,  async (req,res) => {
      
      if(req.decoded.email !== req.query.email){
        return res.status(403).send({message : 'unauthorize access'})
      }
      let query = {};
      if(req.query.email){
        query = {
          email : req.query.email
        } 
      }
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch('/orders/:id', async (req,res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = {_id : ObjectId(id)}
      const updateDoc = {
        $set: {
          status : status
        }
      };
      const result = await orderCollection.updateOne(query,updateDoc)
      res.send(result)
      console.log(result)
    })

    app.delete('/orders/:id', async (req,res) => {
        const id = req.params.id;
        const query = {_id : ObjectId(id)};
        console.log(query)
        const result = await orderCollection.deleteOne(query);
        res.send(result);
        console.log(result);
    });

    app.post('/orders', async (req,res) => {
      const query = req.body;
      const result = await orderCollection.insertOne(query);
      res.send(result);
    });

  }
  finally{

  }
}
run().catch(error => console.log(error))


app.listen(port, () => {
  console.log(`your server is running port ${port}`);
});
