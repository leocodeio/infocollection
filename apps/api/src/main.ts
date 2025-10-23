import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000).then(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`server running at http://localhost:${process.env.PORT}`);
    } else {
      console.log(`server running at ${process.env.BASE_URL}`);
    }
  });
}
bootstrap();
