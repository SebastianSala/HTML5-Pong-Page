const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 300
const DIRECTION = {
  RIGHT: 'right',
  LEFT: 'left',
  UP: 'up',
  DOWN: 'down',
  NEUTRAL: 'neutral'
}

const score = {
  left: 0,
  right: 0
}

const BALL_COLOR = {
  DEFAULT: '#222',
  LEFT: 'Red',
  RIGHT: 'Green'
}

const canvas = document.querySelector('canvas')
canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT

const ctx =
  canvas instanceof HTMLCanvasElement ? canvas.getContext('2d') : null

const paddleRotationSound = document.createElement('audio')
const goalSound = document.createElement('audio')
const ballReboundSound = document.createElement('audio')
const ballStartSound = document.createElement('audio')
const bgMusic = document.createElement('audio')

paddleRotationSound.src = '../app/resources/audio/sfx/paddle-rotatation.wav'
ballReboundSound.src = '../app/resources/audio/sfx/ball-rebound.wav'
ballStartSound.src = '../app/resources/audio/sfx/ball-start.mp3'
goalSound.src = '../app/resources/audio/sfx/ball-goal.mp3'
bgMusic.src = '../app/resources/audio/music/jardins.mp3'

paddleRotationSound.volume = 0.05
ballReboundSound.volume = 0.3
// goalSound.volume = 1.5
// ballReboundSound.volume = 1.25
// bgMusic.volume = 1.25

const getPaddle = ({ x = 0, color = 'orange' }) => ({
  x,
  h: 90,
  y: (Math.floor(canvas.height / 2) - 45),
  w: 10,
  topCollision: false,
  middleCollision: false,
  bottomCollision: false,
  doRotate: false,
  rotationDirection: 0,
  color,
  velocity: 5,
  angle: 0,
  keyPressed: {
    up: false,
    down: false
  },
  draw(x, y) {
    ctx.fillStyle = this.color
    ctx.fillRect(x, y, this.w, this.h)
  },
  move() {
    if (this.keyPressed.up) {
      this.moveUp()
    } else if (this.keyPressed.down) {
      this.moveDown()
    }
  },
  moveUp() {
    if (this.y <= 0) return
    this.y -= this.velocity
  },
  moveDown() {
    if (this.y >= canvas.height - this.h) return
    this.y += this.velocity
  },
  stayIdle() {
    this.velocity = 0
  },
  update() {
    this.move()
  },
  contains(b) {
    const xEnd = (this.x < b.x + b.w &&
      this.x + this.w > b.x)
    const topEnd = Math.floor(this.h * 0.45)
    const middleEnd = Math.floor(this.h * 0.55)
    const bottomEnd = this.h
    this.topCollision = (this.y < b.y + b.h &&
      this.y + topEnd > b.y) && xEnd
    this.middleCollision = (this.y + topEnd < b.y + b.h &&
      this.y + middleEnd > b.y) && xEnd
    this.bottomCollision = (this.y + middleEnd < b.y + b.h &&
      this.y + bottomEnd > b.y) && xEnd

    return (
      // checking on X
      (this.x < b.x + b.w &&
        this.x + this.w > b.x) &&
      // checking on Y
      (
        (this.y < b.y + b.h &&
          this.y + bottomEnd > b.y)
      )
    )
  }
})

const getBall = () => ({
  w: 10,
  h: 10,
  x: Math.floor(canvas.width / 2) - 5,
  y: (Math.floor(canvas.height / 2) - 5),
  color: BALL_COLOR.DEFAULT,
  directionX: DIRECTION.RIGHT,
  directionY: DIRECTION.NEUTRAL,
  speedX: 1,
  speedY: 1,
  friction: 0.5,
  frictionSpeed: 0.015,
  reboundSpeed: 0.95,
  isMoving: false,

  handleMovement() {
    // only move the ball if the players start playing
    if (!this.isMoving) return

    if (this.directionX === DIRECTION.RIGHT) {
      this.speedX++
    } else {
      this.speedX--
    }

    if (this.directionY === DIRECTION.DOWN) {
      this.speedY++
    } else if (this.directionY === DIRECTION.UP) {
      this.speedY--
    } else {
      this.speedY = 0
    }

    if (this.y - (this.h / 2) < 0) {
      this.directionY = DIRECTION.DOWN
      ballReboundSound.currentTime = 0
      ballReboundSound.play()
    } else if (this.y + this.h / 2 > canvas.height - this.h) {
      this.directionY = DIRECTION.UP
      ballReboundSound.currentTime = 0
      ballReboundSound.play()
    }

    if (this.friction >= 0.75) {
      this.friction -= this.frictionSpeed
    } else this.friction = 0.75

    this.speedX *= this.friction
    this.x += this.speedX

    this.speedY *= this.friction
    this.y += this.speedY
  },
  draw() {
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.w, this.h)
    this.handleMovement()
  }
})

