import Player from "./../components/Player.js";
import Enemy from "./../components/Enemy.js";
import Music from "./../components/Music.js";
import Sound from "./../components/Sound.js";
import DialogueBox from "./../components/DialogueBox.js";

export default class LevelScene extends Phaser.Scene {
	constructor() {
		super({key: 'LevelScene'});
	}

	create() {
		this.cameras.main.fadeEffect.start(false, 500, 0x11, 0x11, 0x11);

		if (!this.practiceMusic) {
			this.practiceMusic = new Music(this, 'bgm_practice', { volume: 0.5 });

			this.practiceMusic.on('complete', this.onLevelComplete, this);
			this.practiceMusic.on('bar', this.onBar, this);
			this.practiceMusic.on('beat', this.onBeat, this);
		}

		if (!this.levelMusic) {
			this.levelMusic = new Music(this, 'puppywestern_2_nocues', { volume: 0.5 });
			//this.levelMusic = new Music(this, 'samurai_slice', { volume: 0.4 });

			this.levelMusic.on('complete', this.onLevelComplete, this);
			this.levelMusic.on('bar', this.onBar, this);
			this.levelMusic.on('beat', this.onBeat, this);
		}

		this.currentMusic = null;


		this.soundList = [
			'girl_one','girl_two','girl_three','girl_four','audience_boo','audience_gasp','audience_clap','audience_cheer','audience_cheer2',
			'cowbell','miss','shoot_1','shoot_2','shoot_3','miss','karate_kick_miss','karate_kick_swing','target_destroyed_1','target_destroyed_2','karate_bomb_kick','fade_out','robot_eject','robot_withdraw','flip','destroy_pieces',
			'Back','ButtonDown','ButtonUp','Clap','ClickHigh','ClickLow','Cowbell','Crow','Keypress','MinigameClose','MinigameHover','MinigameLaunch','MinigameOpen','MinigameWindow','Miss2','Miss3','Miss4','Miss','Nature','Page','Punch','RatingOK','Results1','Results2','Shrink','TapDown','TapUp','Woodblock2','Woodblock',
		];
		for (var i = 0; i < this.soundList.length; i++) {
			this[this.soundList[i]] = new Sound(this, this.soundList[i], { volume: 0.5 });
		}
		this.flip.rate = 0.5;//Phaser.Math.RND.realInRange(0.5, 1.5);
		//this.robot_eject.setVolume(0.5);
		//this.robot_withdraw.setVolume(0.3);

		this.cat_cue = new Sound(this, 'cat_cue', { volume: 0.8 });
		this.rat_cue = new Sound(this, 'rat_cue', { volume: 0.8 });


		/* Graphics */

		// Background
		let bg = this.add.image(this.CX, this.CY, 'background');
		this.fitToScreen(bg);

		//this.debugText = this.add.text(0, 0, "Test", { font: "40px Courier" });

		this.wood_back = this.add.sprite(650, 490, 'wood_back');
		this.wood_back.setScale(0.25);
		this.wood_back.setTint(0x936b48);

		this.enemies = [
			new Enemy(this, 650, 490),
			new Enemy(this, 650, 490),
			new Enemy(this, 650, 490),
			new Enemy(this, 650, 490),
		];
		this.enemyIndex = 0;
		for (var i = this.enemies.length - 1; i >= 0; i--) {
			this.enemies[i].on('score', this.onScore, this);
		}

		this.wood_block = this.add.sprite(650, 490, 'wood_block');
		this.wood_block.setOrigin(0.53, 0.02);
		this.wood_block.setScale(0.25);
		this.wood_block.setTint(0xaf825b);

		this.wood_front = this.add.sprite(650, 490, 'wood_front');
		this.wood_front.setScale(0.25);
		this.wood_front.setTint(0x936b48);

		// Tumble
		this.tumble = this.add.sprite(-500, 460, 'tumble');
		this.tumble.startY = this.tumble.y;
		this.tumble.setScale(0.7);

		// Player
		this.player = new Player(this, 280, 570);


		/* Input */

		this.setupInput();


		/* Tutorial */

		this.dialogueBox = new DialogueBox(this, 680, 200, 500, 240);
		this.dialogueBox.setAlpha(0);

		this.dialogueList = [];


		this.events = {};
		this.eventMaxRange = 1;
		this.scores = [];

		this.progress = null;
		this.practiceCount = 0;
		this.canSkip = false;
		this.blockTap = false;

		this.addEvent(700, this.showSkip);
		this.addEvent(1200, this.onProgress);
	}


