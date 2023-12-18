const express = require('express')
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
],
  credentials: true
}));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o19wwr0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

   
    const usersCollection = client.db("rentswiftly").collection("users")
    const housesCollection = client.db("rentswiftly").collection("allhouses")
    const housebookingRequestCollection = client.db("rentswiftly").collection("housebookingrequest")
   
    // jwt related apis

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // middle wares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }





    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    




    // add room related apis
    app.post('/addhouse', async (req, res) => {
      const newhouse = req.body;
      console.log(newhouse);
      const result = await housesCollection.insertOne(newhouse);
      res.send(result);
    })

    app.get('/allhouse', async (req, res) => {
      console.log(req.headers)
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      const filter = req.query;
      const query = {
        location: { $regex: filter.search || '', $options: 'i' },

      }
      const result = await housesCollection.find(query).skip(page * size)
      .limit(size).toArray()
      res.send(result)
    })

    app.get('/allhouse/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await housesCollection.findOne(query);
      res.send(result);
    })

    // house booking information

    app.post('/housebookingrequest', async (req, res) => {
      const newhousebooking = req.body;
      console.log(newhousebooking);
      const result = await housebookingRequestCollection.insertOne(newhousebooking);
      res.send(result);
    })



    app.get('/admin-stats',  async(req, res)=>{
      const house = await housesCollection.estimatedDocumentCount();
      res.send({house})
    })


    










    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('rentswiftfy is running')
})
app.listen(port, () => {
  console.log(`rentswiftfy is sitting on port ${port}`);
})
