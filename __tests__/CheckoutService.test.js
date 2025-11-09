import { UserMother } from "./builders/UserMother.js";
import { CarrinhoBuilder } from "./builders/CarrinhoBuilder.js";
import { Item } from "../src/domain/Item.js";
import { CheckoutService } from "../src/services/CheckoutService.js";


describe("quando um cliente Premium finaliza a compra", () => {
    it("deve aplicar desconto e enviar e-mail de confirmação", async () => {
        const userPremium = UserMother.umUsuarioPremium();
        const itens = [new Item("Produto 1", 200)];
        const carrinho = new CarrinhoBuilder().comUser(userPremium).comItens(itens).build();

        const gatewayStub = {
            cobrar: jest.fn().mockResolvedValue({ success: true }),
        };

        const pedidoRepoStub = {
            salvar: jest.fn().mockResolvedValue({ id: 1 }),
        };

        const emailMock = {
            enviarEmail: jest.fn(),
        };

        const checkoutService = new CheckoutService(
            gatewayStub,
            pedidoRepoStub,
            emailMock
        );


        await checkoutService.processarPedido(carrinho, "cartao-teste-1234");

        expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, expect.anything());
        expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
        expect(emailMock.enviarEmail).toHaveBeenCalledWith(
            "premium@email.com",
            "Seu Pedido foi Aprovado!",
            expect.anything()
        );
    });
    describe("quando o pagamento falha", () => {
        it("deve retornar null e não enviar e-mail", async () => {
            const user = UserMother.umUsuarioPadrao();
            const carrinho = new CarrinhoBuilder().comUser(user).build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: false }),
            };

            const pedidoRepoDummy = { salvar: jest.fn() };
            const emailDummy = { enviarEmail: jest.fn() };

            const checkoutService = new CheckoutService(
                gatewayStub,
                pedidoRepoDummy,
                emailDummy
            );

            const resultado = await checkoutService.processarPedido(carrinho, "cartao123");

            expect(resultado).toBeNull();
            expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
            expect(pedidoRepoDummy.salvar).not.toHaveBeenCalled();
        });
    });

});
