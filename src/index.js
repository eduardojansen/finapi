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

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
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

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();

});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;

  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return response.status(400).json({error: 'Insufficient funds'})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();

});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {

  const { customer } = request;
  const { date } = request.query;

  const dateFilter = new Date(date + " 00:00");
  console.log(dateFilter, date)

  const statement = customer.statement.filter(
    (statement) => 
      statement.created_at.toDateString() === 
      dateFilter.toDateString()
  );


  return response.json(statement);
});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;
  customer.name = name;

  return response.status(200).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.send(customer);


});



app.listen(3333)