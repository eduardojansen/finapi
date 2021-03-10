const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  // Repassando dado para que possa ser aproveitado pelas rotas que utilizam esse middleware
  request.customer = customer;

  if(!customer){
    return response.status(404).json({error: "Customer not found"});
  }

  return next();
}


app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if(customerAlreadyExists){
    return response.status(400).json({
      error: "Customer alterady exists!"
    })
  }

  const id = uuidv4();

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send();

});


/**
 * Maneiras para adicionar os middlewares:
 * 1ª - Informar como parâmetro de rota separando por vírgulas.
 * 2ª - Adicionar em todas as rotas usando app.use(MiddlewareName)
 */
app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {

  // Recuperando dado injetado no middleware
  const { customer } = request;

  return response.json(customer);
});


app.listen(3333)