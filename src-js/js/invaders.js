
$(function () {

	var pressedKeys = {};

	document.onkeydown = function (e)
	{
		pressedKeys[e.which] = true;
	};

	document.onkeyup = function (e)
	{
		pressedKeys[e.which] = false;
	};

	var keys =
		{
			keyLeft : 37,
			keyRight : 39,
			spaceBar : 32
		}
	//init canvas
	console.log("Initializing ");
	var canvas = document.getElementById("invaderCanvas");
	var ctx = canvas.getContext("2d");
	ctx.globalCompositeOperation="source-over";

	//Box type
	var Box = {
		x : 0,
		y : 0,
		width : 0,
		height : 0,

		intersects : function (box2) {
			var a_x1 = this.x;
			var a_x2 = this.x + this.width;
			var a_y1 = this.y;
			var a_y2 = this.y + this.height;

			var b_x1 = box2.x;
			var b_x2 = box2.x + box2.width;
			var b_y1 = box2.y;
			var b_y2 = box2.y + box2.height;

			return !(a_x2 < b_x1 || a_x1 > b_x2 || a_y2 < b_y1 || a_y1 > b_y2);

		},

		create : function (x,y,width,height) {
			var box = Object.create(this);
			box.x = x;
			box.y = y;
			box.width = width;
			box.height = height;
			return box;
		}
	};

	//Explosion animation type
	var ExplosionAnimation = {
		x : 0,
		y : 0,
		radius : 0,
		beginTime : undefined,
		duration : 1500,
		create : function (x,y,radius) {

			var ea = Object.create(this);
			ea.x = x;
			ea.y = y;
			ea.radius = radius;
			return ea;
		},

		draw : function (ctx, now)
		{
			if (this.beginTime == undefined)  
				this.beginTime = now;
			var x = this.x;
			var y = this.y;
			
			var radius = this.radius;
			var width = 2*radius;
			var height = 2*radius;
			// var grd=ctx.createRadialGradient(50,50,100,50,50,100);
			// grd.addColorStop(0,"#FFFFFF");
			// grd.addColorStop(1,"#FFFFFF");
			// ctx.fillStyle=grd;
			// ctx.fillRect(this.x,this.y,150,150);
			var completed = (now - this.beginTime)/this.duration;
			var completedInverse = 1 - completed;
			if (completed > 1)
			{
				return;
			}
			else
			{
				var grd=ctx.createRadialGradient(x,y,0.2*radius*completedInverse,x,y - 0.2*radius,radius);
				grd.addColorStop(0.0,"rgba(255,255,255," + completedInverse*2 + ")");
				grd.addColorStop(0.6,"rgba(0,0,255," + completedInverse + ")");
				grd.addColorStop(1,"transparent");

				// Fill with gradient
				ctx.fillStyle=grd;
				ctx.fillRect(x - width/2,y - height/2,width,height);
			}
		},

		isCompleted : function (now)
		{
			return 
				(this.beginTime != undefined)
				&& (now - this.beginTime > duration);
		}
	}


	var game = {

		gameModel : null,

		drawScene : function (nowMilliseconds) {
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,canvas.width, canvas.height);

				if (this.gameModel.gameWon)
				{
					ctx.fillStyle = "#FFFFFF";
					ctx.font = "40px comic sans"
					ctx.textAlign = "center"
					ctx.fillText("You win!",canvas.width/2 ,canvas.height/2)
				}
				if(this.gameModel.gameLost)
				{
					ctx.fillStyle = "#FFFFFF";
					ctx.font = "40px comic sans"
					ctx.textAlign = "center"
					ctx.fillText("You lost!",canvas.width/2 ,canvas.height/2)
				}
				
				//Call animations draw
				ctx.globalCompositeOperation="lighter";
				_.forEach(this.gameModel.animations, function(anim){
					
					anim.draw(ctx,nowMilliseconds);
					
				});

				//Draw enemies
				_.forEach([].concat(this.gameModel.enemies), function (enemy) {
					var g = Math.floor((enemy.hitPoints/enemy.maxHitPoints) * 255);
					var r =  255 - g;
					ctx.fillStyle = 'rgb('+ r +','+ g + ',0)';
					ctx.fillRect(enemy.box.x,enemy.box.y,enemy.box.width,enemy.box.height);
				});

				//Draw player
				var player = this.gameModel.player;
				ctx.fillStyle = "#FFFFFF";
				ctx.fillRect(player.box.x,player.box.y,player.box.width,player.box.height);

				//Draw projectiles
				_.forEach(this.gameModel.projectiles, function (projectile) 
				{
					ctx.fillStyle = "red";
					ctx.fillRect(projectile.box.x,projectile.box.y, projectile.box.width, projectile.box.height)
				});

				ctx.globalCompositeOperation="source-over";

				ctx.font = "16px comic sans"
				ctx.textAlign = "left"
				ctx.fillStyle = "#FFFFFF";
				ctx.fillText("Score: " + this.gameModel.score,5,5+16)

			},

		doUpdateGame : function (nowMilliseconds,elapsedTimeMilliSeconds) {
			//Player position 
			var elapsedTimeSeconds = elapsedTimeMilliSeconds / 1000.0;
			var playerVelocity = this.gameModel.player.maxvelocity
			var player = this.gameModel.player;
			var gameModel = this.gameModel;

			if (pressedKeys[keys.keyLeft]) {
				player.box.x -= playerVelocity*elapsedTimeSeconds;
			}
			else if (pressedKeys[keys.keyRight])
			{
				player.box.x += playerVelocity*elapsedTimeSeconds;	
			}

			//Weapon
			if (pressedKeys[keys.spaceBar] 
				&& player.weapon.timeBetweenShots < (nowMilliseconds - player.weapon.lastFire) )
			{
				var pheight = 10;
				var px = player.box.width/2 + player.box.x;
				var py = player.box.y - pheight - 1;
				var box = Box.create(px,py,5,pheight);
				var p = {box :  Box.create(px,py,5,pheight), speed : player.weapon.projectileSpeed, damage : player.weapon.damage };
				
				gameModel.projectiles.push( p );
				var explosion = ExplosionAnimation.create(p.box.x + p.box.width/2, p.box.y + p.box.height/2, 20);
				explosion.duration = 200;
				gameModel.animations.push(explosion);
				gameModel.player.weapon.lastFire = nowMilliseconds;
				gameModel.score -= 1;
			}

			//update enemy positions
			_.map(this.gameModel.enemies, function (enemy) {
				enemy.box.x = Math.sin(nowMilliseconds/1000.0)*50 + enemy.startX;
				enemy.box.y += 5*elapsedTimeSeconds;
				return enemy;
			});

			//update projectile positions
			_.map(this.gameModel.projectiles, function(p) {
				p.box.y -= p.speed;

			});

			//remove projectiles out of bounds
			_.remove(this.gameModel.projectiles, function(projectile) {
				return projectile.box.y < 0;
			});

			//check projectile collision with enemies
			var enemiesHit = [];
			var projectilesExploded = [];
			for (var i = 0; i < this.gameModel.enemies.length; i++)
			{
				for (var j = 0; j < this.gameModel.projectiles.length ; j++)
				{
					var e = this.gameModel.enemies[i];
					var p = this.gameModel.projectiles[j];
					if (e.box.intersects(p.box))
					{
						//remove hitpoints
						enemiesHit.push(e);
						projectilesExploded.push(p);
					}
				}
			}

			//Add explosions for dead enemies
			_.forEach(enemiesHit,function(e){
				gameModel.animations.push(
					ExplosionAnimation.create(e.box.x + e.box.width/2, e.box.y + e.box.height/2, 150));
			});

			//add explosion for projectile
			_.forEach(projectilesExploded,function(p){
				var ex = ExplosionAnimation.create(p.box.x + p.box.width/2, p.box.y + p.box.height/2, 20);
				ex.duration = 500;
				gameModel.animations.push(ex);
			});

			//Remove dead enemies and projectiles
			this.gameModel.enemies = _.filter(this.gameModel.enemies, 
				function (e) {
					return !_.contains(enemiesHit,e); 
				});
			this.gameModel.projectiles = _.filter(this.gameModel.projectiles, 
				function (e) {
					return !_.contains(projectilesExploded,e); 
				});

			//update score
			gameModel.score +=  enemiesHit.length*5;
			gameModel.score += projectilesExploded.length;

			//check collision with player
			var playerCollision = _.some(gameModel.enemies, function(e){
					return e.box.intersects(player.box);
				});
			//if enemies are at bottom
			var enemiesAtBottom = _.some(this.gameModel.enemies, function(e) {
				return (e.box.y + e.box.height) > canvas.height;
			});

			//remove completed animations
			_.remove(this.gameModel.animations, function (a) {return a.isCompleted(nowMilliseconds)});

			//winning / losing conditions
			this.gameModel.gameWon = this.gameModel.enemies.length == 0;
			this.gameModel.gameLost = playerCollision || enemiesAtBottom;

		},

		updateGame : function(now,elapsedTimeMilliSeconds) {
			if (!this.gameModel.gameWon && !this.gameModel.gameLost)
			{
				this.doUpdateGame(now,elapsedTimeMilliSeconds);
			}
			
		},

		initGameModel : function (level) 
		{
			var plr = 
				{ 

				  box : Box.create(canvas.width/2, canvas.height - 30, 20, 30),
				  maxvelocity : 300, // pixels per second
				  hitPoints : 5,
				  weapon : {
			  		type : "basic",
				  	timeBetweenShots : 500, // milliseconds
				  	lastFire : 0,
				  	damage : 1,
				  	projectileSpeed : 10

				  }
				};
			
			var enemiesPerRow = 14;
			var enemyCount = 3*enemiesPerRow;
			// var enemyCount = 1;
			//Array of enemies
			var es =
				_.chain(_.range(enemyCount))
				.map(function (n){
					var x = 70 + 50*(n % enemiesPerRow);
					var y = 50 + 60*(Math.floor(n/enemiesPerRow));
					var hitPoints = Math.round(Math.random()*level)

					var e = 
						{
							box : Box.create(x,y,20,30),
							startX : x,
							startY : y,
							hitPoints : hitPoints,
							maxHitPoints : hitPoints
						};
					return e;
				})
				.value();


			var game = 	{
					player : plr,
					enemies : es,
					projectiles : [],
					animations : [],

					gameWon : false,
					gameLost : false,
					score : 0
				};

			return game; 

		},
		timer : null,
		startGame : function () 
		{
			if (this.timer != null) {
				clearInterval(this.timer);
				this.timer = null;
			}
			var game = this;
			game.gameModel = this.initGameModel(5);
			var drawTime = Date.now();
			var gameStartTime = Date.now();
			this.timer = setInterval(function () {
				var now = Date.now();
				var elapsedSinceStart = now - gameStartTime;
				game.updateGame(elapsedSinceStart ,now - drawTime);
				game.drawScene(elapsedSinceStart);
				drawTime = Date.now();
			},1);

		}
	};

	$("#newGameButton").click(function () {
		game.startGame();
	});
	game.startGame();
});