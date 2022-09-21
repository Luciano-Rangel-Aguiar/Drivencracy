import express from 'express.js'
import cors from 'cors.js'
import {  } from 'mongodb'
import joi from "joi";

const server = express()
server.use(cors())
server.use(express.json())

// polls

/*POST
{
  title: "Qual a sua linguagem favorita?",
	expireAt: "2022-02-28 01:00" 
}

Title não pode ser uma string vazia, retornar status 422.

Se expireAt for vazio deve ser considerado 30 dias de enquete por padrão.

Deve retornar a enquete criada em caso de sucesso com status 201.
*/


/*GET
[
	{
		_id: "54759eb3c090d83494e2d222",
    title: "Qual a sua linguagem favorita?",
		expireAt: "2022-02-28 01:00" 
	},
	...
]

*/

//choice

/*POST
{
    title: "JavaScript",
		pollId: "54759eb3c090d83494e2d222",
}

Validação:

Uma opção de voto não pode ser inserida sem uma enquete existente, retornar status 404.

Title não pode ser uma string vazia, retornar status 422.

Title não pode ser uma string vazia, retornar status 422.

Se a enquete já estiver expirado deve retornar erro com status 403.

Deve retornar a opção de voto criada em caso de sucesso com status 201.
*/

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


server.listen(5000, () => console.log('Listening on port 5000...'))