const paddleLeft = getPaddle({ x: 5, color: 'magenta' })
const paddleRight = getPaddle({ x: canvas.width - 15, color: 'lightGreen' })
const ball = getBall()

paddleLeft.draw()
paddleRight.draw()
ball.draw()

const drawBg = (color) => {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}
const BG_COLOR = '#BCF'

// Game Loop
const update = () => {
  bgMusic.play()

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawBg(BG_COLOR)
  drawCourt()
  drawScore()

  paddleLeft.draw()
  ball.color = `rgb(${getRandomColor()}`
  ball.draw()

  updatePlayers()
  checkCollisions()

  drawPlayers()

  requestAnimationFrame(update)
}

const updatePlayers = () => {
  paddleLeft.update()
  paddleRight.update()
}
const drawPlayers = () => {
  if (paddleLeft.doRotate) {
    paddleLeft.angle += (10 * paddleLeft.rotationDirection)
    if (paddleLeft.angle >= 720 || paddleLeft.angle <= -720) {
      paddleLeft.angle = 0
      paddleLeft.doRotate = false
    }
  }

  if (paddleRight.doRotate) {
    paddleRight.angle += (10 * paddleRight.rotationDirection)
    if (paddleRight.angle >= 720 || paddleRight.angle <= -720) {
      paddleRight.angle = 0
      paddleRight.doRotate = false
    }
  }

  rotatePaddle(paddleLeft, paddleLeft.angle)
  rotatePaddle(paddleRight, -paddleRight.angle)
}

