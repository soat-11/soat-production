export interface IEventPublisher {
  /**
   * Publica um evento para o sistema de mensageria.
   * @param eventName Nome do evento (ex: 'order.created')
   * @param payload Dados do evento (o objeto que será enviado)
   */
  publish<T>(eventName: string, payload: T): Promise<void>;
}