	update(time, delta) {
		if (this.currentMusic) {
			//this.debugText.setText(this.currentMusic.getBar());

			let barTime = this.currentMusic.getBarTime();
			let deltaBarTime = barTime - this.lastBarTime;
			this.lastBarTime = barTime;

			this.player.update(barTime, deltaBarTime);

			for (var i = this.enemies.length - 1; i >= 0; i--) {
				this.enemies[i].update(barTime, deltaBarTime);
			}

			this.tumble.angle += 3;
			this.tumble.y = this.tumble.startY - 50 * Math.abs(Math.cos(barTime * Math.PI / 2));
			this.tumble.x += 5;
			if (this.tumble.x > this.W+500) {
				this.tumble.x = -500;
			}
		}
		else {
			this.player.update(0, 0);

			for (var i = this.enemies.length - 1; i >= 0; i--) {
				this.enemies[i].update(0, 0);
			}
		}

		this.blockTap = false;
	}


	setupInput() {
		if (!this._listeners) {
			this._listeners = true;

			let keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
			keySpace.on('down', this.onTapDown, this);
			keySpace.on('up', this.onTapUp, this);

			let keySkip = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
			keySkip.on('down', this.onSkipDown, this);
			keySkip.on('up', this.onSkipUp, this);
		}
		this.input.on('pointerdown', this.onTapDown, this);
		this.input.on('pointerup', this.onTapUp, this);
	}

	addEvent(delay, callback, callbackScope=this) {
		return this.time.addEvent({delay, callback, callbackScope});
	}

	playMusic(music) {
		this.currentMusic = music;
		this.currentMusic.play();
		this.lastBarTime = this.currentMusic.getBarTime();
		this.cat_cue.setRate(this.currentMusic.bpm / 143);
		this.rat_cue.setRate(this.currentMusic.bpm / 143);
	}


	findAvailableEnemy() {
		for (var i = 0; i < this.enemies.length; i++) {
			if (this.enemies[i].isHiding) {
				return this.enemies[i];
			}
		}
		throw "No enemy found.";
	}


	onBar(bar) {
		this.player.onBar(bar);

		for (var i = this.enemies.length - 1; i >= 0; i--) {
			this.enemies[i].onBar(bar);
		}

		if (this.currentMusic == this.practiceMusic) {
			if (this.practiceCount <= 0) {
				this.onProgress();
			}
		}
	}

	onBeat(time) {
		let catCheckTime = (time + 2) % this.eventMaxRange;

		if (this.events[catCheckTime]) {
			let enemy = this.findAvailableEnemy();
			this.invert = !this.invert; // Temporary
			enemy.appear(time, this.invert);
		}

		for (var i = this.enemies.length - 1; i >= 0; i--) {
			this.enemies[i].onBeat(time);
		}
	}

	onTapDown(event) {
		if (this.blockTap)
			return;

		if (this.currentMusic && this.currentMusic.isPlaying) {
			this.onShoot();
		}
		else {
			this.dialogueBox.tapDown();
		}
	}

	onTapUp(event) {
		if (this.blockTap)
			return;

		if (this.currentMusic && this.currentMusic.isPlaying) {
		}
		else {
			let success = this.dialogueBox.tapUp();
			if (success) {
				this.addEvent(500, this.onProgress);
			}
		}
	}

	onSkipDown(event) {
		if (this.canSkip) {
			this.blockTap = true;
			this.ButtonDown.play();
		}
	}

