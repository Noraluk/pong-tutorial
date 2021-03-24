<template>
  <div>
    <canvas
      ref="game"
      :width="width"
      :height="height"
      style="background-color: white"
    ></canvas>
    <h1>1</h1>
  </div>
</template>

<script>
import socket from '../plugins/socket.io'

export default {
  components: {},
  data() {
    return {
      width: 640,
      height: 480,
      context: {},
      ball: {},
      player1: {},
      player2: {},
      isEnd: false,
    }
  },
  mounted() {
    this.context = this.$refs.game.getContext('2d')
    this.context.fillStyle = '#FF0000'

    window.addEventListener('keydown', function (e) {
      switch (e.code) {
        case 'KeyW':
          socket.emit('player1', { command: 'up' })
          break
        case 'KeyS':
          socket.emit('player1', { command: 'down' })
          break
        case 'ArrowUp':
          socket.emit('player2', { command: 'up' })
          break
        case 'ArrowDown':
          socket.emit('player2', { command: 'down' })
          break
        case 'Enter':
          socket.emit('start')
          break
      }
    })

    window.addEventListener('mousedown', function (e) {
      socket.emit('start')
    })

    socket.on('update', (data) => {
      this.ball = data.ball
      this.player1 = data.player1
      this.player2 = data.player2

      this.context.clearRect(
        0,
        0,
        this.$refs.game.width,
        this.$refs.game.height
      )
      this.context.fillRect(
        this.ball.position.x,
        this.ball.position.y,
        this.ball.width,
        this.ball.height
      )
      this.context.fillRect(
        this.player1.thing.position.x,
        this.player1.thing.position.y,
        this.player1.thing.width,
        this.player1.thing.height
      )
      this.context.fillRect(
        this.player2.thing.position.x,
        this.player2.thing.position.y,
        this.player2.thing.width,
        this.player2.thing.height
      )
      this.context.font = '100px Georgia'
      this.context.fillText(this.player1.score, 100, 80)
      this.context.fillText(this.player2.score, 450, 80)

      if (data.isEnd === false) {
        socket.emit('update')
      }
    })
  },
  created() {
    socket.emit('canvas', {
      xStart: 0,
      xEnd: this.width,
      yStart: 0,
      yEnd: this.height,
    })
  },
}
</script>
