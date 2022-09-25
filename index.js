import cors from 'cors'
import dayjs from 'dayjs'
import customParseFormat from './node_modules/dayjs/plugin/customParseFormat.js'
import dotenv from 'dotenv'
import express from 'express'
import joi from 'joi'
import { MongoClient, ObjectId } from 'mongodb'

dayjs.extend(customParseFormat)

let db
const mongoClient = new MongoClient('mongodb://localhost:27017')

try {
  await mongoClient.connect()
} catch (error) {
  console.log(error)
}

db = mongoClient.db('drivencracy')

dotenv.config()

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
    if (valid.error.message == `"title" is not allowed to be empty`) {
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
    if (valid.error.message == `"title" is not allowed to be empty`) {
      return res.send(422)
    }

    return res.send(400)
  }
  try {
    const pollExist = await db
      .collection('polls')
      .findOne({ _id: ObjectId(pollId) })
    console.log()
    if (
      dayjs().isAfter(dayjs(pollExist.expireAt).toDate())
    ) {
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
      pollId
    })

    return res.send(201)
  } catch (error) {
    console.error(error)
    return res.send(500)
  }
})

//poll/:id/choice

/*GET
[
	{
		_id: "54759eb3c090d83494e2d999",
		title: "Javascript",
		pollId: "54759eb3c090d83494e2d222" 
	 },
	{
		_id: "54759eb3c090d83494e2d888",
	  title: "Python",
		pollId: "54759eb3c090d83494e2d222"
	},
	...
]

Validação: caso a enquete não exista deve retornar status 404.

*/

//choice/:id/vote

/*POST
Não recebe nenhum dado do body da requisição. Deve registrar um voto na opção selecionada.

O voto deve armazenar a data e hora que foi criado no backend. 

Validações:

Verificar se é uma opção existente, se não existir retornar 404.

Não pode ser registrado se a enquete já estiver expirado, retornar erro 403.

Retorna status 201 em caso de sucesso.

*/

//poll/:id/result

/*GET
{
	_id: "54759eb3c090d83494e2d222",
	title: "Qual a sua linguagem de programação favorita?"
	expireAt: "2022-02-14 01:00",
	result : {
	title: "Javascript",
	votes: 487
}

Validação: caso a enquete não exista deve retornar status 404.

*/

server.listen(process.env.API, () => {
  console.log(`listen on port ${process.env.API}`)
})
