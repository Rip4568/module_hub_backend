import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../src/common/context/request.context';
import { DataSource } from 'typeorm';

/**
 * PLAYGROUND
 * 
 * Este arquivo permite interagir diretamente com os serviços e repositórios do sistema.
 * Para rodar: npm run playground
 */

async function bootstrap() {
    console.log('🌱 Inicializando contexto do NestJS...');
    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const dataSource = app.get(DataSource);
        const cls = app.get(ClsService);

        // --- SEU CÓDIGO AQUI ---
        // Exemplo: Buscar todos os usuários de um tenant específico

        // 1. Definir o contexto do tenant (Obrigatório para operações que usam TenantAwareEntity)
        const testTenantId = '75d19760-7052-446f-8700-1c04fa063b00'; // Substitua por um ID real

        await cls.runWith({ [RequestContext.TENANT_ID]: testTenantId } as any, async () => {
            console.log(`\n--- Executando Playground para o Tenant: ${testTenantId} ---\n`);

            // Exemplo de Query Builder:
            const users = await dataSource.getRepository('User').find();
            console.log('Usuários encontrados:', users.length);

            // Se quiser usar um service:
            // const productService = app.get(ProductService);
            // const products = await productService.findAll();
            // console.log('Produtos:', products);
        });

        // --- FIM DO SEU CÓDIGO ---

    } catch (error) {
        console.error('❌ Erro no Playground:', error);
    } finally {
        console.log('\n😴 Fechando contexto...');
        await app.close();
    }
}

bootstrap();
