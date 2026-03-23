

const {
    calcularReceita,
  } = require("../dashboard.js");

  describe("Calcular Receita", () =>{
    const mockTransacoes = [
      {
          "id": "00d5c34f-5c92-49c4-a747-2837c9baaf85",
          "tipo": "entrada",
          "descricao": "oi",
          "categoria": "oi",
          "valor": 500,
          "dataISO": "2026-03-23T20:04:08.457Z"
      },
      {
          "id": "2881865b-a032-4156-8127-5006bcd40db6",
          "tipo": "entrada",
          "descricao": "oii",
          "categoria": "oii",
          "valor": 600,
          "dataISO": "2026-03-23T20:04:19.935Z"
      }
  ];
    test ("Deve somar todas as entradas"), () => {
    expect (calcularReceita (mockTransacoes));
    }
  }

);