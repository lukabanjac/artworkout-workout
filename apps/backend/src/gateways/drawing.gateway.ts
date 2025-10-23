import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import Redis from 'ioredis';

@WebSocketGateway({ cors: true })
export class DrawingGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private pub: Redis;
    private sub: Redis;

    afterInit() {
        // setup Redis pub/sub
        this.pub = new Redis(); // default: localhost:6379
        this.sub = new Redis();

        this.sub.subscribe('drawing_channel', (err) => {
            if (err) console.error('Redis subscribe error:', err);
        });

        this.sub.on('message', (channel, message) => {
            if (channel === 'drawing_channel') {
                const data = JSON.parse(message);
                console.log('📩 Received from Redis:', data);

                // broadcast to all connected clients
                this.server.emit('drawing:broadcast', data);
            }
        });

        console.log('✅ DrawingGateway initialized with Redis');
    }

    @SubscribeMessage('drawing:update')
    handleDrawing(@MessageBody() payload: any) {
        console.log('🖊️ Received drawing payload:', payload);

        // publish to Redis for other backend instances
        this.pub.publish('drawing_channel', JSON.stringify(payload));

        // echo back to connected clients
        this.server.emit('drawing:broadcast', payload);
    }
}