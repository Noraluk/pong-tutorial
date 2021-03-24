import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';

class Canvas {
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;

  constructor(partial: Partial<Canvas>) {
    Object.assign(this, partial);
  }
}

class Axis {
  x: number;
  y: number;

  constructor(partial: Partial<Axis>) {
    Object.assign(this, partial);
  }
}

class Thing {
  position: Axis;
  width: number;
  height: number;

  constructor(partial: Partial<Thing>) {
    Object.assign(this, partial);
  }
}

class Player {
  thing: Thing;
  score: number;

  constructor(partial: Partial<Player>) {
    Object.assign(this, partial);
  }
}

@WebSocketGateway()
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  canvas = new Canvas(null);
  ball = new Thing({ position: { x: 200, y: 200 }, width: 0, height: 0 });
  direction = new Axis({ x: 1, y: 1 });
  player = new Player({});
  player1 = new Player({ score: 0 });
  player2 = new Player({ score: 0 });

  private logger: Logger = new Logger('MessageGateway');

  public moveBall(): void {
    if (this.ball.position.y + this.ball.width >= this.canvas.yEnd) {
      this.direction.y *= -1;
    } else if (this.ball.position.y <= this.canvas.yStart) {
      this.direction.y *= -1;
    }

    if (this.ball.position.x + this.ball.height >= this.canvas.xEnd) {
      this.direction.x *= -1;
    } else if (this.ball.position.x <= this.canvas.xStart) {
      this.direction.x *= -1;
    }

    this.ball.position.x += this.direction.x / 2;
    this.ball.position.y += this.direction.y / 2;
  }

  @SubscribeMessage('canvas')
  public setCanvas(client: Socket, payload: any): void {
    this.canvas = payload;
  }

  @SubscribeMessage('player1')
  public setPlayer1(client: Socket, payload: any): void {
    this.player1.thing = this.movePlayer(this.player1.thing, payload.command);
  }

  @SubscribeMessage('player2')
  public setPlayer2(client: Socket, payload: any): void {
    this.player2.thing = this.movePlayer(this.player2.thing, payload.command);
  }

  private movePlayer(player: Thing, command: string): Thing {
    switch (command) {
      case 'up':
        if (player.position.y > this.canvas.yStart) {
          player.position.y -= 10;
        }
        break;
      case 'down':
        if (player.position.y + player.height < this.canvas.yEnd) {
          player.position.y += 10;
        } else if (player.position.y < this.canvas.yEnd) {
          const range = this.canvas.yEnd - (player.position.y + player.height);
          player.position.y += range;
        }
        break;
    }
    return player;
  }

  @SubscribeMessage('update')
  public update(client: Socket): void {
    this.collide();
    this.moveBall();
    const isEnd = this.calScore();
    client.emit('update', {
      ball: this.ball,
      player1: this.player1,
      player2: this.player2,
      isEnd: isEnd,
    });
  }

  private collide(): void {
    const isThingXAxis =
      this.player1.thing.position.x <= this.ball.position.x + this.ball.width &&
      this.player1.thing.position.x + this.player1.thing.width >=
        this.ball.position.x;

    const isThingYAxis =
      this.player1.thing.position.y <=
        this.ball.position.y + this.ball.height &&
      this.player1.thing.position.y + this.player1.thing.height >=
        this.ball.position.y;

    const isPlayer1CollideTop =
      isThingXAxis &&
      this.player1.thing.position.y <=
        this.ball.position.y + this.ball.height &&
      this.ball.position.y + this.ball.height <= this.player1.thing.position.y;

    const isPlayer1CollideBottom =
      isThingXAxis &&
      this.player1.thing.position.y + this.player1.thing.height >=
        this.ball.position.y &&
      this.ball.position.y >=
        this.player1.thing.position.y + this.player1.thing.height;

    const isPlayer1CollideFront =
      isThingYAxis &&
      this.player1.thing.position.x + this.player1.thing.width >=
        this.ball.position.x &&
      this.player1.thing.position.x + this.player1.thing.width <=
        this.ball.position.x + this.ball.width;

    const isPlayer1CollideBack =
      isThingYAxis &&
      this.player1.thing.position.x <= this.ball.position.x + this.ball.width &&
      this.player1.thing.position.x >= this.ball.position.x + this.ball.width;

    const isThingXAxis2 =
      this.player2.thing.position.x <= this.ball.position.x + this.ball.width &&
      this.player2.thing.position.x + this.player2.thing.width >=
        this.ball.position.x;

    const isThingYAxis2 =
      this.player2.thing.position.y <=
        this.ball.position.y + this.ball.height &&
      this.player2.thing.position.y + this.player2.thing.height >=
        this.ball.position.y;

    const isPlayer2CollideTop =
      isThingXAxis2 &&
      this.player2.thing.position.y <=
        this.ball.position.y + this.ball.height &&
      this.ball.position.y + this.ball.height <= this.player2.thing.position.y;

    const isPlayer2CollideBottom =
      isThingXAxis2 &&
      this.player2.thing.position.y + this.player2.thing.height >=
        this.ball.position.y &&
      this.ball.position.y >=
        this.player2.thing.position.y + this.player2.thing.height;

    const isPlayer2CollideFront =
      isThingYAxis2 &&
      this.player2.thing.position.x + this.player2.thing.width >=
        this.ball.position.x &&
      this.player2.thing.position.x + this.player2.thing.width <=
        this.ball.position.x + this.ball.width;

    const isPlayer2CollideBack =
      isThingYAxis2 &&
      this.player2.thing.position.x <= this.ball.position.x + this.ball.width &&
      this.player2.thing.position.x >= this.ball.position.x + this.ball.width;

    if (isPlayer1CollideTop) {
      this.direction.y = -1;
    } else if (isPlayer1CollideBottom) {
      this.direction.y = 1;
    } else if (isPlayer1CollideFront) {
      this.direction.x = 1;
    } else if (isPlayer1CollideBack) {
      this.direction.x = -1;
    } else if (isPlayer2CollideTop) {
      this.direction.y = -1;
    } else if (isPlayer2CollideBottom) {
      this.direction.y = 1;
    } else if (isPlayer2CollideFront) {
      this.direction.x = 1;
    } else if (isPlayer2CollideBack) {
      this.direction.x = -1;
    }
  }

  private calScore(): boolean {
    if (this.ball.position.x <= this.canvas.xStart) {
      this.player1.score++;
      return true;
    } else if (this.ball.position.x + this.ball.width >= this.canvas.xEnd) {
      this.player2.score++;
      return true;
    }
    return false;
  }

  @SubscribeMessage('start')
  public start(client: Socket, payload: any): void {
    this.ball.position.x = 200;
    this.ball.position.y = 200;
    this.direction.x = 1;
    this.direction.y = 1;

    this.update(client);
  }

  public afterInit(server: Server): void {
    return this.logger.log('Init');
  }

  public handleDisconnect(client: Socket): void {
    return this.logger.log(`Client disconnected: ${client.id}`);
  }

  public handleConnection(client: Socket): void {
    this.ball = { position: { x: 200, y: 200 }, width: 20, height: 20 };
    this.player1.thing = {
      position: { x: 50, y: 150 },
      width: 20,
      height: 100,
    };
    this.player2.thing = {
      position: { x: 570, y: 150 },
      width: 20,
      height: 100,
    };

    this.update(client);
    return this.logger.log(`Client connected: ${client.id}`);
  }
}
