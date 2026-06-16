function testHelperFunction() {
  // Teste para a função de validação de e-mail
  const validEmail = "test@example.com";
  const invalidEmail = "test@.com";
  
  const isValid = Helpers.validateEmail(validEmail);
  const isInvalid = Helpers.validateEmail(invalidEmail);
  
  console.assert(isValid === true, "A validação do e-mail deve retornar true para um e-mail válido.");
  console.assert(isInvalid === false, "A validação do e-mail deve retornar false para um e-mail inválido.");
}

function testFormatDateFunction() {
  // Teste para a função de formatação de data
  const date = new Date(2023, 0, 1); // 1 de janeiro de 2023
  const formattedDate = Helpers.formatDate(date);
  
  console.assert(formattedDate === "01/01/2023", "A data deve ser formatada como DD/MM/AAAA.");
}

function runTests() {
  testHelperFunction();
  testFormatDateFunction();
  Logger.log("Todos os testes foram executados.");
}

runTests();