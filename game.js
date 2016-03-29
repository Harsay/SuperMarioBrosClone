var game = new Phaser.Game(256, 240, Phaser.AUTO, '', { preload: preload, create: create, update: update }, false, false);

function preload() {
	game.load.spritesheet('tiles', 'assets/tiles.png', 16, 16);
	game.load.spritesheet('goomba', 'assets/goomba.png', 16, 16);
	game.load.spritesheet('mario', 'assets/mario.png', 16, 16);
	game.load.spritesheet('coin', 'assets/coin.png', 16, 16);
	
	game.load.audio('stomp', 'assets/stomp.wav');
	game.load.audio('die', 'assets/die.wav');
	game.load.audio('coin', 'assets/coin.wav');
	game.load.audio('jump', 'assets/jump.wav');
	game.load.audio('theme', 'assets/theme.ogg');

	game.load.tilemap('level', 'assets/meetjs2.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {

	Phaser.Canvas.setImageRenderingCrisp(game.canvas) // wyłączenie antialiasingu
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; // skalowanie do okna
	game.physics.startSystem(Phaser.Physics.ARCADE); // Uruchamiamy silnik fizyki
	game.scale.pageAlignVertically = true;
	game.scale.pageAlignHorizontally = true;

	/////////////// Poziom
	game.stage.backgroundColor = '#5c94fc';

	map = game.add.tilemap('level');
	map.addTilesetImage('tiles', 'tiles');
	map.setCollisionBetween(3, 12, true, 'solid');

	background = map.createLayer('background');
	layer = map.createLayer('solid');
	layer.resizeWorld();

	coins = game.add.group();
	coins.enableBody = true;
	map.createFromTiles(2, null, 'coin', 'stuff', coins);
	coins.callAll('animations.add', 'animations', 'spin', [0, 0, 1, 2], 3, true);
	coins.callAll('animations.play', 'animations', 'spin');

	goombas = game.add.group();
	goombas.enableBody = true;
	map.createFromTiles(1, null, 'goomba', 'stuff', goombas);
	goombas.callAll('animations.add', 'animations', 'walk', [0, 1], 2, true);
	goombas.callAll('animations.play', 'animations', 'walk');
	goombas.setAll('body.bounce.x', 1);
	goombas.setAll('body.velocity.x', -20);
	goombas.setAll('body.gravity.y', 500);

	// Tworzymy gracza
	player = game.add.sprite(16, game.world.height - 48, 'mario');
	game.physics.arcade.enable(player);

	player.body.gravity.y = 370;
	player.body.collideWorldBounds = true;

	player.animations.add('walkRight', [1, 2, 3], 10, true);
	player.animations.add('walkLeft', [8, 9, 10], 10, true);
	player.goesRight = true;

	game.camera.follow(player);

	cursors = game.input.keyboard.createCursorKeys(); // Phaser oferuje nam wygodny sposób na wygenerowanie "kontrolsów".

	stomp = game.add.audio('stomp');
	die = game.add.audio('die');
	pick = game.add.audio('coin');
	jump = game.add.audio('jump');
	theme = game.add.audio('theme');

	theme.loopFull(0.8);
}

function update() {
	game.physics.arcade.collide(player, layer);
	game.physics.arcade.collide(goombas, layer);
	game.physics.arcade.overlap(player, goombas, goombaOverlap);
	game.physics.arcade.overlap(player, coins, coinOverlap);	

	if(player.body.enable) {
		player.body.velocity.x = 0;

		if(cursors.left.isDown) {
			player.body.velocity.x = -90;
			player.animations.play('walkLeft');
			player.goesRight = false;
		}
		else if(cursors.right.isDown) {
			player.body.velocity.x = 90;
			player.animations.play('walkRight');
			player.goesRight = true;
		}
		else {
			player.animations.stop();
			if(player.goesRight) player.frame = 0;
			else player.frame = 7;
		}

		if(cursors.up.isDown && player.body.onFloor()) {
			player.body.velocity.y = -190;
			player.animations.stop();
			jump.play();
		}

		if(player.body.velocity.y != 0) {
			if(player.goesRight) player.frame = 5;
			else player.frame = 12;
		}
	}
}

function coinOverlap(player, coin) {
	pick.play();
	coin.kill();
}

function goombaOverlap(player, goomba) {
	if(player.body.touching.down) {
		stomp.play();
		goomba.animations.stop();
		goomba.frame = 2;
		goomba.body.enable = false;
		player.body.velocity.y = -80;
		game.time.events.add(Phaser.Timer.SECOND, function() { goomba.kill(); }); 
	}
	else {
		theme.stop();
		die.play();
		player.frame = 6;
		player.body.enable = false;
		player.animations.stop();
		game.time.events.add(Phaser.Timer.SECOND*3, function() { game.paused = true; }); 
	}
}