	onSkipUp(event) {
		if (this.canSkip) {
			this.blockTap = true;
			this.ButtonUp.play();

			this.progress = "end_text";
			this.hideSkip();
			this.dialogueBox.disableInput();

			if (this.currentMusic) {
				this.currentMusic.stop();
				this.currentMusic = null;
			}

			this.cameras.main.fadeEffect.start(true, 100, 0x11, 0x11, 0x11);
			this.addEvent(1000, function() {
				this.dialogueList = [];
				this.dialogueBox.hide();
				this.cameras.main.fadeEffect.start(false, 100, 0x11, 0x11, 0x11);
			});
			this.addEvent(2000, this.onProgress);
		}
	}

	showSkip() {
		this.canSkip = true;

		//this.skipBox = this.add.rexRoundRectangle(10, this.H-35, 200, 50, 25, 0xffffff);
		//this.skipBox.setOrigin(0, 0.5);
		//this.skipBox.setAlpha(0.3);

		//this.skipText = this.add.text(10+100, this.H-35, "[S]kip practice", { font: "bold 25px Wii", color: "white" });
		this.skipText = this.add.text(10, this.H-10, "[S] skip practice", { font: "bold 25px Wii", color: "white" });
		this.skipText.setOrigin(0, 1);
		this.skipText.setAlpha(0.5);

		this.skipText.setInteractive();
		this.skipText.on('pointerdown', this.onSkipDown, this);
		this.skipText.on('pointerup', this.onSkipUp, this);
	}

	hideSkip() {
		this.canSkip = false;
		//this.skipBox.setAlpha(0);
		this.skipText.setAlpha(0);
	}


	getClosestEnemy(time) {
		let record = null;
		let enemy = null;
		for (var i = this.enemies.length - 1; i >= 0; i--) {
			if (this.enemies[i].canHit(time)) {
				let dist = Math.abs(this.enemies[i].targetTime - time);
				if (dist < record || record === null) {
					record = dist;
					enemy = this.enemies[i];
				}
			}
		}
		return enemy;
	}

	getRating(accuracy) {
		if (accuracy > 0) {
			if (accuracy < 0.04)	return 'perfect';
			if (accuracy < 0.12)	return 'good';
			if (accuracy < 0.26)	return 'ok';
			//if (accuracy < 0.48)	return 'bad';
		}
		else {
			if (accuracy > -0.04)	return 'perfect';
			if (accuracy > -0.12)	return 'good';
			if (accuracy > -0.25)	return 'ok';
			//if (accuracy > -0.98)	return 'bad';
		}
		return 'bad';
	}

	onShoot() {
		let time = this.currentMusic.getBarTime();
		let enemy = this.getClosestEnemy(time);
		let rating = "miss";

		if (enemy) {
			let delta = Math.abs(enemy.targetTime - time);
			rating = this.getRating(delta);

			if (rating != 'miss') {
				if (enemy.isHit) {
					rating = 'bad';
				}

				enemy.hit(this, rating);
			}

			if (rating == "perfect") {
				this.player.play('big_shoot');
				this.shoot_3.play();
			}
			else if (rating == "good") {
				this.player.play('big_shoot');
				this.shoot_2.play();
			}
			else if (rating == "ok") {
				this.player.play('big_shoot_miss');
				this.shoot_2.play();
			}
			else {
				this.player.play('small_shoot_miss');
				this.shoot_1.play();
				this.miss.play();
			}
		}
		else {
			this.player.play('small_shoot_miss');
			this.shoot_1.play();
			this.miss.play();
		}

		// Cooldown until holsting the gun
		this.player.holsterTime = Math.ceil(this.currentMusic.getBarTime() + 1.25) % this.currentMusic.maxBar;
	}


