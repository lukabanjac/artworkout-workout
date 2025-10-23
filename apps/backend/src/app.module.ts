import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrawingGateway } from './gateways/drawing.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DrawingGateway],
})
export class AppModule { }
