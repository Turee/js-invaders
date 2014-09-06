

$(function () {


	var onEnterPress = null;

	var updateHighScoreTable = function() 
	{

		var success = function (data) 
		{
			var header = 
				"<tr><th>Score</th> <th>Name</th></tr>";
			
			var content =
				_.map(data,function(row) {
					return "<tr>" + "<td>" + row.score + "</td>" + "<td>" + row.name + "</td>" + "</tr>";

				}).join("\n");

			$("#highScoreTable").html(
				header + content
			);
		};

		$.get("/apiv1/scores","",success);
	};

	var onGameLost = function () 
	{
		$("#submitStatusP").removeClass("hidden");
		$("#submitScoreForm").removeClass("hidden");
		$(".notNeededWhilePlaying").removeClass("hidden");
	};

	var onGameStart = function () 
	{
		$("#submitStatusP").addClass("hidden");
		$("#submitScoreForm").addClass("hidden");
		$(".notNeededWhilePlaying").addClass("hidden");
	};

	//Game stuff
	var pressedKeys = {};

	document.onkeydown = function (e)
	{
		console.log("pressed key: " + e.which);
		pressedKeys[e.which] = true;
	};

	var keys =
		{
			keyLeft : 37,
			keyRight : 39,
			spaceBar : 32,
			n1 : 49,
			enter : 13
		};

	document.onkeyup = function (e)
	{
		pressedKeys[e.which] = false;

		if (onEnterPress && e.which == keys.enter )
		{
			onEnterPress();
		}
	};

	

	//init canvas
	console.log("Initializing ");
	var canvas = document.getElementById("invaderCanvas");
	var ctx = canvas.getContext("2d");
	ctx.globalCompositeOperation="source-over";

	var Weapon = {
	  		type : "lazor",
	  		displayName :"Lazor",
		  	timeBetweenShots : 500, // milliseconds
		  	lastFire : 0,
		  	damage : 1,
		  	projectileSpeed : 10,
		  	projectileHeight : 10,
		  	projectileWidth : 5,
		  	ammo : 100,

		  	createDefault : function()
		  	{
		  		return Object.create(this);
		  	},
		  	create : function(type,timeBetweenShots,damage,projectileSpeed,pheight,pwidth)
		  	{
		  		var weapon = this.createDefault();
		  		weapon.type = type;
		  		weapon.timeBetweenShots = timeBetweenShots;
		  		weapon.damage = damage;
		  		weapon.projectileSpeed = projectileSpeed;
		  		weapon.projectileHeight = pheight;
		  		weapon.projectileWidth = pwidth;
		  		return weapon;
		  	},

		  	createProjectile : function(x,y)
		  	{ 
		  		var box = Box.create(x,y,this.projectileWidth,this.projectileHeight);
		  		return {
		  			box : box,
		  			damage : this.damage,
		  			speed : this.projectileSpeed,
		  			penetratedEnemies : [],
		  		};
		  	}
		}

	var PowerUpTypes =
		[
			"vulcan_ammo",
			"lazor_ammo",
			"rail_gun_ammo"
		]

	var AllWeapons =
		_.map([
			(function () {
				return Weapon.createDefault();
			}),
			(function () {
				var w = Weapon.createDefault();
				w.type = "vulcan";
				w.displayName = "Vulcan";
				w.damage = 0.5;
				w.timeBetweenShots = 50;
				w.projectileHeight = 5;
				w.projectileWidth = 2;
				w.ammo = 500;
				return w;
			}),
			(function () {
				var w = Weapon.createDefault();
				w.type = "rail_gun";
				w.displayName = "Rail gun";
				w.damage = 10;
				w.timeBetweenShots = 2000;
				w.projectileHeight = 20;
				w.projectileWidth = 15;
				w.projectileSpeed = 20;
				w.ammo = 10;
				return w;
			})
		], function (f) {return f();});


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
			var height = 2.5*radius;
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

		//Current game model
		gameModel : null,

		//Draws the scene based on game model
		drawScene : function (nowMilliseconds) {
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,canvas.width, canvas.height);
				var gameModel = this.gameModel;
				if (this.gameModel.gameWon)
				{
					ctx.fillStyle = "#FFFFFF";
					ctx.font = "40px comic sans"
					ctx.textAlign = "center"
					ctx.fillText("Level complete! Enter to continue",canvas.width/2 ,canvas.height/2)
				}
				if(this.gameModel.gameLost)
				{
					ctx.fillStyle = "#FFFFFF";
					ctx.font = "40px comic sans"
					ctx.textAlign = "center"
					ctx.fillText("Click new game to try again",canvas.width/2 ,canvas.height/2)
				}
				
				//Call animations draw
				ctx.globalCompositeOperation="lighter";
				_.forEach(this.gameModel.animations, function(anim){
					
					anim.draw(ctx,nowMilliseconds);
					
				});

				//Draw enemies
				_.forEach([].concat(this.gameModel.enemies), function (enemy) {
					var g = Math.floor((enemy.hitPoints/gameModel.maxEnemyHitpoints) * 255);
					var r =  255 - g;
					ctx.fillStyle = 'rgb('+ r +','+ g + ',0)';
					ctx.fillRect(enemy.box.x,enemy.box.y,enemy.box.width,enemy.box.height);
				});

				//Draw powerups

				_.forEach(this.gameModel.powerUps,function(pu){
					if (pu.type == 'vulcan_ammo')
						ctx.fillStyle = "yellow";
					if (pu.type == 'rail_gun_ammo')
						ctx.fillStyle = "cyan";
					if (pu.type == 'lazor_ammo')
						ctx.fillStyle = "pink";
					ctx.fillRect(pu.box.x,pu.box.y,pu.box.width,pu.box.height)
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
				ctx.fillText("Level: " + this.gameModel.level + " | Score: " + this.gameModel.score,5,5+16)

			},

		//Updates the game model
		doUpdateGame : function (nowMilliseconds,elapsedTimeMilliSeconds) {
			//Player position 
			var elapsedTimeSeconds = elapsedTimeMilliSeconds / 1000.0;
			var playerVelocity = this.gameModel.player.maxvelocity
			var player = this.gameModel.player;
			var gameModel = this.gameModel;

			//Select weapon
			//weaponsController.setWeapons(player.weapons);
			for (var i = 0; i < player.weapons.length; i++)
			{
				if (pressedKeys[keys.n1 + i])
				{
					player.weapon = player.weapons[i];
				}
			}
			var weaponsStr =
				_.map(player.weapons,function (w){
				  	return " <tr style=\"red\"> <td>" + w.displayName + "</td>  <td>" + w.ammo + "</td> </tr>";
				  });

			$("#weapon-table").html( 
				" <tr> <th>Type</th>  <th>Ammo</th> </tr>"
				+ weaponsStr
				);

			if (pressedKeys[keys.keyLeft]) {
				player.box.x -= playerVelocity*elapsedTimeSeconds;
			}
			else if (pressedKeys[keys.keyRight])
			{
				player.box.x += playerVelocity*elapsedTimeSeconds;	
			}

			//Weapon projectile
			if (pressedKeys[keys.spaceBar] 
				&& player.weapon.ammo > 0
				&& player.weapon.timeBetweenShots < (nowMilliseconds - player.weapon.lastFire))
			{


				var px = player.box.width/2 + player.box.x;
				var py = player.box.y - player.weapon.projectileHeight - 1;
				var p = player.weapon.createProjectile(px,py);

				gameModel.projectiles.push( p );
				var explosion = ExplosionAnimation.create(p.box.x + p.box.width/2, p.box.y + p.box.height/2, 20*p.damage);
				explosion.duration = 200;
				gameModel.animations.push(explosion);
				gameModel.player.weapon.lastFire = nowMilliseconds;
				gameModel.player.weapon.ammo -= 1;
				gameModel.score -= gameModel.player.weapon.damage;
			}

			//update enemy positions
			_.map(this.gameModel.enemies, function (enemy) {
				enemy.box.x = Math.sin(nowMilliseconds/1000.0)*50 + enemy.startX;
				enemy.box.y += (gameModel.level*0.2 + 5)*elapsedTimeSeconds;
				return enemy;
			});

			//update projectile positions
			_.map(this.gameModel.projectiles, function(p) {
				p.box.y -= p.speed;

			});

			//Update powerup positions
			_.map(this.gameModel.powerUps,function(pu){
				pu.box.y += 50*elapsedTimeSeconds;
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
						e.hitPoints -= p.damage;
						if(e.hitPoints <= 0)
							enemiesHit.push(e);
						p.penetratedEnemies.push(e);
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
					return  !_.contains(projectilesExploded,e); 
				});

			//update score
			gameModel.score +=  _.reduce(enemiesHit,function(sum,e){
				return sum + e.maxHitPoints*5;
			},0);
			gameModel.score += _.reduce(projectilesExploded,function (sum,p) {
					return p.damage + sum;
				},0);

			//Add powerups from dead enemies
			_.forEach(enemiesHit,function (e){
				var pu = {
					type : _.sample(PowerUpTypes),
					box : Box.create(e.box.x,e.box.y,10,10)
				};
				gameModel.powerUps.push(pu);
			});


			//check collision with player
			var playerCollision = _.some(gameModel.enemies, function(e){
					return e.box.intersects(player.box);
				});

			var powerUpCollisionsWithPlayer =
				_.filter(gameModel.powerUps,function(pu) {
					return pu.box.intersects(player.box)
				});

			//Add benefits from powerups

			_.forEach(powerUpCollisionsWithPlayer,function (pu) 
			{
				var addAmmo = function(count, weapon) 
				{
					_.forEach(player.weapons,function (w) 
					{
						if (w.type == weapon)
							w.ammo += count;
					});
				}
				if (pu.type == "vulcan_ammo")
					addAmmo(100,"vulcan");
				if (pu.type == "lazor_ammo")
					addAmmo(20,"lazor");
				if (pu.type == "rail_gun_ammo")
					addAmmo(5,"rail_gun");
			});

			this.gameModel.powerUps = _.filter(this.gameModel.powerUps, 
				function (pu) {
					return  !_.contains(powerUpCollisionsWithPlayer,pu); 
				});
			//if enemies are at bottom
			var enemiesAtBottom = _.some(this.gameModel.enemies, function(e) {
				return (e.box.y + e.box.height) > canvas.height;
			});

			//remove powerups out of bounds

			_.remove(this.gameModel.powerUps, function(pu){
				return pu.y > canvas.height;
			});

			//remove completed animations
			_.remove(this.gameModel.animations, function (a) {return a.isCompleted(nowMilliseconds)});

			//winning / losing conditions
			this.gameModel.gameWon = this.gameModel.enemies.length == 0;

			var gameLost =  playerCollision || enemiesAtBottom;
			if (gameLost && gameLost != this.gameLost) onGameLost();
			this.gameModel.gameLost = gameLost;
			
		},

		//Calls doUpdateGame if conditions are right
		updateGame : function(now,elapsedTimeMilliSeconds) {
			if (!this.gameModel.gameWon && !this.gameModel.gameLost)
			{
				this.doUpdateGame(now,elapsedTimeMilliSeconds);
			}
			
		},

		//Initializes new instance of game model
		initGameModel : function (level,score) 
		{
			var plr = 
				{ 

				  box : Box.create(canvas.width/2, canvas.height - 30, 20, 30),
				  maxvelocity : 300, // pixels per second
				  hitPoints : 5,
				  weapon : AllWeapons[0],
				  weapons : AllWeapons,
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
					var hitPoints = Math.ceil(Math.random()*level*2)

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
			var maxHitPts = _.max(es,function(e){return e.maxHitPoints;}).maxHitPoints;
			console.log(maxHitPts);
			var gameModel = 	{
					level : level,
					player : plr,
					enemies : es,
					projectiles : [],
					animations : [],
					powerUps : [],
					maxEnemyHitpoints : maxHitPts,
					gameWon : false,
					gameLost : false,
					score : score
				};

			return gameModel; 

		},

		//Main game loop
		gameLoop : function ()
		{
			var drawTime = Date.now();
			var gameStartTime = Date.now();

			var frame = function() {
				var now = Date.now();
				var elapsedSinceStart = now - gameStartTime;
				game.updateGame(elapsedSinceStart ,now - drawTime);
				game.drawScene(elapsedSinceStart);
				drawTime = Date.now();
				requestAnimationFrame(frame);
			}
			requestAnimationFrame(frame);
		},

		//Nextlevel = true if proceed to next level
		startGame : function (nextLevel) 
		{


			onGameStart();
			if (this.timer != null) {
				clearInterval(this.timer);
				this.timer = null;
			}
			var game = this;
			var level = (game.gameModel != null && nextLevel) ? (game.gameModel.level + 1) : 1;
			var score = (game.gameModel != null && nextLevel) ? (game.gameModel.score) : 0;

			game.gameModel = this.initGameModel(level,score);
			game.gameModel.score = score;

		}
	};

	//Event handlers for buttons
	$("#newGameButton").click(function () {
		game.startGame(false);
	});

	onEnterPress = (function() {
		if (game.gameModel && game.gameModel.gameWon)
		{
			game.startGame(true);
		}
	});

	$("#submitScoreButton").click(function () {
		var name = $("#playerNameInput").val();
		var score = game.gameModel ? game.gameModel.score : 0;

		var success = (function (data,status,xhr) {
			console.log(status);
			console.log(data);
			if (data.error)
			{
				$("#submitStatusP").html(data.error);
			}
			else if(status == "success")
			{
				$("#submitStatusP").html("Score submitted!");
				$("#submitScoreForm").addClass("hidden");
				updateHighScoreTable();
			}
			else
			{
				$("#submitStatusP").html("unknown error!");	
			}

		});
		$.post("/apiv1/scores",{name : name , score : score},success,"json");
	});


	game.gameLoop();
	game.startGame();

	updateHighScoreTable();
});