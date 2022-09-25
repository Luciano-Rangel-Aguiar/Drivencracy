import cors from 'cors'
import dayjs from 'dayjs'
import customParseFormat from './node_modules/dayjs/plugin/customParseFormat.js'
import dotenv from 'dotenv'
import express from 'express'
import joi from 'joi'
import { MongoClient, ObjectId } from 'mongodb'


dotenv.config()
dayjs.extend(customParseFormat)

let db
const mongoClient = new MongoClient(process.env.MONGO_URI)

try {
  await mongoClient.connect()
} catch (error) {
  console.log(error)
}

db = mongoClient.db('drivencracy')

const server = express()
server.use(cors())
server.use(express.json())

const pollSchema = joi
  .object({
    title: joi.string().required(),
    expireAt: joi.string()
  })
  .custom(obj => {
    const dateValid = dayjs(obj.expireAt, 'YYYY-MM-DD HH:mm', true).isValid()
    if (!dateValid) {
      throw new Error(
        'Date format is invalid, valid format should be "YYYY-MM-DD HH:mm".'
      )
    }
  })

const choiceSchema = joi.object({
  title: joi.string().required(),
  pollId: joi.string().required()
})

// polls

server.post('/poll', async (req, res) => {
  let { title, expireAt } = req.body

  if (!expireAt) {
    expireAt = dayjs(Date.now()).add(30, 'day').format('YYYY-MM-DD HH:mm')
  }

  const valid = pollSchema.validate({
    title,
    expireAt
  })

  if (valid.error) {
    if (valid.error.message == '"title" is not allowed to be empty') {
      return res.send(422)
    }

    return res.send(400)
  }
  try {
    await db.collection('polls').insertOne({
      title,
      expireAt
    })

    return res.send(201)
  } catch (error) {
    console.error(error)
    return res.send(500)
  }
})

server.get('/poll', async (req, res) => {
  try {
    const polls = await db.collection('polls').find({}).toArray()

    return res.send(polls)
  } catch (error) {
    console.error(error)
    return res.send(500)
  }

  return res.send(200)
})

//choice

server.post('/choice', async (req, res) => {
  const { title, pollId } = req.body

  const valid = choiceSchema.validate({
    title,
    pollId
  })

  if (valid.error) {
    if (valid.error.message == '"title" is not allowed to be empty') {
      return res.send(422)
    }

    return res.send(400)
  }
  try {
    const pollExist = await db
      .collection('polls')
      .findOne({ _id: ObjectId(pollId) })

    if (dayjs().isAfter(dayjs(pollExist.expireAt).toDate())) {
      return res.send(403)
    }
  } catch {
    return res.send(404)
  }
  try {
    const choiceExist = await db.collection('choices').findOne({ title: title })
    if (choiceExist) {
      return res.send(409)
    }
  } catch {
    return res.send(500)
  }

  try {
    await db.collection('choices').insertOne({
      title,
      pollId,
      votes: 0
    })

    return res.send(201)
  } catch (error) {
    console.error(error)
    return res.send(500)
  }
})

//poll/:id/choice

server.get('/poll/:id/choice', async (req, res) => {
  const pollId = req.params.id

  try {
    await db.collection('polls').findOne({ _id: ObjectId(pollId) })
  } catch {
    return res.send(404)
  }
  try {
    let pollChoices = await db
      .collection('choices')
      .find({ pollId: pollId })
      .toArray()
    pollChoices.map(r => {
      delete r.votes
    })
    console.log(pollChoices)
    res.send(pollChoices)
  } catch {
    return res.send(500)
  }
})

//choice/:id/vote

server.post('/choice/:id/vote', async (req, res) => {
  const choiceId = req.params.id
  let votedChoice = await db
    .collection('choices')
    .findOne({ _id: ObjectId(choiceId) })
  if (!votedChoice) {
    return res.send(404)
  }
  try {
    const poll = await db
      .collection('polls')
      .findOne({ _id: ObjectId(votedChoice.pollId) })
    if (dayjs().isAfter(dayjs(poll.expireAt).toDate())) {
      return res.send(403)
    }
  } catch {
    return res.send(500)
  }
  votedChoice.votes++
  try {
    await db
      .collection('choices')
      .replaceOne({ _id: ObjectId(choiceId) }, votedChoice)
    console.log(votedChoice)
    return res.send(200)
  } catch {
    return res.send(500)
  }
})

//poll/:id/result

server.get('/poll/:id/result', async (req, res) => {
  const pollId = req.params.id

  try {
    let poll = await db.collection('polls').findOne({ _id: ObjectId(pollId) })
    const winnerChoice = await db
      .collection('choices')
      .find({ pollId: pollId })
      .sort({ votes: -1 })
      .limit(1)
      .toArray()
    const result = {
      title: winnerChoice[0].title,
      votes: winnerChoice[0].votes
    }
    Object.assign(poll, { result: result })
    console.log(result)
    return res.send(poll)
  } catch {
    return res.send(404)
  }
})

server.listen(process.env.API, () => {
  console.log(`listen on port ${process.env.API}`)
})