const rotatePaddle = (paddle, angle) => {
  const rotation = angle
  const rotationInRadians = rotation * Math.PI / 180
  const { x, y, w, h } = paddle
  const halfPaddleWidth = Math.floor(w / 2)
  const halfPaddleHeigth = Math.floor(h / 2)

  ctx.transform(1, 0, 0, 1, halfPaddleWidth + x, halfPaddleHeigth + y)
  ctx.rotate(rotationInRadians)

  paddle.draw(-(halfPaddleWidth), -(halfPaddleHeigth))

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

// Draw the limits of the stage
const drawCourt = () => {
  // borders
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 10
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  // middle of th court line
  // begin draw
  ctx.beginPath()
  ctx.moveTo(Math.floor(canvas.width / 2), 0)
  ctx.lineWidth = 5
  ctx.lineTo(Math.floor(canvas.width / 2), canvas.height)
  ctx.stroke()
  ctx.closePath()

  // circle at the middle
  ctx.beginPath()
  ctx.arc(
    Math.floor(canvas.width / 2),
    Math.floor(canvas.height / 2),
    50,
    0,
    Math.PI * 2,
    false
  )
  ctx.stroke()
  ctx.fill()
  ctx.closePath()
}

// collision detections
const checkCollisions = () => {
  if (paddleLeft.contains(ball)) {
    ballReboundSound.currentTime = 0
    ballReboundSound.play()

    ball.directionX = DIRECTION.RIGHT
    // rotation
    if (paddleLeft.topCollision) {
      paddleLeft.doRotate = true
      paddleLeft.rotationDirection = 1
      paddleRotationSound.currentTime = 0
      paddleRotationSound.play()
    } else if (paddleLeft.middleCollision) {
      paddleLeft.doRotate = false
      paddleLeft.rotationDirection = 0
    } else if (paddleLeft.bottomCollision) {
      paddleLeft.doRotate = true
      paddleLeft.rotationDirection = -1
      paddleRotationSound.currentTime = 0
      paddleRotationSound.play()
    }

    ball.friction = ball.reboundSpeed
    if ((ball.frictionSpeed <= 0.015) &&
      (ball.frictionSpeed >= 0.007)) {
      ball.frictionSpeed -= 0.0002
    }

    ballDirection(paddleLeft)
  } else if (paddleRight.contains(ball)) {
    ball.directionX = DIRECTION.LEFT
    ball.directionY = DIRECTION.UP

    ballReboundSound.currentTime = 0
    ballReboundSound.play()

    if (paddleRight.topCollision) {
      paddleRight.doRotate = true
      paddleRight.rotationDirection = 1
      paddleRotationSound.currentTime = 0
      paddleRotationSound.play()
    } else if (paddleRight.middleCollision) {
      paddleRight.doRotate = false
      paddleRight.rotationDirection = 0
    } else if (paddleRight.bottomCollision) {
      paddleRight.doRotate = true
      paddleRight.rotationDirection = -1
      paddleRotationSound.currentTime = 0
      paddleRotationSound.play()
    }

    ball.friction = ball.reboundSpeed
    if ((ball.frictionSpeed <= 0.015) &&
      (ball.frictionSpeed >= 0.007)) {
      ball.frictionSpeed -= 0.0002
    }
    ballDirection(paddleRight)
  }

  if (ball.x < 0) {
    ball.x = Math.floor(canvas.width / 2) - Math.floor(ball.w / 2)
    ball.y = Math.floor(canvas.height / 2) - Math.floor(ball.h / 2)
    ball.isMoving = false
    ball.directionY = DIRECTION.NEUTRAL
    ball.directionX = DIRECTION.RIGHT

    ball.frictionSpeed = 0.015

    goalSound.currentTime = 0
    goalSound.play()

    score.right += 1
  } else if (ball.x > canvas.width) {
    ball.x = Math.floor(canvas.width / 2) - Math.floor(ball.w / 2)
    ball.y = Math.floor(canvas.height / 2) - Math.floor(ball.h / 2)
    ball.isMoving = false
    ball.directionY = DIRECTION.NEUTRAL
    ball.directionX = DIRECTION.LEFT

    ball.frictionSpeed = 0.015

    goalSound.currentTime = 0
    goalSound.play()

    score.left += 1
  }
}

// set ball direction
const ballDirection = (paddle) => {
  if (paddle.keyPressed.up) {
    ball.directionY = DIRECTION.UP
  } else if (paddle.keyPressed.down) {
    ball.directionY = DIRECTION.DOWN
  } else {
    ball.directionY = DIRECTION.NEUTRAL
  }
}

// score
const drawScore = () => {
  ctx.fillStyle = 'gray'
  ctx.font = '32px "Press Start 2P"'
  // left score
  ctx.fillText(String(score.left), 70, 70)
  // right score
  ctx.fillText(String(score.right), 200, 70)
}

const getRandomColorComponent = () => {
  return Math.floor(Math.random() * 255)
}
const getRandomColor = () => {
  const rgb = []
  for (let color = 0; color < 3; color++) {
    rgb.push(getRandomColorComponent())
  }
  const finalColor = [...rgb]
  return finalColor
}

// Listeners
addEventListener('keydown', (e) => {
  switch (e.key) {
    // player 1
    case 'W':
    case 'w': {
      console.log('going UP?: ', e.key)

      paddleLeft.keyPressed.down = false
      paddleLeft.keyPressed.up = true

      break
    }
    case 'S':
    case 's': {
      console.log('going DOWN?: ', e.key)

      paddleLeft.keyPressed.up = false
      paddleLeft.keyPressed.down = true

      break
    }
    // player 2
    case 'ArrowUp': {
      console.log('going UP?: ', e.key)

      paddleRight.keyPressed.down = false
      paddleRight.keyPressed.up = true

      break
    }
    case 'ArrowDown': {
      console.log('going DOWN?: ', e.key)

      paddleRight.keyPressed.up = false
      paddleRight.keyPressed.down = true

      break
    }
    case ' ': {
      console.log('Space pressed')
      ball.color = `rgb(${getRandomColor()}`
      if (!ball.isMoving) {
        ballStartSound.currentTime = 0
        ballStartSound.play()
      }
      ball.isMoving = true

      break
    }
    default: {
      console.log('Move the left paddle with UP and Down keyboard arrows')
      console.log('The key pressed: ', e.key)
    }
  }
})

addEventListener('keyup', (e) => {
  switch (e.key) {
    // player 1
    case 'W':
    case 'w':
    case 'S':
    case 's': {
      // paddleLeft.stayIdle();
      // paddleRight.stayIdle();
      paddleLeft.keyPressed.up = false
      paddleLeft.keyPressed.down = false
      break
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      // paddleLeft.stayIdle();
      // paddleRight.stayIdle();
      paddleRight.keyPressed.up = false
      paddleRight.keyPressed.down = false
      break
    }
    default: {
      console.log('Another keys are being pressed: ', e.key)
    }
  }
})

window.onload = () => {
  update()
}