	onProgress() {
		// Practice music is playing
		if (this.currentMusic && this.currentMusic.isPlaying) {
			if (this.currentMusic == this.practiceMusic) {
				this.currentMusic.stop();
				this.currentMusic = null;

				this.audience_clap.play();
				this.addEvent(1000, this.onProgress);
			}
			else {
				console.warn("Failed onProgress");
			}
		}
		// Proceed with dialogue if it exists
		else if (this.dialogueList.length > 0) {
			this.dialogueBox.show(this.dialogueList.shift());
		}
		// New progression
		else {
			if (!this.progress) {
				this.progress = "intro_text";
				this.dialogueList = [
					"Today we're practicing target shooting.",
					"Try to fire to the beat.",
				];
				this.onProgress();
			}
			else if (this.progress == "intro_text") {
				this.progress = "practice_cat";

				this.events = {
					6: 'cat',
					14: 'cat',
				};
				this.eventMaxRange = 16;
				this.practiceCount = 3;

				this.playMusic(this.practiceMusic);
			}
			else if (this.progress == "practice_cat") {
				this.progress = "end_text";
				this.dialogueList = [
					"Wow. You're really good!",
					"Now for the real deal... Try to keep up.",
				];
				this.onProgress();
			}
			else if (this.progress == "end_text") {
				this.progress = "level";
				this.events = {
					6: 'cat', 10: 'cat', 14: 'cat', 19: 'cat', 22: 'cat', 26: 'cat', 30: 'cat', 31: 'cat', 34: 'cat', 38: 'cat', 42: 'cat', 46: 'cat', 47: 'cat', 51: 'cat', 54: 'cat', 58: 'cat', 62: 'cat', 63: 'cat', 66: 'cat', 70: 'cat', 74: 'cat', 78: 'cat', 79: 'cat', 82: 'rat', 87: 'cat', 90: 'cat', 91: 'cat', 95: 'cat', 98: 'cat', 99: 'cat', 103: 'cat', 106: 'cat', 107: 'cat', 111: 'cat', 116: 'cat', 119: 'cat', 122: 'cat', 123: 'cat', 127: 'cat', 130: 'cat', 131: 'cat', 135: 'cat', 138: 'cat', 139: 'cat', 143: 'cat', 148: 'cat', 151: 'cat', 152: 'cat', 155: 'cat', 156: 'cat', 160: 'rat'
				};
				this.eventMaxRange = 9999;

				this.scores = [];

				this.hideSkip();

				this.playMusic(this.levelMusic);
			}
		}
	}

	onScore(rating) {
		if (this.currentMusic == this.practiceMusic) {
			if (rating == 'good' || rating == 'perfect') {
				this.practiceCount -= 1;
			}
		}
		else if (this.currentMusic == this.levelMusic) {
			this.scores.push(rating);
		}
	}

	onLevelComplete() {
		let count = {'perfect': 0, 'good': 0, 'ok': 0, 'bad': 0, 'miss': 0};
		let total = 0;
		for (var i = this.scores.length - 1; i >= 0; i--) {
			count[this.scores[i]] += 1;
			total += 1;
		}
		console.log(count);
		console.log(total);

		let rating = 'bad';

		if (count['ok'] == 0 && count['bad'] == 0 && count['miss'] == 0) {
			rating = 'perfect';
		}
		else if (count['ok'] < total/3 && count['bad'] < total/10 && count['miss'] < total/10) {
			rating = 'great';
		}
		else if (count['bad'] < total/3 && count['miss'] < total/6) {
			rating = 'good';
		}

		this.cameras.main.fadeEffect.start(true, 500, 0x11, 0x11, 0x11);
		this.addEvent(500, function() {
			this.currentMusic.stop();
			this.scene.start("EvaluationScene", {rating});
		});
	}


	get W() { return this.cameras.main.displayWidth; }
	get H() { return this.cameras.main.displayHeight; }
	get CX() { return this.cameras.main.centerX; }
	get CY() { return this.cameras.main.centerY; }

	fitToScreen(image) {
		image.setScale(Math.max(this.W / image.width, this.H / image.height));
	}
}