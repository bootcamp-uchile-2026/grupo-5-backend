import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('LeeConNos API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  it('/libros (GET) debería iniciar con catálogo vacío', () => {
    return request(app.getHttpServer())
      .get('/libros')
      .expect(200)
      .expect([]);
  });

  it('/usuarios (POST) debería registrar un usuario', () => {
    return request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Camila Rojas',
        email: 'camila@correo.cl',
        password: 'contrasenaSegura123',
        rol: 'CLIENTE',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('camila@correo.cl');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
