document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const backgroundMusic = new Audio('background-music.mp3'); // Replace with your MP3 path
    const fireSound = new Audio('fire-sound.mp3'); // Replace with your fire sound path

    // Game state
    let score = 0;
    let gameRunning = false;
    let bullets = [];
    let enemies = [];
    let enemyBullets = []; // Array to store enemy bullets
    let highScore = 0; 

    // Player object
    let player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 70,
        width: 50,
        height: 50,
        speed: 4,
        lives: 5,
    };

    // Mouse controls for player
    canvas.addEventListener('mousemove', function (event) {
        let rect = canvas.getBoundingClientRect();
        player.x = event.clientX - rect.left - player.width / 2;
        player.y = event.clientY - rect.top - player.height / 2;
    });

    // Mouse click to start the game from the menu
    canvas.addEventListener('click', function (event) {
        if (!gameRunning) {
            startGame();
        } else {
            // Fire a bullet
            bullets.push({
                x: player.x + player.width / 2 - 2.5,
                y: player.y,
                width: 5,
                height: 10,
                speed: 4
            });
            fireSound.cloneNode().play();
        }
    });

    // Assets loading
    let assetsLoaded = 0;
    const enemyImage = new Image();
    const playerImage = new Image();
    const backgroundImage = new Image();

    // Load assets
    enemyImage.src = 'enemySprite.png';
    playerImage.src = 'playerSprite.png';
    backgroundImage.src = 'background.gif';

    enemyImage.onload = () => assetLoaded();
    playerImage.onload = () => assetLoaded();
    backgroundImage.onload = () => assetLoaded();

    function assetLoaded() {
        assetsLoaded++;
        if (assetsLoaded === 3) {
            backgroundMusic.loop = true;
            backgroundMusic.play().catch(e => console.error("Error playing music: ", e));
            displayMenu();
        }
    }

    function startGame() {
        gameRunning = true;
        player.lives = 5; // Reset player lives
        score = 0; // Reset score
        bullets = []; // Clear bullets
        enemies = []; // Clear enemies
        createWave();
        countdownToStart(); // Start countdown timer

        // Play music on user interaction
        backgroundMusic.loop = true;
        playMusic();
    }

    // Countdown timer before the game starts
    function countdownToStart() {
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Redraw the background
                ctx.fillStyle = 'white';
                ctx.font = '36px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(countdown, canvas.width / 2, canvas.height / 2); // Display the countdown
                countdown--;
            } else {
                clearInterval(countdownInterval);
                gameLoop(); // Start the game loop
            }
        }, 1000);
    }

    // Handle music playback
    function playMusic() {
        var playPromise = backgroundMusic.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Automatic playback started!
                // Show playing UI.
                console.log("Audio playing");
            })
            .catch(error => {
                // Auto-play was prevented
                // Show paused UI.
                console.log("Playback prevented");
            });
        }
    }

    // Adjust the click event listener for the canvas
    canvas.addEventListener('click', function (event) {
        // If the game is not running, clicking will start the game
        if (!gameRunning) {
            startGame();
        } else {
            // Game is running, clicking will fire a bullet
            bullets.push({
                x: player.x + player.width / 2 - 2.5,
                y: player.y,
                width: 5,
                height: 10,
                speed: 3
            });
            fireSound.cloneNode().play();
        }
    });

    // Game loop
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        if (gameRunning) {
            updateAndDrawPlayer();
            updateAndDrawBullets();
            updateAndDrawEnemies();
            updateAndDrawEnemyBullets(); // Draw enemy bullets
            checkBulletCollisions();
            checkPlayerCollisions(); // Check for player collisions
            displayScore();
            displayLives();
            enemyShoot(); // Make enemies shoot
        }

        requestAnimationFrame(gameLoop);
    }

    // Function to display the start menu
    function displayMenu() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2);
    }

    // Function to check collisions with the player
    function checkPlayerCollisions() {
        enemies.forEach((enemy, index) => {
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {
                // Collision detected, decrement player's lives
                player.lives -= 1;
                enemies.splice(index, 1); // Remove the enemy that collided
                if (player.lives <= 0) {
                    gameOver();
                }
            }
        });
    }

    function gameOver() {
        gameRunning = false;
        updateHighScore(); // Update the high score
        displayHighScore(); // Display high score and game over screen
    }

    // Function to display player lives
    function displayLives() {
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Lives: ${player.lives}`, canvas.width - 10, 20); // Top right corner
    }

    function updateAndDrawPlayer() {
        // Keep the player within bounds
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
        if (player.y < 0) player.y = 0;
        if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    }

    function updateAndDrawBullets() {
        bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            if (bullet.y < 0) {
                bullets.splice(index, 1);
            } else {
                ctx.fillStyle = 'yellow';
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        });
    }

    // Function to make enemies shoot
    function enemyShoot() {
        enemies.forEach((enemy) => {
            if (Math.random() < 0.001) { // Adjust this probability as needed
                // Create a bullet for the enemy
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 2.5,
                    y: enemy.y + enemy.height,
                    width: 5,
                    height: 10,
                    speed: 4 // You can adjust the enemy bullet speed
                });
            }
        });
    }

    // Update and draw enemy bullets
    function updateAndDrawEnemyBullets() {
        enemyBullets.forEach((bullet, index) => {
            bullet.y += bullet.speed;
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                // Collision with player detected, decrement player's lives
                player.lives -= 1;
                enemyBullets.splice(index, 1); // Remove the enemy bullet
                if (player.lives <= 0) {
                    gameOver();
                }
            } else if (bullet.y > canvas.height) {
                enemyBullets.splice(index, 1);
            } else {
                ctx.fillStyle = 'red'; // Color of enemy bullets
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        });
    }

    function updateAndDrawEnemies() {
        if (enemies.length === 0) {
            createWave();
        }

        enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed;
            if (enemy.y > canvas.height) {
                enemies.splice(index, 1);
            } else {
                ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
            }
        });
    }

    function checkBulletCollisions() {
        bullets.forEach((bullet, bulletIndex) => {
            enemies.forEach((enemy, enemyIndex) => {
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    score += 10;
                    bullets.splice(bulletIndex, 1);
                    enemies.splice(enemyIndex, 1);
                }
            });
        });
    }

    function displayScore() {
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.textAlign = 'left'; // Align text to the left
        ctx.fillText(`Score: ${score}`, 10, canvas.height - 10); // Position score at the bottom left of the canvas
    }

    function createWave() {
        const numberOfEnemies = Math.floor(Math.random() * (10 - 5 + 1)) + 5; // Generate a random number between 5 and 10
        for (let i = 0; i < numberOfEnemies; i++) {
            let randomX = Math.random() * (canvas.width - 50);
            let randomYOffset = Math.random() * 100; // This will give some vertical spacing variability

            let newEnemy = {
                x: randomX,
                y: -30 - randomYOffset, // Apply the vertical offset here
                width: 50,
                height: 50,
                speed: 0.8
            };
            enemies.push(newEnemy);
        }
    }

    function updateHighScore() {
        // Update the high score if the current score is higher
        if (score > highScore) {
            highScore = score;
        }
    }

    function displayHighScore() {
        // Display the final score and high score
        document.getElementById("finalScore").textContent = score;
        document.getElementById("highScore").textContent = highScore;

        // Show the game over screen
        document.getElementById("gameOver").style.display = "block";
    }

    // Restart the game when the "Restart" button is clicked
    document.getElementById("restartButton").addEventListener("click", function () {
        document.getElementById("gameOver").style.display = "none"; // Hide the game over screen
        startGame(); // Start a new game
    });
});
