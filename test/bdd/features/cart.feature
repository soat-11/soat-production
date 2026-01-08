Feature: Consultar Carrinho de Compras
  Como um cliente da loja
  Quero visualizar meu carrinho
  Para saber quais itens eu selecionei e o valor total

  Scenario: Recuperar um carrinho existente com sucesso
    Given que existe um carrinho associado à sessão "session-123"
    And o carrinho contém o item "SKU_ABC" com preço 50.00
    When eu solicito a consulta do carrinho para a sessão "session-123"
    Then devo receber os dados do carrinho
    And o valor total deve ser 50.00

  Scenario: Consultar um carrinho que não existe (Sessão Nova)
    Given que não existe nenhum carrinho para a sessão "session-999"
    When eu solicito a consulta do carrinho para a sessão "session-999"
    Then devo receber um resultado vazio ou nulo

  Scenario: Falha ao consultar o serviço de carrinho
    Given que o serviço de carrinho está indisponível
    When eu solicito a consulta do carrinho para a sessão "session-error"
    Then devo receber um erro informando falha de comunicação